"""Profile the selected raw demand dataset for Phase 7A discovery.

This script is intentionally read-only with respect to raw data. It inspects
the selected NESO static CSV and writes a structured profiling report to the
processed data folder for review before any pipeline changes are made.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd

BACKEND_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATASET_PATH = BACKEND_ROOT / "data" / "raw" / "neso_historic_demand_2024.csv"
DEFAULT_PROFILE_PATH = BACKEND_ROOT / "data" / "processed" / "profile.json"

TIMESTAMP_KEYWORDS = ("timestamp", "time", "date", "datetime")
EXACT_DEMAND_COLUMNS = {"ND", "TSD", "I014_ND", "I014_TSD"}
DEMAND_KEYWORDS = ("demand", "load")


def _json_safe(value: Any) -> Any:
    """Convert pandas/numpy scalar values into JSON-safe values."""
    if pd.isna(value):
        return None
    if hasattr(value, "item"):
        return value.item()
    return value


def _parse_neso_settlement_timestamps(data: pd.DataFrame) -> pd.Series | None:
    """Build half-hour timestamps from NESO settlement date/period columns."""
    required = {"SETTLEMENT_DATE", "SETTLEMENT_PERIOD"}
    if not required.issubset(data.columns):
        return None

    dates = pd.to_datetime(data["SETTLEMENT_DATE"], format="%d-%b-%Y", errors="coerce")
    periods = pd.to_numeric(data["SETTLEMENT_PERIOD"], errors="coerce")
    offsets = pd.to_timedelta((periods - 1) * 30, unit="m")
    return dates + offsets


def _find_timestamp_candidate(
    data: pd.DataFrame,
) -> tuple[str | None, pd.Series | None]:
    """Identify the most likely timestamp column or derived timestamp."""
    derived = _parse_neso_settlement_timestamps(data)
    if derived is not None and derived.notna().any():
        return "SETTLEMENT_DATE + SETTLEMENT_PERIOD", derived

    for column in data.columns:
        if any(keyword in column.lower() for keyword in TIMESTAMP_KEYWORDS):
            parsed = pd.to_datetime(data[column], errors="coerce")
            if parsed.notna().any():
                return column, parsed

    return None, None


def _find_demand_candidates(data: pd.DataFrame) -> list[str]:
    """Identify likely demand/load columns."""
    candidates: list[str] = []
    numeric_columns = set(data.select_dtypes(include="number").columns)
    for column in data.columns:
        lower = column.lower()
        is_keyword_match = column.upper() in EXACT_DEMAND_COLUMNS or any(
            keyword in lower for keyword in DEMAND_KEYWORDS
        )
        if is_keyword_match and column in numeric_columns:
            candidates.append(column)
    return candidates


def _estimate_frequency(timestamps: pd.Series | None) -> str | None:
    """Estimate the dominant timestamp frequency."""
    if timestamps is None:
        return None
    parsed = pd.to_datetime(timestamps, errors="coerce").dropna().sort_values()
    if len(parsed) < 2:
        return None
    inferred = pd.infer_freq(parsed)
    if inferred:
        return inferred
    diffs = parsed.diff().dropna()
    if diffs.empty:
        return None
    return str(diffs.mode().iloc[0])


def create_profile(dataset_path: Path = DEFAULT_DATASET_PATH) -> dict[str, Any]:
    """Create a profiling report for the selected raw dataset."""
    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset not found: {dataset_path}")

    data = pd.read_csv(dataset_path)
    timestamp_candidate, timestamps = _find_timestamp_candidate(data)
    demand_candidates = _find_demand_candidates(data)
    numeric_stats = data.describe(include="number").round(3).to_dict()

    date_range = None
    if timestamps is not None:
        parsed = pd.to_datetime(timestamps, errors="coerce").dropna()
        if not parsed.empty:
            date_range = {
                "start": parsed.min().isoformat(),
                "end": parsed.max().isoformat(),
            }

    return {
        "file_name": dataset_path.name,
        "file_path": str(dataset_path),
        "row_count": int(len(data)),
        "column_names": data.columns.tolist(),
        "first_5_rows": data.head(5)
        .where(pd.notna(data.head(5)), None)
        .to_dict(orient="records"),
        "date_range": date_range,
        "timestamp_column_candidate": timestamp_candidate,
        "demand_load_column_candidates": demand_candidates,
        "missing_values_by_column": {
            column: int(value) for column, value in data.isna().sum().items()
        },
        "duplicate_row_count": int(data.duplicated().sum()),
        "frequency_estimate": _estimate_frequency(timestamps),
        "numeric_statistics": {
            column: {key: _json_safe(value) for key, value in stats.items()}
            for column, stats in numeric_stats.items()
        },
    }


def save_profile(
    profile: dict[str, Any], output_path: Path = DEFAULT_PROFILE_PATH
) -> Path:
    """Save the profile report as JSON."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(profile, indent=2), encoding="utf-8")
    return output_path


def print_profile(profile: dict[str, Any], output_path: Path) -> None:
    """Print a readable profiling summary."""
    print("Dataset profile")
    print("---------------")
    print(f"File name: {profile['file_name']}")
    print(f"Row count: {profile['row_count']:,}")
    print(f"Column names: {', '.join(profile['column_names'])}")
    print("First 5 rows:")
    for row in profile["first_5_rows"]:
        print(f"  {row}")
    print(f"Date range: {profile['date_range']}")
    print(f"Timestamp column candidate: {profile['timestamp_column_candidate']}")
    print(
        f"Demand/load column candidates: {', '.join(profile['demand_load_column_candidates'])}"
    )
    print(f"Missing values by column: {profile['missing_values_by_column']}")
    print(f"Duplicate row count: {profile['duplicate_row_count']:,}")
    print(f"Frequency estimate: {profile['frequency_estimate']}")
    print("Numeric statistics:")
    for column, stats in profile["numeric_statistics"].items():
        print(f"  {column}: {stats}")
    print(f"Saved profile: {output_path}")


def main() -> None:
    """Profile the selected raw dataset and save profile.json."""
    profile = create_profile()
    output_path = save_profile(profile)
    print_profile(profile, output_path)


if __name__ == "__main__":
    main()
