"""Runtime cache for model artifacts loaded during FastAPI startup."""

from pathlib import Path
from typing import Any, cast

from app.core.config import settings
from app.models.base import SupportsPredict
from ml.inference.model_loader import ModelMetadataPayload, load_model, load_model_metadata

_runtime_cache: dict[str, Any] = {}


def load_runtime_artifacts(
    model_path: Path | None = None,
    metadata_path: Path | None = None,
) -> None:
    """Load the production model and metadata once for request-time reuse."""
    resolved_model_path = model_path or settings.model_artifact_path
    resolved_metadata_path = metadata_path or settings.model_metadata_path
    _runtime_cache["model"] = load_model(resolved_model_path)
    _runtime_cache["metadata"] = load_model_metadata(resolved_metadata_path)


def get_cached_model(model_path: Path | None = None) -> SupportsPredict:
    """Return the startup-loaded model, with explicit path override for tests."""
    if model_path is not None:
        return load_model(model_path)
    if "model" not in _runtime_cache:
        raise RuntimeError("Model artifact has not been loaded at application startup.")
    return cast(SupportsPredict, _runtime_cache["model"])


def get_cached_metadata(metadata_path: Path | None = None) -> ModelMetadataPayload:
    """Return startup-loaded model metadata, with explicit path override for tests."""
    if metadata_path is not None:
        return load_model_metadata(metadata_path)
    if "metadata" not in _runtime_cache:
        raise RuntimeError("Model metadata has not been loaded at application startup.")
    return cast(ModelMetadataPayload, _runtime_cache["metadata"])
