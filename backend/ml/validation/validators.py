"""Validation utilities for demand forecasting datasets."""

from dataclasses import dataclass, field

import pandas as pd


@dataclass(frozen=True)
class ValidationReport:
    """Summary of dataset quality checks."""

    row_count: int
    missing_timestamp_count: int
    duplicate_row_count: int
    missing_interval_count: int
    unexpected_interval_count: int
    expected_frequency: str | None
    null_percentages: dict[str, float]
    invalid_value_counts: dict[str, int]
    is_chronological: bool
    issues: list[str] = field(default_factory=list)

    @property
    def passed(self) -> bool:
        """Return True when no validation issues were detected."""
        return not self.issues


def check_missing_timestamps(
    data: pd.DataFrame, timestamp_column: str = "timestamp"
) -> int:
    """Count missing timestamp values."""
    if timestamp_column not in data.columns:
        return len(data)
    return int(data[timestamp_column].isna().sum())


def check_duplicate_rows(data: pd.DataFrame, subset: list[str] | None = None) -> int:
    """Count duplicate rows."""
    return int(data.duplicated(subset=subset).sum())


def calculate_null_percentages(data: pd.DataFrame) -> dict[str, float]:
    """Calculate null percentage per column."""
    if data.empty:
        return {column: 0.0 for column in data.columns}
    return {
        column: float(value)
        for column, value in (data.isna().mean() * 100).round(2).items()
    }


def check_invalid_values(data: pd.DataFrame) -> dict[str, int]:
    """Count obvious invalid values for known numeric fields."""
    invalid_counts: dict[str, int] = {}
    for column in ["demand", "temperature", "humidity", "wind_speed"]:
        if column not in data.columns:
            continue
        if column in {"demand", "humidity", "wind_speed"}:
            invalid_counts[column] = int((data[column] < 0).sum())
        if column == "humidity":
            invalid_counts[column] += int((data[column] > 100).sum())
    return invalid_counts


def check_chronological_ordering(
    data: pd.DataFrame, timestamp_column: str = "timestamp"
) -> bool:
    """Check whether timestamps are monotonically increasing."""
    if timestamp_column not in data.columns:
        return False
    timestamps = pd.to_datetime(data[timestamp_column], utc=True, errors="coerce")
    return bool(timestamps.is_monotonic_increasing)


def check_timestamp_intervals(
    data: pd.DataFrame,
    timestamp_column: str = "timestamp",
) -> tuple[int, int, str | None]:
    """Detect gaps and unexpected intervals in a timestamp series."""
    if timestamp_column not in data.columns or len(data) < 2:
        return 0, 0, None

    timestamps = (
        pd.to_datetime(data[timestamp_column], utc=True, errors="coerce")
        .dropna()
        .sort_values()
    )
    if len(timestamps) < 2:
        return 0, 0, None

    diffs = timestamps.diff().dropna()
    expected_interval = diffs.mode().iloc[0]
    if expected_interval <= pd.Timedelta(0):
        return 0, 0, str(expected_interval)

    missing_intervals = int(
        ((diffs[diffs > expected_interval] / expected_interval) - 1).sum()
    )
    unexpected_intervals = int((diffs != expected_interval).sum())
    return missing_intervals, unexpected_intervals, str(expected_interval)


def validate_dataset(
    data: pd.DataFrame,
    timestamp_column: str = "timestamp",
    duplicate_subset: list[str] | None = None,
    expected_interval: pd.Timedelta | None = None,
) -> ValidationReport:
    """Validate core dataset quality and return a report."""
    missing_timestamps = check_missing_timestamps(data, timestamp_column)
    duplicate_rows = check_duplicate_rows(data, subset=duplicate_subset)
    missing_intervals, unexpected_intervals, expected_frequency = (
        check_timestamp_intervals(data, timestamp_column)
    )
    null_percentages = calculate_null_percentages(data)
    invalid_values = check_invalid_values(data)
    is_chronological = check_chronological_ordering(data, timestamp_column)

    issues: list[str] = []
    if missing_timestamps:
        issues.append(f"{missing_timestamps} missing timestamps")
    if duplicate_rows:
        issues.append(f"{duplicate_rows} duplicate rows")
    if missing_intervals:
        issues.append(f"{missing_intervals} missing timestamp intervals")
    if unexpected_intervals:
        issues.append(f"{unexpected_intervals} unexpected timestamp intervals")
    if expected_interval is not None and expected_frequency != str(expected_interval):
        issues.append(
            f"Expected timestamp interval {expected_interval}, found {expected_frequency}"
        )
    if any(count > 0 for count in invalid_values.values()):
        issues.append("Invalid numeric values detected")
    if not is_chronological and len(data) > 1:
        issues.append("Timestamps are not chronological")

    return ValidationReport(
        row_count=len(data),
        missing_timestamp_count=missing_timestamps,
        duplicate_row_count=duplicate_rows,
        missing_interval_count=missing_intervals,
        unexpected_interval_count=unexpected_intervals,
        expected_frequency=expected_frequency,
        null_percentages=null_percentages,
        invalid_value_counts=invalid_values,
        is_chronological=is_chronological,
        issues=issues,
    )
