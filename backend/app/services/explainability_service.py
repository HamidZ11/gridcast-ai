"""Service layer for model-backed SHAP explanations."""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from app.core.config import settings
from app.schemas.explainability import ExplainFeature, ExplainResponse
from app.services.inference_service import (
    FORECAST_PERIODS,
    MW_PER_GW,
    _load_processed_data,
)
from ml.explainability.explainer import explain_prediction
from ml.inference.model_loader import load_model, load_model_metadata
from ml.inference.predict import recursive_forecast


class ExplainabilityUnavailableError(RuntimeError):
    """Raised when a requested model explanation cannot be produced."""


def _resolve_forecast_index(
    timestamps: pd.DatetimeIndex,
    predictions: object,
    forecast_index: int | None,
    timestamp: str | None,
) -> int:
    """Resolve an explicit point or default to the forecast peak."""
    if timestamp is not None:
        requested = pd.Timestamp(timestamp)
        if requested.tzinfo is None:
            requested = requested.tz_localize("UTC")
        else:
            requested = requested.tz_convert("UTC")
        matches = timestamps == requested
        if not matches.any():
            raise ValueError("Timestamp is not present in the current forecast window.")
        return int(matches.argmax())
    if forecast_index is not None:
        if not 0 <= forecast_index < FORECAST_PERIODS:
            raise ValueError(
                f"forecast_index must be between 0 and {FORECAST_PERIODS - 1}."
            )
        return forecast_index

    return int(pd.Series(predictions).idxmax())


def get_prediction_explanation(
    forecast_index: int | None = None,
    timestamp: str | None = None,
    model_path: Path | None = None,
    metadata_path: Path | None = None,
    dataset_path: Path | None = None,
) -> ExplainResponse:
    """Explain one point from the current 48-hour production forecast."""
    try:
        resolved_model_path = model_path or settings.model_artifact_path
        model = load_model(resolved_model_path)
        metadata = load_model_metadata(metadata_path or settings.model_metadata_path)
        data = _load_processed_data(dataset_path or settings.training_dataset_path)
        feature_columns = metadata["feature_columns"]
        timestamps, predictions, future_features = recursive_forecast(
            model,
            data,
            feature_columns,
            periods=FORECAST_PERIODS,
        )
        selected_index = _resolve_forecast_index(
            timestamps,
            predictions,
            forecast_index,
            timestamp,
        )
        background = data[feature_columns]
        explanation = explain_prediction(
            resolved_model_path,
            model,
            background,
            future_features.iloc[[selected_index]],
        )
        selected_timestamp = timestamps[selected_index]
        return ExplainResponse(
            prediction=round(explanation.prediction / MW_PER_GW, 4),
            base_value=round(explanation.base_value / MW_PER_GW, 4),
            features=[
                ExplainFeature(
                    name=item.name,
                    value=round(item.value, 4),
                    impact=round(item.impact / MW_PER_GW, 4),
                )
                for item in explanation.features[:10]
            ],
            forecast_index=selected_index,
            timestamp=selected_timestamp.isoformat().replace("+00:00", "Z"),
            model_name=metadata["model_name"],
            method=explanation.method,
        )
    except ValueError:
        raise
    except (FileNotFoundError, OSError, KeyError, TypeError) as error:
        raise ExplainabilityUnavailableError(str(error)) from error
