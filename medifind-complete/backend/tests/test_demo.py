import pytest
from starlette.testclient import TestClient


def test_demo_reset_unauthorized(client: TestClient):
    """Attempting to reset without admin key must return 403 Forbidden."""
    resp = client.post("/api/demo/reset", json={"admin_key": "wrong-key"})
    assert resp.status_code == 403
    data = resp.json()
    assert "error" in data
    assert data["error"]["code"] == "FORBIDDEN"


def test_demo_reset_success(client: TestClient):
    """Valid admin key must restore database in under 2000ms."""
    resp = client.post("/api/demo/reset", json={"admin_key": "medifind-demo-secret-2025"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "duration_ms" in data
    assert data["duration_ms"] < 2000.0  # Must restore in under 2 seconds!
