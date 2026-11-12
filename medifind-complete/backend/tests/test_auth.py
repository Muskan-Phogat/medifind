import pytest
from starlette.testclient import TestClient
from app.db import query_one


def test_pharmacy_login_success_and_failure(client: TestClient):
    """
    Tests PIN authentication:
    - Success with 1234 returns JWT Bearer token
    - Failure with 9999 returns 401 Unauthorized
    """
    # 1. Success
    success_resp = client.post("/api/pharmacy/login", json={"pharmacy_id": 1, "pin": "1234"})
    assert success_resp.status_code == 200
    data = success_resp.json()
    assert "token" in data
    assert data["token_type"] == "bearer"
    assert data["pharmacy"]["id"] == 1

    # 2. Failure with wrong PIN
    fail_resp = client.post("/api/pharmacy/login", json={"pharmacy_id": 1, "pin": "9999"})
    assert fail_resp.status_code == 401
    err = fail_resp.json()["error"]
    assert err["code"] == "INVALID_CREDENTIALS"

    # 3. Failure with nonexistent pharmacy
    notfound_resp = client.post("/api/pharmacy/login", json={"pharmacy_id": 999, "pin": "1234"})
    assert notfound_resp.status_code == 401


def test_protected_dashboard_and_inventory_update(client: TestClient, setup_test_database):
    """
    Tests JWT-protected routes:
    - 401 without Bearer header
    - 403 when attempting to access another pharmacy's dashboard
    - 200 with valid JWT
    - PUT inventory updates stock with source='manual'
    """
    # Login as pharmacy 1
    login_resp = client.post("/api/pharmacy/login", json={"pharmacy_id": 1, "pin": "1234"})
    token = login_resp.json()["token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # 1. Access dashboard without auth -> 401
    unauth_resp = client.get("/api/pharmacy/1/dashboard")
    assert unauth_resp.status_code == 401

    # 2. Access dashboard with valid auth -> 200
    dash_resp = client.get("/api/pharmacy/1/dashboard", headers=auth_headers)
    assert dash_resp.status_code == 200
    dash_data = dash_resp.json()
    assert "pending_pings" in dash_data
    assert "active_reservations" in dash_data
    assert "inventory" in dash_data
    assert "unmet_demand" in dash_data

    # 3. Access another store's dashboard (id=2) -> 403
    forbidden_resp = client.get("/api/pharmacy/2/dashboard", headers=auth_headers)
    assert forbidden_resp.status_code == 403
    assert forbidden_resp.json()["error"]["code"] == "FORBIDDEN"

    # 4. Update Inventory
    inv_update_resp = client.put(
        "/api/pharmacy/1/inventory",
        headers=auth_headers,
        json={"medicine_id": 1, "status": "in_stock", "price": 28.50, "stock_quantity": 25}
    )
    assert inv_update_resp.status_code == 200
    assert inv_update_resp.json()["status"] == "in_stock"
    assert inv_update_resp.json()["price"] == 28.50

    # Verify directly in SQLite
    inv = query_one(
        "SELECT status, price, source FROM inventory WHERE pharmacy_id = 1 AND medicine_id = 1",
        db_path=setup_test_database
    )
    assert inv["status"] == "in_stock"
    assert inv["price"] == 28.50
    assert inv["source"] == "manual"
