"""Common interfaces for swappable forecasting models."""

from abc import ABC, abstractmethod
from typing import Any, Protocol

import numpy as np
import pandas as pd


class SupportsPredict(Protocol):
    """Protocol for fitted estimators that can produce numeric predictions."""

    def predict(self, features: pd.DataFrame) -> np.ndarray:
        """Predict target values for feature rows."""
        ...


class ForecastModel(ABC):
    """Base interface for all demand forecasting model adapters."""

    name: str

    @abstractmethod
    def fit(self, features: pd.DataFrame, target: pd.Series) -> None:
        """Fit the model to engineered features and demand targets."""

    @abstractmethod
    def predict(self, features: pd.DataFrame) -> np.ndarray:
        """Generate demand forecasts from engineered features."""

    @abstractmethod
    def get_params(self) -> dict[str, Any]:
        """Return model hyperparameters and metadata."""
