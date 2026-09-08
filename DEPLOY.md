# Deploying EagleReach

Two moving parts: a **static site** (`docs/`, on GitHub Pages) and an **API**
(`backend/`, on any Python host). The site is useless without the API, so deploy
the API first.

---

## 1. Deploy the API

### Option A — Render (uses `render.yaml`)

1. Render dashboard → **New → Web Service** → connect this repo.
2. Pick the branch you want to serve.
3. Render reads `render.yaml`:
   - build: `pip install -r requirements.txt`
   - start: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - health check: `/health`
4. Deploy. Note the URL, e.g. `https://eaglereach-api.onrender.com`.

### Option B — Fly.io / Railway / Cloud Run (uses `Dockerfile`)

```bash
# Fly
fly launch --no-deploy      # accept the detected Dockerfile
fly deploy

# Railway
railway init && railway up
```

The container listens on `$PORT` (defaults to 8000 locally).

### Verify

```bash
curl https://YOUR-API/health
curl "https://YOUR-API/local?lat=41.8781&lon=-87.6298"     # Chicago → mayor + ward
```

---

## 2. Point the site at the API

Edit **one line** in [`docs/index.html`](docs/index.html):

```js
const API_DEFAULT = "https://YOUR-API";
```

To test a new backend before committing, just visit the site with
`?api=https://YOUR-API` appended — no edit needed.

---

## 3. CORS

`backend/main.py` already allows `https://vikesh2608.github.io` and
`localhost`. Serving the site from a different origin? Add it via the
`EXTRA_ALLOWED_ORIGINS` env var (comma-separated) — no code change.

---

## 4. Publish the site

GitHub Pages → **Settings → Pages** → Source: your branch, folder `/docs`.
Push, wait ~1 min, load `https://<user>.github.io/<repo>/`.

---

## Local development

```bash
python -m venv .venv && . .venv/Scripts/activate   # or source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn backend.main:app --reload --port 8000       # API at :8000
python -m http.server 8000 --directory docs         # site (separate shell/port)
pytest -q
```
