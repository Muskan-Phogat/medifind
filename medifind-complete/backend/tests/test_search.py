import pytest
from starlette.testclient import TestClient


def test_autocomplete_typo_tolerance(client: TestClient):
    """Verifies rapidfuzz matches typos like 'paractamol' to Paracetamol / Calpol."""
    resp = client.get("/api/medicines/suggest?q=paractamol")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) > 0
    # Should find paracetamol drugs
    names = [d["generic_name"].lower() for d in data] + [d["brand_name"].lower() for d in data]
    assert any("paracetamol" in n or "calpol" in n or "dolo" in n for n in names)


def test_search_structure_and_ranking(client: TestClient):
    """
    Verifies search returns structured results with:
    - Stock status
    - Confidence score and label
    - Distance
    - Open now
    And verifies ranking places in_stock above out_of_stock.
    """
    resp = client.get("/api/search?medicine_id=1&lat=26.9124&lng=75.7873&radius_km=10.0")
    assert resp.status_code == 200
    data = resp.json()

    assert "search_id" in data
    assert "medicine" in data
    assert data["medicine"]["id"] == 1
    assert "results" in data
    assert len(data["results"]) > 0

    results = data["results"]
    for r in results:
        assert "pharmacy_name" in r
        assert "stock_status" in r
        assert "confidence_score" in r
        assert "confidence_label" in r
        assert "distance_km" in r
        assert "open_now" in r
        assert "is_stale" in r
        assert r["distance_km"] <= 10.0

    # Verify ranking: any in_stock appears before any out_of_stock
    seen_out_of_stock = False
    for r in results:
        if r["stock_status"] == "out_of_stock":
            seen_out_of_stock = True
        elif seen_out_of_stock and r["stock_status"] == "in_stock":
            pytest.fail("Found in_stock result ranked after an out_of_stock result!")


def test_emergency_mode_boost(client: TestClient):
    """
    Verifies emergency=true boosts open pharmacies over closed ones.
    """
    resp = client.get("/api/search?medicine_id=1&lat=26.9124&lng=75.7873&radius_km=15.0&emergency=true")
    assert resp.status_code == 200
    results = resp.json()["results"]
    assert len(results) > 0
    # Top results should be open if any are open
    has_open = any(r["open_now"] for r in results)
    if has_open:
        assert results[0]["open_now"] is True
