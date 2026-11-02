from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
from fastapi import HTTPException
import re
import xml.etree.ElementTree as ET
import logging
import time
from typing import Optional

logger = logging.getLogger("eaglereach")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "EagleReach API running"}

LEGISLATORS_URL = "https://unitedstates.github.io/congress-legislators/legislators-current.json"
PHOTO_URL = "https://unitedstates.github.io/images/congress/225x275/{bioguide}.jpg"
CENSUS_URL = "https://geocoding.geo.census.gov/geocoder/geographies/coordinates"
NO_SENATORS = {"DC", "PR", "GU", "VI", "AS", "MP"}
_legislators_cache = {"data": None, "loaded": 0.0}


def load_legislators():
    """Current members of Congress (public-domain dataset), cached for 12 hours."""
    if _legislators_cache["data"] is None or time.time() - _legislators_cache["loaded"] > 12 * 3600:
        res = requests.get(LEGISLATORS_URL, timeout=15)
        res.raise_for_status()
        _legislators_cache["data"] = res.json()
        _legislators_cache["loaded"] = time.time()
    return _legislators_cache["data"]


def congressional_district(lat, lon):
    """House district number for a point, from the U.S. Census Geocoder. 0 = at-large/delegate."""
    res = requests.get(
        CENSUS_URL,
        params={"x": lon, "y": lat, "benchmark": "Public_AR_Current",
                "vintage": "Current_Current", "layers": "all", "format": "json"},
        timeout=12,
    )
    res.raise_for_status()
    geos = res.json().get("result", {}).get("geographies", {})
    for layer, rows in geos.items():
        if "Congressional District" in layer and rows:
            row = rows[0]
            code = next((v for k, v in row.items() if re.fullmatch(r"CD\d+", k)), None)
            if code and str(code).isdigit():
                n = int(code)
                return 0 if n in (0, 98) else n
    return None


def member(person, role):
    term = person["terms"][-1]
    bioguide = person.get("id", {}).get("bioguide")
    name = person["name"].get("official_full") or f'{person["name"]["first"]} {person["name"]["last"]}'
    return {
        "name": name,
        "role": role,
        "party": term.get("party", ""),
        "phone": term.get("phone", ""),
        "link": term.get("url") or term.get("contact_form") or "",
        "photo": PHOTO_URL.format(bioguide=bioguide) if bioguide else "",
    }


def find_members(state, district):
    people = load_legislators()
    senators = [p for p in people if p["terms"][-1]["type"] == "sen" and p["terms"][-1]["state"] == state]
    house = [p for p in people if p["terms"][-1]["type"] == "rep" and p["terms"][-1]["state"] == state]
    out = [member(p, f"U.S. Senator · {state}") for p in senators]
    if len(house) == 1:  # at-large state or delegate (WY, VT, DC, ...)
        p = house[0]
        label = "Delegate" if p["terms"][-1].get("district", 0) == 0 and state in NO_SENATORS else "Representative"
        out.append(member(p, f"U.S. {label} · {state} at-large"))
    elif district is not None:
        out += [member(p, f"U.S. Representative · {state}-{district}")
                for p in house if p["terms"][-1].get("district") == district]
    return out


@app.get("/api/civic")
def civic(zip: str, lat: Optional[float] = None, lon: Optional[float] = None):

    if not re.fullmatch(r"\d{5}", zip):
        raise HTTPException(status_code=400, detail="Enter a valid five-digit U.S. ZIP code")

    try:
        geo_response = requests.get(f"https://api.zippopotam.us/us/{zip}", timeout=10)
        if geo_response.status_code == 404:
            raise HTTPException(status_code=404, detail="ZIP code not found")
        geo_response.raise_for_status()
        geo = geo_response.json()

        place = geo["places"][0]
        city = place["place name"]
        state = place["state abbreviation"]
        zip_lat = float(place["latitude"])
        zip_lon = float(place["longitude"])
    except HTTPException:
        raise
    except (requests.RequestException, ValueError, KeyError, IndexError, TypeError):
        raise HTTPException(status_code=503, detail="Location lookup is temporarily unavailable")

    # Device coordinates (if the visitor shared them) are more precise than the ZIP centre.
    precise = lat is not None and lon is not None and -90 <= lat <= 90 and -180 <= lon <= 180
    point_lat, point_lon = (lat, lon) if precise else (zip_lat, zip_lon)

    district = None
    try:
        district = congressional_district(point_lat, point_lon)
    except (requests.RequestException, ValueError):
        logger.warning("Census district lookup failed for %s", zip)

    reps = []
    try:
        reps = find_members(state, district)
    except (requests.RequestException, ValueError, KeyError):
        logger.warning("Legislator lookup failed for %s", state)

    house_found = any("Representative" in r["role"] or "Delegate" in r["role"] for r in reps)
    if not house_found:
        reps.append({
            "name": "Find your U.S. House Representative",
            "role": "U.S. House · look up by full address",
            "party": "", "phone": "202-225-3121", "photo": "",
            "link": "https://www.house.gov/representatives/find-your-representative",
        })
    if state not in NO_SENATORS and not any("Senator" in r["role"] for r in reps):
        reps.insert(0, {
            "name": f"Find U.S. Senators for {state}", "role": "U.S. Senate",
            "party": "", "phone": "202-224-3121", "photo": "",
            "link": "https://www.senate.gov/senators/senators-contact.htm",
        })
    reps.append({
        "name": f"Local government offices in {city}", "role": "State & local",
        "party": "", "phone": "", "photo": "",
        "link": "https://www.usa.gov/elected-officials",
    })

    return {
        "city": city,
        "state": state,
        "district": district,
        "district_source": "device location" if precise else "ZIP code centre",
        "lat": zip_lat,
        "lon": zip_lon,
        "representatives": reps,
    }


@app.get("/api/news/world")
def world_news():
    try:
        url = "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en"
        res = requests.get(url)
        root = ET.fromstring(res.content)

        return [
            {
                "title": item.find("title").text,
                "link": item.find("link").text
            }
            for item in root.findall(".//item")[:10]
        ]
    except:
        return []


@app.get("/api/news/local")
def local_news(city: str):
    try:
        url = f"https://news.google.com/rss/search?q={city}&hl=en-US&gl=US&ceid=US:en"
        res = requests.get(url)
        root = ET.fromstring(res.content)

        return [
            {
                "title": item.find("title").text,
                "link": item.find("link").text
            }
            for item in root.findall(".//item")[:10]
        ]
    except:
        return []
