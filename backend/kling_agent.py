import json
import os
import time
from typing import Any

import requests

API_BASE_URL = "https://api.kie.ai/api/v1"


def _get_api_key() -> str:
    api_key = os.environ.get("KIE_API_KEY", "").strip()
    if not api_key:
        raise Exception("Missing KIE_API_KEY environment variable")
    return api_key


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {_get_api_key()}",
        "Content-Type": "application/json",
    }


def _safe_json(response: requests.Response) -> dict[str, Any]:
    try:
        return response.json()
    except Exception as exc:
        raise Exception(f"Invalid JSON response from Kie API: {exc}") from exc


def generate_video(
    prompt: str,
    duration: str = "5",
    mode: str = "std",
    multi_shots: bool = False,
    multi_prompt: list | None = None,
) -> str:
    print("Submitting Kling task...")

    input_payload = {
        "prompt": prompt,
        "sound": False,
        "aspect_ratio": "9:16",
        "duration": duration,
        "mode": mode,
        "multi_shots": multi_shots,
        "multi_prompt": multi_prompt if multi_shots else None,
    }
    input_payload = {k: v for k, v in input_payload.items() if v is not None}

    payload = {
        "model": "kling-3.0/video",
        "input": input_payload,
    }

    try:
        response = requests.post(
            f"{API_BASE_URL}/jobs/createTask",
            headers=_headers(),
            json=payload,
            timeout=60,
        )
    except requests.RequestException as exc:
        raise Exception(f"Kling createTask request failed: {exc}") from exc

    result = _safe_json(response)

    if response.status_code != 200:
        raise Exception(f"Kling createTask HTTP {response.status_code}: {result}")

    if result.get("code") != 200:
        raise Exception(f"Kling createTask failed: {result}")

    data = result.get("data", {}) if isinstance(result.get("data"), dict) else {}
    task_id = data.get("taskId") or data.get("task_id") or result.get("taskId")
    if not task_id:
        raise Exception(f"Kling createTask succeeded but taskId missing: {result}")

    return str(task_id)


def poll_video(task_id: str, interval: int = 15, max_wait: int = 600) -> str:
    if not task_id:
        raise Exception("task_id is required")

    elapsed = 0
    while elapsed <= max_wait:
        try:
            response = requests.get(
                f"{API_BASE_URL}/jobs/recordInfo",
                headers=_headers(),
                params={"taskId": task_id},
                timeout=60,
            )
        except requests.RequestException as exc:
            raise Exception(f"Kling recordInfo request failed: {exc}") from exc

        result = _safe_json(response)
        if response.status_code != 200:
            raise Exception(f"Kling recordInfo HTTP {response.status_code}: {result}")

        if result.get("code") != 200:
            raise Exception(f"Kling recordInfo failed: {result}")

        data = result.get("data", {}) if isinstance(result.get("data"), dict) else {}
        state = str(data.get("state", "")).lower()
        print(f"[{elapsed}s] {state or 'unknown'}")

        if state == "waiting":
            time.sleep(interval)
            elapsed += interval
            continue

        if state == "success":
            result_json = data.get("resultJson", "{}")
            try:
                parsed_result = json.loads(result_json) if isinstance(result_json, str) else result_json
            except Exception as exc:
                raise Exception(f"Failed to parse resultJson: {exc} | raw={result_json}") from exc

            if not isinstance(parsed_result, dict):
                raise Exception(f"Unexpected resultJson format: {parsed_result}")

            urls = parsed_result.get("resultUrls", [])
            if not urls or not isinstance(urls, list):
                raise Exception(f"No resultUrls found in resultJson: {parsed_result}")

            return str(urls[0])

        if state == "fail":
            raise Exception(data.get("failMsg") or "Kling generation failed")

        time.sleep(interval)
        elapsed += interval

    raise Exception(f"Timed out waiting for Kling task {task_id} after {max_wait}s")


def generate_and_poll(prompt: str, **kwargs) -> str:
    print("🚀 Submitting to Kling...")
    task_id = generate_video(prompt, **kwargs)
    final_url = poll_video(task_id)
    print(f"🎬 Video ready: {final_url}")
    return final_url


def generate_multi_shot(scenes: list[dict], duration_each: int = 3) -> str:
    if not scenes:
        raise Exception("scenes cannot be empty")

    normalized_scenes = []
    total_duration = 0

    for idx, scene in enumerate(scenes):
        if not isinstance(scene, dict):
            raise Exception(f"Scene at index {idx} must be a dict")

        scene_prompt = str(scene.get("prompt", "")).strip()
        if not scene_prompt:
            raise Exception(f"Scene at index {idx} missing 'prompt'")

        scene_duration = int(scene.get("duration", duration_each))
        if scene_duration <= 0:
            raise Exception(f"Scene at index {idx} has invalid duration")

        normalized_scenes.append({"prompt": scene_prompt, "duration": scene_duration})
        total_duration += scene_duration

    return generate_and_poll(
        prompt="Multi-shot viral sequence",
        duration=str(total_duration),
        mode="std",
        multi_shots=True,
        multi_prompt=normalized_scenes,
    )


class KlingAgent:
    def __init__(self) -> None:
        pass

    async def generate_video(self, prompt: str, style: str = "std") -> dict[str, str]:
        mode = style if style in {"std", "pro"} else "std"
        task_id = generate_video(prompt=prompt, mode=mode)
        video_url = poll_video(task_id)
        return {
            "task_id": task_id,
            "status": "success",
            "video_url": video_url,
        }
