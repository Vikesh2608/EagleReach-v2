# EagleReach API — runs anywhere that takes a container (Fly.io, Railway, Render,
# Cloud Run, a VPS). Render can also use render.yaml directly without this file.
FROM python:3.12-slim

WORKDIR /app

# Install deps first so layer caching survives code changes.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend ./backend

# Hosts inject $PORT; default to 8000 for local `docker run`.
ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
