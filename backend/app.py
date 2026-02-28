# NOTE: Hackathon/dev implementation.
# In-memory jobs are process-local and ephemeral. In production, use Redis/DB so
# jobs are shared across workers/instances and survive restarts.

import asyncio
import importlib
import inspect
import logging
import os
import threading
import time
import traceback
import uuid
from datetime import datetime, timezone
from typing import Any

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

import pipeline as pipeline_module
from pipeline import TrendHijackPipeline

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"), override=False)
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("trendhijack")

app = Flask(__name__)
CORS(app)

PIPELINE_RUNNER = TrendHijackPipeline()


# Load expected env vars (do not log values)
TAVILY_API_KEY = os.environ.get("TAVILY_API_KEY", "")
REKA_API_KEY = os.environ.get("REKA_API_KEY", "")
KIE_API_KEY = os.environ.get("KIE_API_KEY", "")
TWITTER_BEARER_TOKEN = os.environ.get("TWITTER_BEARER_TOKEN", "")
YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "")
PORT = int(os.environ.get("PORT", "5050"))
FLASK_ENV = os.environ.get("FLASK_ENV", "production")
DEBUG_MODE = FLASK_ENV == "development"
SMOKE_MODE = os.environ.get("SMOKE_MODE", "0") == "1"

SERVICES = {
    "tavily": bool(TAVILY_API_KEY.strip()),
    "reka": bool(REKA_API_KEY.strip()),
    "kling": bool(KIE_API_KEY.strip()),
    "twitter": bool(TWITTER_BEARER_TOKEN.strip()),
}

if not TAVILY_API_KEY.strip() and not REKA_API_KEY.strip() and not KIE_API_KEY.strip():
    logger.warning("Keys not loaded. Create backend/.env from .env.example and fill keys.")

logger.info(
    "Services enabled - Tavily: %s, Reka: %s, Kling: %s, Twitter: %s",
    "yes" if SERVICES["tavily"] else "no",
    "yes" if SERVICES["reka"] else "no",
    "yes" if SERVICES["kling"] else "no",
    "yes" if SERVICES["twitter"] else "no",
)

JOBS: dict[str, dict[str, Any]] = {}
JOBS_LOCK = threading.Lock()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _create_job(input_dict: dict[str, Any]) -> str:
    job_id = str(uuid.uuid4())
    job_obj = {
        "id": job_id,
        "status": "queued",
        "created_at": _now_iso(),
        "updated_at": _now_iso(),
        "input": input_dict,
        "progress": {
            "step": "QUEUED",
            "percent": 0,
            "message": "Job accepted and queued",
        },
        "result": None,
        "error": None,
    }
    with JOBS_LOCK:
        JOBS[job_id] = job_obj
    return job_id


def _set_job_state(
    job_id: str,
    status: str,
    result: dict[str, Any] | None = None,
    error: str | None = None,
    progress: dict[str, Any] | None = None,
) -> None:
    with JOBS_LOCK:
        job = JOBS.get(job_id)
        if not job:
            return
        job["status"] = status
        job["updated_at"] = _now_iso()
        if progress is not None:
            job["progress"] = progress
        if result is not None:
            job["result"] = result
        if error is not None:
            job["error"] = error


def _get_job(job_id: str) -> dict[str, Any] | None:
    with JOBS_LOCK:
        job = JOBS.get(job_id)
        return dict(job) if job else None


def _sanitize_result(payload: Any) -> Any:
    exact_sensitive_keys = {
        "api_key",
        "apikey",
        "token",
        "access_token",
        "refresh_token",
        "secret",
        "client_secret",
        "authorization",
        "bearer",
        "password",
        "private_key",
    }

    def _is_sensitive_key(key: str) -> bool:
        key_l = str(key).strip().lower()
        if key_l in exact_sensitive_keys:
            return True
        if key_l.endswith(("_api_key", "_apikey", "_token", "_secret", "_password")):
            return True
        if "authorization" in key_l or "bearer" in key_l:
            return True
        return False

    if isinstance(payload, dict):
        cleaned: dict[str, Any] = {}
        for key, value in payload.items():
            if _is_sensitive_key(str(key)):
                continue
            cleaned[key] = _sanitize_result(value)
        return cleaned

    if isinstance(payload, list):
        return [_sanitize_result(item) for item in payload]

    if isinstance(payload, str):
        if "bearer " in payload.strip().lower():
            return "[REDACTED]"
        return payload

    return payload


def _validate_generate_body(body: dict[str, Any]) -> tuple[dict[str, str] | None, str | None]:
    brand = str(body.get("brand", "")).strip()
    competitor = str(body.get("competitor", "")).strip()
    location = str(body.get("location", "")).strip()

    if not brand:
        return None, "missing brand"
    if not competitor:
        return None, "missing competitor"
    if not location:
        return None, "missing location"

    return {
        "brand": brand,
        "competitor": competitor,
        "location": location,
    }, None


def _supports_on_progress(func: Any) -> bool:
    try:
        signature = inspect.signature(func)
    except Exception:
        return False
    return "on_progress" in signature.parameters


def _pipeline_supports_progress_callback() -> bool:
    runner_func = getattr(pipeline_module, "run_pipeline", None)
    if callable(runner_func):
        return _supports_on_progress(runner_func)

    if hasattr(PIPELINE_RUNNER, "run_pipeline"):
        return _supports_on_progress(getattr(PIPELINE_RUNNER, "run_pipeline"))

    if hasattr(PIPELINE_RUNNER, "run"):
        return _supports_on_progress(getattr(PIPELINE_RUNNER, "run"))

    return False


def _invoke_pipeline(
    brand: str,
    competitor: str,
    location: str,
    on_progress: Any | None = None,
) -> tuple[dict[str, Any], bool]:
    runner_func = getattr(pipeline_module, "run_pipeline", None)
    callback_supported = False

    if callable(runner_func):
        if _supports_on_progress(runner_func):
            callback_supported = True
            output = runner_func(brand, competitor, location, on_progress=on_progress)
        else:
            output = runner_func(brand, competitor, location)
        if asyncio.iscoroutine(output):
            output = asyncio.run(output)
    elif hasattr(PIPELINE_RUNNER, "run_pipeline"):
        runner_method = getattr(PIPELINE_RUNNER, "run_pipeline")
        if _supports_on_progress(runner_method):
            callback_supported = True
            output = runner_method(brand, competitor, location, on_progress=on_progress)
        else:
            output = runner_method(brand, competitor, location)
        if asyncio.iscoroutine(output):
            output = asyncio.run(output)
    elif hasattr(PIPELINE_RUNNER, "run"):
        # Fallback for current class shape in this repo.
        # Pipeline currently takes competitor query and can read defaults from env.
        runner_method = getattr(PIPELINE_RUNNER, "run")
        if _supports_on_progress(runner_method):
            callback_supported = True
            output = asyncio.run(runner_method(query=competitor, on_progress=on_progress))
        else:
            output = asyncio.run(runner_method(query=competitor))
    else:
        raise RuntimeError("Pipeline runner does not expose run_pipeline or run")

    if not isinstance(output, dict):
        output = {"output": output}

    # Ensure request context fields are present in output
    output["brand"] = output.get("brand", brand)
    output["competitor"] = output.get("competitor", competitor)
    output["location"] = output.get("location", location)

    return output, callback_supported


def _run_pipeline_job(job_id: str) -> None:
    job = _get_job(job_id)
    if not job:
        logger.error("Job %s not found in store", job_id)
        return

    input_data = job.get("input", {})
    brand = str(input_data.get("brand", ""))
    competitor = str(input_data.get("competitor", ""))
    location = str(input_data.get("location", ""))

    logger.info("Job %s starting (brand=%s, competitor=%s, location=%s)", job_id, brand, competitor, location)

    _set_job_state(
        job_id,
        "running",
        progress={
            "step": "STEP 1 — discovery",
            "percent": 10,
            "message": "Discovering trends across sources",
        },
    )

    result_holder: dict[str, Any] = {}
    error_holder: dict[str, str] = {}
    done_event = threading.Event()
    callback_enabled = _pipeline_supports_progress_callback()

    def _progress_callback(step: str, percent: int, message: str) -> None:
        _set_job_state(
            job_id,
            "running",
            progress={
                "step": step,
                "percent": percent,
                "message": message,
            },
        )

    def _worker() -> None:
        try:
            output, _ = _invoke_pipeline(
                brand,
                competitor,
                location,
                on_progress=_progress_callback,
            )
            result_holder["output"] = output
        except Exception as exc:
            error_holder["message"] = str(exc)
            error_holder["trace"] = traceback.format_exc(limit=8)
        finally:
            done_event.set()

    worker_thread = threading.Thread(target=_worker, daemon=True)
    worker_thread.start()

    max_runtime_seconds = 12 * 60
    start_ts = time.time()

    # Approximate progress for long jobs so clients can show movement.
    staged_progress = [
        (0, "STEP 1 — discovery", 10, "Discovery in progress"),
        (120, "STEP 2 — analysis", 40, "Analyzing source media"),
        (300, "STEP 3 — prompt generation", 70, "Building director brief and prompt"),
        (480, "STEP 4 — generation", 95, "Generating final video"),
    ]

    stage_index = 0

    while not done_event.wait(timeout=2):
        elapsed = time.time() - start_ts

        if elapsed >= max_runtime_seconds:
            logger.error("Job %s timed out after %.1fs", job_id, elapsed)
            _set_job_state(
                job_id,
                "error",
                error="timeout",
                progress={
                    "step": "TIMEOUT",
                    "percent": 100,
                    "message": "Job exceeded max runtime (12 minutes)",
                },
            )
            return

        if not callback_enabled:
            while stage_index + 1 < len(staged_progress) and elapsed >= staged_progress[stage_index + 1][0]:
                stage_index += 1
                _, step_name, percent, message = staged_progress[stage_index]
                _set_job_state(
                    job_id,
                    "running",
                    progress={
                        "step": step_name,
                        "percent": percent,
                        "message": message,
                    },
                )

    if "message" in error_holder:
        logger.error("Job %s failed: %s", job_id, error_holder["message"])
        logger.error("Job %s traceback: %s", job_id, error_holder.get("trace", ""))
        _set_job_state(
            job_id,
            "error",
            error=error_holder["message"],
            progress={
                "step": "ERROR",
                "percent": 100,
                "message": "Pipeline execution failed",
            },
        )
        return

    output = result_holder.get("output")
    safe_output = _sanitize_result(output)

    _set_job_state(
        job_id,
        "done",
        result=safe_output,
        progress={
            "step": "COMPLETE",
            "percent": 100,
            "message": "Pipeline finished successfully",
        },
    )
    logger.info("Job %s completed", job_id)


@app.before_request
def _log_request() -> None:
    logger.info("Request %s %s at %s", request.method, request.path, _now_iso())


@app.get("/api/health")
def health() -> Any:
    return jsonify(
        {
            "status": "ok",
            "timestamp": _now_iso(),
            "smoke_mode": SMOKE_MODE,
            "services": {
                "tavily": SERVICES["tavily"],
                "reka": SERVICES["reka"],
                "kling": SERVICES["kling"],
                "twitter": SERVICES["twitter"],
            },
        }
    )


@app.get("/api/models")
def models() -> Any:
    return jsonify({"reka": "reka-flash", "kling": "kling-3.0/video", "tavily": "search"})


@app.get("/api/test-keys")
def test_keys() -> Any:
    return jsonify(
        {
            "tavily": SERVICES["tavily"],
            "reka": SERVICES["reka"],
            "kling": SERVICES["kling"],
            "twitter": SERVICES["twitter"],
        }
    )


@app.get("/api/selftest")
def selftest() -> Any:
    checks: dict[str, Any] = {}
    failures: list[str] = []

    def _check(module_name: str, attr_name: str, optional: bool = False) -> bool:
        try:
            module = importlib.import_module(module_name)
            exists = hasattr(module, attr_name)
            checks[f"{module_name}.{attr_name}"] = bool(exists)
            if not exists and not optional:
                failures.append(f"{module_name}.{attr_name}")
            return bool(exists)
        except Exception:
            checks[f"{module_name}.{attr_name}"] = False
            if not optional:
                failures.append(f"{module_name}.{attr_name}")
            return False

    _check("pipeline", "run_pipeline")
    _check("tavily_agent", "TavilySocialScout")
    _check("yutori_agent", "YutoriTwitterScout")
    _check("reka_agent", "analyze_video")

    kling_generate_and_poll = _check("kling_agent", "generate_and_poll", optional=True)
    kling_generate_multi_shot = _check("kling_agent", "generate_multi_shot", optional=True)
    kling_ok = kling_generate_and_poll or kling_generate_multi_shot
    checks["kling_agent.required_generation_fn"] = kling_ok
    if not kling_ok:
        failures.append("kling_agent.required_generation_fn")

    status = "ok" if not failures else "error"
    return jsonify(
        {
            "status": status,
            "server_up": True,
            "smoke_mode": SMOKE_MODE,
            "services": {
                "tavily": SERVICES["tavily"],
                "reka": SERVICES["reka"],
                "kling": SERVICES["kling"],
                "twitter": SERVICES["twitter"],
            },
            "checks": checks,
            "missing": sorted(set(failures)),
            "timestamp": _now_iso(),
        }
    )


@app.post("/api/generate")
def generate() -> Any:
    body = request.get_json(silent=True) or {}
    parsed, error = _validate_generate_body(body)
    if error:
        return jsonify({"error": error}), 400

    job_id = _create_job(parsed)
    threading.Thread(target=_run_pipeline_job, args=(job_id,), daemon=True).start()
    return jsonify({"job_id": job_id, "status": "queued"}), 202


@app.get("/api/job/<job_id>")
def get_job(job_id: str) -> Any:
    job = _get_job(job_id)
    if not job:
        return jsonify({"error": "job not found"}), 404
    return jsonify(job)


@app.post("/api/generate_sync")
def generate_sync() -> Any:
    body = request.get_json(silent=True) or {}
    parsed, error = _validate_generate_body(body)
    if error:
        return jsonify({"error": error}), 400

    try:
        output, _ = _invoke_pipeline(parsed["brand"], parsed["competitor"], parsed["location"])
        return jsonify(_sanitize_result(output))
    except Exception as exc:
        logger.error("Sync pipeline failed: %s", exc)
        logger.error("Traceback: %s", traceback.format_exc(limit=5))
        return jsonify({"error": str(exc)}), 500


# Legacy compatibility routes
@app.post("/api/pipeline/run")
def legacy_run() -> Any:
    return generate()


@app.get("/api/pipeline/status/<job_id>")
def legacy_status(job_id: str) -> Any:
    return get_job(job_id)


@app.get("/api/pipeline/jobs")
def legacy_jobs() -> Any:
    with JOBS_LOCK:
        summaries = [
            {"id": j["id"], "status": j["status"], "created_at": j["created_at"]}
            for j in JOBS.values()
        ]
    return jsonify(summaries)


@app.get("/_debug/jobs_clear")
def debug_jobs_clear() -> Any:
    if not DEBUG_MODE:
        return jsonify({"error": "forbidden"}), 403

    with JOBS_LOCK:
        JOBS.clear()
    return jsonify({"status": "cleared", "timestamp": _now_iso()})


# Frontend polling note:
# Poll GET /api/job/<job_id> every 2-3 seconds and handle statuses:
# queued | running | done | error

if __name__ == "__main__":
    debug_enabled = os.environ.get("FLASK_ENV") == "development"
    selected_port = int(os.environ.get("PORT", 5050))
    logger.info(
        "Startup config - FLASK_ENV=%s, selected_port=%s, fallback_ports_enabled=%s",
        FLASK_ENV,
        selected_port,
        True,
    )
    fallback_ports = [5050, 5051, 5052, 5053]
    port_candidates = [selected_port] + [p for p in fallback_ports if p != selected_port]

    last_error: OSError | None = None
    for idx, candidate in enumerate(port_candidates):
        logger.info("Attempting to bind on port %s", candidate)
        try:
            app.run(host="0.0.0.0", port=int(candidate), debug=debug_enabled)
            break
        except OSError as exc:
            last_error = exc
            if "Address already in use" in str(exc) and idx < len(port_candidates) - 1:
                logger.warning("Port %s in use, trying next", candidate)
                continue
            raise

    if last_error and "Address already in use" in str(last_error):
        raise last_error
