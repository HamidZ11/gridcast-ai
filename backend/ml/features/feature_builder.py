"""Feature engineering for training-ready demand forecasting datasets."""

import pandas as pd

from ml.preprocessing.preprocessing import validate_required_columns


def add_time_features(
    data: pd.DataFrame, timestamp_column: str = "timestamp"
) -> pd.DataFrame:
    """Add hour, day, month, day-of-week, and weekend features."""
    validate_required_columns(data, [timestamp_column])
    featured = data.copy()
    timestamps = pd.to_datetime(featured[timestamp_column], utc=True)
    featured["hour"] = timestamps.dt.hour
    featured["day"] = timestamps.dt.day
    featured["month"] = timestamps.dt.month
    featured["day_of_week"] = timestamps.dt.dayofweek
    featured["is_weekend"] = featured["day_of_week"].isin([5, 6]).astype(int)
    return featured


def add_lag_features(
    data: pd.DataFrame,
    demand_column: str = "demand",
    lags: tuple[int, ...] = (1, 48, 336),
) -> pd.DataFrame:
    """Add half-hourly demand lag features for t-1, t-48, and t-336 by default."""
    validate_required_columns(data, [demand_column])
    featured = data.copy()
    for lag in lags:
        featured[f"demand_lag_{lag}"] = featured[demand_column].shift(lag)
    return featured


def add_rolling_features(
    data: pd.DataFrame,
    demand_column: str = "demand",
    windows: tuple[int, ...] = (3, 48, 336),
) -> pd.DataFrame:
    """Add half-hourly rolling demand features for 3, 48, and 336 periods."""
    validate_required_columns(data, [demand_column])
    featured = data.copy()
    for window in windows:
        featured[f"demand_rolling_{window}"] = (
            featured[demand_column]
            .shift(1)
            .rolling(window=window, min_periods=1)
            .mean()
        )
    return featured


def add_weather_placeholders(data: pd.DataFrame) -> pd.DataFrame:
    """Ensure expected weather feature columns exist."""
    featured = data.copy()
    for column in ["temperature", "humidity", "wind_speed"]:
        if column not in featured.columns:
            featured[column] = pd.NA
    return featured


def add_calendar_placeholders(data: pd.DataFrame) -> pd.DataFrame:
    """Ensure expected calendar feature columns exist."""
    featured = data.copy()
    if "holiday_flag" not in featured.columns:
        featured["holiday_flag"] = 0
    return featured


def build_training_features(data: pd.DataFrame) -> pd.DataFrame:
    """Build a clean, training-ready feature table.

    Rows without lag values are dropped because they cannot be used for
    supervised model training without leakage or imputation decisions.
    """
    featured = add_time_features(data)
    featured = add_weather_placeholders(featured)
    featured = add_calendar_placeholders(featured)
    featured = add_lag_features(featured)
    featured = add_rolling_features(featured)
    return featured.dropna(
        subset=["demand_lag_1", "demand_lag_48", "demand_lag_336"]
    ).reset_index(drop=True)
