import sqlite3
import pytest
from starlette.testclient import TestClient
from app.db import execute_write


def test_reservation_lifecycle_and_transitions(client: TestClient, setup_test_database):
    """
    Tests 60-minute reservation creation, valid state transitions,
    and 409 Conflict rejection on illegal transitions.
    """
    # 1. Create reservation
    payload = {
        "pharmacy_id": 1,
        "medicine_id": 1,
        "quantity": 2,
        "customer_name": "Rohan Mehra",
        "customer_phone": "+91 98765 12345",
        "notes": "Elderly patient hold"
    }
    create_resp = client.post("/api/reservations", json=payload)
    assert create_resp.status_code == 201
    res_data = create_resp.json()

    res_id = res_data["id"]
    token = res_data["token"]
    assert len(token) == 4
    assert res_data["status"] == "requested"

    # 2. Get reservation
    get_resp = client.get(f"/api/reservations/{res_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == res_id

    # 3. Valid Transition: requested -> accepted
    patch_resp = client.patch(f"/api/reservations/{res_id}", json={"status": "accepted"})
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "accepted"

    # 4. Valid Transition: accepted -> collected
    patch_resp2 = client.patch(f"/api/reservations/{res_id}", json={"status": "collected"})
    assert patch_resp2.status_code == 200
    assert patch_resp2.json()["status"] == "collected"

    # 5. Illegal Transition from terminal state: collected -> cancelled should fail with 409 Conflict
    illegal_resp = client.patch(f"/api/reservations/{res_id}", json={"status": "cancelled"})
    assert illegal_resp.status_code == 409
    err = illegal_resp.json()["error"]
    assert err["code"] == "ILLEGAL_TRANSITION"


def test_lazy_reservation_expiry(client: TestClient, setup_test_database):
    """
    Verifies that reading an expired reservation lazily updates its status to 'expired'.
    """
    # Create reservation
    payload = {
        "pharmacy_id": 2,
        "medicine_id": 2,
        "quantity": 1,
        "customer_name": "Anita Roy",
        "customer_phone": "+91 98765 67890"
    }
    create_resp = client.post("/api/reservations", json=payload)
    res_id = create_resp.json()["id"]

    # Manually backdate expires_at in the temporary test database
    execute_write(
        "UPDATE reservations SET expires_at = datetime('now', '-10 minutes') WHERE id = ?",
        (res_id,),
        db_path=setup_test_database
    )

    # Read reservation — lazy check should detect past expiration and update status
    get_resp = client.get(f"/api/reservations/{res_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["status"] == "expired"
