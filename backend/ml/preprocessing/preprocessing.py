"""Reusable preprocessing stages for electricity demand forecasting."""

from pathlib import Path

import pandas as pd


def load_raw_data(data_path: Path) -> pd.DataFrame:
    """Load raw demand data from storage.

    Pipeline stage: Load data.

    TODO:
        - Support National Grid ESO source files.
        - Validate required columns and timestamp timezone.
        - Add source-specific loaders for CSV/API extracts.
    """
    raise NotImplementedError(
        "Raw data loading will be implemented during the data ingestion phase."
    )


def clean_missing_values(data: pd.DataFrame) -> pd.DataFrame:
    """Clean missing or invalid demand records.

    Pipeline stage: Clean missing values.

    TODO:
        - Define interpolation rules for short gaps.
        - Flag long outages for exclusion.
        - Preserve audit columns for downstream diagnostics.
    """
    return handle_missing_values(data)


def merge_weather_data(
    demand_data: pd.DataFrame, weather_data: pd.DataFrame
) -> pd.DataFrame:
    """Merge weather observations into demand data.

    Pipeline stage: Weather merge.

    TODO:
        - Align weather observations to demand timestamps.
        - Add regional weighting for temperature and wind signals.
        - Handle future weather forecast data separately from historical observations.
    """
    return demand_data.merge(weather_data, on="timestamp", how="left")


def validate_required_columns(data: pd.DataFrame, required_columns: list[str]) -> None:
    """Validate that a DataFrame contains required columns."""
    missing = [column for column in required_columns if column not in data.columns]
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(missing)}")


def parse_timestamps(
    data: pd.DataFrame, timestamp_column: str = "timestamp"
) -> pd.DataFrame:
    """Parse timestamps as UTC pandas datetimes."""
    validate_required_columns(data, [timestamp_column])
    parsed = data.copy()
    parsed[timestamp_column] = pd.to_datetime(
        parsed[timestamp_column], utc=True, errors="coerce"
    )
    if parsed[timestamp_column].isna().any():
        raise ValueError(f"Invalid timestamp values found in {timestamp_column}.")
    return parsed


def remove_duplicates(
    data: pd.DataFrame, subset: list[str] | None = None
) -> pd.DataFrame:
    """Remove duplicate rows while keeping the first occurrence."""
    return data.drop_duplicates(subset=subset, keep="first").reset_index(drop=True)


def sort_chronologically(
    data: pd.DataFrame, timestamp_column: str = "timestamp"
) -> pd.DataFrame:
    """Sort rows by timestamp in ascending order."""
    validate_required_columns(data, [timestamp_column])
    return data.sort_values(timestamp_column).reset_index(drop=True)


def handle_missing_values(data: pd.DataFrame) -> pd.DataFrame:
    """Handle missing values in a conservative, model-prep-friendly way.

    Numeric columns are time-interpolated, then forward/back-filled for edge
    values. Non-numeric columns are forward/back-filled.
    """
    cleaned = data.copy()
    numeric_columns = cleaned.select_dtypes(include="number").columns
    non_numeric_columns = cleaned.columns.difference(numeric_columns)

    if len(numeric_columns) > 0:
        cleaned[numeric_columns] = cleaned[numeric_columns].interpolate(
            limit_direction="both"
        )
        cleaned[numeric_columns] = cleaned[numeric_columns].ffill().bfill()
    if len(non_numeric_columns) > 0:
        cleaned[non_numeric_columns] = cleaned[non_numeric_columns].ffill().bfill()

    return cleaned


def detect_obvious_outliers(
    data: pd.DataFrame,
    column: str = "demand",
    z_score_threshold: float = 4.0,
) -> pd.DataFrame:
    """Flag obvious outliers without removing them."""
    validate_required_columns(data, [column])
    checked = data.copy()
    std = checked[column].std()
    if std == 0 or pd.isna(std):
        checked[f"{column}_outlier_flag"] = False
        return checked

    z_scores = (checked[column] - checked[column].mean()).abs() / std
    checked[f"{column}_outlier_flag"] = z_scores > z_score_threshold
    return checked


def preprocess_demand_data(data: pd.DataFrame) -> pd.DataFrame:
    """Run standard demand preprocessing steps."""
    validate_required_columns(data, ["timestamp", "demand"])
    cleaned = parse_timestamps(data)
    cleaned = remove_duplicates(cleaned, subset=["timestamp"])
    cleaned = sort_chronologically(cleaned)
    cleaned = handle_missing_values(cleaned)
    return detect_obvious_outliers(cleaned, column="demand")
