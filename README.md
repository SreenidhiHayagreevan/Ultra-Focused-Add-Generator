# Ultra-Focused-Add-Generator

Ultra-Focused-Add-Generator is a hackathon-style experimental repository
built around Jupyter notebooks and lightweight web components. It
focuses on rapid prototyping for ultra-targeted AI content generation
and scouting workflows.

------------------------------------------------------------------------

## Repository Structure

### Notebooks

-   `Reka_Ai.ipynb`
-   `Travily_Youtori.ipynb`
-   `multimodal_ai_twitter_scout.ipynb`
-   `realtime_5min_scout.ipynb`

These notebooks contain prototype pipelines for AI-driven generation,
multimodal exploration, and real-time scouting experiments.

### Web Folder

-   `explore-america/`\
    Contains supporting frontend or static web components (if
    applicable).

### TrendHijack (Sparks Project)

AI-powered viral content generation pipeline with a Flask backend and static dashboard frontend.

```text
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
```

------------------------------------------------------------------------

## Getting Started

### 1. Clone the Repository

``` bash
git clone https://github.com/SreenidhiHayagreevan/Ultra-Focused-Add-Generator.git
cd Ultra-Focused-Add-Generator
```

### 2. Create Virtual Environment

``` bash
python -m venv .venv
source .venv/bin/activate   # macOS/Linux
.venv\Scripts\activate    # Windows
```

### 3. Install Dependencies

If a `requirements.txt` file exists:

``` bash
pip install -r requirements.txt
```

Otherwise install minimal dependencies:

``` bash
pip install jupyter ipykernel
```

### 4. Launch Jupyter

``` bash
jupyter notebook
```

Open and run any notebook to begin experimenting.

------------------------------------------------------------------------

## TrendHijack Backend Setup

### Environment Setup

Create `backend/.env` from `.env.example`:

```bash
cd backend
cp ../.env.example .env
```

Fill keys in `backend/.env` and never commit this file.

> WARNING
> - Never commit `.env`.
> - `.env.example` must never contain real keys.
> - Rotate keys immediately if they were ever committed.

### Demo Without Keys

Set `SMOKE_MODE=1` in `backend/.env` to run a deterministic no-network demo.

### Run Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Backend uses `PORT` from env with default `5050`.

### Run Frontend

```bash
cd frontend
python3 -m http.server 3000
```

Frontend runs at `http://localhost:3000`.

### Quick Demo Inputs (15s)

- `brand=Render`
- `competitor=Vercel`
- `location=San Francisco`

### API Endpoints

- `GET /api/health` - Returns service availability and `smoke_mode`.
- `GET /api/selftest` - Local import/function self-test only.
- `POST /api/generate` - Start content generation job
- `GET /api/job/<job_id>` - Get job status and result
- `POST /api/generate_sync` - Synchronous generation

------------------------------------------------------------------------

## Environment Variables (If Required)

Some notebooks may require API keys.

Create a `.env` file:

``` bash
touch .env
```

Example:

``` bash
PROVIDER_API_KEY="your_api_key_here"
```

Do NOT commit your `.env` file.

------------------------------------------------------------------------

## Render Deployment

This repo includes a Render Blueprint in `render.yaml`:

1. `trendhijack-api` (Flask backend via Docker)
2. `trendhijack-frontend` (dashboard via Docker)

See `DEPLOYMENT.md` for detailed deployment instructions.

------------------------------------------------------------------------

## Contributing

Pull requests and improvements are welcome.

------------------------------------------------------------------------

## License

No license is currently specified.
