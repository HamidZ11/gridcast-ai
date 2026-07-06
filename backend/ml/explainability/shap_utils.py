"""SHAP explainer selection and output normalization utilities."""

from __future__ import annotations

from typing import Any, Literal

import numpy as np
import pandas as pd
import shap

from app.models.base import SupportsPredict

ExplainerMethod = Literal[
    "LinearExplainer",
    "TreeExplainer",
    "PermutationExplainer",
]


def build_shap_explainer(
    model: SupportsPredict,
    background: pd.DataFrame,
) -> tuple[Any, ExplainerMethod]:
    """Select the most appropriate SHAP explainer for a fitted estimator."""
    if hasattr(model, "coef_"):
        return shap.LinearExplainer(model, background), "LinearExplainer"
    if hasattr(model, "feature_importances_"):
        return shap.TreeExplainer(model), "TreeExplainer"

    masker = shap.maskers.Independent(background, max_samples=100)
    return (
        shap.Explainer(model.predict, masker, algorithm="permutation"),
        "PermutationExplainer",
    )


def explain_rows(explainer: Any, rows: pd.DataFrame) -> tuple[np.ndarray, np.ndarray]:
    """Return two-dimensional SHAP values and one base value per row."""
    explanation = explainer(rows)
    values = np.asarray(explanation.values, dtype=float)
    base_values = np.asarray(explanation.base_values, dtype=float)

    if values.ndim == 1:
        values = values.reshape(1, -1)
    if values.ndim == 3 and values.shape[-1] == 1:
        values = values[..., 0]
    if values.ndim != 2:
        raise ValueError(f"Unsupported SHAP value shape: {values.shape}")

    base_values = base_values.reshape(-1)
    if len(base_values) == 1 and len(rows) > 1:
        base_values = np.repeat(base_values, len(rows))
    if len(base_values) != len(rows):
        raise ValueError("SHAP base values do not align with explained rows.")
    if not np.isfinite(values).all() or not np.isfinite(base_values).all():
        raise ValueError("SHAP returned non-finite explanation values.")
    return values, base_values
