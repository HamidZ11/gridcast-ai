"""Prediction helpers for trained GridCast AI models."""

import numpy as np
import pandas as pd

from app.models.base import SupportsPredict


def predict_demand(model: SupportsPredict, features: pd.DataFrame) -> np.ndarray:
    """Generate a one-dimensional numeric prediction array."""
    predictions = np.asarray(model.predict(features), dtype=float)
    if predictions.ndim != 1 or len(predictions) != len(features):
        raise ValueError("Model returned an unexpected prediction shape.")
    if not np.isfinite(predictions).all():
        raise ValueError("Model returned non-finite predictions.")
    return predictions


def recursive_forecast(
    model: SupportsPredict,
    data: pd.DataFrame,
    feature_columns: list[str],
    periods: int = 96,
    frequency: str = "30min",
) -> tuple[pd.DatetimeIndex, np.ndarray, pd.DataFrame]:
    """Generate a recursive forecast with updated lag and rolling features.

    Every prediction is appended to an in-memory demand history before the
    next feature row is built. This mirrors the training definitions, where
    rolling features use only values available before the target timestamp.
    """
    if periods <= 0:
        raise ValueError("Forecast periods must be positive.")
    required_columns = {"timestamp", "demand", *feature_columns}
    missing = sorted(required_columns.difference(data.columns))
    if missing:
        raise ValueError(f"Forecast data is missing required columns: {missing}")

    ordered = data.sort_values("timestamp").reset_index(drop=True)
    timestamps = pd.to_datetime(ordered["timestamp"], utc=True, errors="raise")
    latest = ordered.iloc[-1]
    demand_history = ordered["demand"].astype(float).tolist()
    maximum_history = max(
        [
            int(column.removeprefix("demand_lag_"))
            for column in feature_columns
            if column.startswith("demand_lag_")
        ]
        + [
            int(column.removeprefix("demand_rolling_"))
            for column in feature_columns
            if column.startswith("demand_rolling_")
        ]
        + [1]
    )
    if len(demand_history) < maximum_history:
        raise ValueError(
            f"Recursive forecasting requires at least {maximum_history} demand rows."
        )

    step = pd.Timedelta(frequency)
    forecast_timestamps: list[pd.Timestamp] = []
    feature_rows: list[dict[str, float]] = []
    predictions: list[float] = []

    for period in range(periods):
        timestamp = timestamps.iloc[-1] + step * (period + 1)
        row = {column: float(latest[column]) for column in feature_columns}
        calendar_values = {
            "hour": timestamp.hour,
            "day": timestamp.day,
            "month": timestamp.month,
            "day_of_week": timestamp.dayofweek,
            "is_weekend": int(timestamp.dayofweek >= 5),
        }
        for column, value in calendar_values.items():
            if column in row:
                row[column] = float(value)

        for column in feature_columns:
            if column.startswith("demand_lag_"):
                lag = int(column.removeprefix("demand_lag_"))
                row[column] = demand_history[-lag]
            elif column.startswith("demand_rolling_"):
                window = int(column.removeprefix("demand_rolling_"))
                row[column] = float(np.mean(demand_history[-window:]))

        feature_frame = pd.DataFrame([row], columns=feature_columns)
        prediction = float(predict_demand(model, feature_frame)[0])
        forecast_timestamps.append(timestamp)
        feature_rows.append(row)
        predictions.append(prediction)
        demand_history.append(prediction)

    return (
        pd.DatetimeIndex(forecast_timestamps),
        np.asarray(predictions, dtype=float),
        pd.DataFrame(feature_rows, columns=feature_columns),
    )


def build_forecast_response(predictions: np.ndarray) -> list[dict[str, float]]:
    """Convert raw predictions into API-ready forecast records.

    TODO:
        - Include timestamps, confidence intervals, and model metadata.
        - Ensure output matches ForecastResponse schema.
    """
    return [{"predicted_demand_gw": float(value)} for value in predictions]
