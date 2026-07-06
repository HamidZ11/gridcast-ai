"""Forecast model adapter placeholders.

These adapters establish the interface. Actual estimator construction and
hyperparameter tuning will be implemented during the training phase.
"""

from typing import Any

import numpy as np
import pandas as pd

from app.models.base import ForecastModel, SupportsPredict


class SklearnForecastModel(ForecastModel):
    """Adapter for scikit-learn compatible estimators."""

    def __init__(self, name: str, estimator: SupportsPredict | None = None) -> None:
        self.name = name
        self.estimator = estimator

    def fit(self, features: pd.DataFrame, target: pd.Series) -> None:
        """Fit the wrapped estimator when available."""
        if self.estimator is None:
            raise NotImplementedError("Estimator construction is not implemented yet.")
        fit = getattr(self.estimator, "fit", None)
        if fit is None:
            raise TypeError(f"{self.name} estimator does not support fit().")
        fit(features, target)

    def predict(self, features: pd.DataFrame) -> np.ndarray:
        """Predict with the wrapped estimator."""
        if self.estimator is None:
            raise NotImplementedError("No fitted estimator has been loaded yet.")
        return self.estimator.predict(features)

    def get_params(self) -> dict[str, Any]:
        """Return estimator parameters when available."""
        if self.estimator is None:
            return {"name": self.name, "status": "placeholder"}
        get_params = getattr(self.estimator, "get_params", None)
        return dict(get_params()) if get_params else {"name": self.name}


class LinearRegressionModel(SklearnForecastModel):
    """Placeholder adapter for a linear regression baseline."""

    def __init__(self) -> None:
        super().__init__(name="Linear Regression")


class RandomForestModel(SklearnForecastModel):
    """Placeholder adapter for a random forest model."""

    def __init__(self) -> None:
        super().__init__(name="Random Forest")


class XGBoostForecastModel(SklearnForecastModel):
    """Placeholder adapter for the future XGBoost production model."""

    def __init__(self) -> None:
        super().__init__(name="XGBoost Regressor")
