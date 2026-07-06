"""Mock service responses for early frontend/backend integration."""

from app.schemas.responses import (
    FeatureImportanceItem,
    FeatureImportanceResponse,
    ForecastPoint,
    ForecastResponse,
    HealthResponse,
    HistoryPoint,
    HistoryResponse,
    MetricItem,
    MetricsResponse,
    ModelInfoResponse,
)


def get_health() -> HealthResponse:
    """Return service health."""
    return HealthResponse(status="operational", service="gridcast-api", version="0.1.0")


def get_forecast() -> ForecastResponse:
    """Return mock forecast points."""
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
    """Return mock historical demand points."""
    return HistoryResponse(
        source="National Grid ESO",
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


def get_metrics() -> MetricsResponse:
    """Return mock production model metrics."""
    return MetricsResponse(
        model_name="XGBoost Regressor",
        model_version="v1.3.0",
        metrics=[
            MetricItem(name="MAE", value=0.94, unit="GW"),
            MetricItem(name="RMSE", value=1.28, unit="GW"),
            MetricItem(name="MAPE", value=2.6, unit="%"),
            MetricItem(name="R2", value=0.96),
        ],
    )


def get_feature_importance() -> FeatureImportanceResponse:
    """Return mock feature-importance data."""
    return FeatureImportanceResponse(
        model_name="XGBoost Regressor",
        generated_at="2026-06-25T12:05:00Z",
        features=[
            FeatureImportanceItem(feature="Previous day demand", importance=28),
            FeatureImportanceItem(feature="Hour of day", importance=22),
            FeatureImportanceItem(feature="Rolling average demand", importance=18),
            FeatureImportanceItem(feature="Temperature", importance=12),
            FeatureImportanceItem(feature="Day of week", importance=8),
            FeatureImportanceItem(feature="Holiday flag", importance=5),
            FeatureImportanceItem(feature="Humidity", importance=4),
            FeatureImportanceItem(feature="Wind speed", importance=3),
        ],
    )


def get_model_info() -> ModelInfoResponse:
    """Return mock model metadata."""
    return ModelInfoResponse(
        name="XGBoost Regressor",
        version="v1.3.0",
        algorithm="Gradient boosted decision trees",
        status="Production",
        training_date="2026-06-24",
        training_window="Previous 24 months",
        forecast_horizon_hours=48,
        dataset="National Grid ESO",
        rows_trained=876_000,
    )
