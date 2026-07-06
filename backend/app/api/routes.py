"""HTTP routes for GridCast AI."""

from fastapi import APIRouter, HTTPException, Query

from app.schemas.responses import (
    FeatureImportanceResponse,
    ForecastResponse,
    HealthResponse,
    HistoryResponse,
    MetricsResponse,
    ModelInfoResponse,
)
from app.schemas.explainability import ExplainResponse
from app.schemas.simulation import SimulationRequest, SimulationResponse
from app.services.mock_data_service import get_health
from app.services.inference_service import (
    get_feature_importance,
    get_forecast,
    get_history,
    get_metrics,
    get_model_info,
)
from app.services.simulation_service import simulate_scenario
from app.services.explainability_service import (
    ExplainabilityUnavailableError,
    get_prediction_explanation,
)

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["system"])
def health() -> HealthResponse:
    """Return API health and readiness information."""
    return get_health()


@router.get("/forecast", response_model=ForecastResponse, tags=["forecast"])
def forecast() -> ForecastResponse:
    """Return short-term demand forecast data."""
    return get_forecast()


@router.get("/explain", response_model=ExplainResponse, tags=["model"])
def explain(
    forecast_index: int | None = Query(default=None, ge=0, lt=96),
    timestamp: str | None = None,
) -> ExplainResponse:
    """Return a cached SHAP explanation for one forecast point."""
    try:
        return get_prediction_explanation(
            forecast_index=forecast_index,
            timestamp=timestamp,
        )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except ExplainabilityUnavailableError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@router.post("/simulate", response_model=SimulationResponse, tags=["forecast"])
def simulate(request: SimulationRequest) -> SimulationResponse:
    """Run a what-if scenario through the active forecast model."""
    return simulate_scenario(request)


@router.get("/history", response_model=HistoryResponse, tags=["forecast"])
def history() -> HistoryResponse:
    """Return recent historical demand observations."""
    return get_history()


@router.get("/metrics", response_model=MetricsResponse, tags=["model"])
def metrics() -> MetricsResponse:
    """Return model performance metrics."""
    return get_metrics()


@router.get(
    "/feature-importance", response_model=FeatureImportanceResponse, tags=["model"]
)
def feature_importance() -> FeatureImportanceResponse:
    """Return model feature-importance values."""
    return get_feature_importance()


@router.get("/model", response_model=ModelInfoResponse, tags=["model"])
def model_info() -> ModelInfoResponse:
    """Return current production model metadata."""
    return get_model_info()
