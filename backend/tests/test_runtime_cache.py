"""The API must not re-parse its immutable artifacts per request.

These tests pin the production performance fix: the processed dataset is read
from disk once per file identity, the 48-hour forecast is computed once per
(model, dataset) pair, and an override path never sees another path's cache.
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import model_cache
from tests.test_inference_api import configure_artifacts, inference_artifacts  # noqa: F401

pytestmark = pytest.mark.usefixtures("inference_artifacts")


@pytest.fixture(autouse=True)
def fresh_caches():
    """Every test starts and ends with empty caches so counts are exact."""
    model_cache.clear_runtime_caches()
    yield
    model_cache.clear_runtime_caches()


def _count_calls(monkeypatch: pytest.MonkeyPatch, target: str) -> dict[str, int]:
    """Wrap a model_cache function so the test can count real invocations."""
    calls = {"n": 0}
    original = getattr(model_cache, target)

    def counted(*args, **kwargs):
        calls["n"] += 1
        return original(*args, **kwargs)

    monkeypatch.setattr(model_cache, target, counted)
    return calls


def test_dataset_is_parsed_once_across_endpoints(
    monkeypatch: pytest.MonkeyPatch,
    inference_artifacts: tuple[Path, Path, Path],
) -> None:
    """Five different endpoints reading the dataset cost one CSV parse."""
    configure_artifacts(monkeypatch, inference_artifacts)
    parses = _count_calls(monkeypatch, "load_processed_data")
    client = TestClient(app)

    for _ in range(2):
        assert client.get("/history").status_code == 200
        assert client.get("/forecast").status_code == 200
        assert client.get("/feature-importance").status_code == 200
        assert (
            client.post(
                "/simulate",
                json={
                    "temperature_anomaly": 0,
                    "wind_generation_multiplier": 1,
                    "solar_generation_multiplier": 1,
                    "ev_demand_multiplier": 1,
                    "industrial_demand_multiplier": 1,
                    "residential_demand_multiplier": 1,
                    "weekend_flag": False,
                    "bank_holiday_flag": False,
                },
            ).status_code
            == 200
        )

    assert parses["n"] == 1


def test_forecast_is_computed_once_and_stays_identical(
    monkeypatch: pytest.MonkeyPatch,
    inference_artifacts: tuple[Path, Path, Path],
) -> None:
    """Repeated /forecast calls reuse one recursive run and return the same points."""
    configure_artifacts(monkeypatch, inference_artifacts)
    runs = _count_calls(monkeypatch, "recursive_forecast")
    client = TestClient(app)

    first = client.get("/forecast").json()
    second = client.get("/forecast").json()
    explain = client.get("/explain")

    assert runs["n"] == 1
    assert first["points"] == second["points"]
    assert first["data_source"] == "artifact"
    # /explain shares the same memoised run when shap is installed; when it is
    # not, it returns 503 and must still not have triggered a second run.
    assert explain.status_code in (200, 503)
    assert runs["n"] == 1


def test_forecast_generated_at_still_reflects_the_response_time(
    monkeypatch: pytest.MonkeyPatch,
    inference_artifacts: tuple[Path, Path, Path],
) -> None:
    """Memoising the arrays must not freeze the response timestamp (API contract)."""
    configure_artifacts(monkeypatch, inference_artifacts)
    client = TestClient(app)

    first = client.get("/forecast").json()["generated_at"]
    second = client.get("/forecast").json()["generated_at"]

    assert pd.Timestamp(second) >= pd.Timestamp(first)


def test_override_paths_do_not_share_cached_data(
    monkeypatch: pytest.MonkeyPatch,
    inference_artifacts: tuple[Path, Path, Path],
    tmp_path: Path,
) -> None:
    """Two datasets at different paths produce two parses and two histories."""
    model_path, metadata_path, dataset_path = inference_artifacts
    configure_artifacts(monkeypatch, inference_artifacts)
    client = TestClient(app)
    baseline = client.get("/history").json()["points"][-1]["demand_gw"]

    # a second dataset whose latest row differs by exactly 1 GW
    other = pd.read_csv(dataset_path)
    other.loc[other.index[-1], "demand"] = other.iloc[-1]["demand"] + 1_000
    other_path = tmp_path / "other_dataset.csv"
    other.to_csv(other_path, index=False)
    parses = _count_calls(monkeypatch, "load_processed_data")

    monkeypatch.setattr(model_cache.settings, "training_dataset_path", other_path)
    switched = client.get("/history").json()["points"][-1]["demand_gw"]

    assert parses["n"] == 1
    assert switched == pytest.approx(baseline + 1.0, abs=0.001)


def test_startup_preload_warms_dataset_and_forecast(
    monkeypatch: pytest.MonkeyPatch,
    inference_artifacts: tuple[Path, Path, Path],
) -> None:
    """After lifespan-style preloading, the first request performs no parse or run."""
    model_path, metadata_path, dataset_path = inference_artifacts
    configure_artifacts(monkeypatch, inference_artifacts)
    model_cache.load_runtime_artifacts(model_path, metadata_path, dataset_path)

    parses = _count_calls(monkeypatch, "load_processed_data")
    runs = _count_calls(monkeypatch, "recursive_forecast")
    client = TestClient(app)

    assert client.get("/forecast").status_code == 200
    assert client.get("/history").status_code == 200
    assert parses["n"] == 0
    assert runs["n"] == 0


def test_missing_dataset_still_falls_back(
    monkeypatch: pytest.MonkeyPatch,
    inference_artifacts: tuple[Path, Path, Path],
    tmp_path: Path,
) -> None:
    """Caching must not swallow the documented fallback for a missing file."""
    model_path, metadata_path, _ = inference_artifacts
    monkeypatch.setattr(model_cache.settings, "model_artifact_path", model_path)
    monkeypatch.setattr(model_cache.settings, "model_metadata_path", metadata_path)
    monkeypatch.setattr(
        model_cache.settings, "training_dataset_path", tmp_path / "missing.csv"
    )
    client = TestClient(app)

    forecast = client.get("/forecast")
    history = client.get("/history")

    assert forecast.status_code == 200
    assert forecast.json()["data_source"] == "fallback"
    assert history.status_code == 200
    assert history.json()["data_source"] == "fallback"
