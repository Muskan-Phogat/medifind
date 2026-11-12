import os
import sys
import logging
from pathlib import Path
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from slowapi.errors import RateLimitExceeded

from contextlib import asynccontextmanager
from app.config import ORIGINS, CITY_NAME, DB_PATH, REPO_ROOT
from app.db import get_connection
from app.limiter import limiter
from app.routers import (
    health, medicines, search, pings,
    reservations, pharmacy, reports, insights, demo
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    On ephemeral cloud environments (Render, Fly.io, etc.), automatically initialize
    and seed the database on startup if missing or empty.
    """
    db_file = Path(DB_PATH)
    needs_seed = False
    
    if not db_file.exists() or db_file.stat().st_size == 0:
        needs_seed = True
    else:
        try:
            with get_connection() as conn:
                count = conn.execute("SELECT count(*) FROM pharmacies").fetchone()[0]
                if count == 0:
                    needs_seed = True
        except Exception:
            needs_seed = True

    if needs_seed:
        logger.warning("Database missing or unseeded at %s. Running automatic seeder...", DB_PATH)
        try:
            sys.path.insert(0, str(REPO_ROOT))
            from database.seed import run_seeder
            run_seeder(reset=True, target_db_path=DB_PATH)
            logger.info("Automatic startup database seeding completed successfully.")
        except Exception as exc:
            logger.error("Failed to auto-seed database on startup: %s", exc)
    yield


app = FastAPI(
    title="MediFind API",
    description="Real-time medicine availability verification and 60-minute hold reservation platform.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Attach SlowAPI limiter state
app.state.limiter = limiter

# Robust CORS Configuration: supports localhost, custom origins, and any LAN IP for mobile demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS if ORIGINS != ["*"] else ["*"],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Standard Error Handlers conforming to {error: {code, message}}
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, dict) and "code" in detail and "message" in detail:
        error_payload = detail
    elif isinstance(detail, dict) and "error" in detail:
        error_payload = detail["error"]
    else:
        error_payload = {
            "code": f"HTTP_{exc.status_code}",
            "message": str(detail),
        }
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": error_payload},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    first_msg = errors[0]["msg"] if errors else "Invalid request body or query parameters."
    field_loc = " -> ".join(str(l) for l in errors[0].get("loc", [])) if errors else ""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": f"{first_msg} (field: {field_loc})",
            }
        },
    )


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "error": {
                "code": "RATE_LIMIT_EXCEEDED",
                "message": f"Too many requests: {exc.detail}",
            }
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred.",
            }
        },
    )


# Mount All API Routers under /api
app.include_router(health.router, prefix="/api")
app.include_router(medicines.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(pings.router, prefix="/api")
app.include_router(reservations.router, prefix="/api")
app.include_router(pharmacy.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(insights.router, prefix="/api")
app.include_router(demo.router, prefix="/api")


@app.get("/")
def root_redirect():
    """Welcome page with link to Swagger docs."""
    return {
        "service": "MediFind API",
        "tagline": "We don't list medicines, we verify them.",
        "documentation": "/docs",
        "health": "/api/health",
        "active_city": CITY_NAME,
    }
