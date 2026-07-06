"""Unit tests for the data engineering pipeline."""

import pandas as pd

from ml.features.feature_builder import add_lag_features, add_rolling_features
from ml.ingestion.loaders import (
    DemandDataLoader,
    build_neso_timestamps,
    validate_settlement_periods,
)
from ml.pipeline import prepare_training_data
from ml.preprocessing.preprocessing import handle_missing_values, parse_timestamps
from ml.validation.validators import validate_dataset


def write_fixture_demand_csv(path, periods: int = 400) -> None:
    """Write a small NESO-shaped demand CSV for tests."""
    timestamps = pd.date_range("2026-06-01", periods=periods, freq="30min")
    pd.DataFrame(
        {
            "SETTLEMENT_DATE": timestamps.strftime("%d-%b-%Y").str.upper(),
            "SETTLEMENT_PERIOD": (
                (timestamps.hour * 2) + (timestamps.minute // 30) + 1
            ),
            "ND": (32000 + timestamps.hour.to_numpy() * 120).round(2),
            "TSD": (33500 + timestamps.hour.to_numpy() * 125).round(2),
            "ENGLAND_WALES_DEMAND": (29000 + timestamps.hour.to_numpy() * 105).round(2),
        }
    ).to_csv(path, index=False)


def test_timestamp_parsing() -> None:
    """Timestamp strings are parsed to UTC datetimes."""
    data = pd.DataFrame({"timestamp": ["2026-06-01 00:00:00"], "demand": [32.1]})

    parsed = parse_timestamps(data)

    assert str(parsed["timestamp"].dt.tz) == "UTC"


def test_missing_value_handling() -> None:
    """Missing numeric values are interpolated and filled."""
    data = pd.DataFrame(
        {
            "timestamp": pd.date_range("2026-06-01", periods=3, freq="h", tz="UTC"),
            "demand": [30.0, None, 34.0],
        }
    )

    cleaned = handle_missing_values(data)

    assert cleaned["demand"].isna().sum() == 0
    assert cleaned.loc[1, "demand"] == 32.0


def test_lag_feature_generation() -> None:
    """Demand lag features are shifted without leakage."""
    data = pd.DataFrame({"demand": [10.0, 20.0, 30.0]})

    featured = add_lag_features(data, lags=(1,))

    assert pd.isna(featured.loc[0, "demand_lag_1"])
    assert featured.loc[2, "demand_lag_1"] == 20.0


def test_half_hourly_lag_feature_generation() -> None:
    """Half-hourly daily and weekly lags use 48 and 336 periods."""
    data = pd.DataFrame({"demand": range(400)})

    featured = add_lag_features(data)

    assert featured.loc[48, "demand_lag_48"] == 0
    assert featured.loc[336, "demand_lag_336"] == 0


def test_rolling_average_generation() -> None:
    """Rolling means use previous observations only."""
    data = pd.DataFrame({"demand": [10.0, 20.0, 30.0, 40.0]})

    featured = add_rolling_features(data, windows=(3,))

    assert pd.isna(featured.loc[0, "demand_rolling_3"])
    assert featured.loc[3, "demand_rolling_3"] == 20.0


def test_settlement_period_to_timestamp_conversion() -> None:
    """NESO settlement periods map to 30-minute timestamps."""
    data = pd.DataFrame(
        {
            "SETTLEMENT_DATE": ["01-JAN-2024", "01-JAN-2024", "01-JAN-2024"],
            "SETTLEMENT_PERIOD": [1, 2, 48],
        }
    )

    timestamps = build_neso_timestamps(data)

    assert timestamps.iloc[0] == pd.Timestamp("2024-01-01 00:00:00")
    assert timestamps.iloc[1] == pd.Timestamp("2024-01-01 00:30:00")
    assert timestamps.iloc[2] == pd.Timestamp("2024-01-01 23:30:00")


def test_settlement_period_validation_rejects_out_of_range_periods() -> None:
    """Model-ready settlement period validation expects periods 1 through 48."""
    data = pd.DataFrame({"SETTLEMENT_PERIOD": [1, 48, 49]})

    try:
        validate_settlement_periods(data)
    except ValueError as exc:
        assert "outside 1-48" in str(exc)
    else:
        raise AssertionError("Expected settlement period validation to fail.")


def test_validation_logic_detects_issues() -> None:
    """Validation reports duplicate rows, invalid values, and ordering issues."""
    data = pd.DataFrame(
        {
            "timestamp": [
                "2026-06-01T02:00:00Z",
                "2026-06-01T01:00:00Z",
                "2026-06-01T01:00:00Z",
            ],
            "demand": [31.0, -1.0, -1.0],
        }
    )

    report = validate_dataset(data, duplicate_subset=["timestamp"])

    assert not report.passed
    assert report.duplicate_row_count == 1
    assert report.invalid_value_counts["demand"] == 2
    assert not report.is_chronological


def test_validation_logic_detects_timestamp_gaps() -> None:
    """Validation reports missing and unexpected half-hourly intervals."""
    data = pd.DataFrame(
        {
            "timestamp": [
                "2026-06-01T00:00:00Z",
                "2026-06-01T00:30:00Z",
                "2026-06-01T02:00:00Z",
            ],
            "demand": [31.0, 32.0, 33.0],
        }
    )

    report = validate_dataset(data, duplicate_subset=["timestamp"])

    assert not report.passed
    assert report.missing_interval_count == 2
    assert report.unexpected_interval_count == 1


def test_demand_loader_normalizes_real_csv_shape(tmp_path) -> None:
    """The demand loader validates, sorts, deduplicates, and fills the source CSV."""
    csv_path = tmp_path / "demand.csv"
    pd.DataFrame(
        {
            "SETTLEMENT_DATE": [
                "01-JUN-2026",
                "01-JUN-2026",
                "01-JUN-2026",
                "01-JUN-2026",
            ],
            "SETTLEMENT_PERIOD": [3, 1, 2, 2],
            "ND": [34.0, 30.0, None, 31.0],
            "TSD": [36.0, 32.0, None, 33.0],
            "ENGLAND_WALES_DEMAND": [29.0, 27.0, None, 28.0],
        }
    ).to_csv(csv_path, index=False)

    loaded = DemandDataLoader(source_path=csv_path).load()

    assert {"timestamp", "demand", "TSD", "ENGLAND_WALES_DEMAND"}.issubset(
        loaded.columns
    )
    assert loaded["timestamp"].is_monotonic_increasing
    assert loaded["timestamp"].duplicated().sum() == 0
    assert loaded["demand"].isna().sum() == 0
    assert loaded.loc[0, "demand"] == 30.0


def test_prepare_training_data_with_csv_loader(tmp_path) -> None:
    """The CSV pipeline returns a feature-engineered training dataset."""
    csv_path = tmp_path / "demand.csv"
    profile_path = tmp_path / "profile.json"
    output_path = tmp_path / "training_dataset.csv"
    write_fixture_demand_csv(csv_path)

    features, initial_report, final_report = prepare_training_data(
        demand_loader=DemandDataLoader(source_path=csv_path),
        profile_output_path=profile_path,
        training_dataset_output_path=output_path,
        print_profile_summary=False,
    )

    assert initial_report.passed
    assert final_report.passed
    assert not features.empty
    assert profile_path.exists()
    assert output_path.exists()
    assert {"demand_lag_1", "demand_lag_48", "demand_lag_336"}.issubset(
        features.columns
    )
    assert {"demand_rolling_3", "demand_rolling_48", "demand_rolling_336"}.issubset(
        features.columns
    )
    assert {"temperature", "humidity", "wind_speed", "holiday_flag"}.issubset(
        features.columns
    )
