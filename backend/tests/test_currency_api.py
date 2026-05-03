import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://currency-converter-83.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ---- Currencies ----
class TestCurrencies:
    def test_list_currencies(self, s):
        r = s.get(f"{API}/currencies", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 150, f"expected 150+ got {len(data)}"
        sample = data[0]
        for k in ("code", "name", "country", "symbol"):
            assert k in sample
        codes = {c["code"] for c in data}
        for must in ("USD", "EUR", "INR", "BTN", "JPY"):
            assert must in codes


# ---- Rates ----
class TestRates:
    def test_latest_usd(self, s):
        r = s.get(f"{API}/rates/latest", params={"base": "USD"}, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["base"] == "USD"
        assert isinstance(d["rates"], dict) and len(d["rates"]) > 20
        assert "EUR" in d["rates"]
        assert "updated_at" in d and d["updated_at"]

    def test_latest_eur(self, s):
        r = s.get(f"{API}/rates/latest", params={"base": "EUR"}, timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert d["base"] == "EUR"
        assert "USD" in d["rates"]

    def test_timeseries_usd_eur(self, s):
        r = s.get(f"{API}/rates/timeseries", params={"base": "USD", "target": "EUR", "days": 30}, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["base"] == "USD" and d["target"] == "EUR"
        assert len(d["points"]) >= 2
        assert all("date" in p and "rate" in p for p in d["points"])

    def test_timeseries_fallback_synthesized(self, s):
        # BTN likely unsupported by frankfurter -> should synthesize
        r = s.get(f"{API}/rates/timeseries", params={"base": "USD", "target": "BTN", "days": 30}, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert len(d["points"]) >= 2
        # Should be synthesized since frankfurter doesn't have BTN
        assert d["source"] in ("synthesized", "frankfurter.app")


# ---- History ----
class TestHistory:
    created_id = None

    def test_clear_first(self, s):
        r = s.delete(f"{API}/history", timeout=15)
        assert r.status_code == 200

    def test_add_history(self, s):
        payload = {"from_code": "USD", "to_code": "EUR", "amount": 100.0, "result": 92.5, "rate": 0.925}
        r = s.post(f"{API}/history", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["from_code"] == "USD" and d["to_code"] == "EUR"
        assert d["amount"] == 100.0
        assert "id" in d
        TestHistory.created_id = d["id"]

    def test_list_history_contains(self, s):
        r = s.get(f"{API}/history", timeout=15)
        assert r.status_code == 200
        ids = [e["id"] for e in r.json()]
        assert TestHistory.created_id in ids

    def test_delete_history_entry(self, s):
        r = s.delete(f"{API}/history/{TestHistory.created_id}", timeout=15)
        assert r.status_code == 200
        assert r.json()["deleted"] == 1
        # verify
        r2 = s.get(f"{API}/history", timeout=15)
        ids = [e["id"] for e in r2.json()]
        assert TestHistory.created_id not in ids

    def test_clear_history(self, s):
        s.post(f"{API}/history", json={"from_code": "USD", "to_code": "JPY", "amount": 1, "result": 150, "rate": 150}, timeout=15)
        r = s.delete(f"{API}/history", timeout=15)
        assert r.status_code == 200
        r2 = s.get(f"{API}/history", timeout=15)
        assert r2.json() == []


# ---- Favorites ----
class TestFavorites:
    def test_clear_then_add(self, s):
        # Clean any previous
        for code in ("EUR", "JPY"):
            s.delete(f"{API}/favorites/{code}", timeout=15)
        r = s.post(f"{API}/favorites", json={"code": "EUR"}, timeout=15)
        assert r.status_code == 200
        assert r.json()["code"] == "EUR"

    def test_list_favorites(self, s):
        r = s.get(f"{API}/favorites", timeout=15)
        assert r.status_code == 200
        codes = [f["code"] for f in r.json()]
        assert "EUR" in codes

    def test_add_favorite_invalid(self, s):
        r = s.post(f"{API}/favorites", json={"code": "ZZZ"}, timeout=15)
        assert r.status_code == 400

    def test_delete_favorite(self, s):
        r = s.delete(f"{API}/favorites/EUR", timeout=15)
        assert r.status_code == 200
        r2 = s.get(f"{API}/favorites", timeout=15)
        assert "EUR" not in [f["code"] for f in r2.json()]
