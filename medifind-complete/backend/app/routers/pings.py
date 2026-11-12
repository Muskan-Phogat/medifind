from typing import Optional
from fastapi import APIRouter, HTTPException, status, Query
from app.db import query_all
from app.services.ping_service import get_batch_status, record_ping_reply
from app.models import PingStatusResponse, PingReplyRequest, PingReplyResponse

router = APIRouter(tags=["Pings"])

@router.get("/pings/pending")
def list_pending_pings(pharmacy_id: Optional[int] = Query(default=None, description="Optional pharmacy ID filter")):
    """Returns real-time pending pings for Pharmacist Simulator."""
    if pharmacy_id:
        rows = query_all("""
            SELECT p.id AS ping_id, p.batch_id, p.pharmacy_id, p.medicine_id,
                   p.status, p.created_at,
                   ph.name AS pharmacy_name, ph.phone AS pharmacy_phone, ph.locality,
                   m.brand_name, m.generic_name, m.strength, m.form, m.requires_prescription
            FROM pings p
            JOIN pharmacies ph ON ph.id = p.pharmacy_id
            JOIN medicines m ON m.id = p.medicine_id
            WHERE p.status = 'pending' AND p.pharmacy_id = ?
            ORDER BY p.created_at DESC
        """, (pharmacy_id,))
    else:
        rows = query_all("""
            SELECT p.id AS ping_id, p.batch_id, p.pharmacy_id, p.medicine_id,
                   p.status, p.created_at,
                   ph.name AS pharmacy_name, ph.phone AS pharmacy_phone, ph.locality,
                   m.brand_name, m.generic_name, m.strength, m.form, m.requires_prescription
            FROM pings p
            JOIN pharmacies ph ON ph.id = p.pharmacy_id
            JOIN medicines m ON m.id = p.medicine_id
            WHERE p.status = 'pending'
            ORDER BY p.created_at DESC
        """)
    return rows

@router.get("/pings/{batch_id}/status", response_model=PingStatusResponse)
def poll_ping_status(batch_id: str):
    """
    Reliable polling endpoint returning the real-time status of each ping in the batch:
    'waiting', 'yes', 'no', 'no_reply' (after 90s).
    """
    res = get_batch_status(batch_id)
    if "error" in res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=res["error"])
    return res


@router.post("/pings/{ping_id}/reply", response_model=PingReplyResponse)
def reply_to_ping(ping_id: int, payload: PingReplyRequest):
    """
    Pharmacist responds to an auto-ping ('yes' or 'no').
    Live-updates inventory status, confirmed_at freshness, and recalculates store metrics.
    """
    res = record_ping_reply(ping_id, payload.reply)
    if "error" in res:
        err_code = res["error"].get("code")
        status_code = status.HTTP_404_NOT_FOUND if err_code == "NOT_FOUND" else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=res["error"])
    return res
