# TrendHijack Deployment Runbook (Render Blueprint)

## 1) Deploy the Blueprint
1. Push this repo to GitHub.
2. In Render dashboard, click **New +** (top-right).
3. Click **Blueprint**.
4. Connect/select your GitHub repo.
5. Render detects `render.yaml`; click **Apply** / **Create New Services**.
6. Wait for both services to build:
   - `trendhijack-api`
   - `trendhijack-frontend`

## 2) Backend env vars (`trendhijack-api`)
Set in Render: **Service > Environment**.

Required:
- `TAVILY_API_KEY`
- `REKA_API_KEY`
- `KIE_API_KEY`

Recommended/default:
- `FLASK_ENV=production`

Optional:
- `REKA_API_KEY_FALLBACK`
- `TWITTER_BEARER_TOKEN`
- `YOUTUBE_API_KEY`
- `SMOKE_MODE` (`0` normal, `1` deterministic demo mode)

## 3) Frontend env vars (`trendhijack-frontend`)
Set in Render: **Service > Environment**.

Required:
- `API_BASE`

Value for `API_BASE`:
- Use the backend public URL from `trendhijack-api` (for example: `https://trendhijack-api.onrender.com`).

After setting/changing `API_BASE`, redeploy frontend.

## 4) Validate deployment (copy/paste)
Set backend URL:

```bash
export BACKEND_URL="https://trendhijack-api.onrender.com"
```

Health check:

```bash
curl -s "$BACKEND_URL/api/health" | jq
```

Self-test (imports/functions only, no external API calls):

```bash
curl -s "$BACKEND_URL/api/selftest" | jq
```

SMOKE_MODE test:
1. In Render backend env, set `SMOKE_MODE=1`.
2. Redeploy `trendhijack-api`.
3. Trigger async job:

```bash
curl -s -X POST "$BACKEND_URL/api/generate" \
  -H "Content-Type: application/json" \
  -d '{"brand":"Render","competitor":"Vercel","location":"San Francisco"}' | jq
```

Expected: HTTP `202` with `job_id` and `status: "queued"`.

## 5) 60-second judge demo script
1. Open frontend URL (`trendhijack-frontend`).
2. Click **Demo Preset: Render vs Vercel**.
3. Confirm Backend URL field points to your Render API URL.
4. Click **Run Pipeline**.
5. While it runs, say:
   - "This pipeline discovers trends, analyzes creative direction, and generates a video concept end-to-end."
6. When done, show:
   - **Trend Summary** panel
   - **What we found** counts + source links
   - **Director Brief** JSON
   - **Generated Video** player
   - **Explain** section for transparent pipeline trace
