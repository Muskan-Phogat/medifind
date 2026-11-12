import uuid
import random
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from app.db import query_one, execute_write

# Canonical Status States & Synonyms
# requested/pending -> accepted/confirmed | rejected -> collected/dispensed | expired | cancelled

STATUS_TRANSITIONS = {
    "requested": {"accepted", "confirmed", "rejected", "cancelled", "expired"},
    "pending": {"accepted", "confirmed", "rejected", "cancelled", "expired"},
    "accepted": {"collected", "dispensed", "cancelled", "expired"},
    "confirmed": {"collected", "dispensed", "cancelled", "expired"},
    "rejected": set(),
    "collected": set(),
    "dispensed": set(),
    "cancelled": set(),
    "expired": set(),
}

def create_reservation(
    pharmacy_id: int,
    medicine_id: int,
    quantity: int,
    customer_name: str,
    customer_phone: str,
    notes: Optional[str] = None,
    db_path: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Creates a new 60-minute reservation request.
    Generates a 4-digit pickup token.
    """
    # Check pharmacy & medicine exist
    pharmacy = query_one("SELECT name FROM pharmacies WHERE id = ?", (pharmacy_id,), db_path=db_path)
    if not pharmacy:
        return {"error": {"code": "PHARMACY_NOT_FOUND", "message": f"Pharmacy ID {pharmacy_id} not found."}}

    medicine = query_one("SELECT brand_name, strength FROM medicines WHERE id = ?", (medicine_id,), db_path=db_path)
    if not medicine:
        return {"error": {"code": "MEDICINE_NOT_FOUND", "message": f"Medicine ID {medicine_id} not found."}}

    res_id = str(uuid.uuid4())
    token = f"{random.randint(1000, 9999)}"
    now = datetime.utcnow()
    expires_at = (now + timedelta(minutes=60)).strftime("%Y-%m-%d %H:%M:%S")
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")

    execute_write("""
        INSERT INTO reservations (
            id, token, pharmacy_id, medicine_id, quantity, customer_name,
            customer_phone, status, notes, expires_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'requested', ?, ?, ?, ?)
    """, (
        res_id, token, pharmacy_id, medicine_id, quantity, customer_name,
        customer_phone, notes, expires_at, now_str, now_str
    ), db_path=db_path)

    return {
        "id": res_id,
        "token": token,
        "pharmacy_id": pharmacy_id,
        "pharmacy_name": pharmacy["name"],
        "medicine_id": medicine_id,
        "medicine_name": f"{medicine['brand_name']} {medicine['strength']}",
        "quantity": quantity,
        "customer_name": customer_name,
        "customer_phone": customer_phone,
        "status": "requested",
        "notes": notes,
        "expires_at": expires_at,
        "created_at": now_str,
        "updated_at": now_str,
    }


def get_reservation(
    reservation_id: str,
    db_path: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Fetches a reservation with lazy expiry evaluation.
    """
    row = query_one("""
        SELECT r.*, p.name AS pharmacy_name, (m.brand_name || ' ' || m.strength) AS medicine_name
        FROM reservations r
        JOIN pharmacies p ON p.id = r.pharmacy_id
        JOIN medicines m ON m.id = r.medicine_id
        WHERE r.id = ?
    """, (reservation_id,), db_path=db_path)

    if not row:
        return {"error": {"code": "NOT_FOUND", "message": f"Reservation {reservation_id} not found."}}

    # Lazy expiry check
    current_status = row["status"]
    expires_at_str = row["expires_at"]
    
    if current_status in ("requested", "pending", "accepted", "confirmed"):
        try:
            exp_dt = datetime.strptime(expires_at_str.replace("T", " ").split(".")[0], "%Y-%m-%d %H:%M:%S")
            if datetime.utcnow() > exp_dt:
                current_status = "expired"
                execute_write("""
                    UPDATE reservations SET status = 'expired', updated_at = datetime('now') WHERE id = ?
                """, (reservation_id,), db_path=db_path)
        except Exception:
            pass

    return {
        "id": row["id"],
        "token": row["token"],
        "pharmacy_id": row["pharmacy_id"],
        "pharmacy_name": row["pharmacy_name"],
        "medicine_id": row["medicine_id"],
        "medicine_name": row["medicine_name"],
        "quantity": row["quantity"],
        "customer_name": row["customer_name"],
        "customer_phone": row["customer_phone"],
        "status": current_status,
        "notes": row["notes"],
        "expires_at": row["expires_at"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def update_reservation_status(
    reservation_id: str,
    new_status: str,
    db_path: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Updates status enforcing valid state machine transitions.
    Rejects illegal transitions with 409 status code.
    """
    clean_target = new_status.strip().lower()

    # Fetch current reservation
    current = get_reservation(reservation_id, db_path=db_path)
    if "error" in current:
        return current

    current_status = current["status"].lower()
    allowed = STATUS_TRANSITIONS.get(current_status, set())

    if clean_target not in allowed:
        return {
            "conflict": {
                "code": "ILLEGAL_TRANSITION",
                "message": f"Cannot transition reservation from '{current_status}' to '{clean_target}'. Allowed transitions: {sorted(list(allowed))}"
            }
        }

    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    execute_write("""
        UPDATE reservations
        SET status = ?, updated_at = ?
        WHERE id = ?
    """, (clean_target, now_str, reservation_id), db_path=db_path)

    current["status"] = clean_target
    current["updated_at"] = now_str
    return current
