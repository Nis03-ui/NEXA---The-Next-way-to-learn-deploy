from contextlib import asynccontextmanager
import asyncio
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.api import admin, ai, auth, teacher, users
from app.api import quiz as quiz_api
from app.api import course as course_api
from app.api import course_material as course_material_api
from app.api import assignment as assignment_api
from app.api import schedule as schedule_api
from app.api import notification as notification_api
from app.core.config import settings
from app.core.exceptions import (
    AppError,
    app_error_handler,
    general_error_handler,
)
from app.db.base import Base
from app.db.session import engine
from app.models import *


async def _promote_demo_admin():
    try:
        async with engine.begin() as conn:
            await conn.execute(text(
                "UPDATE users SET role = 'ADMIN' WHERE lower(email) = lower(:email)"
            ), {"email": "bhandarinishan69@gmail.com"})
    except Exception:
        pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    asyncio.create_task(_promote_demo_admin())

    yield

    await engine.dispose()


Path("uploads/materials").mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="NEXA — The Next Way to Learn API",
    lifespan=lifespan,
)


# ============================================================
# Middleware
# ============================================================

ALLOWED_ORIGINS = {
    settings.frontend_origin.rstrip("/"),
    "https://nexa-the-next-way-to-learn-deploy-3.onrender.com",
    "http://localhost:3000",
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(ALLOWED_ORIGINS),
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


app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

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

app.include_router(
    course_api.router,
    prefix=API_PREFIX,
)
app.include_router(
    schedule_api.router,
    prefix=API_PREFIX,
)
app.include_router(
    course_material_api.router,
    prefix=API_PREFIX,
)
app.include_router(
    assignment_api.router,
    prefix=API_PREFIX,
)
app.include_router(notification_api.router, prefix=API_PREFIX)
app.include_router(
    notification_api.router,
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
