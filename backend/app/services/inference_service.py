"""Real model-backed API services with deterministic mock fallbacks."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd

from app.core.config import settings
from app.schemas.responses import (
    FeatureImportanceItem,
    FeatureImportanceResponse,
    ForecastPoint,
    ForecastResponse,
    HistoryPoint,
    HistoryResponse,
    MetricItem,
    MetricsResponse,
    ModelInfoResponse,
)
from app.services.mock_data_service import (
    get_feature_importance as get_mock_feature_importance,
    get_forecast as get_mock_forecast,
    get_history as get_mock_history,
    get_metrics as get_mock_metrics,
    get_model_info as get_mock_model_info,
)
from ml.inference.model_loader import (
    ModelMetadataPayload,
    load_model,
    load_model_metadata,
)
from ml.inference.predict import predict_demand, recursive_forecast
from ml.explainability.explainer import mean_absolute_shap_values

LOGGER = logging.getLogger(__name__)
FORECAST_PERIODS = 96
FORECAST_FREQUENCY = "30min"
MW_PER_GW = 1_000
NINETY_PERCENT_Z_SCORE = 1.645


def _load_processed_data(dataset_path: Path) -> pd.DataFrame:
    """Load processed rows in chronological order with parsed UTC timestamps."""
    if not dataset_path.exists():
        raise FileNotFoundError(f"Processed training dataset not found: {dataset_path}")

    data = pd.read_csv(dataset_path)
    if "timestamp" not in data.columns or "demand" not in data.columns:
        raise ValueError("Processed dataset must contain timestamp and demand columns.")

    data["timestamp"] = pd.to_datetime(data["timestamp"], utc=True, errors="raise")
    return data.sort_values("timestamp").drop_duplicates("timestamp", keep="last")


def _build_future_features(
    data: pd.DataFrame,
    feature_columns: list[str],
) -> tuple[pd.DatetimeIndex, pd.DataFrame]:
    """Build a first-pass 48-hour feature frame from the latest known row.

    Lag and rolling fields are intentionally held at their latest observed
    values. Calendar fields are updated for every future half-hour timestamp.
    The first point overlaps the final observation to provide a continuous
    handoff to the frontend history series.
    """
    missing = sorted(set(feature_columns).difference(data.columns))
    if missing:
        raise ValueError(f"Processed dataset is missing model features: {missing}")

    latest = data.iloc[-1]
    timestamps = pd.date_range(
        start=latest["timestamp"],
        periods=FORECAST_PERIODS,
        freq=FORECAST_FREQUENCY,
    )
    features = pd.DataFrame(
        [latest[feature_columns].to_dict() for _ in range(FORECAST_PERIODS)],
        columns=feature_columns,
    )

    calendar_values: dict[str, pd.Series] = {
        "hour": pd.Series(timestamps.hour, dtype=int),
        "day": pd.Series(timestamps.day, dtype=int),
        "month": pd.Series(timestamps.month, dtype=int),
        "day_of_week": pd.Series(timestamps.dayofweek, dtype=int),
        "is_weekend": pd.Series((timestamps.dayofweek >= 5).astype(int), dtype=int),
    }
    for column, values in calendar_values.items():
        if column in features.columns:
            features[column] = values

    return timestamps, features


def _model_version(metadata: ModelMetadataPayload) -> str:
    """Create a stable display version from the saved training timestamp."""
    training_date = datetime.fromisoformat(
        metadata["training_timestamp"].replace("Z", "+00:00")
    )
    return f"trained-{training_date:%Y%m%d}"


def _algorithm_description(model_name: str) -> str:
    """Return a concise algorithm description for existing API clients."""
    descriptions = {
        "Linear Regression": "Linear regression baseline",
        "Random Forest Regressor": "Random forest ensemble",
        "XGBoost Regressor": "Gradient boosted decision trees",
    }
    return descriptions.get(model_name, model_name)


def get_forecast(
    model_path: Path | None = None,
    metadata_path: Path | None = None,
    dataset_path: Path | None = None,
) -> ForecastResponse:
    """Run the saved model or return the existing mock forecast on failure."""
    try:
        resolved_model_path = model_path or settings.model_artifact_path
        resolved_metadata_path = metadata_path or settings.model_metadata_path
        resolved_dataset_path = dataset_path or settings.training_dataset_path
        model = load_model(resolved_model_path)
        metadata = load_model_metadata(resolved_metadata_path)
        data = _load_processed_data(resolved_dataset_path)
        timestamps, predictions_mw, _ = recursive_forecast(
            model,
            data,
            metadata["feature_columns"],
            periods=FORECAST_PERIODS,
            frequency=FORECAST_FREQUENCY,
        )

        rmse_mw = float(metadata["metrics"].get("rmse", 0))
        interval_width_gw = max(NINETY_PERCENT_Z_SCORE * rmse_mw / MW_PER_GW, 0.1)
        points = [
            ForecastPoint(
                timestamp=timestamp.isoformat().replace("+00:00", "Z"),
                predicted_demand_gw=round(prediction_mw / MW_PER_GW, 3),
                confidence_low_gw=round(
                    max(prediction_mw / MW_PER_GW - interval_width_gw, 0), 3
                ),
                confidence_high_gw=round(
                    prediction_mw / MW_PER_GW + interval_width_gw, 3
                ),
            )
            for timestamp, prediction_mw in zip(timestamps, predictions_mw)
        ]
        return ForecastResponse(
            horizon_hours=48,
            generated_at=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            points=points,
            data_source="artifact",
        )
    except (FileNotFoundError, OSError, TypeError, ValueError) as error:
        LOGGER.warning("Real forecast unavailable; using mock fallback: %s", error)
        return get_mock_forecast()


def get_history(dataset_path: Path | None = None) -> HistoryResponse:
    """Return the latest 24 hours of processed NESO demand data."""
    try:
        data = _load_processed_data(dataset_path or settings.training_dataset_path)
        recent = data.tail(49)
        return HistoryResponse(
            source="NESO Historic Demand Data 2024",
            points=[
                HistoryPoint(
                    timestamp=row.timestamp.isoformat().replace("+00:00", "Z"),
                    demand_gw=round(float(row.demand) / MW_PER_GW, 3),
                )
                for row in recent.itertuples(index=False)
            ],
            data_source="artifact",
        )
    except (FileNotFoundError, OSError, ValueError) as error:
        LOGGER.warning("Real history unavailable; using mock fallback: %s", error)
        return get_mock_history()


def get_metrics(metadata_path: Path | None = None) -> MetricsResponse:
    """Return saved validation metrics in frontend-compatible units."""
    try:
        metadata = load_model_metadata(metadata_path or settings.model_metadata_path)
        metrics = metadata["metrics"]
        return MetricsResponse(
            model_name=metadata["model_name"],
            model_version=_model_version(metadata),
            metrics=[
                MetricItem(
                    name="MAE",
                    value=float(metrics["mae"]) / MW_PER_GW,
                    unit="GW",
                ),
                MetricItem(
                    name="RMSE",
                    value=float(metrics["rmse"]) / MW_PER_GW,
                    unit="GW",
                ),
                MetricItem(name="MAPE", value=float(metrics["mape"]), unit="%"),
                MetricItem(name="R2", value=float(metrics["r2"])),
            ],
            data_source="artifact",
        )
    except (FileNotFoundError, OSError, KeyError, TypeError, ValueError) as error:
        LOGGER.warning("Saved metrics unavailable; using mock fallback: %s", error)
        return get_mock_metrics()


def get_model_info(metadata_path: Path | None = None) -> ModelInfoResponse:
    """Return production model information sourced from saved metadata."""
    try:
        metadata = load_model_metadata(metadata_path or settings.model_metadata_path)
        limitations = [
            *metadata["notes"],
            "Forecast inference recursively updates lag and rolling-demand features from prior predictions.",
            "Prediction intervals are approximated from validation RMSE and are not yet calibrated per horizon.",
        ]
        return ModelInfoResponse(
            name=metadata["model_name"],
            version=_model_version(metadata),
            algorithm=_algorithm_description(metadata["model_name"]),
            status="Production",
            training_date=metadata["training_timestamp"][:10],
            training_window="NESO 2024 historical record",
            forecast_horizon_hours=48,
            dataset=metadata["dataset"],
            rows_trained=metadata["training_rows"],
            selected_model=metadata["model_name"],
            target=metadata["target"],
            training_timestamp=metadata["training_timestamp"],
            metrics=metadata["metrics"],
            feature_columns=metadata["feature_columns"],
            limitations=limitations,
            all_model_metrics=metadata["all_model_metrics"],
            row_count=metadata["row_count"],
            training_rows=metadata["training_rows"],
            test_rows=metadata["test_rows"],
            metric_error_unit="MW",
            data_source="artifact",
        )
    except (FileNotFoundError, OSError, KeyError, TypeError, ValueError) as error:
        LOGGER.warning(
            "Saved model metadata unavailable; using mock fallback: %s", error
        )
        return get_mock_model_info()


def get_feature_importance(
    model_path: Path | None = None,
    metadata_path: Path | None = None,
    dataset_path: Path | None = None,
) -> FeatureImportanceResponse:
    """Return SHAP mean absolute importance with native-model fallback."""
    try:
        resolved_model_path = model_path or settings.model_artifact_path
        model = load_model(resolved_model_path)
        metadata = load_model_metadata(metadata_path or settings.model_metadata_path)
        method = "mean_absolute_shap"

        try:
            data = _load_processed_data(dataset_path or settings.training_dataset_path)
            shap_importance = mean_absolute_shap_values(
                resolved_model_path,
                model,
                data[metadata["feature_columns"]],
            )
            raw_importance = np.asarray(
                [shap_importance[column] for column in metadata["feature_columns"]],
                dtype=float,
            )
        except Exception as error:
            LOGGER.warning(
                "SHAP feature importance unavailable; using model-native values: %s",
                error,
            )
            method = "native_importance"
            if hasattr(model, "coef_"):
                raw_importance = np.abs(np.asarray(model.coef_, dtype=float)).reshape(
                    -1
                )
            elif hasattr(model, "feature_importances_"):
                raw_importance = np.abs(
                    np.asarray(model.feature_importances_, dtype=float)
                ).reshape(-1)
            else:
                raise ValueError(
                    f"{metadata['model_name']} does not expose feature importance."
                ) from error

        if len(raw_importance) != len(metadata["feature_columns"]):
            raise ValueError("Model importance length does not match feature metadata.")
        total = float(raw_importance.sum())
        if not np.isfinite(total) or total <= 0:
            raise ValueError("Model importance values cannot be normalized.")

        ranked_features = sorted(
            zip(metadata["feature_columns"], raw_importance, strict=True),
            key=lambda item: item[1],
            reverse=True,
        )
        return FeatureImportanceResponse(
            model_name=metadata["model_name"],
            generated_at=metadata["training_timestamp"],
            features=[
                FeatureImportanceItem(
                    feature=feature,
                    importance=round(float(value / total * 100), 4),
                )
                for feature, value in ranked_features
            ],
            method=method,
            data_source="artifact",
        )
    except (FileNotFoundError, OSError, TypeError, ValueError) as error:
        LOGGER.warning(
            "Saved feature importance unavailable; using mock fallback: %s", error
        )
        return get_mock_feature_importance()
