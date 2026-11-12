from typing import Optional
from fastapi import APIRouter, Query, HTTPException, status, Request
from app.services.search import search_pharmacies
from app.services.ping_service import create_pings_for_search
from app.models import SearchResponse, PingBatchResponse
from app.limiter import limiter
from app.config import CITY_LAT, CITY_LNG

router = APIRouter(tags=["Search"])

@router.get("/search", response_model=SearchResponse)
def perform_search(
    medicine_id: int = Query(..., description="ID of medicine from suggest endpoint"),
    lat: float = Query(default=CITY_LAT, description="User latitude"),
    lng: float = Query(default=CITY_LNG, description="User longitude"),
    radius_km: float = Query(default=5.0, ge=0.5, le=50.0, description="Search radius in kilometers"),
    emergency: bool = Query(default=False, description="Emergency flag boosting open-now pharmacies"),
):
    """
    Ranks nearby pharmacies for a medicine by stock status, confidence score, distance,
    and boosts open-now pharmacies if emergency=true.
    """
    res = search_pharmacies(
        medicine_id=medicine_id,
        user_lat=lat,
        user_lng=lng,
        radius_km=radius_km,
        emergency=emergency,
    )
    if "error" in res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=res["error"],
        )
    return res


@router.post("/search/{search_id}/ping", response_model=PingBatchResponse)
@limiter.limit("60/minute")
def trigger_auto_ping(
    request: Request,
    search_id: str,
):
    """
    Dispatches Auto-Ping to top 3 stale nearby pharmacies asking 'Do you have it right now?'.
    Rate limited to 10 per minute per client IP.
    """
    res = create_pings_for_search(search_id)
    if "error" in res:
        err_code = res["error"].get("code")
        status_code = status.HTTP_404_NOT_FOUND if err_code == "NOT_FOUND" else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=res["error"])
    return res
