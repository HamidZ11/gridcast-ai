"""Baseline forecasting model factories."""

from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression


def create_baseline_models(random_state: int = 42) -> dict[str, object]:
    """Create available baseline model instances.

    XGBoost is optional. If the dependency is unavailable, the model is skipped
    with a clear message in the returned registry metadata.
    """
    models: dict[str, object] = {
        "Linear Regression": LinearRegression(),
        "Random Forest Regressor": RandomForestRegressor(
            n_estimators=120,
            max_depth=8,
            min_samples_leaf=2,
            random_state=random_state,
            n_jobs=-1,
        ),
    }

    try:
        from xgboost import XGBRegressor
    except Exception as exc:
        print(f"XGBoost is unavailable; skipping XGBoost Regressor. Reason: {exc}")
        return models

    models["XGBoost Regressor"] = XGBRegressor(
        n_estimators=160,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="reg:squarederror",
        random_state=random_state,
        n_jobs=1,
    )
    return models
