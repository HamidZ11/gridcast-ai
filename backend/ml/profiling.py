"""Dataset profiling utilities for real-world demand ingestion."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd


def _to_json_safe(value: Any) -> Any:
    """Convert pandas/numpy values into JSON-serializable Python values."""
    if pd.isna(value):
        return None
    if hasattr(value, "item"):
        return value.item()
    return value


def infer_frequency(timestamps: pd.Series) -> str | None:
    """Infer the dominant interval between sorted timestamps."""
    parsed = (
        pd.to_datetime(timestamps, utc=True, errors="coerce").dropna().sort_values()
    )
    if len(parsed) < 2:
        return None
    inferred = pd.infer_freq(parsed)
    if inferred:
        return inferred
    diffs = parsed.diff().dropna()
    if diffs.empty:
        return None
    return str(diffs.mode().iloc[0])


def create_profile(
    data: pd.DataFrame,
    timestamp_column: str = "timestamp",
    demand_column: str = "demand",
) -> dict[str, Any]:
    """Create a profiling summary for a loaded demand dataset."""
    if timestamp_column not in data.columns or demand_column not in data.columns:
        raise ValueError("Profile requires timestamp and demand columns.")

    timestamps = pd.to_datetime(data[timestamp_column], utc=True, errors="coerce")
    demand = pd.to_numeric(data[demand_column], errors="coerce")
    stats = demand.describe()

    return {
        "row_count": int(len(data)),
        "date_range": {
            "start": timestamps.min().isoformat() if not timestamps.empty else None,
            "end": timestamps.max().isoformat() if not timestamps.empty else None,
        },
        "missing_values": {
            column: int(count) for column, count in data.isna().sum().items()
        },
        "duplicate_count": int(data.duplicated(subset=[timestamp_column]).sum()),
        "frequency": infer_frequency(timestamps),
        "demand_statistics": {
            key: _to_json_safe(value) for key, value in stats.round(3).items()
        },
    }


def save_profile(profile: dict[str, Any], output_path: Path) -> Path:
    """Persist a profile summary as JSON."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(profile, indent=2), encoding="utf-8")
    return output_path


def print_profile(profile: dict[str, Any]) -> None:
    """Print a readable profile summary for CLI pipeline runs."""
    date_range = profile["date_range"]
    stats = profile["demand_statistics"]
    print("Demand dataset profile")
    print("----------------------")
    print(f"Rows: {profile['row_count']:,}")
    print(f"Date range: {date_range['start']} -> {date_range['end']}")
    print(f"Frequency: {profile['frequency']}")
    print(f"Duplicates: {profile['duplicate_count']:,}")
    print(f"Missing values: {profile['missing_values']}")
    print(
        "Demand stats: "
        f"mean={stats.get('mean')}, min={stats.get('min')}, "
        f"max={stats.get('max')}, std={stats.get('std')}"
    )
