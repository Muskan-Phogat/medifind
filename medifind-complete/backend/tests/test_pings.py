import pytest
from starlette.testclient import TestClient
from app.db import query_one


def test_auto_ping_flow_and_inventory_update(client: TestClient, setup_test_database):
    """
    Tests complete Auto-Ping flow:
    1. Search for a medicine
    2. Trigger auto-ping on stale results
    3. Poll batch status
    4. Pharmacist replies 'yes'
    5. Verify inventory status updated to 'in_stock', source 'ping', and metrics recalculated.
    """
    # 1. Search
    search_resp = client.get("/api/search?medicine_id=1&lat=26.9124&lng=75.7873&radius_km=10.0")
    assert search_resp.status_code == 200
    search_id = search_resp.json()["search_id"]

    # 2. Trigger Auto-Ping
    ping_resp = client.post(f"/api/search/{search_id}/ping")
    assert ping_resp.status_code == 200
    batch_data = ping_resp.json()
    batch_id = batch_data["batch_id"]
    pings = batch_data["pings"]
    assert len(pings) > 0

    target_ping = pings[0]
    target_ping_id = target_ping["ping_id"]
    target_pharmacy_id = target_ping["pharmacy_id"]

    # 3. Poll batch status
    status_resp = client.get(f"/api/pings/{batch_id}/status")
    assert status_resp.status_code == 200
    statuses = status_resp.json()["statuses"]
    assert len(statuses) == len(pings)
    assert statuses[0]["status"] in ("waiting", "pending")

    # 4. Pharmacist replies 'yes'
    reply_resp = client.post(f"/api/pings/{target_ping_id}/reply", json={"reply": "yes"})
    assert reply_resp.status_code == 200
    assert reply_resp.json()["status"] == "yes"

    # 5. Verify inventory was updated
    inv = query_one("""
        SELECT status, source, stock_quantity FROM inventory
        WHERE pharmacy_id = ? AND medicine_id = 1
    """, (target_pharmacy_id,), db_path=setup_test_database)
    
    assert inv is not None
    assert inv["status"] == "in_stock"
    assert inv["source"] == "ping"

    # 6. Verify pharmacy response rate updated
    pharmacy = query_one("""
        SELECT response_rate, accuracy FROM pharmacies WHERE id = ?
    """, (target_pharmacy_id,), db_path=setup_test_database)
    assert pharmacy["response_rate"] >= 0.50
    assert pharmacy["accuracy"] >= 0.70
