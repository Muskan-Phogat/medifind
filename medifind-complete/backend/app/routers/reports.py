from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Request
from app.db import query_one, execute_write
from app.models import ReportCreate, ReportResponse
from app.limiter import limiter

router = APIRouter(tags=["Reports"])

@router.post("/reports", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("60/minute")
def submit_stock_report(request: Request, payload: ReportCreate):
    """
    Submits a community 'Report wrong stock' flag for a medicine at a specific chemist.
    Creates an accountability audit trail and immediately degrades pharmacy accuracy.
    """
    pharmacy = query_one("SELECT id, name FROM pharmacies WHERE id = ?", (payload.pharmacy_id,))
    if not pharmacy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PHARMACY_NOT_FOUND", "message": f"Pharmacy ID {payload.pharmacy_id} not found."},
        )

    med = query_one("SELECT id FROM medicines WHERE id = ?", (payload.medicine_id,))
    if not med:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "MEDICINE_NOT_FOUND", "message": f"Medicine ID {payload.medicine_id} not found."},
        )

    report_id = execute_write("""
        INSERT INTO reports (pharmacy_id, medicine_id, reason, user_note, resolved, created_at)
        VALUES (?, ?, ?, ?, 0, datetime('now'))
    """, (payload.pharmacy_id, payload.medicine_id, payload.reason, payload.user_note))

    # Adjust pharmacy accuracy score slightly for verified crowd accountability
    execute_write("""
        UPDATE pharmacies
        SET accuracy = MAX(0.60, accuracy - 0.02), updated_at = datetime('now')
        WHERE id = ?
    """, (payload.pharmacy_id,))

    return {
        "success": True,
        "report_id": report_id,
        "message": "Report logged. Thank you for helping keep neighborhood pharmacy stock verified.",
    }
