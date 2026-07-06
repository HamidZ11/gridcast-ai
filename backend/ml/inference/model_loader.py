"""Validated model artifact and metadata loading utilities."""

import json
from pathlib import Path
from typing import Any, TypedDict, cast

import joblib

from app.models.base import SupportsPredict


class ModelMetadataPayload(TypedDict):
    """Serialized metadata required by API inference."""

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


def load_model(model_path: Path) -> SupportsPredict:
    """Load the active forecast model artifact.

    Raises:
        FileNotFoundError: If the artifact does not exist.
        TypeError: If the deserialized object cannot produce predictions.
    """
    if not model_path.exists():
        raise FileNotFoundError(f"Model artifact not found: {model_path}")

    model = joblib.load(model_path)
    if not callable(getattr(model, "predict", None)):
        raise TypeError(f"Model artifact does not expose predict(): {model_path}")
    return cast(SupportsPredict, model)


def load_model_metadata(metadata_path: Path) -> ModelMetadataPayload:
    """Load and validate the metadata stored beside the trained model."""
    if not metadata_path.exists():
        raise FileNotFoundError(f"Model metadata not found: {metadata_path}")

    with metadata_path.open(encoding="utf-8") as metadata_file:
        raw_metadata: Any = json.load(metadata_file)

    if not isinstance(raw_metadata, dict):
        raise ValueError("Model metadata must be a JSON object.")

    required_fields = {
        "model_name": str,
        "training_timestamp": str,
        "dataset": str,
        "target": str,
        "row_count": int,
        "metrics": dict,
        "feature_columns": list,
        "training_rows": int,
        "test_rows": int,
        "notes": list,
    }
    for field, expected_type in required_fields.items():
        if not isinstance(raw_metadata.get(field), expected_type):
            raise ValueError(f"Invalid or missing metadata field: {field}")

    raw_metadata.setdefault("all_model_metrics", {})
    return cast(ModelMetadataPayload, raw_metadata)
