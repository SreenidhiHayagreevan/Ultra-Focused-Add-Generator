# TrendHijack

> WARNING
> - Never commit `.env`.
> - `.env.example` must never contain real keys.
> - Rotate keys immediately if they were ever committed.

AI-powered viral content generation pipeline with a Flask backend and static dashboard frontend.

## Project Structure

```text
trendhijack/
  backend/
    app.py
    tavily_agent.py
    yutori_agent.py
    reka_agent.py
    kling_agent.py
    pipeline.py
    config.py
    requirements.txt
    Dockerfile
  frontend/
    index.html
    styles.css
    config.js
    app.js
    Dockerfile
  .env.example
  render.yaml
  README.md
```

## Environment Setup

Create `backend/.env` from `.env.example` (not repo root):

```bash
cd trendhijack/backend
cp ../.env.example .env
```

Fill keys in `backend/.env` and never commit this file.

### Demo Without Keys

Set `SMOKE_MODE=1` in `backend/.env` to run a deterministic no-network demo.

## Local Run

### 1) Backend

```bash
cd trendhijack/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Backend uses `PORT` from env with default `5050`.
In local `__main__` mode, if the selected port is busy it tries: `5051`, `5052`, `5053`.

### 2) Frontend

```bash
cd trendhijack/frontend
python3 -m http.server 3000
```

Frontend runs at `http://localhost:3000`.
For local backend, use `http://localhost:5050`.

## Quick Demo Inputs (15s)

- `brand=Render`
- `competitor=Vercel`
- `location=San Francisco`

## API Endpoints

- `GET /api/health`
  - Returns service availability and `smoke_mode`.

- `GET /api/selftest`
  - Local import/function self-test only.
  - Does not call external APIs.

- `POST /api/generate`
  - Body:
    ```json
    { "brand": "Render", "competitor": "Vercel", "location": "San Francisco" }
    ```
  - Response: `202 Accepted`
    ```json
    { "job_id": "...", "status": "queued" }
    ```

- `GET /api/job/<job_id>`
  - Returns full job object including:
    - `status`: `queued | running | done | error`
    - `progress`: `{ step, percent, message }`
    - `result` or `error`

- `POST /api/generate_sync`
  - Body: same as `/api/generate`
  - Response: direct pipeline result on success, or `500` on failure.

- Legacy compatibility aliases:
  - `POST /api/pipeline/run` -> alias of `POST /api/generate`
  - `GET /api/pipeline/status/<job_id>` -> alias of `GET /api/job/<job_id>`
  - `GET /api/pipeline/jobs` -> job summaries (`id`, `status`, `created_at`)

## Render Deployment (2 Services)

This repo includes a Render Blueprint in `render.yaml`:

1. `trendhijack-api` (Flask backend via Docker)
2. `trendhijack-frontend` (dashboard via Docker)

### Exact Render Steps

1. Deploy the Blueprint from this repo (`render.yaml`).
2. Copy the deployed backend URL from the `trendhijack-api` service.
3. Set `trendhijack-frontend` env var `API_BASE` to that backend URL.
4. Redeploy `trendhijack-frontend` so `config.js` gets updated.

## Render Runtime Notes

- Backend container binds `0.0.0.0:$PORT` via gunicorn.
- Backend gunicorn stays at `--workers 1` to keep in-memory job state consistent.
- Frontend container serves static files (`index.html`, `config.js`, `app.js`) with `python -m http.server` on `$PORT`.
- Frontend `API_BASE` injection happens on container startup before serving files.

## Notes

- No database is used; jobs are in-memory per process.
- For production multi-instance/multi-worker reliability, move jobs to Redis or a database.
