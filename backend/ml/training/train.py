"""Baseline model training workflow for GridCast AI."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pandas as pd

from ml.evaluation.evaluate import evaluate_model
from ml.model_registry import (
    ModelMetadata,
    ModelResult,
    build_model_metadata,
    save_model_artifacts,
    select_best_model,
)
from ml.models import create_baseline_models

TARGET_COLUMN = "demand"
DEFAULT_MODEL_DIR = Path(__file__).resolve().parents[2] / "models"
DEFAULT_TRAINING_DATASET_PATH = (
    Path(__file__).resolve().parents[2] / "data" / "processed" / "training_dataset.csv"
)
TRAINING_FEATURE_COLUMNS = [
    "hour",
    "day",
    "month",
    "day_of_week",
    "is_weekend",
    "demand_lag_1",
    "demand_lag_48",
    "demand_lag_336",
    "demand_rolling_3",
    "demand_rolling_48",
    "demand_rolling_336",
]


def load_processed_training_dataset(
    dataset_path: Path = DEFAULT_TRAINING_DATASET_PATH,
) -> pd.DataFrame:
    """Load the processed NESO training dataset from disk."""
    if not dataset_path.exists():
        raise FileNotFoundError(
            f"Processed training dataset not found: {dataset_path}. "
            "Run `python -m ml.pipeline` first."
        )
    return pd.read_csv(dataset_path)


def separate_features_and_target(
    data: pd.DataFrame,
    target_column: str = TARGET_COLUMN,
    feature_columns: list[str] | None = None,
) -> tuple[pd.DataFrame, pd.Series]:
    """Separate engineered numeric features from the target column.

    Uses an explicit feature whitelist by default to avoid leakage from other
    demand columns or future placeholder columns.
    """
    if target_column not in data.columns:
        raise ValueError(f"Target column not found: {target_column}")

    selected_columns = feature_columns or TRAINING_FEATURE_COLUMNS
    missing_features = [
        column for column in selected_columns if column not in data.columns
    ]
    if missing_features:
        raise ValueError(
            f"Missing required feature columns: {', '.join(missing_features)}"
        )

    numeric_features = data[selected_columns].select_dtypes(include="number").copy()
    if list(numeric_features.columns) != selected_columns:
        missing_numeric = sorted(
            set(selected_columns).difference(numeric_features.columns)
        )
        raise ValueError(
            f"Feature columns must be numeric: {', '.join(missing_numeric)}"
        )

    target = data[target_column].copy()
    return numeric_features, target


def train_test_split_time_series(
    data: pd.DataFrame,
    target_column: str,
    test_size: float = 0.2,
    feature_columns: list[str] | None = None,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """Split data chronologically for model evaluation."""
    if not 0 < test_size < 1:
        raise ValueError("test_size must be between 0 and 1.")
    if len(data) < 2:
        raise ValueError("At least two rows are required for train/test split.")

    features, target = separate_features_and_target(
        data,
        target_column=target_column,
        feature_columns=feature_columns,
    )
    split_index = int(len(data) * (1 - test_size))
    if split_index <= 0 or split_index >= len(data):
        raise ValueError("Split produced an empty train or test set.")

    x_train = features.iloc[:split_index].reset_index(drop=True)
    x_test = features.iloc[split_index:].reset_index(drop=True)
    y_train = target.iloc[:split_index].reset_index(drop=True)
    y_test = target.iloc[split_index:].reset_index(drop=True)
    return x_train, x_test, y_train, y_test


def train_and_evaluate_models(
    data: pd.DataFrame,
    target_column: str = TARGET_COLUMN,
    test_size: float = 0.2,
    feature_columns: list[str] | None = None,
) -> tuple[dict[str, Any], list[ModelResult], list[str], pd.DataFrame, pd.Series]:
    """Train and evaluate all available baseline models."""
    x_train, x_test, y_train, y_test = train_test_split_time_series(
        data=data,
        target_column=target_column,
        test_size=test_size,
        feature_columns=feature_columns,
    )
    models = create_baseline_models()
    trained_models: dict[str, Any] = {}
    results: list[ModelResult] = []

    for model_name, model in models.items():
        model.fit(x_train, y_train)
        predictions = model.predict(x_test)
        metrics = evaluate_model(y_test.to_numpy(), predictions)
        trained_models[model_name] = model
        results.append(
            ModelResult(
                model_name=model_name,
                metrics=metrics,
                training_rows=len(x_train),
                test_rows=len(x_test),
            )
        )

    return trained_models, results, list(x_train.columns), x_test, y_test


def run_training(
    output_dir: Path = DEFAULT_MODEL_DIR,
    dataset: pd.DataFrame | None = None,
    dataset_path: Path = DEFAULT_TRAINING_DATASET_PATH,
) -> tuple[ModelResult, ModelMetadata]:
    """Train baselines on processed NESO data, select best model, and save artifacts."""
    training_data = (
        dataset
        if dataset is not None
        else load_processed_training_dataset(dataset_path)
    )

    trained_models, results, feature_columns, _x_test, _y_test = (
        train_and_evaluate_models(training_data)
    )
    best_result = select_best_model(results, metric="rmse")
    best_model = trained_models[best_result.model_name]
    metadata = build_model_metadata(
        best_result,
        feature_columns=feature_columns,
        row_count=len(training_data),
        all_results=results,
    )
    save_model_artifacts(best_model, metadata, output_dir=output_dir)
    return best_result, metadata


def print_results(results: list[ModelResult]) -> None:
    """Print model comparison results for CLI usage."""
    print("Model leaderboard")
    print("-----------------")
    print(f"{'Model':<26} | {'MAE':>10} | {'RMSE':>10} | {'MAPE':>8} | {'R²':>8}")
    print("-" * 74)
    for result in results:
        metrics = result.metrics
        print(
            f"{result.model_name:<26} | "
            f"{metrics['mae']:>10.3f} | "
            f"{metrics['rmse']:>10.3f} | "
            f"{metrics['mape']:>7.2f}% | "
            f"{metrics['r2']:>8.4f}"
        )


def main() -> None:
    """Run baseline training from the command line."""
    dataset = load_processed_training_dataset()

    trained_models, results, feature_columns, _x_test, _y_test = (
        train_and_evaluate_models(dataset)
    )
    print_results(results)

    best_result = select_best_model(results, metric="rmse")
    metadata = build_model_metadata(
        best_result,
        feature_columns=feature_columns,
        row_count=len(dataset),
        all_results=results,
    )
    model_path, metadata_path = save_model_artifacts(
        trained_models[best_result.model_name],
        metadata,
        output_dir=DEFAULT_MODEL_DIR,
    )

    print("\nSelected best model")
    print("-------------------")
    print(f"Model: {best_result.model_name}")
    print(f"Saved model: {model_path}")
    print(f"Saved metadata: {metadata_path}")


if __name__ == "__main__":
    main()
