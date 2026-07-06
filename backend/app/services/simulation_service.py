"""Model-backed what-if simulation service."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

import numpy as np
import pandas as pd

from app.core.config import settings
from app.schemas.responses import ForecastPoint
from app.schemas.simulation import (
    SimulationMetrics,
    SimulationRequest,
    SimulationResponse,
)
from app.services.inference_service import (
    FORECAST_PERIODS,
    MW_PER_GW,
    NINETY_PERCENT_Z_SCORE,
    _build_future_features,
    _load_processed_data,
    get_forecast,
)
from ml.inference.model_loader import load_model, load_model_metadata
from ml.inference.predict import predict_demand

LOGGER = logging.getLogger(__name__)
BASE_CARBON_INTENSITY_G_PER_KWH = 142.0
SCENARIO_LIMITATIONS = [
    "Temperature, generation mix, sector demand, and bank holidays are not dedicated features in the current model.",
    "Those inputs currently use isolated provisional adjustments to lag and rolling-demand features.",
    "Lag and rolling values are held from the latest observation rather than updated recursively.",
]


def _gaussian(periods: np.ndarray, centre: float, width: float) -> np.ndarray:
    """Return a smooth half-hourly weighting profile."""
    return np.exp(-np.square(periods - centre) / (2 * width**2))


def _scenario_adjustment_factors(
    timestamps: pd.DatetimeIndex,
    request: SimulationRequest,
) -> np.ndarray:
    """Build provisional demand effects for unsupported scenario variables.

    The factors are deliberately isolated here. When weather, generation, sector,
    and holiday features are trained into the model, this function can be
    replaced with direct feature assignments without changing the API.
    """
    periods = np.arange(len(timestamps), dtype=float) % 48
    daytime = 0.25 + 0.75 * _gaussian(periods, 25, 10)
    evening = 0.28 + 0.72 * _gaussian(periods, 37, 6)
    residential = (
        0.3 + 0.42 * _gaussian(periods, 15, 5.5) + 0.58 * _gaussian(periods, 37, 6.5)
    )
    solar = _gaussian(periods, 25, 7.5)

    temperature_effect = np.where(
        request.temperature_anomaly >= 0,
        request.temperature_anomaly * 0.003 * (0.35 + 0.65 * _gaussian(periods, 32, 9)),
        abs(request.temperature_anomaly)
        * 0.0045
        * (0.45 + 0.3 * _gaussian(periods, 15, 7) + 0.4 * _gaussian(periods, 37, 7)),
    )
    wind_effect = (1 - request.wind_generation_multiplier) * 0.022
    solar_effect = (1 - request.solar_generation_multiplier) * 0.016 * solar
    ev_effect = (request.ev_demand_multiplier - 1) * 0.035 * evening
    industrial_effect = (request.industrial_demand_multiplier - 1) * 0.085 * daytime
    residential_effect = (
        (request.residential_demand_multiplier - 1) * 0.12 * residential
    )
    weekend_effect = -0.025 * daytime + 0.008 * evening if request.weekend_flag else 0
    holiday_effect = (
        -0.045 * daytime + 0.012 * residential if request.bank_holiday_flag else 0
    )
    factors = (
        1
        + temperature_effect
        + wind_effect
        + solar_effect
        + ev_effect
        + industrial_effect
        + residential_effect
        + weekend_effect
        + holiday_effect
    )
    return np.clip(factors, 0.75, 1.3)


def apply_scenario_to_features(
    features: pd.DataFrame,
    timestamps: pd.DatetimeIndex,
    request: SimulationRequest,
) -> pd.DataFrame:
    """Apply scenario assumptions to model features without mutating the baseline."""
    adjusted = features.copy()
    factors = _scenario_adjustment_factors(timestamps, request)

    demand_features = [
        column
        for column in adjusted.columns
        if column.startswith("demand_lag_") or column.startswith("demand_rolling_")
    ]
    for column in demand_features:
        adjusted[column] = adjusted[column].astype(float).to_numpy() * factors

    if "is_weekend" in adjusted.columns:
        adjusted["is_weekend"] = int(request.weekend_flag)
    if "is_holiday" in adjusted.columns:
        adjusted["is_holiday"] = int(request.bank_holiday_flag)
    if "holiday_flag" in adjusted.columns:
        adjusted["holiday_flag"] = int(request.bank_holiday_flag)
    if "temperature" in adjusted.columns:
        adjusted["temperature"] = (
            adjusted["temperature"].astype(float) + request.temperature_anomaly
        )
    if "wind_generation" in adjusted.columns:
        adjusted["wind_generation"] = (
            adjusted["wind_generation"].astype(float)
            * request.wind_generation_multiplier
        )
    if "solar_generation" in adjusted.columns:
        adjusted["solar_generation"] = (
            adjusted["solar_generation"].astype(float)
            * request.solar_generation_multiplier
        )
    return adjusted


def _forecast_points(
    timestamps: pd.DatetimeIndex,
    predictions_mw: np.ndarray,
    interval_width_gw: float,
) -> list[ForecastPoint]:
    """Convert model predictions into the shared forecast point contract."""
    return [
        ForecastPoint(
            timestamp=timestamp.isoformat().replace("+00:00", "Z"),
            predicted_demand_gw=round(max(prediction_mw / MW_PER_GW, 0), 3),
            confidence_low_gw=round(
                max(prediction_mw / MW_PER_GW - interval_width_gw, 0), 3
            ),
            confidence_high_gw=round(
                max(prediction_mw / MW_PER_GW + interval_width_gw, 0), 3
            ),
        )
        for timestamp, prediction_mw in zip(timestamps, predictions_mw, strict=True)
    ]


def _summary(request: SimulationRequest, peak_change_gw: float) -> str:
    """Describe the two strongest scenario drivers in plain English."""
    drivers: list[tuple[float, str]] = []
    inputs = [
        (
            abs(request.temperature_anomaly) * 10,
            (
                "hotter temperatures"
                if request.temperature_anomaly > 0
                else "colder temperatures"
            ),
            abs(request.temperature_anomaly) >= 2,
        ),
        (
            abs(request.wind_generation_multiplier - 1) * 100,
            (
                "reduced wind generation"
                if request.wind_generation_multiplier < 1
                else "higher wind generation"
            ),
            abs(request.wind_generation_multiplier - 1) >= 0.1,
        ),
        (
            abs(request.solar_generation_multiplier - 1) * 100,
            (
                "reduced solar generation"
                if request.solar_generation_multiplier < 1
                else "higher solar generation"
            ),
            abs(request.solar_generation_multiplier - 1) >= 0.1,
        ),
        (
            abs(request.ev_demand_multiplier - 1) * 100,
            (
                "higher EV charging demand"
                if request.ev_demand_multiplier > 1
                else "lower EV charging demand"
            ),
            abs(request.ev_demand_multiplier - 1) >= 0.1,
        ),
        (
            abs(request.industrial_demand_multiplier - 1) * 100,
            (
                "higher industrial demand"
                if request.industrial_demand_multiplier > 1
                else "lower industrial demand"
            ),
            abs(request.industrial_demand_multiplier - 1) >= 0.1,
        ),
        (
            abs(request.residential_demand_multiplier - 1) * 100,
            (
                "higher residential demand"
                if request.residential_demand_multiplier > 1
                else "lower residential demand"
            ),
            abs(request.residential_demand_multiplier - 1) >= 0.1,
        ),
    ]
    drivers.extend((score, phrase) for score, phrase, active in inputs if active)
    if request.weekend_flag:
        drivers.append((18, "weekend activity"))
    if request.bank_holiday_flag:
        drivers.append((22, "bank holiday activity"))

    if not drivers:
        return (
            "Scenario inputs match the baseline operating assumptions, so no "
            "material change in peak demand is projected."
        )
    phrases = [
        phrase
        for _, phrase in sorted(drivers, reverse=True, key=lambda item: item[0])[:2]
    ]
    driver_text = (
        phrases[0] if len(phrases) == 1 else f"{phrases[0]} combined with {phrases[1]}"
    )
    direction = "increase" if peak_change_gw >= 0 else "reduce"
    return (
        f"{driver_text.capitalize()} {direction} predicted peak demand by "
        f"{abs(peak_change_gw):.1f} GW across the next 48 hours."
    )


def _build_response(
    request: SimulationRequest,
    timestamps: pd.DatetimeIndex,
    baseline_mw: np.ndarray,
    scenario_mw: np.ndarray,
    rmse_mw: float,
    mape: float,
    data_source: Literal["artifact", "fallback"],
) -> SimulationResponse:
    """Calculate scenario points, aggregates, uncertainty, and impact metrics."""
    extremity = (
        abs(request.temperature_anomaly) * 0.3
        + abs(request.wind_generation_multiplier - 1) * 2
        + abs(request.solar_generation_multiplier - 1) * 1.2
        + abs(request.ev_demand_multiplier - 1) * 1.5
        + abs(request.industrial_demand_multiplier - 1) * 1.2
        + abs(request.residential_demand_multiplier - 1) * 1.2
        + (0.4 if request.weekend_flag else 0)
        + (0.6 if request.bank_holiday_flag else 0)
    )
    interval_width_gw = max(
        NINETY_PERCENT_Z_SCORE * rmse_mw / MW_PER_GW + extremity * 0.035,
        0.1,
    )
    baseline_points = _forecast_points(timestamps, baseline_mw, interval_width_gw)
    points = _forecast_points(timestamps, scenario_mw, interval_width_gw)
    scenario_gw = np.maximum(scenario_mw / MW_PER_GW, 0)
    baseline_gw = np.maximum(baseline_mw / MW_PER_GW, 0)
    peak_index = int(np.argmax(scenario_gw))
    peak_demand = float(scenario_gw[peak_index])
    baseline_peak = float(np.max(baseline_gw))
    energy = float(scenario_gw.sum() * 0.5)
    baseline_energy = float(baseline_gw.sum() * 0.5)
    carbon_factor = float(
        np.clip(
            1
            - 0.16 * (request.wind_generation_multiplier - 1)
            - 0.08 * (request.solar_generation_multiplier - 1),
            0.65,
            1.35,
        )
    )
    carbon = energy * (BASE_CARBON_INTENSITY_G_PER_KWH / 1_000) * carbon_factor
    baseline_carbon = baseline_energy * (BASE_CARBON_INTENSITY_G_PER_KWH / 1_000)
    peak_change = peak_demand - baseline_peak
    grid_stress = (
        "High"
        if peak_demand >= 51 or peak_change >= 3
        else "Medium" if peak_demand >= 48 or peak_change >= 1.2 else "Low"
    )
    confidence = max(75, min(99, 100 - mape - extremity))

    return SimulationResponse(
        horizon_hours=48,
        generated_at=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        points=points,
        baseline_points=baseline_points,
        metrics=SimulationMetrics(
            peak_demand_gw=round(peak_demand, 3),
            average_demand_gw=round(float(scenario_gw.mean()), 3),
            total_energy_gwh=round(energy, 3),
            carbon_estimate_ktco2=round(carbon, 3),
            peak_time=timestamps[peak_index].isoformat().replace("+00:00", "Z"),
            peak_change_gw=round(peak_change, 3),
            energy_change_gwh=round(energy - baseline_energy, 3),
            carbon_change_ktco2=round(carbon - baseline_carbon, 3),
            confidence_percent=round(confidence, 1),
            grid_stress=grid_stress,
        ),
        summary=_summary(request, peak_change),
        limitations=SCENARIO_LIMITATIONS,
        data_source=data_source,
    )


def simulate_scenario(
    request: SimulationRequest,
    model_path: Path | None = None,
    metadata_path: Path | None = None,
    dataset_path: Path | None = None,
) -> SimulationResponse:
    """Run a 48-hour scenario through the active trained model."""
    try:
        model = load_model(model_path or settings.model_artifact_path)
        metadata = load_model_metadata(metadata_path or settings.model_metadata_path)
        data = _load_processed_data(dataset_path or settings.training_dataset_path)
        timestamps, baseline_features = _build_future_features(
            data, metadata["feature_columns"]
        )
        scenario_features = apply_scenario_to_features(
            baseline_features, timestamps, request
        )
        baseline_mw = predict_demand(model, baseline_features)
        scenario_mw = predict_demand(model, scenario_features)
        return _build_response(
            request=request,
            timestamps=timestamps,
            baseline_mw=baseline_mw,
            scenario_mw=scenario_mw,
            rmse_mw=float(metadata["metrics"].get("rmse", 0)),
            mape=float(metadata["metrics"].get("mape", 0)),
            data_source="artifact",
        )
    except (FileNotFoundError, OSError, KeyError, TypeError, ValueError) as error:
        LOGGER.warning("Model-backed simulation unavailable; using fallback: %s", error)
        fallback = get_forecast()
        timestamps = pd.DatetimeIndex(
            pd.to_datetime(
                [point.timestamp for point in fallback.points],
                utc=True,
            )
        )
        baseline_mw = np.asarray(
            [point.predicted_demand_gw * MW_PER_GW for point in fallback.points]
        )
        scenario_mw = baseline_mw * _scenario_adjustment_factors(timestamps, request)
        return _build_response(
            request=request,
            timestamps=timestamps,
            baseline_mw=baseline_mw,
            scenario_mw=scenario_mw,
            rmse_mw=750,
            mape=4,
            data_source="fallback",
        )
