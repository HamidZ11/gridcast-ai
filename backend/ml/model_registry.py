"""Model registry and artifact persistence helpers."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import joblib


@dataclass(frozen=True)
class ModelResult:
    """Evaluation result for one trained model."""

    model_name: str
    metrics: dict[str, float]
    training_rows: int
    test_rows: int


@dataclass(frozen=True)
class ModelMetadata:
    """Metadata persisted alongside the selected model artifact."""

    model_name: str
    training_timestamp: str
    dataset: str
    target: str
    row_count: int
    metrics: dict[str, float]
    all_model_metrics: dict[str, dict[str, float]]
    feature_columns: list[str]
    training_rows: int
    test_rows: int
    notes: list[str]


def select_best_model(results: list[ModelResult], metric: str = "rmse") -> ModelResult:
    """Select the best model by the lowest metric value."""
    if not results:
        raise ValueError("No model results were provided.")
    return min(results, key=lambda result: result.metrics[metric])


def build_model_metadata(
    result: ModelResult,
    feature_columns: list[str],
    row_count: int,
    all_results: list[ModelResult],
    dataset: str = "NESO Historic Demand Data 2024",
    target: str = "ND / demand",
    notes: list[str] | None = None,
) -> ModelMetadata:
    """Create serializable metadata for a selected model."""
    return ModelMetadata(
        model_name=result.model_name,
        training_timestamp=datetime.now(UTC).isoformat(),
        dataset=dataset,
        target=target,
        row_count=row_count,
        metrics=result.metrics,
        all_model_metrics={
            model_result.model_name: model_result.metrics
            for model_result in all_results
        },
        feature_columns=feature_columns,
        training_rows=result.training_rows,
        test_rows=result.test_rows,
        notes=notes
        or [
            "Baseline model trained on engineered demand/time features only.",
            "Weather features are not yet included.",
            "TSD and ENGLAND_WALES_DEMAND are excluded to avoid target leakage.",
        ],
    )


def save_model_artifacts(
    model: Any,
    metadata: ModelMetadata,
    output_dir: Path,
) -> tuple[Path, Path]:
    """Save the model artifact and JSON metadata."""
    output_dir.mkdir(parents=True, exist_ok=True)
    model_path = output_dir / "model.pkl"
    metadata_path = output_dir / "model_metadata.json"

    joblib.dump(model, model_path)
    metadata_path.write_text(json.dumps(asdict(metadata), indent=2), encoding="utf-8")
    return model_path, metadata_path
