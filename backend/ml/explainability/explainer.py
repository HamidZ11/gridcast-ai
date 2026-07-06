"""Cached SHAP explanations for the active production model."""

from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256
from pathlib import Path
from threading import RLock
from typing import Any

import numpy as np
import pandas as pd

from app.models.base import SupportsPredict
from ml.explainability.shap_utils import (
    ExplainerMethod,
    build_shap_explainer,
    explain_rows,
)

MAX_BACKGROUND_ROWS = 256
MAX_IMPORTANCE_ROWS = 256


@dataclass(frozen=True)
class FeatureContribution:
    """One feature's local contribution in model output units."""

    name: str
    value: float
    impact: float


@dataclass(frozen=True)
class PredictionExplanation:
    """A local prediction decomposed into its SHAP contributions."""

    prediction: float
    base_value: float
    features: list[FeatureContribution]
    method: ExplainerMethod


@dataclass
class _ExplainerBundle:
    explainer: Any
    method: ExplainerMethod


_cache_lock = RLock()
_active_signature: str | None = None
_explainer_cache: dict[str, _ExplainerBundle] = {}
_explanation_cache: dict[tuple[str, str], PredictionExplanation] = {}
_importance_cache: dict[str, dict[str, float]] = {}


def _model_signature(model_path: Path) -> str:
    """Identify an artifact version without deserializing it again."""
    stat = model_path.stat()
    return f"{model_path.resolve()}:{stat.st_mtime_ns}:{stat.st_size}"


def _sample_rows(data: pd.DataFrame, limit: int) -> pd.DataFrame:
    """Select deterministic, evenly spaced rows for SHAP background work."""
    if len(data) <= limit:
        return data.reset_index(drop=True)
    indexes = np.linspace(0, len(data) - 1, limit, dtype=int)
    return data.iloc[indexes].reset_index(drop=True)


def _row_signature(row: pd.DataFrame) -> str:
    """Create a stable cache key from feature names and values."""
    payload = row.to_json(orient="split", double_precision=15).encode()
    return sha256(payload).hexdigest()


def _activate_signature(signature: str) -> None:
    """Invalidate all cached SHAP state when the model artifact changes."""
    global _active_signature
    if _active_signature == signature:
        return
    _explainer_cache.clear()
    _explanation_cache.clear()
    _importance_cache.clear()
    _active_signature = signature


def _get_bundle(
    model_path: Path,
    model: SupportsPredict,
    background: pd.DataFrame,
) -> tuple[str, _ExplainerBundle]:
    signature = _model_signature(model_path)
    with _cache_lock:
        _activate_signature(signature)
        bundle = _explainer_cache.get(signature)
        if bundle is None:
            sampled_background = _sample_rows(background, MAX_BACKGROUND_ROWS)
            explainer, method = build_shap_explainer(model, sampled_background)
            bundle = _ExplainerBundle(explainer=explainer, method=method)
            _explainer_cache[signature] = bundle
    return signature, bundle


def explain_prediction(
    model_path: Path,
    model: SupportsPredict,
    background: pd.DataFrame,
    row: pd.DataFrame,
) -> PredictionExplanation:
    """Explain one prediction and cache it for the active artifact."""
    signature, bundle = _get_bundle(model_path, model, background)
    row_key = _row_signature(row)
    cache_key = (signature, row_key)
    with _cache_lock:
        cached = _explanation_cache.get(cache_key)
        if cached is not None:
            return cached

    shap_values, base_values = explain_rows(bundle.explainer, row)
    prediction = float(np.asarray(model.predict(row), dtype=float).reshape(-1)[0])
    contributions = [
        FeatureContribution(
            name=column,
            value=float(row.iloc[0][column]),
            impact=float(shap_values[0, index]),
        )
        for index, column in enumerate(row.columns)
    ]
    contributions.sort(key=lambda item: abs(item.impact), reverse=True)
    result = PredictionExplanation(
        prediction=prediction,
        base_value=float(base_values[0]),
        features=contributions,
        method=bundle.method,
    )
    with _cache_lock:
        _explanation_cache[cache_key] = result
    return result


def mean_absolute_shap_values(
    model_path: Path,
    model: SupportsPredict,
    background: pd.DataFrame,
) -> dict[str, float]:
    """Return cached global mean absolute SHAP values for an artifact."""
    signature, bundle = _get_bundle(model_path, model, background)
    with _cache_lock:
        cached = _importance_cache.get(signature)
        if cached is not None:
            return cached

    rows = _sample_rows(background, MAX_IMPORTANCE_ROWS)
    shap_values, _ = explain_rows(bundle.explainer, rows)
    importance = {
        column: float(value)
        for column, value in zip(
            rows.columns,
            np.mean(np.abs(shap_values), axis=0),
            strict=True,
        )
    }
    with _cache_lock:
        _importance_cache[signature] = importance
    return importance


def clear_explainability_cache() -> None:
    """Clear process-local caches, primarily for tests."""
    global _active_signature
    with _cache_lock:
        _active_signature = None
        _explainer_cache.clear()
        _explanation_cache.clear()
        _importance_cache.clear()
