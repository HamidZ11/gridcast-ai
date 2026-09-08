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
    """Return the startup-loaded model, with explicit path override for tests.

    Startup preloading is an optimisation, not a precondition. When the cache is
    cold - a TestClient used without its context manager never runs lifespan
    events - the artifact is loaded directly from settings so callers still see
    the documented behaviour: a real model when the file exists, and
    FileNotFoundError (which the services turn into the fallback contract) when
    it does not. Previously a cold cache raised RuntimeError, which no service
    caught, so every endpoint returned 500 instead.
    """
    if model_path is not None:
        return load_model(model_path)
    if "model" not in _runtime_cache:
        return load_model(settings.model_artifact_path)
    return cast(SupportsPredict, _runtime_cache["model"])


def get_cached_metadata(metadata_path: Path | None = None) -> ModelMetadataPayload:
    """Return startup-loaded metadata, with explicit path override for tests.

    Same cold-cache behaviour as :func:`get_cached_model`.
    """
    if metadata_path is not None:
        return load_model_metadata(metadata_path)
    if "metadata" not in _runtime_cache:
        return load_model_metadata(settings.model_metadata_path)
    return cast(ModelMetadataPayload, _runtime_cache["metadata"])
