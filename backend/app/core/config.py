"""Runtime configuration for the GridCast AI backend."""

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="GRIDCAST_",
        extra="ignore",
    )

    environment: Literal["local", "development", "staging", "production"] = "local"
    api_title: str = "GridCast AI API"
    api_version: str = "0.1.0"
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://localhost:3001"]
    )

    project_root: Path = Path(__file__).resolve().parents[2]
    raw_data_path: Path = project_root / "data" / "raw"
    processed_data_path: Path = project_root / "data" / "processed"
    external_data_path: Path = project_root / "data" / "external"
    model_artifact_path: Path = project_root / "models" / "model.pkl"
    model_metadata_path: Path = project_root / "models" / "model_metadata.json"
    training_dataset_path: Path = processed_data_path / "training_dataset.csv"

    weather_api_key: str | None = None


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()


settings = get_settings()
