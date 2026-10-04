"""Fallback responses for when the saved artifacts cannot be loaded.

Every response here carries data_source="fallback", and the dashboard labels it
as such instead of presenting it as a result.

Model-describing fallbacks describe the model that is actually deployed:
- /metrics and /model only fall back when backend/models/model_metadata.json
  cannot be read or is malformed, so they use DEPLOYED_MODEL, a copy of that
  file. A test fails if the copy and the file disagree.
- /feature-importance can fall back while the metadata is still readable (the
  model file or the dataset is missing). It reads the metadata first and only
  reports the recorded influences if they belong to that same model.

/forecast and /history fall back to short illustrative series.
"""

from pathlib import Path

from app.core.config import settings
from app.schemas.responses import (
    FeatureImportanceItem,
    FeatureImportanceResponse,
    ForecastPoint,
    ForecastResponse,
    HealthResponse,
    HistoryPoint,
    HistoryResponse,
)
from ml.inference.model_loader import ModelMetadataPayload, load_model_metadata

# Copy of backend/models/model_metadata.json for the deployed model.
DEPLOYED_MODEL: ModelMetadataPayload = {
    "model_name": "Linear Regression",
    "training_timestamp": "2026-06-26T14:51:52.212563+00:00",
    "dataset": "NESO Historic Demand Data 2024",
    "target": "ND / demand",
    "row_count": 17232,
    "metrics": {
        "mae": 385.74935478020075,
        "rmse": 492.0337404419855,
        "mape": 1.3589508228085907,
        "r2": 0.9936485819787304,
    },
    "all_model_metrics": {
        "Linear Regression": {
            "mae": 385.74935478020075,
            "rmse": 492.0337404419855,
            "mape": 1.3589508228085907,
            "r2": 0.9936485819787304,
        },
        "Random Forest Regressor": {
            "mae": 374.35927215945713,
            "rmse": 492.18011326357015,
            "mape": 1.2889088460136386,
            "r2": 0.9936448025092236,
        },
    },
    "feature_columns": [
        "hour",
        "day",
        "month",
        "day_of_week",
        "is_weekend",
        "demand_lag_1",
        "demand_lag_48",
        "demand_lag_336",
        "demand_rolling_3",
        "demand_rolling_48",
        "demand_rolling_336",
    ],
    "training_rows": 13785,
    "test_rows": 3447,
    "notes": [
        "Baseline model trained on engineered demand/time features only.",
        "Weather features are not yet included.",
        "TSD and ENGLAND_WALES_DEMAND are excluded to avoid target leakage.",
    ],
}

# Share of mean absolute SHAP value (%) per feature for DEPLOYED_MODEL, as
# served by /feature-importance from that artifact. Metadata stores feature
# names but not their influence, so this is recorded rather than derived.
DEPLOYED_FEATURE_INFLUENCE: dict[str, float] = {
    "demand_lag_1": 65.179,
    "demand_rolling_3": 31.9412,
    "demand_rolling_48": 1.0879,
    "demand_lag_336": 0.5987,
    "demand_lag_48": 0.4077,
    "day_of_week": 0.3564,
    "hour": 0.2035,
    "demand_rolling_336": 0.1386,
    "is_weekend": 0.0501,
    "month": 0.0312,
    "day": 0.0056,
}


def get_health() -> HealthResponse:
    """Return service health."""
    return HealthResponse(status="operational", service="gridcast-api", version="0.1.0")


def get_forecast() -> ForecastResponse:
    """Return a short illustrative forecast series."""
    return ForecastResponse(
        horizon_hours=48,
        generated_at="2026-06-25T12:05:00Z",
        points=[
            ForecastPoint(
                timestamp="2026-06-25T12:00:00Z",
                predicted_demand_gw=41.7,
                confidence_low_gw=40.6,
                confidence_high_gw=42.8,
            ),
            ForecastPoint(
                timestamp="2026-06-25T14:00:00Z",
                predicted_demand_gw=43.5,
                confidence_low_gw=41.9,
                confidence_high_gw=45.0,
            ),
            ForecastPoint(
                timestamp="2026-06-25T16:00:00Z",
                predicted_demand_gw=46.1,
                confidence_low_gw=44.1,
                confidence_high_gw=48.0,
            ),
            ForecastPoint(
                timestamp="2026-06-25T18:00:00Z",
                predicted_demand_gw=48.2,
                confidence_low_gw=45.8,
                confidence_high_gw=50.3,
            ),
            ForecastPoint(
                timestamp="2026-06-25T20:00:00Z",
                predicted_demand_gw=45.6,
                confidence_low_gw=43.7,
                confidence_high_gw=47.4,
            ),
            ForecastPoint(
                timestamp="2026-06-25T22:00:00Z",
                predicted_demand_gw=39.8,
                confidence_low_gw=38.4,
                confidence_high_gw=41.3,
            ),
        ],
    )


def get_history() -> HistoryResponse:
    """Return a short illustrative demand series."""
    return HistoryResponse(
        source="Illustrative fallback series",
        points=[
            HistoryPoint(timestamp="2026-06-25T00:00:00Z", demand_gw=31.8),
            HistoryPoint(timestamp="2026-06-25T02:00:00Z", demand_gw=29.6),
            HistoryPoint(timestamp="2026-06-25T04:00:00Z", demand_gw=28.9),
            HistoryPoint(timestamp="2026-06-25T06:00:00Z", demand_gw=33.7),
            HistoryPoint(timestamp="2026-06-25T08:00:00Z", demand_gw=39.4),
            HistoryPoint(timestamp="2026-06-25T10:00:00Z", demand_gw=41.0),
            HistoryPoint(timestamp="2026-06-25T12:00:00Z", demand_gw=41.7),
        ],
    )


def _is_deployed_model(metadata: ModelMetadataPayload) -> bool:
    return (
        metadata["model_name"] == DEPLOYED_MODEL["model_name"]
        and metadata["training_timestamp"] == DEPLOYED_MODEL["training_timestamp"]
    )


def get_feature_importance(metadata_path: Path | None = None) -> FeatureImportanceResponse:
    """Return the deployed model's recorded influences, or none for another model."""
    try:
        saved = load_model_metadata(metadata_path or settings.model_metadata_path)
    except (OSError, ValueError):
        saved = None

    if saved is not None and not _is_deployed_model(saved):
        # The saved metadata describes a model these influences were not
        # recorded for. Report none rather than another model's.
        return FeatureImportanceResponse(
            model_name=saved["model_name"],
            generated_at=saved["training_timestamp"],
            features=[],
        )

    return FeatureImportanceResponse(
        model_name=DEPLOYED_MODEL["model_name"],
        generated_at=DEPLOYED_MODEL["training_timestamp"],
        features=[
            FeatureImportanceItem(feature=feature, importance=importance)
            for feature, importance in DEPLOYED_FEATURE_INFLUENCE.items()
        ],
        method="mean_absolute_shap",
    )
