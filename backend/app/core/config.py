"""Runtime configuration for the GridCast AI backend."""

from functools import lru_cache
from pathlib import Path
from typing import Annotated, Any, Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


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
    cors_origins: Annotated[list[str], NoDecode] = Field(
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

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Any) -> Any:
        """Support comma-separated GRIDCAST_CORS_ORIGINS values."""
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()


settings = get_settings()
