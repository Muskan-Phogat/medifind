import uuid
from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.db import query_all, query_one, execute_write
from app.config import PING_TIMEOUT_SECONDS

class PingProvider(ABC):
    """Abstract interface for dispatching pharmacist pings."""
    @abstractmethod
    def dispatch_ping(self, ping_id: int, pharmacy_phone: str, medicine_name: str) -> bool:
        pass


class SimulatedPingProvider(PingProvider):
    """
    Default in-memory / simulated ping provider.
    Allows demo and testing without external third-party SMS or WhatsApp costs.
    """
    def dispatch_ping(self, ping_id: int, pharmacy_phone: str, medicine_name: str) -> bool:
        # In simulation mode, the ping record in SQLite is immediately ready
        # to be answered via the Pharmacist Simulator or API.
        return True


class WhatsAppPingProvider(PingProvider):
    """
    STUB: Production WhatsApp Business Cloud API provider.
    NOT WIRED IN for local demo/contest.
    """
    def __init__(self, api_key: Optional[str] = None, phone_number_id: Optional[str] = None):
        # TODO: Configure WhatsApp Business Cloud API credentials
        # TODO: Initialize Meta Graph API client
        self.api_key = api_key
        self.phone_number_id = phone_number_id

    def dispatch_ping(self, ping_id: int, pharmacy_phone: str, medicine_name: str) -> bool:
        # TODO: Format WhatsApp interactive template with Yes/No quick-reply buttons
        # TODO: POST to https://graph.facebook.com/v19.0/{phone_number_id}/messages
        # TODO: Handle webhook callback for incoming message button payload
        raise NotImplementedError("WhatsAppPingProvider is a stub for future integration.")


# Active provider instance
default_ping_provider: PingProvider = SimulatedPingProvider()


def create_pings_for_search(
    search_id: str,
    db_path: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Picks top 3 stale pharmacies for the medicine in search_id,
    creates ping records under a single batch_id, and dispatches them.
    """
    # 1. Fetch search
    search = query_one("SELECT * FROM searches WHERE id = ?", (search_id,), db_path=db_path)
    if not search:
        return {"error": {"code": "NOT_FOUND", "message": f"Search ID {search_id} not found."}}

    med_id = search["medicine_id"]
    med = query_one("SELECT brand_name, strength FROM medicines WHERE id = ?", (med_id,), db_path=db_path)
    medicine_name = f"{med['brand_name']} {med['strength']}" if med else "Medicine"

    # 2. Find pharmacies near search coordinates with stale or out_of_stock inventory
    # Priority: pharmacies whose stock was confirmed > 240 mins ago, or unverified, or out of stock
    sql = """
        SELECT p.id, p.name, p.phone, p.lat, p.lng,
               COALESCE(i.status, 'out_of_stock') AS stock_status,
               COALESCE(i.source, 'unverified') AS source,
               COALESCE(i.confirmed_at, datetime('now', '-3 days')) AS confirmed_at
        FROM pharmacies p
        LEFT JOIN inventory i ON i.pharmacy_id = p.id AND i.medicine_id = ?
        ORDER BY 
            CASE 
                WHEN i.source = 'unverified' THEN 0
                WHEN i.confirmed_at <= datetime('now', '-4 hours') THEN 1
                ELSE 2
            END,
            ((p.lat - ?) * (p.lat - ?) + (p.lng - ?) * (p.lng - ?)) ASC
        LIMIT 3
    """
    candidates = query_all(sql, (med_id, search["lat"], search["lat"], search["lng"], search["lng"]), db_path=db_path)
    
    if not candidates:
        return {"error": {"code": "NO_CANDIDATES", "message": "No nearby pharmacies available to ping."}}

    batch_id = str(uuid.uuid4())
    pings_created = []

    for cand in candidates:
        ping_id = execute_write("""
            INSERT INTO pings (batch_id, search_id, pharmacy_id, medicine_id, status, created_at)
            VALUES (?, ?, ?, ?, 'pending', datetime('now'))
        """, (batch_id, search_id, cand["id"], med_id), db_path=db_path)

        default_ping_provider.dispatch_ping(ping_id, cand["phone"], medicine_name)

        pings_created.append({
            "ping_id": ping_id,
            "pharmacy_id": cand["id"],
            "pharmacy_name": cand["name"],
            "phone": cand["phone"],
            "status": "pending",
            "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "replied_at": None,
            "response_time_seconds": None,
        })

    return {
        "batch_id": batch_id,
        "search_id": search_id,
        "medicine_id": med_id,
        "medicine_name": medicine_name,
        "pings_sent": len(pings_created),
        "pings": pings_created,
    }


def get_batch_status(batch_id: str, db_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Reliable polling endpoint returning each pharmacy's current state:
    'waiting', 'yes', 'no', 'no_reply' (after 90 seconds).
    """
    rows = query_all("""
        SELECT p.id AS ping_id, p.batch_id, p.pharmacy_id, p.status,
               p.created_at, p.replied_at, p.response_time_seconds,
               ph.name AS pharmacy_name, ph.phone
        FROM pings p
        JOIN pharmacies ph ON ph.id = p.pharmacy_id
        WHERE p.batch_id = ?
    """, (batch_id,), db_path=db_path)

    if not rows:
        return {"error": {"code": "NOT_FOUND", "message": f"Ping batch {batch_id} not found."}}

    now = datetime.utcnow()
    statuses = []

    for r in rows:
        current_status = r["status"]
        
        # Check elapsed time for pending pings
        if current_status == "pending":
            try:
                c_time = datetime.strptime(r["created_at"].replace("T", " ").split(".")[0], "%Y-%m-%d %H:%M:%S")
                elapsed = (now - c_time).total_seconds()
            except Exception:
                elapsed = 0.0

            if elapsed > float(PING_TIMEOUT_SECONDS):
                current_status = "no_reply"
            else:
                current_status = "waiting"

        statuses.append({
            "ping_id": r["ping_id"],
            "pharmacy_id": r["pharmacy_id"],
            "pharmacy_name": r["pharmacy_name"],
            "phone": r["phone"],
            "status": current_status,
            "created_at": r["created_at"],
            "replied_at": r["replied_at"],
            "response_time_seconds": r["response_time_seconds"],
        })

    return {
        "batch_id": batch_id,
        "statuses": statuses,
    }


def record_ping_reply(
    ping_id: int,
    reply: str,
    db_path: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Records pharmacist reply (yes / no).
    1. Updates inventory (status, source='ping', confirmed_at=now)
    2. Updates ping record (status, replied_at, response_time_seconds)
    3. Recalculates pharmacy response_rate and accuracy fields!
    """
    clean_reply = reply.strip().lower()
    if clean_reply not in ("yes", "no"):
        return {"error": {"code": "INVALID_REPLY", "message": "Reply must be 'yes' or 'no'."}}

    ping = query_one("SELECT * FROM pings WHERE id = ?", (ping_id,), db_path=db_path)
    if not ping:
        return {"error": {"code": "NOT_FOUND", "message": f"Ping ID {ping_id} not found."}}

    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    
    # Calculate response time
    try:
        created_dt = datetime.strptime(ping["created_at"].replace("T", " ").split(".")[0], "%Y-%m-%d %H:%M:%S")
        resp_time_sec = max(1, int((datetime.utcnow() - created_dt).total_seconds()))
    except Exception:
        resp_time_sec = 30

    # 1. Update ping record
    execute_write("""
        UPDATE pings
        SET status = ?, replied_at = ?, response_time_seconds = ?
        WHERE id = ?
    """, (clean_reply, now_str, resp_time_sec, ping_id), db_path=db_path)

    # 2. Update inventory
    new_status = "in_stock" if clean_reply == "yes" else "out_of_stock"
    pharmacy_id = ping["pharmacy_id"]
    medicine_id = ping["medicine_id"]

    # Check if inventory row exists
    inv = query_one("""
        SELECT id FROM inventory WHERE pharmacy_id = ? AND medicine_id = ?
    """, (pharmacy_id, medicine_id), db_path=db_path)

    if inv:
        execute_write("""
            UPDATE inventory
            SET status = ?, source = 'ping', confirmed_at = ?, stock_quantity = CASE WHEN ? = 'yes' THEN MAX(stock_quantity, 5) ELSE 0 END
            WHERE pharmacy_id = ? AND medicine_id = ?
        """, (new_status, now_str, clean_reply, pharmacy_id, medicine_id), db_path=db_path)
    else:
        # Fetch default price from medicine
        med = query_one("SELECT mrp FROM medicines WHERE id = ?", (medicine_id,), db_path=db_path)
        mrp = med["mrp"] if med else 50.0
        execute_write("""
            INSERT INTO inventory (pharmacy_id, medicine_id, status, price, stock_quantity, source, confirmed_at, created_at)
            VALUES (?, ?, ?, ?, ?, 'ping', ?, ?)
        """, (pharmacy_id, medicine_id, new_status, mrp, 10 if clean_reply == "yes" else 0, now_str, now_str), db_path=db_path)

    # 3. Recalculate pharmacy response_rate and accuracy
    stats = query_one("""
        SELECT 
            COUNT(*) AS total_pings,
            SUM(CASE WHEN status IN ('yes', 'no') THEN 1 ELSE 0 END) AS replied_pings
        FROM pings WHERE pharmacy_id = ?
    """, (pharmacy_id,), db_path=db_path)

    total_pings = stats["total_pings"] or 1
    replied_pings = stats["replied_pings"] or 1
    new_response_rate = round(min(1.0, max(0.5, replied_pings / float(total_pings))), 2)

    # Accuracy factor: community complaints count
    report_count = query_one("""
        SELECT COUNT(*) AS total_reports FROM reports WHERE pharmacy_id = ? AND reason = 'out_of_stock'
    """, (pharmacy_id,), db_path=db_path)
    neg_reports = report_count["total_reports"] if report_count else 0
    new_accuracy = round(max(0.70, min(0.99, 0.98 - (neg_reports * 0.04))), 2)

    execute_write("""
        UPDATE pharmacies
        SET response_rate = ?, accuracy = ?, updated_at = ?
        WHERE id = ?
    """, (new_response_rate, new_accuracy, now_str, pharmacy_id), db_path=db_path)

    return {
        "success": True,
        "ping_id": ping_id,
        "status": clean_reply,
        "updated_at": now_str,
    }
