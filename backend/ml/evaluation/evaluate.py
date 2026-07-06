"""Evaluation metrics for electricity demand forecasting."""

import numpy as np
from sklearn.metrics import r2_score


def calculate_mae(actual: np.ndarray, predicted: np.ndarray) -> float:
    """Calculate mean absolute error."""
    return float(np.mean(np.abs(actual - predicted)))


def calculate_rmse(actual: np.ndarray, predicted: np.ndarray) -> float:
    """Calculate root mean squared error."""
    return float(np.sqrt(np.mean(np.square(actual - predicted))))


def calculate_mape(actual: np.ndarray, predicted: np.ndarray) -> float:
    """Calculate mean absolute percentage error.

    TODO:
        - Decide how zero or near-zero demand values should be handled.
    """
    non_zero_mask = actual != 0
    if not np.any(non_zero_mask):
        return float("nan")
    return float(
        np.mean(
            np.abs(
                (actual[non_zero_mask] - predicted[non_zero_mask])
                / actual[non_zero_mask]
            )
        )
        * 100
    )


def calculate_r2(actual: np.ndarray, predicted: np.ndarray) -> float:
    """Calculate coefficient of determination."""
    return float(r2_score(actual, predicted))


def evaluate_model(actual: np.ndarray, predicted: np.ndarray) -> dict[str, float]:
    """Evaluate model predictions.

    Pipeline stage: Evaluation.

    TODO:
        - Add R2 and forecast-horizon-specific metrics.
        - Add residual distribution diagnostics.
        - Persist evaluation reports for the dashboard.
    """
    return {
        "mae": calculate_mae(actual, predicted),
        "rmse": calculate_rmse(actual, predicted),
        "mape": calculate_mape(actual, predicted),
        "r2": calculate_r2(actual, predicted),
    }
