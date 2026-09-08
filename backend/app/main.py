"""FastAPI entrypoint for the GridCast AI backend."""

import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import settings
from app.services.model_cache import load_runtime_artifacts

LOGGER = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Preload production ML artifacts, but do not require them to serve.

    Preloading is a warm-cache optimisation. Every service already handles a
    missing artifact by returning the documented `data_source: "fallback"`
    contract, so a hard failure here made that contract unreachable on a running
    server and turned a missing file into total downtime. Log and continue: the
    API then reports `fallback` and the UI shows "Artifacts unavailable".
    """
    try:
        load_runtime_artifacts()
    except (FileNotFoundError, OSError, KeyError, TypeError, ValueError) as error:
        LOGGER.warning(
            "Model artifacts could not be preloaded; serving fallback responses: %s", error
        )
    yield


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.api_title,
        version=settings.api_version,
        description="Backend API for GridCast AI electricity demand forecasting.",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(router)
    return app


app = create_app()
