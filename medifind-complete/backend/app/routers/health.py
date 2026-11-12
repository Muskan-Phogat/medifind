from datetime import datetime
from fastapi import APIRouter
from app.db import query_one

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    """Service health check verifying database connectivity."""
    db_ok = False
    try:
        res = query_one("SELECT 1 AS ok")
        db_ok = bool(res and res["ok"] == 1)
    except Exception:
        db_ok = False

    return {
        "status": "ok" if db_ok else "degraded",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "database": "connected" if db_ok else "disconnected",
        "version": "1.0.0",
    }
