"""Swappable dataset loaders for GridCast AI."""

from abc import ABC, abstractmethod
from pathlib import Path

import pandas as pd

from ml.preprocessing.preprocessing import (
    handle_missing_values,
    parse_timestamps,
    remove_duplicates,
    sort_chronologically,
)

BACKEND_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DEMAND_DATASET_PATH = (
    BACKEND_ROOT / "data" / "raw" / "neso_historic_demand_2024.csv"
)
NESO_DATE_COLUMN = "SETTLEMENT_DATE"
NESO_PERIOD_COLUMN = "SETTLEMENT_PERIOD"
NESO_TARGET_COLUMN = "ND"
NESO_OPTIONAL_DEMAND_COLUMNS = ("TSD", "ENGLAND_WALES_DEMAND")
OPSD_TIMESTAMP_COLUMN = "utc_timestamp"
OPSD_DEMAND_COLUMN = "GB_UKM_load_actual_entsoe_transparency"


class DataLoader(ABC):
    """Common interface for all tabular dataset loaders."""

    def __init__(self, source_path: Path | None = None) -> None:
        self.source_path = source_path

    @abstractmethod
    def load(self) -> pd.DataFrame:
        """Load a dataset into a pandas DataFrame."""


class DemandDataLoader(DataLoader):
    """Load NESO historical electricity demand observations from a CSV file.

    The selected source is NESO Historic Demand Data. It is normalized into the
    internal schema used by the ML pipeline: ``timestamp`` and ``demand``.
    """

    def __init__(
        self,
        source_path: Path | None = None,
        target_column: str = NESO_TARGET_COLUMN,
    ) -> None:
        super().__init__(source_path or DEFAULT_DEMAND_DATASET_PATH)
        self.target_column = target_column

    def load(self) -> pd.DataFrame:
        """Load, normalize, and lightly clean NESO historical demand records."""
        if self.source_path is None or not self.source_path.exists():
            raise FileNotFoundError(
                "Historical demand CSV was not found. Download the NESO Historic Demand Data "
                f"file to {DEFAULT_DEMAND_DATASET_PATH} before running the pipeline."
            )

        self._validate_csv_columns()
        raw = pd.read_csv(self.source_path)
        normalized = normalize_neso_demand_data(raw, target_column=self.target_column)
        normalized = remove_duplicates(normalized, subset=["timestamp"])
        normalized = sort_chronologically(normalized)
        normalized = handle_missing_values(normalized)
        normalized = ensure_half_hourly_index(normalized)
        return normalized

    def _validate_csv_columns(self) -> None:
        """Validate required source columns before loading the full CSV."""
        assert self.source_path is not None
        columns = set(pd.read_csv(self.source_path, nrows=0).columns)
        required = {NESO_DATE_COLUMN, NESO_PERIOD_COLUMN, self.target_column}
        missing = required.difference(columns)
        if missing:
            raise ValueError(
                "Demand CSV is missing required columns: " + ", ".join(sorted(missing))
            )


def validate_settlement_periods(
    data: pd.DataFrame,
    period_column: str = NESO_PERIOD_COLUMN,
    min_period: int = 1,
    max_period: int = 48,
) -> None:
    """Validate settlement periods for the model-ready half-hour convention."""
    if period_column not in data.columns:
        raise ValueError(f"Missing required column: {period_column}")
    periods = pd.to_numeric(data[period_column], errors="coerce")
    invalid = periods.isna() | (periods < min_period) | (periods > max_period)
    if invalid.any():
        invalid_values = sorted(periods[invalid].dropna().unique().astype(int).tolist())
        raise ValueError(
            f"Unexpected settlement periods outside {min_period}-{max_period}: {invalid_values}"
        )


def build_neso_timestamps(
    data: pd.DataFrame,
    date_column: str = NESO_DATE_COLUMN,
    period_column: str = NESO_PERIOD_COLUMN,
) -> pd.Series:
    """Construct timestamps from NESO settlement date and settlement period."""
    required = {date_column, period_column}
    missing = required.difference(data.columns)
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(sorted(missing))}")

    dates = pd.to_datetime(data[date_column], format="%d-%b-%Y", errors="coerce")
    periods = pd.to_numeric(data[period_column], errors="coerce")
    if dates.isna().any() or periods.isna().any():
        raise ValueError("Invalid settlement dates or settlement periods found.")
    offsets = pd.to_timedelta((periods - 1) * 30, unit="m")
    return dates + offsets


def normalize_neso_demand_data(
    data: pd.DataFrame,
    target_column: str = NESO_TARGET_COLUMN,
) -> pd.DataFrame:
    """Normalize raw NESO Historic Demand Data into pipeline column names."""
    required = {NESO_DATE_COLUMN, NESO_PERIOD_COLUMN, target_column}
    missing = required.difference(data.columns)
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(sorted(missing))}")

    normalized_source = data.copy()
    periods = pd.to_numeric(normalized_source[NESO_PERIOD_COLUMN], errors="coerce")
    normalized_source = normalized_source[(periods >= 1) & (periods <= 48)].copy()
    validate_settlement_periods(normalized_source)
    normalized_source["timestamp"] = build_neso_timestamps(normalized_source)

    output_columns = ["timestamp", target_column]
    output_columns.extend(
        column
        for column in NESO_OPTIONAL_DEMAND_COLUMNS
        if column in normalized_source.columns and column != target_column
    )
    normalized = normalized_source[output_columns].rename(
        columns={target_column: "demand"}
    )
    return parse_timestamps(normalized)


def ensure_half_hourly_index(data: pd.DataFrame) -> pd.DataFrame:
    """Reindex demand data to a continuous 30-minute timestamp grid."""
    if data.empty:
        return data.copy()

    indexed = data.copy()
    indexed["timestamp"] = pd.to_datetime(
        indexed["timestamp"], utc=True, errors="coerce"
    )
    indexed = indexed.sort_values("timestamp").set_index("timestamp")
    full_index = pd.date_range(
        indexed.index.min(),
        indexed.index.max(),
        freq="30min",
        tz=indexed.index.tz,
    )
    reindexed = indexed.reindex(full_index)
    reindexed.index.name = "timestamp"
    reindexed = handle_missing_values(reindexed.reset_index())
    return reindexed


class WeatherDataLoader(DataLoader):
    """Load weather observations or forecasts."""

    def load(self) -> pd.DataFrame:
        """Return weather data.

        TODO:
            - Connect weather provider data.
            - Add regional weather weighting.
            - Separate historical observations from forecast weather.
        """
        if self.source_path:
            return pd.read_csv(self.source_path)

        timestamps = pd.date_range("2026-06-01", periods=240, freq="h", tz="UTC")
        return pd.DataFrame(
            {
                "timestamp": timestamps.astype(str),
                "temperature": 17.5 + (timestamps.hour.to_numpy() / 24 * 5),
                "humidity": 68 - (timestamps.hour.to_numpy() / 24 * 10),
                "wind_speed": 8 + (timestamps.dayofweek.to_numpy() % 3),
            }
        )

    def load_for_timestamps(self, timestamps: pd.Series) -> pd.DataFrame:
        """Return mocked weather values aligned to demand timestamps.

        TODO:
            - Replace with historical UK regional weather observations.
            - Preserve station/source metadata for later model explainability.
        """
        aligned = pd.to_datetime(timestamps, utc=True)
        return pd.DataFrame(
            {
                "timestamp": aligned,
                "temperature": 11.5 + (aligned.dt.month / 12 * 9),
                "humidity": 74 - (aligned.dt.hour / 24 * 12),
                "wind_speed": 7.5 + (aligned.dt.dayofweek % 4),
            }
        )


class CalendarDataLoader(DataLoader):
    """Load calendar and holiday data."""

    def load(self) -> pd.DataFrame:
        """Return calendar data.

        TODO:
            - Connect UK bank holiday calendar.
            - Add special events and school holiday indicators.
            - Add settlement-period calendar features if needed.
        """
        if self.source_path:
            return pd.read_csv(self.source_path)

        timestamps = pd.date_range("2026-06-01", periods=240, freq="h", tz="UTC")
        return pd.DataFrame(
            {
                "timestamp": timestamps.astype(str),
                "holiday_flag": (
                    timestamps.date == pd.Timestamp("2026-06-08").date()
                ).astype(int),
            }
        )

    def load_for_timestamps(self, timestamps: pd.Series) -> pd.DataFrame:
        """Return mocked calendar values aligned to demand timestamps.

        TODO:
            - Replace with UK bank holiday and special-event calendar data.
            - Add regional school holiday features if they improve accuracy.
        """
        aligned = pd.to_datetime(timestamps, utc=True)
        return pd.DataFrame(
            {
                "timestamp": aligned,
                "holiday_flag": aligned.dt.dayofweek.isin([5, 6]).astype(int),
            }
        )
