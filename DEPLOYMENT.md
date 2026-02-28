# TrendHijack Render Deployment (10-Minute Runbook)

## 1) Deploy Blueprint (Render Dashboard)
1. Push this repo to GitHub.
2. In Render click **New +**.
3. Click **Blueprint**.
4. Select your repo (Render reads `render.yaml`).
5. Click **Apply** / **Create New Services**.
6. Wait for both services:
   - `trendhijack-api` (backend)
   - `trendhijack-frontend` (UI)

## 2) Set Backend Env Vars (`trendhijack-api`)
Render -> `trendhijack-api` -> **Environment**.

Required:
- `TAVILY_API_KEY`
- `REKA_API_KEY`
- `KIE_API_KEY`

Optional:
- `TWITTER_BEARER_TOKEN`
- `YOUTUBE_API_KEY`
- `REKA_API_KEY_FALLBACK`
- `SMOKE_MODE` (`1` for deterministic demo mode)

Recommended:
- `FLASK_ENV=production`

## 3) Set Frontend Env Vars (`trendhijack-frontend`)
Render -> `trendhijack-frontend` -> **Environment**.

Required:
- `API_BASE`

Value:
- Set to backend public URL, for example:
  - `https://trendhijack-api.onrender.com`

Then **Redeploy `trendhijack-frontend`**.

## 4) Validate Deployment
Set your backend URL:

```bash
export BACKEND_URL="https://trendhijack-api.onrender.com"
```

Health:

```bash
curl -s "$BACKEND_URL/api/health" | jq
```

Self-test:

```bash
curl -s "$BACKEND_URL/api/selftest" | jq
```

SMOKE_MODE demo run:
1. Set `SMOKE_MODE=1` on backend env.
2. Redeploy backend.
3. Start async job:

```bash
curl -s -X POST "$BACKEND_URL/api/generate" \
  -H "Content-Type: application/json" \
  -d '{"brand":"Render","competitor":"Vercel","location":"San Francisco"}' | jq
```

Expected: `202` with `job_id` and `status: "queued"`.

## 5) Quick UI Verification
1. Open frontend URL: `https://<your-frontend>.onrender.com`
2. Click **Demo Preset: Render vs Vercel**
3. Click **Run Pipeline**
4. Confirm status progresses to `done` and results render.

## Common Render Failures
- Wrong `API_BASE`:
  - Symptom: UI says backend health check failed.
  - Fix: set frontend `API_BASE` to backend URL and redeploy frontend.
- Backend not binding `$PORT`:
  - Symptom: backend fails to boot.
  - Fix: backend starts with gunicorn `--bind 0.0.0.0:$PORT` (already configured).
- CORS blocked:
  - Symptom: browser fetch errors.
  - Fix: backend CORS is enabled globally in Flask app; ensure requests target correct backend URL.
- Multi-worker job loss:
  - Symptom: job IDs disappear during polling.
  - Fix: backend runs `--workers 1` (in-memory jobs are process-local).
- Missing env vars:
  - Symptom: pipeline fails in normal mode.
  - Fix: set required backend keys, or run with `SMOKE_MODE=1` for demo.
