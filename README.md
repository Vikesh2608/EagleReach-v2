# 🦅 EagleReach

**A free, open civic assistant for U.S. residents — in English & Español.**
One tap on your location shows your **mayor**, your **city council member**, and
your **members of Congress** — plus voter info, elections, weather, city 311
updates, news, traffic, and the latest bills in Congress. No sign-in, no
paywalls, no tracking. Free for the community, forever.

- **Live site:** https://vikesh2608.github.io/EagleReach/
- **API:** FastAPI backend (`/docs` for interactive OpenAPI)

---

## What's new in 3.0

| Area | Change |
| --- | --- |
| **One-tap local** | `GET /local?lat=&lon=` — from a coordinate, returns your **mayor** (Wikidata), **city council member** (city open-data portals), and **federal delegation** (GovTrack) in one call. Wired to the site's **"Use my location"** button. |
| **Bilingual** | Full **English / Español** UI with a header toggle (auto-detects `navigator.language`, persists, `?lang=es` shareable). `/elections` and `/voter` return localized strings + `next_federal_iso` for a locale-free countdown. |
| **Mayor, reliably** | Curated Wikidata QIDs for the 30 largest cities + a population-ranked coordinate search elsewhere; bare-QID / stub results are rejected, and an official "office of the mayor" link is always offered. |
| **City council** | Point-in-district lookup for **New York City** and **Chicago** today (`backend/providers/council.py`); every other city gets a "find your council district" deep link. Adding a city = one small adapter. |
| **Redesigned site** | Location-first hero, first-run guide, cards grouped into three sections, per-card retry, a single "service unavailable" banner, skeleton loaders, dark mode, back-to-top, and an accessibility pass (skip link, focus rings, labelled inputs, keyboard star rating, dialog roles). |

### Local-data coverage

| City | Mayor | City council |
| --- | --- | --- |
| New York City | ✅ | ✅ Council District lookup |
| Chicago | ✅ | ✅ Ward / alderman lookup |
| Los Angeles, and ~30 large cities | ✅ (curated) | 🔜 fallback link |
| Everywhere else | best-effort (coordinate search) | fallback link |

> There is no free nationwide source for city-council membership, so it is built
> city-by-city. Contributions welcome — see `backend/providers/council.py`.

---

## What's new in 1.4

| Area | Change |
| --- | --- |
| **New endpoint** | `GET /bills` — recent activity in the U.S. Congress via GovTrack (keyless), with an **"In Congress Now"** card on the site. |
| **New endpoint** | `GET /` — service metadata + endpoint index. |
| **Modernized** | Replaced deprecated `datetime.utcnow()` with timezone-aware UTC timestamps. |
| **Config** | Optional `EXTRA_ALLOWED_ORIGINS` env var to add CORS origins; `localhost:5500` (Live Server) allowed by default. |
| **Repo hygiene** | Added `.gitignore`; removed the committed `venv/`, `__pycache__/`, and `backend/.env` from version control; added `backend/.env.example`. |
| **Tests + CI** | Added a `pytest` suite for pure helpers and no-network routes, plus a GitHub Actions workflow (`.github/workflows/ci.yml`). |
| **Frontend** | New bills card, dynamic footer year, refreshed intro copy. |

> ⚠️ **If you cloned before 1.4:** `backend/.env` was previously tracked. Rotate
> any secret that lived there (e.g. a Census API key) and keep the new
> `backend/.env` untracked — it is now in `.gitignore`.

---

## Architecture

```
frontend (static)          backend (FastAPI)              open-data sources (no keys)
─────────────────          ─────────────────              ──────────────────────────
docs/index.html   ──────▶  backend/main.py       ──────▶  zippopotam.us  (ZIP → lat/lon)
 (GitHub Pages)             /officials /weather           FCC Census Block (district)
                            /voter /elections             GovTrack        (Congress)
                            /city/updates /news           Wikidata SPARQL (mayor)
                            /bills                         Open-Meteo      (weather)
                                                          NYC / Chicago Open Data (311)
```

Everything the backend calls is **public and keyless**.
`backend/providers/free_civic.py` holds an alternate Census-geocoder path for
federal officials.

---

## Quickstart

### Backend

```bash
python -m venv .venv
# Windows:      .venv\Scripts\activate
# macOS/Linux:  source .venv/bin/activate

pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```

Open http://127.0.0.1:8000/docs for the interactive API.

### Frontend

The site is a single static file. Serve `docs/` with any static server:

```bash
python -m http.server 8000 --directory docs
# then open http://127.0.0.1:8000
```

By default the page talks to the deployed API. To point it at a local backend,
edit the `BACKEND` constant near the top of the `<script>` block in
`docs/index.html`.

### Tests

```bash
pip install -r requirements-dev.txt
pytest -q
```

---

## API reference

| Method & path | Purpose |
| --- | --- |
| `GET /` | Service metadata and endpoint index. |
| `GET /health` | Liveness check + backend version + source list. |
| `GET /zipinfo?zip=` | City, state, and coordinates for a ZIP. |
| `GET /local?lat=&lon=&lang=en\|es` | **One-tap local:** mayor, city council member, and federal delegation from a coordinate. |
| `GET /officials?zip=` | U.S. Senators, House Representative, and (best-effort) Mayor. |
| `GET /weather?zip=` | 7-day forecast (Open-Meteo). |
| `GET /voter?zip=&lang=en\|es` | Registration, "how to vote", and election-office links for the state. |
| `GET /elections?zip=&lang=en\|es` | Next federal general-election date (`next_federal_iso` for parsing). |
| `GET /city/updates?zip=&limit=` | Recent 311 service requests (NYC and Chicago today). |
| `GET /news?zip=` | Local and world news links. |
| `GET /bills?limit=&order_by=introduced\|status` | Recent bills in Congress (GovTrack). |

Responses are JSON. Upstream results are cached in-memory (5–60 min) to stay
within the free tiers of the data sources.

---

## Configuration

Copy `backend/.env.example` to `backend/.env` for local overrides. Every
variable is optional — the backend runs with no keys.

| Variable | Effect |
| --- | --- |
| `CENSUS_API_KEY` | Raises rate limits on the Census geocoder used by `free_civic.py`. |
| `EXTRA_ALLOWED_ORIGINS` | Comma-separated extra CORS origins allowed to call the API. |

---

## Deployment

- **API** — Render web service (`render.yaml`):
  `uvicorn backend.main:app --host 0.0.0.0 --port 10000`
- **Site** — GitHub Pages serving `/docs` on `main`.

---

## Roadmap

- City-council adapters for more cities (LA, SF, Seattle, Boston, Austin, Denver…).
- County officials and state legislators (OpenStates).
- Voice interface for accessibility.
- Per-state primary / local election dates from Secretary of State feeds.
- More UI languages.

## Contributing a city's council data

1. Add an `async def _yourcity(client, lat, lon)` adapter in
   `backend/providers/council.py` that resolves the point to a district and
   returns the member(s) — model it on `_chicago` / `_nyc`.
2. Register it in `_ADAPTERS` under `(place_lowercase, state_abbr)`.
3. Add the city to `SUPPORTED_CITIES` and add a test in
   `backend/tests/test_helpers.py`.

---

## Background

EagleReach began as a hackathon project exploring how AI and open government
data could make civic participation "as easy as checking the weather." It has
since been rebuilt around a lean, keyless open-data API so it can run
indefinitely on free infrastructure.

## License

[MIT](LICENSE) — free for anyone to use, run, and build on. © Vikesh Sagar Bairam.
