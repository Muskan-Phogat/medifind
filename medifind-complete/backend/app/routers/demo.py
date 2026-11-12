import time
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Header, Body, status
from pydantic import BaseModel
from app.config import DEMO_ADMIN_KEY, DB_PATH, REPO_ROOT

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/demo", tags=["demo"])


class ResetRequest(BaseModel):
    admin_key: Optional[str] = None


@router.post("/reset")
def reset_demo_database(
    payload: Optional[ResetRequest] = Body(default=None),
    x_demo_admin_key: Optional[str] = Header(default=None),
):
    """
    Hidden admin endpoint that restores the seeded database to its initial clean state in under 2 seconds.
    Protected by DEMO_ADMIN_KEY.
    """
    provided_key = (payload.admin_key if payload and payload.admin_key else None) or x_demo_admin_key
    
    if not provided_key or provided_key.strip() != DEMO_ADMIN_KEY.strip():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "Invalid or missing DEMO_ADMIN_KEY."}
        )

    t0 = time.perf_counter()
    try:
        # Dynamically import run_seeder from database/seed.py
        import sys
        sys.path.insert(0, str(REPO_ROOT))
        from database.seed import run_seeder
        
        run_seeder(reset=True, target_db_path=DB_PATH)
        elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)
        
        logger.info("Demo database successfully reset in %.2f ms", elapsed_ms)
        return {
            "status": "ok",
            "message": f"Demo database successfully restored to initial seed state in {elapsed_ms}ms.",
            "duration_ms": elapsed_ms,
        }
    except Exception as exc:
        logger.error("Failed to reset demo database: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "RESET_FAILED", "message": f"Failed to reset demo database: {str(exc)}"}
        )
