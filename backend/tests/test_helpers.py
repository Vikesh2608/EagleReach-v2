"""Offline unit tests for EagleReach backend helpers and no-network routes."""
import datetime as dt

from fastapi.testclient import TestClient

import asyncio

from backend.main import (
    app,
    first_tuesday_after_first_monday,
    normalize_officials,
    state_to_abbr,
    utcnow_iso,
    wmo_label_icon,
    _bill_row,
    _clean_label,
)
from backend.providers.council import _flip_name, _unwrap_url, council_for

client = TestClient(app)


def test_election_day_is_first_tuesday_after_first_monday():
    # Known U.S. general-election dates.
    assert first_tuesday_after_first_monday(2024) == dt.date(2024, 11, 5)
    assert first_tuesday_after_first_monday(2025) == dt.date(2025, 11, 4)
    assert first_tuesday_after_first_monday(2026) == dt.date(2026, 11, 3)
    assert first_tuesday_after_first_monday(2028) == dt.date(2028, 11, 7)


def test_election_day_always_falls_on_a_tuesday():
    for year in range(2024, 2041):
        assert first_tuesday_after_first_monday(year).weekday() == 1  # Tuesday


def test_wmo_label_icon_known_and_unknown():
    assert wmo_label_icon(0) == ("Clear", "☀️")
    assert wmo_label_icon(95)[0] == "Thunderstorm"
    # Unknown codes fall back rather than raising.
    assert wmo_label_icon(9999) == ("Weather", "⛅")


def test_normalize_officials_orders_senator_then_rep_then_mayor():
    rows = [
        {"office": "Mayor"},
        {"office": "United States Representative (CD 5)"},
        {"office": "United States Senator"},
        {"office": "Dogcatcher"},
    ]
    ordered = [r["office"] for r in normalize_officials(rows)]
    assert ordered == [
        "United States Senator",
        "United States Representative (CD 5)",
        "Mayor",
        "Dogcatcher",
    ]


def test_utcnow_iso_shape():
    s = utcnow_iso()
    assert s.endswith("Z")
    # Parses back as an aware datetime.
    parsed = dt.datetime.fromisoformat(s.replace("Z", "+00:00"))
    assert parsed.tzinfo is not None


def test_bill_row_maps_govtrack_shape_defensively():
    row = _bill_row(
        {
            "display_number": "H.R. 1234",
            "title_without_number": "A very important act",
            "current_status_label": "Introduced",
            "current_status_date": "2026-09-04",
            "introduced_date": "2026-09-04",
            "congress": 119,
            "current_chamber": "house",
            "sponsor": {"name": "Rep. Jane Doe [D-CA12]"},
            "sponsor_role": {"party": "Democrat"},
            "link": "https://www.govtrack.us/congress/bills/119/hr1234",
            "is_alive": True,
        }
    )
    assert row["number"] == "H.R. 1234"
    assert row["title"] == "A very important act"
    assert row["sponsor_party"] == "Democrat"
    # Missing fields degrade to None instead of KeyError.
    assert _bill_row({})["title"] is None


def test_root_and_health_routes_need_no_network():
    r = client.get("/")
    assert r.status_code == 200
    body = r.json()
    assert "/bills" in body["endpoints"]
    assert "/local" in body["endpoints"]
    assert body["languages"] == ["en", "es"]

    h = client.get("/health")
    assert h.status_code == 200
    assert h.json()["ok"] is True


def test_state_to_abbr():
    assert state_to_abbr("Illinois") == "IL"
    assert state_to_abbr("new york") == "NY"
    assert state_to_abbr("District of Columbia") == "DC"
    assert state_to_abbr("Nowhere") == ""
    assert state_to_abbr(None) == ""


def test_clean_label_rejects_bare_qids():
    assert _clean_label("Karen Bass") == "Karen Bass"
    assert _clean_label("Q28034971") is None
    assert _clean_label("  ") is None
    assert _clean_label(None) is None
    assert _clean_label("Q4 Media") == "Q4 Media"  # not a bare QID


def test_council_flip_name_and_unwrap():
    assert _flip_name("La Spata, Daniel") == "Daniel La Spata"
    assert _flip_name("Robinson, Lamont J.") == "Lamont J. Robinson"
    assert _flip_name("Someone") == "Someone"
    assert _unwrap_url({"url": "https://x.gov"}) == "https://x.gov"
    assert _unwrap_url("https://y.gov") == "https://y.gov"
    assert _unwrap_url(None) is None


def test_council_for_unsupported_city_returns_fallback():
    out = asyncio.run(council_for(38.5, -99.9, "Hays", "KS"))
    assert out["supported"] is False
    assert out["members"] == []
    assert out["find_url"].startswith("https://www.google.com/search")
    assert "New York City, NY" in out["supported_cities"]


def test_elections_route_localizes(monkeypatch):
    # /elections computes locally, no network.
    en = client.get("/elections?zip=62704").json()
    es = client.get("/elections?zip=62704&lang=es").json()
    assert en["next_federal_iso"] == es["next_federal_iso"]
    assert "de" in es["next_federal"]  # e.g. "3 de noviembre de 2026"
    assert es["notes"] != en["notes"]
