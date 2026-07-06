"""Tests for baseline model training workflow."""

import numpy as np
import pandas as pd

from ml.evaluation.evaluate import evaluate_model
from ml.training.train import (
    TARGET_COLUMN,
    TRAINING_FEATURE_COLUMNS,
    load_processed_training_dataset,
    run_training,
    separate_features_and_target,
    train_test_split_time_series,
)


def make_processed_training_data(rows: int = 120) -> pd.DataFrame:
    """Create a small processed NESO-style training dataset."""
    timestamps = pd.date_range("2024-01-08", periods=rows, freq="30min", tz="UTC")
    base = (
        26000 + timestamps.hour.to_numpy() * 130 + timestamps.dayofweek.to_numpy() * 90
    )
    data = pd.DataFrame(
        {
            "timestamp": timestamps.astype(str),
            "demand": base.astype(float),
            "TSD": base.astype(float) + 1800,
            "ENGLAND_WALES_DEMAND": base.astype(float) - 2200,
            "demand_outlier_flag": False,
            "hour": timestamps.hour,
            "day": timestamps.day,
            "month": timestamps.month,
            "day_of_week": timestamps.dayofweek,
            "is_weekend": timestamps.dayofweek.isin([5, 6]).astype(int),
            "demand_lag_1": base.astype(float) - 10,
            "demand_lag_48": base.astype(float) - 120,
            "demand_lag_336": base.astype(float) - 180,
            "demand_rolling_3": base.astype(float) - 20,
            "demand_rolling_48": base.astype(float) - 100,
            "demand_rolling_336": base.astype(float) - 140,
            "temperature": 12.0,
            "humidity": 70.0,
            "wind_speed": 8.0,
            "holiday_flag": 0,
        }
    )
    return data


def test_chronological_train_test_split() -> None:
    """Train/test split preserves chronological order."""
    data = pd.DataFrame(
        {
            "timestamp": pd.date_range("2026-06-01", periods=10, freq="h", tz="UTC"),
            "demand": np.arange(10, dtype=float),
            **{
                column: np.arange(index, index + 10, dtype=float)
                for index, column in enumerate(TRAINING_FEATURE_COLUMNS)
            },
        }
    )

    x_train, x_test, y_train, y_test = train_test_split_time_series(
        data, TARGET_COLUMN, test_size=0.2
    )

    assert len(x_train) == 8
    assert len(x_test) == 2
    assert y_train.iloc[-1] == 7.0
    assert y_test.iloc[0] == 8.0


def test_metrics_calculation() -> None:
    """Evaluation returns MAE, RMSE, MAPE, and R2."""
    actual = np.array([10.0, 20.0, 30.0])
    predicted = np.array([11.0, 19.0, 29.0])

    metrics = evaluate_model(actual, predicted)

    assert set(metrics) == {"mae", "rmse", "mape", "r2"}
    assert metrics["mae"] > 0
    assert metrics["rmse"] > 0
    assert metrics["r2"] < 1


def test_feature_target_separation_excludes_leakage() -> None:
    """Feature separation uses only the approved engineered feature columns."""
    data = make_processed_training_data(rows=20)

    features, target = separate_features_and_target(data)

    assert list(features.columns) == TRAINING_FEATURE_COLUMNS
    assert "TSD" not in features.columns
    assert "ENGLAND_WALES_DEMAND" not in features.columns
    assert "temperature" not in features.columns
    assert "demand_outlier_flag" not in features.columns
    assert target.name == TARGET_COLUMN


def test_load_processed_training_dataset(tmp_path) -> None:
    """Processed training data is loaded from CSV."""
    dataset_path = tmp_path / "training_dataset.csv"
    expected = make_processed_training_data(rows=12)
    expected.to_csv(dataset_path, index=False)

    loaded = load_processed_training_dataset(dataset_path)

    assert len(loaded) == 12
    assert set(TRAINING_FEATURE_COLUMNS).issubset(loaded.columns)


def test_training_workflow_creates_best_model_metadata(tmp_path) -> None:
    """Training workflow runs on processed data and saves NESO metadata."""
    model_dir = tmp_path / "models"
    dataset = make_processed_training_data(rows=120)

    best_result, metadata = run_training(
        output_dir=model_dir,
        dataset=dataset,
    )
    metadata_path = model_dir / "model_metadata.json"
    model_path = model_dir / "model.pkl"

    assert best_result.model_name == metadata.model_name
    assert model_path.exists()
    assert metadata_path.exists()

    import json

    saved_metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    assert saved_metadata["model_name"] == metadata.model_name
    assert saved_metadata["dataset"] == "NESO Historic Demand Data 2024"
    assert saved_metadata["target"] == "ND / demand"
    assert saved_metadata["row_count"] == len(dataset)
    assert saved_metadata["all_model_metrics"]
    assert saved_metadata["training_rows"] > 0
    assert saved_metadata["test_rows"] > 0
    assert saved_metadata["feature_columns"] == TRAINING_FEATURE_COLUMNS


def test_prepare_training_data_has_numeric_training_features(tmp_path) -> None:
    """Processed data can be separated into numeric model features and target."""
    data = make_processed_training_data(rows=60)

    features, target = separate_features_and_target(data)

    assert not features.empty
    assert target.name == TARGET_COLUMN
    assert all(
        pd.api.types.is_numeric_dtype(features[column]) for column in features.columns
    )
