from fastapi import APIRouter, HTTPException, status, Request
from app.services.reservations import create_reservation, get_reservation, update_reservation_status
from app.models import ReservationCreate, ReservationResponse, ReservationStatusUpdate
from app.limiter import limiter

router = APIRouter(tags=["Reservations"])

@router.post("/reservations", response_model=ReservationResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("60/minute")
def request_reservation(request: Request, payload: ReservationCreate):
    """
    Submits a 60-minute medicine hold request to a verified pharmacy.
    Returns 4-digit token and expiration timestamp.
    """
    res = create_reservation(
        pharmacy_id=payload.pharmacy_id,
        medicine_id=payload.medicine_id,
        quantity=payload.quantity,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        notes=payload.notes,
    )
    if "error" in res:
        err_code = res["error"].get("code")
        status_code = status.HTTP_404_NOT_FOUND if "NOT_FOUND" in err_code else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=res["error"])
    return res


@router.get("/reservations/{id}", response_model=ReservationResponse)
def fetch_reservation(id: str):
    """
    Retrieves reservation details with lazy 60-minute expiry evaluation.
    """
    res = get_reservation(id)
    if "error" in res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=res["error"])
    return res


@router.patch("/reservations/{id}", response_model=ReservationResponse)
def change_reservation_status(id: str, payload: ReservationStatusUpdate):
    """
    Pharmacist updates reservation status (e.g. accepted, rejected, collected).
    Rejects illegal state transitions with HTTP 409 Conflict.
    """
    res = update_reservation_status(id, payload.status)
    if "conflict" in res:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=res["conflict"])
    if "error" in res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=res["error"])
    return res
