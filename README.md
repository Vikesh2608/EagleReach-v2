# 🦅 EagleReach

**An open, keyless civic-engagement assistant for U.S. residents.**
One ZIP code unlocks your elected officials, voter information, upcoming
elections, local weather, city 311 updates, news, traffic, and the latest
bills moving through Congress — no sign-in, no paywalls, no tracking.

- **Live site:** https://vikesh2608.github.io/EagleReach/
- **API:** FastAPI backend on Render (`/docs` for interactive OpenAPI)

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
| `GET /officials?zip=` | U.S. Senators, House Representative, and (best-effort) Mayor. |
| `GET /weather?zip=` | 7-day forecast (Open-Meteo). |
| `GET /voter?zip=` | Registration, "how to vote", and election-office links for the state. |
| `GET /elections?zip=` | Next federal general-election date. |
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

- Voice interface for accessibility.
- More cities in `/city/updates` (Los Angeles, Boston, Seattle open data).
- Per-state primary / local election dates from Secretary of State feeds.
- Filter `/bills` by the visitor's own state delegation.

---

## Background

EagleReach began as a hackathon project exploring how AI and open government
data could make civic participation "as easy as checking the weather." It has
since been rebuilt around a lean, keyless open-data API so it can run
indefinitely on free infrastructure.

## License

© EagleReach by Vikesh Sagar Bairam. All rights reserved.
