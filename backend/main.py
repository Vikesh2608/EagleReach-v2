from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import os, httpx, asyncio, datetime as dt, time
from typing import Optional, Dict, Any, Tuple

APP_VERSION = "1.4.0-open-data"

app = FastAPI(
    title="EagleReach Backend (Open Data)",
    version=APP_VERSION,
    description="Keyless civic-data API for EagleReach: officials, weather, voter info, "
                "elections, city 311 feeds, news links, and recent bills in Congress.",
)


def utcnow_iso() -> str:
    """Timezone-aware UTC timestamp, second precision, trailing Z."""
    return (
        dt.datetime.now(dt.timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )


# CORS — built-in origins plus anything in EXTRA_ALLOWED_ORIGINS (comma-separated)
ALLOWED = [
    "https://vikesh2608.github.io",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
]
ALLOWED += [o.strip() for o in os.getenv("EXTRA_ALLOWED_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sources (no keys)
ZIPPOP = "https://api.zippopotam.us/us"
FCC = "https://geo.fcc.gov/api/census/block/find"
GOVTRACK = "https://www.govtrack.us/api/v2"
WIKIDATA_SPARQL = "https://query.wikidata.org/sparql"
OPEN_METEO = "https://api.open-meteo.com/v1/forecast"
NYC311 = "https://data.cityofnewyork.us/resource/erm2-nwe9.json"
CHI311 = "https://data.cityofchicago.org/resource/v6vf-nfxy.json"

UA = {"User-Agent": "EagleReach/1.4 (contact: vikebairam@gmail.com)"}

def _esc(s): return (s or "").strip()

# Simple TTL cache
_cache: Dict[str, Tuple[float, Any]] = {}
def cache_get(key: str):
    v = _cache.get(key)
    if not v: return None
    exp, data = v
    if time.time() > exp:
        _cache.pop(key, None); return None
    return data
def cache_set(key: str, data: Any, ttl: int = 300):
    _cache[key] = (time.time() + ttl, data)

def fallback_search_url(name:str, state_abbr:str, office:str):
    q = f"{name} {state_abbr} {office} official site"
    return f"https://www.google.com/search?q={httpx.QueryParams({'q': q})['q']}"

def first_tuesday_after_first_monday(year:int) -> dt.date:
    d = dt.date(year, 11, 1)
    while d.weekday() != 0:  # Monday=0
        d += dt.timedelta(days=1)
    return d + dt.timedelta(days=1)

def wmo_label_icon(code:int):
    MAP = {
        0: ("Clear", "☀️"),
        1: ("Mainly clear", "🌤️"),
        2: ("Partly cloudy", "⛅"),
        3: ("Overcast", "☁️"),
        45: ("Fog", "🌫️"), 48: ("Depositing rime fog", "🌫️"),
        51: ("Light drizzle", "🌦️"), 53: ("Drizzle", "🌦️"), 55: ("Dense drizzle", "🌧️"),
        56: ("Freezing drizzle", "🌨️"), 57: ("Dense freezing drizzle", "🌨️"),
        61: ("Light rain", "🌦️"), 63: ("Rain", "🌧️"), 65: ("Heavy rain", "🌧️"),
        66: ("Freezing rain", "🌨️"), 67: ("Heavy freezing rain", "🌨️"),
        71: ("Light snow", "🌨️"), 73: ("Snow", "❄️"), 75: ("Heavy snow", "❄️"),
        77: ("Snow grains", "🌨️"),
        80: ("Rain showers", "🌦️"), 81: ("Rain showers", "🌦️"), 82: ("Violent rain showers", "⛈️"),
        85: ("Snow showers", "🌨️"), 86: ("Snow showers", "❄️"),
        95: ("Thunderstorm", "⛈️"), 96: ("Thunderstorm w/ hail", "⛈️"), 99: ("Thunderstorm w/ hail", "⛈️"),
    }
    return MAP.get(code, ("Weather", "⛅"))

@app.get("/")
def root():
    return {
        "service": "EagleReach Backend (Open Data)",
        "version": APP_VERSION,
        "docs": "/docs",
        "endpoints": [
            "/health", "/zipinfo", "/officials", "/weather", "/voter",
            "/city/updates", "/elections", "/news", "/bills",
        ],
    }

@app.get("/health")
def health():
    return {
        "ok": True,
        "backend_version": APP_VERSION,
        "sources": [
            "zippopotam.us", "FCC", "GovTrack", "Wikidata",
            "Open‑Meteo", "NYC 311", "Chicago 311",
        ],
    }

# ---------- ZIP helpers ----------
async def fetch_zip(zip_code:str):
    url = f"{ZIPPOP}/{_esc(zip_code)}"
    ck = f"zip:{zip_code}"
    c = cache_get(ck)
    if c: return c
    async with httpx.AsyncClient(timeout=15, headers=UA) as client:
        r = await client.get(url)
        if r.status_code == 404:
            raise HTTPException(404, f"ZIP {zip_code} not found")
        r.raise_for_status()
        j = r.json()
        place = j["places"][0]
        out = {
            "state_abbr": _esc(place["state abbreviation"]),
            "state_name": _esc(place["state"]),
            "place_name": _esc(place["place name"]),
            "lat": float(place["latitude"]),
            "lon": float(place["longitude"]),
        }
        cache_set(ck, out, 3600)
        return out

@app.get("/zipinfo")
async def zipinfo(zip: str = Query(..., min_length=5, max_length=10)):
    z = await fetch_zip(zip)
    return {"zip": zip, **z}

async def fetch_cd(lat:float, lon:float):
    params = {"latitude": lat, "longitude": lon, "format": "json", "showall": "false"}
    ck = f"cd:{lat:.4f},{lon:.4f}"
    c = cache_get(ck)
    if c: return c
    async with httpx.AsyncClient(timeout=15, headers=UA) as client:
        r = await client.get(FCC, params=params)
        r.raise_for_status()
        j = r.json()
        cd_obj = j.get("CongressionalDistrict")
        num: Optional[str] = None
        if isinstance(cd_obj, dict):
            num = _esc(cd_obj.get("code") or "").lstrip("0") or None
        out = {"district": num}
        cache_set(ck, out, 3600)
        return out

# ---------- Officials ----------
async def fetch_senators(state_abbr:str):
    url = f"{GOVTRACK}/role"
    params = {"current": "true", "role_type": "senator", "state": state_abbr.upper()}
    ck = f"sen:{state_abbr}"
    c = cache_get(ck)
    if c: return c
    async with httpx.AsyncClient(timeout=20, headers=UA) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        j = r.json()
        rows = []
        for it in j.get("objects", []):
            p = it.get("person", {})
            name = p.get("name") or p.get("name_long")
            website = it.get("website") or p.get("link")
            if not website:
                website = fallback_search_url(name, state_abbr, "United States Senator")
            rows.append({
                "name": name,
                "office": "United States Senator",
                "party": it.get("party"),
                "phones": [it.get("phone")] if it.get("phone") else [],
                "emails": [],
                "urls": [website] if website else [],
            })
        cache_set(ck, rows, 3600)
        return rows

async def fetch_rep(state_abbr:str, district: Optional[str]):
    if not district: return []
    url = f"{GOVTRACK}/role"
    params = {"current": "true", "role_type": "representative", "state": state_abbr.upper(), "district": district}
    ck = f"rep:{state_abbr}:{district}"
    c = cache_get(ck)
    if c: return c
    async with httpx.AsyncClient(timeout=20, headers=UA) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        j = r.json()
        rows = []
        for it in j.get("objects", []):
            p = it.get("person", {})
            name = p.get("name") or p.get("name_long")
            website = it.get("website") or p.get("link")
            if not website:
                website = fallback_search_url(name, state_abbr, f"United States Representative CD {district}")
            rows.append({
                "name": name,
                "office": f"United States Representative (CD {district})",
                "party": it.get("party"),
                "phones": [it.get("phone")] if it.get("phone") else [],
                "emails": [],
                "urls": [website] if website else [],
            })
        cache_set(ck, rows, 3600)
        return rows

async def fetch_mayor(place_name:str, state_name:str):
    city = _esc(place_name); st = _esc(state_name)
    if not city or not st: return []
    q = f"""
    SELECT ?personLabel ?website WHERE {{
      ?city rdfs:label "{city}"@en ;
            wdt:P17 wd:Q30 ;
            wdt:P131* ?state ;
            wdt:P31/wdt:P279* wd:Q515 .
      ?state rdfs:label "{st}"@en .
      ?city wdt:P6 ?person .
      OPTIONAL {{ ?person wdt:P856 ?website. }}
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
    }} LIMIT 1
    """
    ck = f"mayor:{city},{st}"
    c = cache_get(ck)
    if c is not None: return c
    async with httpx.AsyncClient(timeout=20, headers={**UA, "Accept":"application/sparql-results+json"}) as client:
        r = await client.get(WIKIDATA_SPARQL, params={"query": q})
        if r.status_code != 200:
            cache_set(ck, [], 600); return []
        j = r.json()
        b = j.get("results", {}).get("bindings", [])
        if not b:
            cache_set(ck, [], 600); return []
        name = b[0].get("personLabel", {}).get("value")
        site = b[0].get("website", {}).get("value")
        url = site or fallback_search_url(name, st, "Mayor")
        if not name:
            cache_set(ck, [], 600); return []
        out = [{
            "name": name,
            "office": "Mayor",
            "party": None,
            "phones": [],
            "emails": [],
            "urls": [url] if url else [],
        }]
        cache_set(ck, out, 3600)
        return out

def normalize_officials(rows):
    def w(row):
        off = (row.get("office") or "").lower()
        if "united states senator" in off: return 0
        if "united states representative" in off: return 1
        if "mayor" in off: return 2
        return 9
    return sorted(rows, key=w)

@app.get("/officials")
async def officials(zip: str = Query(..., min_length=5, max_length=10)):
    z = await fetch_zip(zip)
    state_abbr, state_name, place = z["state_abbr"], z["state_name"], z["place_name"]
    lat, lon = z["lat"], z["lon"]

    cd_task     = asyncio.create_task(fetch_cd(lat, lon))
    senate_task = asyncio.create_task(fetch_senators(state_abbr))
    mayor_task  = asyncio.create_task(fetch_mayor(place, state_name))

    cd = await cd_task
    district = cd.get("district")
    rep_rows  = await fetch_rep(state_abbr, district)
    sen_rows, mayor_rows = await asyncio.gather(senate_task, mayor_task)

    rows = normalize_officials(sen_rows + rep_rows + mayor_rows)
    return {
        "zip": zip,
        "state": {"abbr": state_abbr, "name": state_name},
        "place": place,
        "location": {"lat": lat, "lon": lon},
        "district": district,
        "officials": rows,
        "generated_at": utcnow_iso(),
        "sources": {
            "zip": "zippopotam.us",
            "district": "FCC Census Block",
            "congress": "GovTrack",
            "mayor": "Wikidata (best‑effort, with search fallback)"
        }
    }

# ---------- Weather ----------
@app.get("/weather")
async def weather(zip: str):
    z = await fetch_zip(zip)
    lat, lon = z["lat"], z["lon"]
    params = {
        "latitude": lat, "longitude": lon,
        "daily": "weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
        "forecast_days": 7,
        "timezone": "auto",
    }
    async with httpx.AsyncClient(timeout=15, headers=UA) as client:
        r = await client.get(OPEN_METEO, params=params)
        r.raise_for_status()
        j = r.json()
    daily = j.get("daily", {})
    out = []
    for i, t in enumerate(daily.get("time", []) or []):
        code = int((daily.get("weathercode") or [0])[i])
        label, icon = wmo_label_icon(code)
        out.append({
            "date": t,
            "tmax_c": (daily.get("temperature_2m_max") or [None])[i],
            "tmin_c": (daily.get("temperature_2m_min") or [None])[i],
            "precip_pct": (daily.get("precipitation_probability_max") or [0])[i],
            "label": label, "icon": icon
        })
    return {
        "zip": zip,
        "place": z.get("place_name"),
        "state": z.get("state_abbr"),
        "lat": lat, "lon": lon,
        "days": out,
        "updated_at": utcnow_iso(),
        "source": "Open‑Meteo"
    }

# ---------- Voter ----------
@app.get("/voter")
async def voter(zip: str):
    z = await fetch_zip(zip)
    abbr = z["state_abbr"].lower()
    register_url = f"https://www.vote.gov/register/{abbr}/"
    howto_url = "https://www.vote.gov/how-to-vote/"
    polling_url = "https://www.usa.gov/election-office"
    return {
        "zip": zip,
        "state": z["state_name"],
        "register_url": register_url,
        "howto_url": howto_url,
        "polling_url": polling_url
    }

# ---------- City updates (NYC & Chicago) ----------
@app.get("/city/updates")
async def city_updates(zip: str, limit: int = 8):
    z = await fetch_zip(zip)
    place = (z["place_name"] or "").lower()
    state = z["state_abbr"].upper()
    out = []; source = None
    try:
        async with httpx.AsyncClient(timeout=15, headers=UA) as client:
            if state == "NY" and place in {"new york", "new york city", "manhattan", "brooklyn", "bronx", "queens", "staten island"}:
                params = {"$limit": str(limit), "$order": "created_date DESC", "incident_zip": zip}
                r = await client.get(NYC311, params=params)
                if r.status_code == 200:
                    for it in r.json():
                        out.append({
                            "type": it.get("complaint_type"),
                            "detail": it.get("descriptor"),
                            "status": it.get("status"),
                            "address": it.get("incident_address"),
                            "created": it.get("created_date"),
                        })
                    source = "NYC Open Data (311 service requests)"
            elif state == "IL" and "chicago" in place:
                params = {"$limit": str(limit), "$order": "creation_date DESC", "zip_code": zip}
                r = await client.get(CHI311, params=params)
                if r.status_code == 200:
                    for it in r.json():
                        out.append({
                            "type": it.get("service_request_type"),
                            "detail": it.get("status"),
                            "status": it.get("status"),
                            "address": it.get("street_address"),
                            "created": it.get("creation_date"),
                        })
                    source = "Chicago Open Data (311 service requests)"
    except Exception:
        pass
    return {"zip": zip, "items": out[:limit], "count": len(out), "source": source}

# ---------- Elections ----------
@app.get("/elections")
async def elections(zip: str):
    today = dt.date.today()
    this_year = first_tuesday_after_first_monday(today.year)
    next_date = this_year if this_year >= today else first_tuesday_after_first_monday(today.year + 1)
    notes = "State primary dates coming soon (open data, state SoS sources)."
    # strftime portable for Windows: avoid %-d
    pretty = next_date.strftime("%B %d, %Y").replace(" 0", " ")
    return {"zip": zip, "next_federal": pretty, "notes": notes}

# ---------- News ----------
@app.get("/news")
async def news(zip: str):
    q = httpx.QueryParams({"q": f"{zip} news"})["q"]
    local_url = f"https://news.google.com/search?hl=en-US&gl=US&ceid=US:en&q={q}"
    world_url = "https://news.google.com/topstories?hl=en-US&gl=US&ceid=US:en"
    return {"zip": zip, "local_url": local_url, "world_url": world_url}

# ---------- Bills in Congress ----------
def _bill_row(it: Dict[str, Any]) -> Dict[str, Any]:
    sponsor = it.get("sponsor") or {}
    return {
        "number": it.get("display_number") or it.get("number"),
        "title": it.get("title_without_number") or it.get("title"),
        "status": it.get("current_status_label") or it.get("current_status"),
        "status_date": it.get("current_status_date"),
        "introduced_date": it.get("introduced_date"),
        "congress": it.get("congress"),
        "chamber": it.get("current_chamber"),
        "sponsor": sponsor.get("name"),
        "sponsor_party": (it.get("sponsor_role") or {}).get("party"),
        "link": it.get("link"),
        "is_alive": it.get("is_alive"),
    }


@app.get("/bills")
async def bills(
    limit: int = Query(8, ge=1, le=25),
    order_by: str = Query("introduced", pattern="^(introduced|status)$"),
):
    """Recent activity in the U.S. Congress (GovTrack, keyless)."""
    sort = "-introduced_date" if order_by == "introduced" else "-current_status_date"
    ck = f"bills:{order_by}:{limit}"
    cached = cache_get(ck)
    if cached is not None:
        return cached
    params = {"sort": sort, "limit": str(limit), "fields": ",".join([
        "display_number", "number", "title", "title_without_number",
        "current_status", "current_status_label", "current_status_date",
        "introduced_date", "congress", "current_chamber", "sponsor",
        "sponsor_role", "link", "is_alive",
    ])}
    try:
        async with httpx.AsyncClient(timeout=20, headers=UA) as client:
            r = await client.get(f"{GOVTRACK}/bill", params=params)
            r.raise_for_status()
            objs = r.json().get("objects", []) or []
    except Exception:
        objs = []
    out = {
        "items": [_bill_row(it) for it in objs],
        "count": len(objs),
        "order_by": order_by,
        "updated_at": utcnow_iso(),
        "source": "GovTrack",
        "browse_url": "https://www.govtrack.us/congress/bills/browse",
    }
    if objs:
        cache_set(ck, out, 900)
    return out
