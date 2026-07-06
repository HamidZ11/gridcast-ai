"""Response models for the GridCast AI API."""

from typing import Literal

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """System health response."""

    status: str
    service: str
    version: str


class ForecastPoint(BaseModel):
    """Single forecasted demand point."""

    timestamp: str
    predicted_demand_gw: float
    confidence_low_gw: float
    confidence_high_gw: float


class ForecastResponse(BaseModel):
    """Forecast response returned to the frontend."""

    horizon_hours: int
    generated_at: str
    unit: str = "GW"
    points: list[ForecastPoint]
    data_source: Literal["artifact", "fallback"] = "fallback"


class HistoryPoint(BaseModel):
    """Historical demand observation."""

    timestamp: str
    demand_gw: float


class HistoryResponse(BaseModel):
    """Historical demand response."""

    source: str
    unit: str = "GW"
    points: list[HistoryPoint]
    data_source: Literal["artifact", "fallback"] = "fallback"


class MetricItem(BaseModel):
    """Model metric item."""

    name: str
    value: float
    unit: str | None = None


class MetricsResponse(BaseModel):
    """Model performance metrics response."""

    model_name: str
    model_version: str
    metrics: list[MetricItem]
    data_source: Literal["artifact", "fallback"] = "fallback"


class FeatureImportanceItem(BaseModel):
    """Feature importance value."""

    feature: str
    importance: float = Field(ge=0)


class FeatureImportanceResponse(BaseModel):
    """Feature importance response."""

    model_name: str
    generated_at: str
    features: list[FeatureImportanceItem]
    method: str | None = None
    data_source: Literal["artifact", "fallback"] = "fallback"


class ModelInfoResponse(BaseModel):
    """Current production model metadata."""

    name: str
    version: str
    algorithm: str
    status: str
    training_date: str
    training_window: str
    forecast_horizon_hours: int
    dataset: str
    rows_trained: int
    selected_model: str | None = None
    target: str | None = None
    training_timestamp: str | None = None
    metrics: dict[str, float] | None = None
    feature_columns: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    all_model_metrics: dict[str, dict[str, float]] = Field(default_factory=dict)
    row_count: int | None = None
    training_rows: int | None = None
    test_rows: int | None = None
    metric_error_unit: str | None = None
    data_source: Literal["artifact", "fallback"] = "fallback"
