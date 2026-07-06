"""Prediction explainability API schemas."""

from typing import Literal

from pydantic import BaseModel


class ExplainFeature(BaseModel):
    """One model feature and its local SHAP contribution."""

    name: str
    value: float
    impact: float


class ExplainResponse(BaseModel):
    """Local SHAP explanation for a forecast point."""

    prediction: float
    base_value: float
    features: list[ExplainFeature]
    forecast_index: int
    timestamp: str
    model_name: str
    method: str
    unit: str = "GW"
    data_source: Literal["artifact"] = "artifact"
