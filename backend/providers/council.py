"""City-council lookup by geographic point.

There is no free nationwide source for "who is my city council member", so this
module resolves it city-by-city against each city's own open-data portal. Adding
a city = writing one small async adapter and registering it in ``_ADAPTERS``.

Every adapter takes an ``httpx.AsyncClient`` plus ``lat``/``lon`` and returns a
dict shaped like::

    {
      "city": "Chicago",
      "district_label": "Ward 4",
      "members": [{ "name", "office", "district", "phones", "emails", "urls", "photo_url" }],
      "source": "Chicago Data Portal",
    }

or ``None`` when the point can't be resolved. Callers use :func:`council_for`,
which always returns a dict — with ``supported: false`` and a ``find_url`` when
the city has no adapter.
"""
from __future__ import annotations

from typing import Any, Dict, Optional
from urllib.parse import quote_plus

import httpx

UA = {"User-Agent": "EagleReach/3.0 (contact: vikebairam@gmail.com)"}

# Cities with a working adapter, for display in the UI.
SUPPORTED_CITIES = ["New York City, NY", "Chicago, IL"]


def _search_link(query: str) -> str:
    return f"https://www.google.com/search?q={quote_plus(query)}"


def _flip_name(raw: str) -> str:
    """"La Spata, Daniel" -> "Daniel La Spata"."""
    raw = (raw or "").strip()
    if "," in raw:
        last, first = (p.strip() for p in raw.split(",", 1))
        return f"{first} {last}".strip()
    return raw


def _unwrap_url(v: Any) -> Optional[str]:
    """Socrata URL columns arrive as {"url": "..."} or a bare string."""
    if isinstance(v, dict):
        return v.get("url")
    return v or None


# --------------------------------------------------------------------------- #
# Chicago
# --------------------------------------------------------------------------- #
async def _chicago(client: httpx.AsyncClient, lat: float, lon: float) -> Optional[Dict[str, Any]]:
    boundary = await client.get(
        "https://data.cityofchicago.org/resource/k9yb-bpqx.json",
        params={"$where": f"intersects(the_geom,'POINT({lon} {lat})')", "$select": "ward"},
    )
    boundary.raise_for_status()
    rows = boundary.json()
    if not rows:
        return None
    ward = str(rows[0].get("ward") or "").strip()
    if not ward:
        return None

    who = await client.get(
        "https://data.cityofchicago.org/resource/htai-wnw4.json",
        params={"ward": ward},
    )
    who.raise_for_status()
    people = who.json()
    if not people:
        return None
    m = people[0]
    return {
        "city": "Chicago",
        "district_label": f"Ward {ward}",
        "members": [
            {
                "name": _flip_name(m.get("alderman", "")),
                "office": "Alderman",
                "district": ward,
                "phones": [m["ward_phone"]] if m.get("ward_phone") else [],
                "emails": [m["email"]] if m.get("email") else [],
                "urls": [u for u in [_unwrap_url(m.get("website"))] if u],
                "photo_url": _unwrap_url(m.get("photo_link")),
            }
        ],
        "source": "Chicago Data Portal",
    }


# --------------------------------------------------------------------------- #
# New York City
# --------------------------------------------------------------------------- #
async def _nyc(client: httpx.AsyncClient, lat: float, lon: float) -> Optional[Dict[str, Any]]:
    boundary = await client.get(
        "https://data.cityofnewyork.us/resource/872g-cjhh.json",
        params={"$where": f"intersects(the_geom,'POINT({lon} {lat})')", "$select": "coundist"},
    )
    boundary.raise_for_status()
    rows = boundary.json()
    if not rows:
        return None
    dist = str(rows[0].get("coundist") or "").strip().lstrip("0")
    if not dist:
        return None

    who = await client.get(
        "https://data.cityofnewyork.us/resource/uvw5-9znb.json",
        params={"district": dist},
    )
    who.raise_for_status()
    people = who.json()
    name = people[0].get("name") if people else None
    if not name:
        return None
    return {
        "city": "New York City",
        "district_label": f"Council District {dist}",
        "members": [
            {
                "name": name,
                "office": "City Council Member",
                "district": dist,
                "phones": [],
                "emails": [],
                "urls": [f"https://council.nyc.gov/district-{dist}/"],
                "photo_url": None,
            }
        ],
        "source": "NYC Open Data",
    }


# (place, state_abbr) -> adapter
_ADAPTERS = {
    ("new york", "ny"): _nyc,
    ("new york city", "ny"): _nyc,
    ("manhattan", "ny"): _nyc,
    ("brooklyn", "ny"): _nyc,
    ("bronx", "ny"): _nyc,
    ("queens", "ny"): _nyc,
    ("staten island", "ny"): _nyc,
    ("chicago", "il"): _chicago,
}


def _adapter_for(place: str, state_abbr: str):
    return _ADAPTERS.get(((place or "").strip().lower(), (state_abbr or "").strip().lower()))


async def council_for(lat: float, lon: float, place: str, state_abbr: str) -> Dict[str, Any]:
    """Always returns a dict. ``supported`` is False for cities without an adapter."""
    fallback = {
        "supported": False,
        "city": place,
        "members": [],
        "find_url": _search_link(f"{place} {state_abbr} city council district lookup"),
        "supported_cities": SUPPORTED_CITIES,
    }
    adapter = _adapter_for(place, state_abbr)
    if adapter is None:
        return fallback
    try:
        async with httpx.AsyncClient(timeout=15, headers=UA) as client:
            out = await adapter(client, lat, lon)
    except Exception:
        return fallback
    if not out:
        return fallback
    out["supported"] = True
    out["supported_cities"] = SUPPORTED_CITIES
    return out
