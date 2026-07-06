"""Tests for saved-model inference and API metadata responses."""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import pandas as pd
import pytest
from fastapi.testclient import TestClient
from sklearn.linear_model import LinearRegression

from app.core.config import settings
from app.main import app
from app.schemas.simulation import SimulationRequest
from app.services.simulation_service import apply_scenario_to_features
from ml.inference.model_loader import load_model, load_model_metadata
from ml.inference.predict import recursive_forecast
from ml.training.train import TRAINING_FEATURE_COLUMNS


@pytest.fixture
def inference_artifacts(tmp_path: Path) -> tuple[Path, Path, Path]:
    """Create a fitted model, metadata, and real-style processed rows."""
    rows = []
    start = pd.Timestamp("2024-12-30T00:00:00Z")
    for index in range(420):
        timestamp = start + pd.Timedelta(minutes=30 * index)
        demand = 25_000 + index * 10
        rows.append(
            {
                "timestamp": timestamp.isoformat(),
                "demand": demand,
                "hour": timestamp.hour,
                "day": timestamp.day,
                "month": timestamp.month,
                "day_of_week": timestamp.dayofweek,
                "is_weekend": int(timestamp.dayofweek >= 5),
                "demand_lag_1": demand - 10,
                "demand_lag_48": demand - 480,
                "demand_lag_336": demand - 3_360,
                "demand_rolling_3": demand - 10,
                "demand_rolling_48": demand - 240,
                "demand_rolling_336": demand - 1_680,
            }
        )

    dataset = pd.DataFrame(rows)
    model = LinearRegression().fit(dataset[TRAINING_FEATURE_COLUMNS], dataset["demand"])
    model_path = tmp_path / "model.pkl"
    metadata_path = tmp_path / "model_metadata.json"
    dataset_path = tmp_path / "training_dataset.csv"
    joblib.dump(model, model_path)
    dataset.to_csv(dataset_path, index=False)
    metadata_path.write_text(
        json.dumps(
            {
                "model_name": "Linear Regression",
                "training_timestamp": "2026-06-26T12:00:00+00:00",
                "dataset": "NESO Historic Demand Data 2024",
                "target": "ND / demand",
                "row_count": len(dataset),
                "metrics": {
                    "mae": 400.0,
                    "rmse": 500.0,
                    "mape": 1.5,
                    "r2": 0.98,
                },
                "all_model_metrics": {
                    "Linear Regression": {
                        "mae": 400.0,
                        "rmse": 500.0,
                        "mape": 1.5,
                        "r2": 0.98,
                    }
                },
                "feature_columns": TRAINING_FEATURE_COLUMNS,
                "training_rows": 336,
                "test_rows": 84,
                "notes": ["Weather features are not yet included."],
            }
        ),
        encoding="utf-8",
    )
    return model_path, metadata_path, dataset_path


def configure_artifacts(
    monkeypatch: pytest.MonkeyPatch,
    artifacts: tuple[Path, Path, Path],
) -> None:
    """Point API settings at temporary inference artifacts."""
    model_path, metadata_path, dataset_path = artifacts
    monkeypatch.setattr(settings, "model_artifact_path", model_path)
    monkeypatch.setattr(settings, "model_metadata_path", metadata_path)
    monkeypatch.setattr(settings, "training_dataset_path", dataset_path)


def test_model_artifact_loading(
    inference_artifacts: tuple[Path, Path, Path],
) -> None:
    """A fitted joblib artifact is loaded and supports prediction."""
    model = load_model(inference_artifacts[0])
    assert callable(model.predict)


def test_model_metadata_loading(
    inference_artifacts: tuple[Path, Path, Path],
) -> None:
    """Saved metadata is loaded with its feature schema intact."""
    metadata = load_model_metadata(inference_artifacts[1])
    assert metadata["model_name"] == "Linear Regression"
    assert metadata["feature_columns"] == TRAINING_FEATURE_COLUMNS


def test_model_endpoint_returns_saved_metadata(
    monkeypatch: pytest.MonkeyPatch,
    inference_artifacts: tuple[Path, Path, Path],
) -> None:
    """The model endpoint exposes saved production metadata."""
    configure_artifacts(monkeypatch, inference_artifacts)
    response = TestClient(app).get("/model")

    assert response.status_code == 200
    payload = response.json()
    assert payload["selected_model"] == "Linear Regression"
    assert payload["dataset"] == "NESO Historic Demand Data 2024"
    assert payload["target"] == "ND / demand"
    assert payload["feature_columns"] == TRAINING_FEATURE_COLUMNS
    assert payload["limitations"]
    assert payload["all_model_metrics"]
    assert payload["metric_error_unit"] == "MW"
    assert payload["data_source"] == "artifact"


def test_metrics_endpoint_returns_saved_metrics(
    monkeypatch: pytest.MonkeyPatch,
    inference_artifacts: tuple[Path, Path, Path],
) -> None:
    """Saved MW errors are returned in the API's GW display unit."""
    configure_artifacts(monkeypatch, inference_artifacts)
    response = TestClient(app).get("/metrics")

    assert response.status_code == 200
    metrics = {item["name"]: item for item in response.json()["metrics"]}
    assert metrics["MAE"] == {"name": "MAE", "value": 0.4, "unit": "GW"}
    assert metrics["RMSE"] == {"name": "RMSE", "value": 0.5, "unit": "GW"}
    assert metrics["MAPE"]["value"] == 1.5
    assert metrics["R2"]["value"] == 0.98
    assert response.json()["data_source"] == "artifact"


def test_forecast_endpoint_returns_96_half_hourly_points(
    monkeypatch: pytest.MonkeyPatch,
    inference_artifacts: tuple[Path, Path, Path],
) -> None:
    """The model-backed API returns a complete 48-hour forecast window."""
    configure_artifacts(monkeypatch, inference_artifacts)
    response = TestClient(app).get("/forecast")

    assert response.status_code == 200
    payload = response.json()
    assert payload["horizon_hours"] == 48
    assert len(payload["points"]) == 96
    timestamps = pd.to_datetime(
        [point["timestamp"] for point in payload["points"]], utc=True
    )
    latest_observation = pd.read_csv(inference_artifacts[2]).iloc[-1]["timestamp"]
    assert timestamps[0] == pd.Timestamp(latest_observation) + pd.Timedelta(minutes=30)
    assert timestamps.is_monotonic_increasing
    assert (timestamps[1:] - timestamps[:-1]).unique() == pd.Timedelta(minutes=30)
    predictions = [point["predicted_demand_gw"] for point in payload["points"]]
    assert len(set(predictions)) > 1
    assert payload["data_source"] == "artifact"


def test_recursive_forecast_updates_lag_and_rolling_features() -> None:
    """Each recursive step uses prior predictions in target-derived features."""

    class IncrementingLagModel:
        def predict(self, features: pd.DataFrame) -> pd.Series:
            return features["demand_lag_1"] + 25

    timestamps = pd.date_range("2024-12-24T00:00:00Z", periods=400, freq="30min")
    demand = pd.Series(range(20_000, 20_400), dtype=float)
    data = pd.DataFrame(
        {
            "timestamp": timestamps,
            "demand": demand,
            "hour": timestamps.hour,
            "day": timestamps.day,
            "month": timestamps.month,
            "day_of_week": timestamps.dayofweek,
            "is_weekend": (timestamps.dayofweek >= 5).astype(int),
            "demand_lag_1": demand.shift(1).bfill(),
            "demand_lag_48": demand.shift(48).bfill(),
            "demand_lag_336": demand.shift(336).bfill(),
            "demand_rolling_3": demand.shift(1)
            .rolling(3, min_periods=1)
            .mean()
            .bfill(),
            "demand_rolling_48": demand.shift(1)
            .rolling(48, min_periods=1)
            .mean()
            .bfill(),
            "demand_rolling_336": demand.shift(1)
            .rolling(336, min_periods=1)
            .mean()
            .bfill(),
        }
    )

    _, predictions, features = recursive_forecast(
        IncrementingLagModel(),
        data,
        TRAINING_FEATURE_COLUMNS,
        periods=3,
    )

    assert predictions.tolist() == [20_424.0, 20_449.0, 20_474.0]
    assert features.loc[0, "demand_lag_1"] == 20_399.0
    assert features.loc[1, "demand_lag_1"] == predictions[0]
    assert features.loc[2, "demand_lag_1"] == predictions[1]
    assert features.loc[1, "demand_rolling_3"] != features.loc[0, "demand_rolling_3"]


def test_scenario_feature_adjustment_is_isolated() -> None:
    """Scenario inputs modify demand features without mutating the baseline."""
    timestamps = pd.date_range("2024-12-30T00:00:00Z", periods=4, freq="30min")
    baseline = pd.DataFrame(
        {
            "is_weekend": [0, 0, 0, 0],
            "demand_lag_1": [25_000.0] * 4,
            "demand_rolling_48": [24_500.0] * 4,
            "hour": [0, 0, 1, 1],
        }
    )
    request = SimulationRequest(
        temperature_anomaly=-5,
        wind_generation_multiplier=0.7,
        solar_generation_multiplier=1,
        ev_demand_multiplier=1.2,
        industrial_demand_multiplier=1,
        residential_demand_multiplier=1.1,
        weekend_flag=True,
        bank_holiday_flag=False,
    )

    adjusted = apply_scenario_to_features(baseline, timestamps, request)

    assert adjusted["is_weekend"].eq(1).all()
    assert not adjusted["demand_lag_1"].equals(baseline["demand_lag_1"])
    assert not adjusted["demand_rolling_48"].equals(baseline["demand_rolling_48"])
    assert baseline["is_weekend"].eq(0).all()
    assert baseline["demand_lag_1"].eq(25_000).all()


def test_simulate_endpoint_uses_active_model(
    monkeypatch: pytest.MonkeyPatch,
    inference_artifacts: tuple[Path, Path, Path],
) -> None:
    """The simulation endpoint returns model-backed 48-hour scenario data."""
    configure_artifacts(monkeypatch, inference_artifacts)
    response = TestClient(app).post(
        "/simulate",
        json={
            "temperature_anomaly": 4,
            "wind_generation_multiplier": 0.75,
            "solar_generation_multiplier": 1.1,
            "ev_demand_multiplier": 1.25,
            "industrial_demand_multiplier": 1.05,
            "residential_demand_multiplier": 1.15,
            "weekend_flag": False,
            "bank_holiday_flag": False,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["horizon_hours"] == 48
    assert len(payload["points"]) == 96
    assert len(payload["baseline_points"]) == 96
    assert payload["data_source"] == "artifact"
    assert payload["metrics"]["peak_demand_gw"] > 0
    assert payload["metrics"]["total_energy_gwh"] > 0
    assert payload["metrics"]["peak_time"]
    assert payload["limitations"]
    assert payload["points"] != payload["baseline_points"]


def test_simulate_endpoint_validates_scenario_ranges() -> None:
    """Invalid multipliers are rejected before inference."""
    response = TestClient(app).post(
        "/simulate",
        json={
            "temperature_anomaly": 0,
            "wind_generation_multiplier": 2,
            "solar_generation_multiplier": 1,
            "ev_demand_multiplier": 1,
            "industrial_demand_multiplier": 1,
            "residential_demand_multiplier": 1,
            "weekend_flag": False,
            "bank_holiday_flag": False,
        },
    )

    assert response.status_code == 422


def test_feature_importance_uses_active_model(
    monkeypatch: pytest.MonkeyPatch,
    inference_artifacts: tuple[Path, Path, Path],
) -> None:
    """Feature importance is calculated from the fitted model and sorted."""
    configure_artifacts(monkeypatch, inference_artifacts)
    response = TestClient(app).get("/feature-importance")

    assert response.status_code == 200
    payload = response.json()
    assert payload["model_name"] == "Linear Regression"
    assert payload["data_source"] == "artifact"
    assert payload["method"] == "mean_absolute_shap"
    assert len(payload["features"]) == len(TRAINING_FEATURE_COLUMNS)
    importances = [feature["importance"] for feature in payload["features"]]
    assert importances == sorted(importances, reverse=True)
    assert sum(importances) == pytest.approx(100, abs=0.01)


def test_explain_endpoint_returns_sorted_shap_contributions(
    monkeypatch: pytest.MonkeyPatch,
    inference_artifacts: tuple[Path, Path, Path],
) -> None:
    """A forecast point is decomposed into real additive SHAP values."""
    configure_artifacts(monkeypatch, inference_artifacts)
    response = TestClient(app).get("/explain", params={"forecast_index": 12})

    assert response.status_code == 200
    payload = response.json()
    assert payload["forecast_index"] == 12
    assert payload["model_name"] == "Linear Regression"
    assert payload["method"] == "LinearExplainer"
    assert payload["unit"] == "GW"
    assert payload["data_source"] == "artifact"
    assert 0 < len(payload["features"]) <= 10
    impacts = [abs(feature["impact"]) for feature in payload["features"]]
    assert impacts == sorted(impacts, reverse=True)
    assert payload["base_value"] + sum(
        feature["impact"] for feature in payload["features"]
    ) == pytest.approx(payload["prediction"], abs=0.01)


def test_explain_endpoint_defaults_to_forecast_peak(
    monkeypatch: pytest.MonkeyPatch,
    inference_artifacts: tuple[Path, Path, Path],
) -> None:
    """Omitting selectors explains the highest point in the current forecast."""
    configure_artifacts(monkeypatch, inference_artifacts)
    client = TestClient(app)
    forecast = client.get("/forecast").json()
    expected_index = max(
        range(len(forecast["points"])),
        key=lambda index: forecast["points"][index]["predicted_demand_gw"],
    )

    explanation = client.get("/explain")

    assert explanation.status_code == 200
    assert explanation.json()["forecast_index"] == expected_index


def test_explain_endpoint_rejects_timestamp_outside_window(
    monkeypatch: pytest.MonkeyPatch,
    inference_artifacts: tuple[Path, Path, Path],
) -> None:
    """Timestamp selection is constrained to the active forecast horizon."""
    configure_artifacts(monkeypatch, inference_artifacts)
    response = TestClient(app).get(
        "/explain", params={"timestamp": "2035-01-01T00:00:00Z"}
    )

    assert response.status_code == 422


def test_api_falls_back_when_artifacts_are_missing(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    """Missing model files return the stable mock contract rather than a 500."""
    monkeypatch.setattr(settings, "model_artifact_path", tmp_path / "missing.pkl")
    monkeypatch.setattr(
        settings, "model_metadata_path", tmp_path / "missing_metadata.json"
    )
    monkeypatch.setattr(
        settings, "training_dataset_path", tmp_path / "missing_dataset.csv"
    )
    client = TestClient(app)

    forecast_response = client.get("/forecast")
    metrics_response = client.get("/metrics")
    model_response = client.get("/model")

    assert forecast_response.status_code == 200
    assert forecast_response.json()["points"]
    assert metrics_response.status_code == 200
    assert metrics_response.json()["model_name"] == "XGBoost Regressor"
    assert metrics_response.json()["data_source"] == "fallback"
    assert model_response.status_code == 200
    assert model_response.json()["status"] == "Production"
    assert model_response.json()["data_source"] == "fallback"
