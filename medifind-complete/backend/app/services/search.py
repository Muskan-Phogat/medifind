import math
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from rapidfuzz import fuzz, process
from app.db import query_all, query_one, execute_write
from app.services.scoring import score_and_label, parse_minutes_since

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two points in km."""
    R = 6371.0  # Earth radius in kilometers
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)


def is_pharmacy_open_now(is_24x7: int, opening_hours: str) -> bool:
    """Checks whether the pharmacy is open right now."""
    if is_24x7 == 1:
        return True
    
    # Try parsing opening hours format e.g. "08:30 - 22:30"
    try:
        if "-" not in opening_hours:
            return True
        parts = [p.strip() for p in opening_hours.split("-")]
        if len(parts) != 2:
            return True
        start_t = datetime.strptime(parts[0], "%H:%M").time()
        end_t = datetime.strptime(parts[1], "%H:%M").time()
        
        now_t = datetime.now().time()
        if start_t <= end_t:
            return start_t <= now_t <= end_t
        else:
            # Over midnight
            return now_t >= start_t or now_t <= end_t
    except Exception:
        return True


def suggest_medicines(query: str, limit: int = 8, db_path: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Typo-tolerant autocomplete across 70+ medicines using RapidFuzz.
    Matches across brand_name and generic_name (composition).
    """
    clean_q = (query or "").strip().lower()
    if not clean_q:
        return []

    medicines = query_all("""
        SELECT id, brand_name, generic_name, strength, form,
               manufacturer, mrp, requires_prescription, pack_size
        FROM medicines
    """, db_path=db_path)

    scored_items = []
    for med in medicines:
        brand = med["brand_name"].lower()
        generic = med["generic_name"].lower()
        combined = f"{brand} {generic} {med['strength'].lower()}"

        # Match using WRatio and token_set_ratio
        score_brand = fuzz.WRatio(clean_q, brand)
        score_generic = fuzz.WRatio(clean_q, generic)
        score_combined = fuzz.token_set_ratio(clean_q, combined)
        
        # Exact prefix boost
        prefix_boost = 15 if brand.startswith(clean_q) or generic.startswith(clean_q) else 0
        final_score = min(100.0, max(score_brand, score_generic, score_combined) + prefix_boost)

        if final_score >= 45.0:
            scored_items.append({
                "id": med["id"],
                "brand_name": med["brand_name"],
                "generic_name": med["generic_name"],
                "strength": med["strength"],
                "form": med["form"],
                "manufacturer": med["manufacturer"],
                "mrp": float(med["mrp"]),
                "requires_prescription": bool(med["requires_prescription"]),
                "pack_size": med["pack_size"],
                "match_score": round(final_score, 1)
            })

    # Sort descending by match score
    scored_items.sort(key=lambda x: x["match_score"], reverse=True)
    return scored_items[:limit]


def search_pharmacies(
    medicine_id: int,
    user_lat: float,
    user_lng: float,
    radius_km: float = 5.0,
    emergency: bool = False,
    db_path: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Ranks nearby pharmacies for a given medicine by:
    1. Stock Status (in_stock > low_stock > out_of_stock)
    2. Emergency Open-Now boost (if emergency=True)
    3. Confidence Score (descending)
    4. Distance (ascending)
    
    Logs search with coarse rounded coordinates (never personal identity).
    If no stock found, records an unmet-demand event.
    """
    search_id = str(uuid.uuid4())
    
    # 1. Fetch medicine details
    med = query_one("""
        SELECT id, brand_name, generic_name, strength, form,
               manufacturer, mrp, requires_prescription, pack_size
        FROM medicines WHERE id = ?
    """, (medicine_id,), db_path=db_path)

    if not med:
        return {"error": {"code": "NOT_FOUND", "message": f"Medicine ID {medicine_id} not found."}}

    rx_notice = (
        "Prescription Required: The chemist will verify your physical or digital doctor's prescription in person before dispensing."
        if med["requires_prescription"] else None
    )

    # 2. Query all pharmacies and their inventory for this medicine
    sql = """
        SELECT 
            p.id AS pharmacy_id, p.name AS pharmacy_name, p.address, p.locality,
            p.city, p.phone, p.owner_name, p.is_24x7, p.opening_hours,
            p.lat, p.lng, p.accuracy, p.response_rate,
            COALESCE(i.status, 'out_of_stock') AS stock_status,
            COALESCE(i.price, p_med.mrp) AS price,
            COALESCE(i.stock_quantity, 0) AS stock_quantity,
            COALESCE(i.source, 'unverified') AS source,
            COALESCE(i.confirmed_at, datetime('now', '-3 days')) AS confirmed_at
        FROM pharmacies p
        CROSS JOIN (SELECT mrp FROM medicines WHERE id = ?) p_med
        LEFT JOIN inventory i ON i.pharmacy_id = p.id AND i.medicine_id = ?
    """
    rows = query_all(sql, (medicine_id, medicine_id), db_path=db_path)

    results = []
    in_stock_count = 0

    for r in rows:
        dist = haversine_distance_km(user_lat, user_lng, r["lat"], r["lng"])
        if dist > radius_km:
            continue

        mins_since = parse_minutes_since(r["confirmed_at"])
        conf_score, conf_label = score_and_label(
            minutes_since_confirmation=mins_since,
            source=r["source"],
            pharmacy_accuracy=r["accuracy"],
            pharmacy_response_rate=r["response_rate"],
        )
        
        open_now = is_pharmacy_open_now(r["is_24x7"], r["opening_hours"])
        
        # Stale if confirmation is older than 240 mins or source is unverified
        is_stale = (mins_since >= 240) or (r["source"] == "unverified")

        if r["stock_status"] in ("in_stock", "low_stock"):
            in_stock_count += 1

        results.append({
            "pharmacy_id": r["pharmacy_id"],
            "pharmacy_name": r["pharmacy_name"],
            "address": r["address"],
            "locality": r["locality"],
            "city": r["city"],
            "phone": r["phone"],
            "owner_name": r["owner_name"],
            "is_24x7": bool(r["is_24x7"]),
            "opening_hours": r["opening_hours"],
            "lat": float(r["lat"]),
            "lng": float(r["lng"]),
            "distance_km": dist,
            "stock_status": r["stock_status"],
            "price": float(r["price"]),
            "stock_quantity": int(r["stock_quantity"]),
            "source": r["source"],
            "confirmed_at": r["confirmed_at"],
            "minutes_since_confirmation": mins_since,
            "confidence_score": conf_score,
            "confidence_label": conf_label,
            "open_now": open_now,
            "is_stale": is_stale,
        })

    # Ranking logic
    status_order = {"in_stock": 0, "low_stock": 1, "out_of_stock": 2}
    
    def sort_key(item):
        stock_rank = status_order.get(item["stock_status"], 3)
        # In emergency mode: open pharmacies get highest priority
        emergency_rank = 0 if (not emergency or item["open_now"]) else 1
        return (
            emergency_rank,
            stock_rank,
            -item["confidence_score"],  # Higher confidence first
            item["distance_km"],        # Closer distance first
        )

    results.sort(key=sort_key)

    has_unmet_demand = (in_stock_count == 0)

    # Coarse coordinates logging (rounded to 2 decimal places ~1.1km area)
    coarse_lat = round(user_lat, 2)
    coarse_lng = round(user_lng, 2)
    execute_write("""
        INSERT INTO searches (id, medicine_id, query_text, lat, lng, radius_km, results_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    """, (search_id, medicine_id, f"{med['brand_name']} {med['strength']}", coarse_lat, coarse_lng, radius_km, len(results)), db_path=db_path)

    return {
        "search_id": search_id,
        "medicine": {
            "id": med["id"],
            "brand_name": med["brand_name"],
            "generic_name": med["generic_name"],
            "strength": med["strength"],
            "form": med["form"],
            "manufacturer": med["manufacturer"],
            "mrp": float(med["mrp"]),
            "requires_prescription": bool(med["requires_prescription"]),
            "pack_size": med["pack_size"],
            "prescription_notice": rx_notice,
        },
        "total_results": len(results),
        "results": results,
        "has_unmet_demand": has_unmet_demand,
    }
