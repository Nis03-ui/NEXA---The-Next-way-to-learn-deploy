from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api import admin, ai, auth, quiz as quiz_api, teacher, users
from app.core.config import settings
from app.core.exceptions import (
    AppError,
    app_error_handler,
    general_error_handler,
)
from app.db.base import Base
from app.db.session import engine
from app.models import *


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables when the application starts.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield

    # Dispose database connections when the application shuts down.
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="NEXA — The Next Way to Learn API",
    lifespan=lifespan,
)


# ============================================================
# Middleware
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Exception Handlers
# ============================================================

app.add_exception_handler(
    AppError,
    app_error_handler,
)

app.add_exception_handler(
    Exception,
    general_error_handler,
)


# ============================================================
# API Routes
# ============================================================

API_PREFIX = "/api/v1"

app.include_router(
    auth.router,
    prefix=API_PREFIX,
)

app.include_router(
    users.router,
    prefix=API_PREFIX,
)

app.include_router(
    ai.router,
    prefix=API_PREFIX,
)

app.include_router(
    admin.router,
    prefix=API_PREFIX,
)

app.include_router(
    teacher.router,
    prefix=API_PREFIX,
)

app.include_router(
    quiz_api.router,
    prefix=API_PREFIX,
)


# ============================================================
# Health & Readiness
# ============================================================

@app.get(
    "/health",
    tags=["System"],
)
async def health():
    return {
        "status": "ok",
        "service": "nexa-api",
    }


@app.get(
    "/ready",
    tags=["System"],
)
async def readiness():
    """
    Verify that the API can communicate with the database.
    """

    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))

    return {
        "status": "ready",
        "database": "connected",
    }