"""Runtime cache for the immutable artifacts the API serves from.

Everything this service answers with is derived from three files that do not
change while the process is running: the saved model, its metadata, and the
processed NESO 2024 dataset. Loading them once and keeping them in memory is
the whole optimisation; there is no invalidation story because the inputs are
frozen. A change to the files means a redeploy, which starts a new process.

Each accessor takes an explicit path override for the tests, which point the
API at temporary artifacts. Overrides are keyed into the same caches by path
and file identity, so a test with its own dataset never sees another test's
rows and never sees production data.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, cast

import numpy as np
import pandas as pd

from app.core.config import settings
from app.models.base import SupportsPredict
from ml.inference.model_loader import ModelMetadataPayload, load_model, load_model_metadata
from ml.inference.predict import recursive_forecast

_runtime_cache: dict[str, Any] = {}

# Keyed by (resolved path, mtime_ns, size). Holds one frame at a time: the
# dataset is 17,232 rows and this is not a general-purpose cache.
_dataset_cache: dict[tuple[str, int, int], pd.DataFrame] = {}

# Keyed by everything the forecast is a pure function of. Holds one entry.
ForecastResult = tuple[pd.DatetimeIndex, np.ndarray, pd.DataFrame]
_forecast_cache: dict[tuple[Any, ...], ForecastResult] = {}


def load_processed_data(dataset_path: Path) -> pd.DataFrame:
    """Read processed rows in chronological order with parsed UTC timestamps.

    This is the expensive call - a CSV parse plus a timestamp parse and a sort
    over the whole file - and it must not run per request. Go through
    :func:`get_cached_dataset` instead.
    """
    if not dataset_path.exists():
        raise FileNotFoundError(f"Processed training dataset not found: {dataset_path}")

    data = pd.read_csv(dataset_path)
    if "timestamp" not in data.columns or "demand" not in data.columns:
        raise ValueError("Processed dataset must contain timestamp and demand columns.")

    data["timestamp"] = pd.to_datetime(data["timestamp"], utc=True, errors="raise")
    return data.sort_values("timestamp").drop_duplicates("timestamp", keep="last")


def _file_key(path: Path) -> tuple[str, int, int]:
    resolved = path.resolve()
    stat = resolved.stat()  # FileNotFoundError propagates to the fallback path
    return (str(resolved), stat.st_mtime_ns, stat.st_size)


def load_runtime_artifacts(
    model_path: Path | None = None,
    metadata_path: Path | None = None,
    dataset_path: Path | None = None,
) -> None:
    """Load the model, its metadata and the dataset once, and pre-compute the forecast.

    Called from the FastAPI lifespan. The forecast warm-up means the first
    request after a cold start does not pay for the 96-step recursive loop.
    """
    resolved_model_path = model_path or settings.model_artifact_path
    resolved_metadata_path = metadata_path or settings.model_metadata_path
    _runtime_cache["model"] = load_model(resolved_model_path)
    _runtime_cache["metadata"] = load_model_metadata(resolved_metadata_path)

    data = get_cached_dataset(dataset_path)
    get_cached_forecast(
        _runtime_cache["model"],
        data,
        _runtime_cache["metadata"]["feature_columns"],
        model_path=model_path,
        dataset_path=dataset_path,
    )


def get_cached_model(model_path: Path | None = None) -> SupportsPredict:
    """Return the startup-loaded model, with explicit path override for tests.

    Startup preloading is an optimisation, not a precondition. When the cache is
    cold - a TestClient used without its context manager never runs lifespan
    events - the artifact is loaded directly from settings so callers still see
    the documented behaviour: a real model when the file exists, and
    FileNotFoundError (which the services turn into the fallback contract) when
    it does not.
    """
    if model_path is not None:
        return load_model(model_path)
    if "model" not in _runtime_cache:
        return load_model(settings.model_artifact_path)
    return cast(SupportsPredict, _runtime_cache["model"])


def get_cached_metadata(metadata_path: Path | None = None) -> ModelMetadataPayload:
    """Return startup-loaded metadata, with explicit path override for tests."""
    if metadata_path is not None:
        return load_model_metadata(metadata_path)
    if "metadata" not in _runtime_cache:
        return load_model_metadata(settings.model_metadata_path)
    return cast(ModelMetadataPayload, _runtime_cache["metadata"])


def get_cached_dataset(dataset_path: Path | None = None) -> pd.DataFrame:
    """Return the processed dataset, parsing it at most once per file identity.

    The returned frame is shared. Callers must treat it as read-only; every
    current consumer either selects columns or sorts into a new frame.
    """
    key = _file_key(dataset_path or settings.training_dataset_path)
    cached = _dataset_cache.get(key)
    if cached is None:
        _dataset_cache.clear()
        cached = load_processed_data(Path(key[0]))
        _dataset_cache[key] = cached
    return cached


def get_cached_forecast(
    model: SupportsPredict,
    data: pd.DataFrame,
    feature_columns: list[str],
    *,
    periods: int = 96,
    frequency: str = "30min",
    model_path: Path | None = None,
    dataset_path: Path | None = None,
) -> ForecastResult:
    """Run the recursive 48-hour forecast at most once per (model, dataset).

    The forecast is a pure function of the model file, the dataset file and the
    feature schema, none of which change while the process runs. Both files
    are keyed by path and identity, so a test pointing at its own artifacts
    never receives a forecast computed from different ones.
    """
    key = (
        _file_key(model_path or settings.model_artifact_path),
        _file_key(dataset_path or settings.training_dataset_path),
        tuple(feature_columns),
        periods,
        frequency,
    )
    cached = _forecast_cache.get(key)
    if cached is None:
        _forecast_cache.clear()
        cached = recursive_forecast(
            model, data, feature_columns, periods=periods, frequency=frequency
        )
        _forecast_cache[key] = cached
    return cached


def clear_runtime_caches() -> None:
    """Drop every cached artifact. Used by tests that swap artifacts under the API."""
    _runtime_cache.clear()
    _dataset_cache.clear()
    _forecast_cache.clear()
