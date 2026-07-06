"""Feature engineering utilities for GridCast AI models."""

import pandas as pd


def generate_lag_features(data: pd.DataFrame, lags: list[int]) -> pd.DataFrame:
    """Generate demand lag variables.

    Pipeline stage: Generate lag features.

    TODO:
        - Use demand-specific naming conventions.
        - Ensure lag generation does not leak future values.
        - Add configurable lag windows for 24h, 48h, and 7-day history.
    """
    engineered = data.copy()
    for lag in lags:
        engineered[f"demand_lag_{lag}"] = engineered["demand"].shift(lag)
    return engineered


def generate_rolling_averages(data: pd.DataFrame, windows: list[int]) -> pd.DataFrame:
    """Generate rolling average demand features.

    Pipeline stage: Generate rolling averages.

    TODO:
        - Compare rolling means, medians, and exponentially weighted averages.
        - Add rolling volatility features for residual-risk detection.
    """
    engineered = data.copy()
    for window in windows:
        engineered[f"demand_rolling_mean_{window}"] = (
            engineered["demand"].rolling(window=window).mean()
        )
    return engineered


def generate_time_features(
    data: pd.DataFrame, timestamp_column: str = "timestamp"
) -> pd.DataFrame:
    """Generate calendar and cyclical time features.

    Pipeline stage: Time features.

    TODO:
        - Add cyclical hour/day encodings.
        - Add UK holiday and settlement-period indicators.
        - Add daylight-saving transition handling.
    """
    engineered = data.copy()
    timestamps = pd.to_datetime(engineered[timestamp_column], utc=True)
    engineered["hour"] = timestamps.dt.hour
    engineered["day_of_week"] = timestamps.dt.dayofweek
    engineered["month"] = timestamps.dt.month
    return engineered
