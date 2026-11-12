from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends, Request
from app.db import query_all, query_one, execute_write
from app.models import (
    PharmacyLoginRequest, PharmacyLoginResponse,
    InventoryUpdateRequest
)
from app.services.auth import (
    verify_pin, create_access_token, get_current_pharmacy
)
from app.services.insights import get_unmet_demand_insights
from app.limiter import limiter

router = APIRouter(tags=["Pharmacy Portal"])

@router.get("/pharmacies")
def list_pharmacies():
    """Returns list of active pharmacies for discovery and selector."""
    rows = query_all("""
        SELECT id, name, address, locality, city, lat, lng, phone,
               owner_name, pin_code, is_24x7, opening_hours, accuracy, response_rate
        FROM pharmacies
        ORDER BY name ASC
    """)
    return rows

@router.post("/pharmacy/login", response_model=PharmacyLoginResponse)
@limiter.limit("60/minute")
def pharmacy_login(request: Request, payload: PharmacyLoginRequest):
    """
    Authenticates a chemist using Store ID and 4-digit PIN against salted PBKDF2 hash.
    Returns signed JWT access token.
    """
    pharmacy = query_one("SELECT * FROM pharmacies WHERE id = ?", (payload.pharmacy_id,))
    if not pharmacy:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": "Invalid pharmacy ID or PIN."},
        )

    stored_hash = pharmacy["pin_hash"]
    fallback_pin = pharmacy["login_pin"]
    
    if not verify_pin(payload.pin, stored_hash, fallback_pin):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": "Invalid pharmacy ID or PIN."},
        )

    token = create_access_token(pharmacy["id"], pharmacy["name"])
    
    pharmacy_dict = dict(pharmacy)
    pharmacy_dict.pop("pin_hash", None)
    pharmacy_dict.pop("login_pin", None)

    return {
        "token": token,
        "token_type": "bearer",
        "pharmacy": pharmacy_dict,
    }


@router.get("/pharmacy/{id}/dashboard")
def get_pharmacy_dashboard(
    id: int,
    current_pharmacy: dict = Depends(get_current_pharmacy),
):
    """
    Chemist partner dashboard:
    Returns pending pings, active reservations, current inventory with confirmation age,
    and localized unmet-demand alerts.
    Protected by JWT Bearer authentication.
    """
    if int(current_pharmacy["id"]) != id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "You can only access your own store dashboard."},
        )

    # 1. Pending Pings
    pending_pings = query_all("""
        SELECT p.id, p.batch_id, p.medicine_id, p.created_at,
               m.brand_name, m.generic_name, m.strength, m.form
        FROM pings p
        JOIN medicines m ON m.id = p.medicine_id
        WHERE p.pharmacy_id = ? AND p.status = 'pending'
        ORDER BY p.created_at DESC
    """, (id,))

    # 2. Active Reservations
    active_reservations = query_all("""
        SELECT r.id, r.token, r.quantity, r.customer_name, r.customer_phone,
               r.status, r.notes, r.expires_at, r.created_at,
               m.brand_name, m.strength
        FROM reservations r
        JOIN medicines m ON m.id = r.medicine_id
        WHERE r.pharmacy_id = ? AND r.status IN ('requested', 'pending', 'accepted', 'confirmed')
        ORDER BY r.created_at DESC
    """, (id,))

    # 3. Store Inventory
    inventory = query_all("""
        SELECT i.id, i.medicine_id, i.status, i.price, i.stock_quantity,
               i.source, i.confirmed_at,
               m.brand_name, m.generic_name, m.strength, m.form, m.mrp, m.pack_size, m.requires_prescription
        FROM inventory i
        JOIN medicines m ON m.id = i.medicine_id
        WHERE i.pharmacy_id = ?
        ORDER BY i.status ASC, m.brand_name ASC
    """, (id,))

    # 4. Localized Unmet Demand
    unmet = get_unmet_demand_insights(pharmacy_id=id, limit=10)

    pharmacy_info = dict(current_pharmacy)
    pharmacy_info.pop("pin_hash", None)
    pharmacy_info.pop("login_pin", None)

    return {
        "pharmacy": pharmacy_info,
        "pending_pings": pending_pings,
        "active_reservations": active_reservations,
        "inventory": inventory,
        "unmet_demand": unmet,
    }


@router.put("/pharmacy/{id}/inventory")
def update_pharmacy_inventory(
    id: int,
    payload: InventoryUpdateRequest,
    current_pharmacy: dict = Depends(get_current_pharmacy),
):
    """
    Chemist updates their medicine stock status or price.
    Marks source='manual', confirmed_at=now.
    Protected by JWT Bearer authentication.
    """
    if int(current_pharmacy["id"]) != id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "You can only update inventory for your own store."},
        )

    # Check medicine exists
    med = query_one("SELECT mrp FROM medicines WHERE id = ?", (payload.medicine_id,))
    if not med:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "MEDICINE_NOT_FOUND", "message": f"Medicine ID {payload.medicine_id} not found."},
        )

    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    
    # Check if inventory row exists
    inv = query_one("SELECT id, price, stock_quantity FROM inventory WHERE pharmacy_id = ? AND medicine_id = ?", (id, payload.medicine_id))
    
    final_price = payload.price if payload.price is not None else (inv["price"] if inv else med["mrp"])
    if payload.stock_quantity is not None:
        final_qty = payload.stock_quantity
    elif inv:
        final_qty = 0 if payload.status == "out_of_stock" else inv["stock_quantity"]
    else:
        final_qty = 10 if payload.status != "out_of_stock" else 0

    if inv:
        execute_write("""
            UPDATE inventory
            SET status = ?, price = ?, stock_quantity = ?, source = 'manual', confirmed_at = ?
            WHERE pharmacy_id = ? AND medicine_id = ?
        """, (payload.status, final_price, final_qty, now_str, id, payload.medicine_id))
    else:
        execute_write("""
            INSERT INTO inventory (pharmacy_id, medicine_id, status, price, stock_quantity, source, confirmed_at, created_at)
            VALUES (?, ?, ?, ?, ?, 'manual', ?, ?)
        """, (id, payload.medicine_id, payload.status, final_price, final_qty, now_str, now_str))

    return {
        "success": True,
        "pharmacy_id": id,
        "medicine_id": payload.medicine_id,
        "status": payload.status,
        "price": final_price,
        "stock_quantity": final_qty,
        "confirmed_at": now_str,
    }
