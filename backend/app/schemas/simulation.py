"""Scenario simulation API schemas."""

from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.responses import ForecastPoint


class SimulationRequest(BaseModel):
    """Operational assumptions applied to the active forecast model."""

    temperature_anomaly: float = Field(ge=-10, le=10)
    wind_generation_multiplier: float = Field(ge=0, le=1.5)
    solar_generation_multiplier: float = Field(ge=0, le=1.5)
    ev_demand_multiplier: float = Field(ge=0, le=1.5)
    industrial_demand_multiplier: float = Field(ge=0, le=1.5)
    residential_demand_multiplier: float = Field(ge=0, le=1.5)
    weekend_flag: bool
    bank_holiday_flag: bool


class SimulationMetrics(BaseModel):
    """Aggregate values calculated from a 48-hour simulation."""

    peak_demand_gw: float
    average_demand_gw: float
    total_energy_gwh: float
    carbon_estimate_ktco2: float
    peak_time: str
    peak_change_gw: float
    energy_change_gwh: float
    carbon_change_ktco2: float
    confidence_percent: float
    grid_stress: Literal["Low", "Medium", "High"]


class SimulationResponse(BaseModel):
    """Model-backed scenario forecast with its unmodified baseline."""

    horizon_hours: int
    generated_at: str
    unit: str = "GW"
    points: list[ForecastPoint]
    baseline_points: list[ForecastPoint]
    metrics: SimulationMetrics
    summary: str
    limitations: list[str]
    data_source: Literal["artifact", "fallback"]
