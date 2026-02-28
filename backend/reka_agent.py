import ast
import json
import logging
import os
import re
from typing import Any

try:
    from reka_api import Reka as _RekaClientClass
except Exception:
    _RekaClientClass = None
    try:
        import reka_api as _reka_api_module  # type: ignore

        for _candidate in ("Reka", "RekaClient", "Client", "SyncClient"):
            _class_obj = getattr(_reka_api_module, _candidate, None)
            if _class_obj is not None:
                _RekaClientClass = _class_obj
                break
    except Exception:
        _RekaClientClass = None

logger = logging.getLogger("trendhijack.reka")


FALLBACK_DIRECTOR_BRIEF = {
    "hook": "Fast opening with a bold claim and visual contrast.",
    "vibe": "Clean Tech",
    "energy": "high",
    "emotion": "curiosity",
    "pacing": "fast",
    "setting": "modern urban workspace",
    "key_moments": [{"time": "0:04", "description": "Feature reveal with reaction"}],
    "brand_safety": "safe",
    "tiktok_hook_score": "7",
    "variation_briefs": [
        "Product POV with snappy captions",
        "Before/after transformation cut",
        "Founder-style honest reaction",
    ],
}

FALLBACK_IMAGE_ANALYSIS = {
    "dominant_colors": ["black", "teal", "white"],
    "vibe": "Clean Tech",
    "clickbait_score": 6,
    "emotion_conveyed": "curiosity",
    "thumbnail_hook": "Unexpected visual contrast with direct claim",
}

REKA_API_KEY = os.environ.get("REKA_API_KEY", "").strip()
REKA_API_KEY_FALLBACK = os.environ.get("REKA_API_KEY_FALLBACK", "").strip()


def _init_client(api_key: str) -> Any:
    if _RekaClientClass is None:
        logger.error("Reka SDK client class not found. Ensure reka-api==3.2.0 is installed.")
        return None

    if api_key:
        for kwargs in ({"api_key": api_key}, {"token": api_key}):
            try:
                return _RekaClientClass(**kwargs)
            except Exception:
                continue
        logger.error("Failed to initialize Reka client with provided API key.")

    # Some SDK variants support env-based auth with no args.
    try:
        return _RekaClientClass()
    except Exception:
        logger.error(
            "Failed to initialize Reka client from environment auth. "
            "Set REKA_API_KEY or verify reka-api installation."
        )
        return None


reka_client = _init_client(REKA_API_KEY)
reka_fallback_client = (
    _init_client(REKA_API_KEY_FALLBACK)
    if REKA_API_KEY_FALLBACK and REKA_API_KEY_FALLBACK != REKA_API_KEY
    else None
)

if not REKA_API_KEY and not REKA_API_KEY_FALLBACK:
    logger.error("REKA_API_KEY is not set. reka_agent will run in fallback mode.")


def _strip_markdown_fences(text: str) -> str:
    cleaned = (text or "").strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def _extract_text_from_response(response: Any) -> str:
    if response is None:
        return "{}"

    # Common SDK shortcuts
    for attr in ("output_text", "text", "content"):
        value = getattr(response, attr, None)
        if isinstance(value, str) and value.strip():
            return value

    # Dict-like response
    if isinstance(response, dict):
        if isinstance(response.get("output_text"), str):
            return response["output_text"]
        if isinstance(response.get("text"), str):
            return response["text"]

        choices = response.get("choices", [])
        if isinstance(choices, list) and choices:
            msg = choices[0].get("message", {}) if isinstance(choices[0], dict) else {}
            content = msg.get("content", "") if isinstance(msg, dict) else ""
            if isinstance(content, str):
                return content
            if isinstance(content, list):
                parts = []
                for item in content:
                    if isinstance(item, dict) and isinstance(item.get("text"), str):
                        parts.append(item["text"])
                if parts:
                    return "\n".join(parts)

        output = response.get("output", [])
        if isinstance(output, list):
            parts = []
            for o in output:
                if isinstance(o, dict):
                    c = o.get("content", [])
                    if isinstance(c, list):
                        for chunk in c:
                            if isinstance(chunk, dict) and isinstance(chunk.get("text"), str):
                                parts.append(chunk["text"])
            if parts:
                return "\n".join(parts)

        try:
            return json.dumps(response)
        except Exception:
            return str(response)

    # Object-like response with nested fields
    choices = getattr(response, "choices", None)
    if isinstance(choices, list) and choices:
        msg = getattr(choices[0], "message", None)
        content = getattr(msg, "content", None) if msg is not None else None
        if isinstance(content, str):
            return content

    output = getattr(response, "output", None)
    if isinstance(output, list):
        parts = []
        for o in output:
            content = getattr(o, "content", None)
            if isinstance(content, list):
                for chunk in content:
                    text = getattr(chunk, "text", None)
                    if isinstance(text, str):
                        parts.append(text)
        if parts:
            return "\n".join(parts)

    return str(response)


def _safe_parse_json(raw_text: str) -> dict:
    cleaned = _strip_markdown_fences(raw_text)
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict):
            return parsed
        return {"raw": parsed}
    except Exception as exc:
        print(f"Reka JSON parse failed: {exc}")
        try:
            parsed = ast.literal_eval(cleaned)
            if isinstance(parsed, dict):
                return parsed
            return {"raw": parsed}
        except Exception as inner_exc:
            print(f"Reka fallback parse failed: {inner_exc}")
            return {"raw": cleaned}


def _chat_create(client: Any, messages: list[dict]) -> Any:
    # Primary reka-api 3.x style
    if hasattr(client, "chat") and hasattr(client.chat, "create"):
        return client.chat.create(model="reka-flash", messages=messages)

    # Compatibility fallbacks for possible SDK variants
    if hasattr(client, "responses") and hasattr(client.responses, "create"):
        return client.responses.create(model="reka-flash", input=messages)

    if hasattr(client, "chat_completions") and hasattr(client.chat_completions, "create"):
        return client.chat_completions.create(model="reka-flash", messages=messages)

    if hasattr(client, "create"):
        return client.create(model="reka-flash", messages=messages)

    raise RuntimeError("Unsupported reka-api client shape: no usable chat create method")


def _chat_create_with_fallback(messages: list[dict]) -> Any:
    if not reka_client and not reka_fallback_client:
        return None

    if reka_client:
        try:
            return _chat_create(reka_client, messages)
        except Exception as exc:
            print(f"Primary Reka key/client failed: {exc}")

    if reka_fallback_client:
        try:
            print("Retrying with fallback Reka key...")
            return _chat_create(reka_fallback_client, messages)
        except Exception as exc:
            print(f"Fallback Reka key/client failed: {exc}")

    return None


def analyze_video(video_url: str) -> dict:
    print(f"Analyzing video with Reka: {video_url}")

    if not reka_client and not reka_fallback_client:
        print("Reka unavailable or REKA_API_KEY missing. Returning fallback brief.")
        return dict(FALLBACK_DIRECTOR_BRIEF)

    prompt = (
        "You are a viral TikTok content strategist. Analyze this video and return ONLY valid JSON:\n"
        "{\n"
        "  'hook': 'exact 3-second opening hook description',\n"
        "  'vibe': 'TikTok aesthetic e.g. Neon Cyberpunk / Clean Tech',\n"
        "  'energy': 'low | medium | high',\n"
        "  'emotion': 'primary emotion',\n"
        "  'pacing': 'slow | medium | fast',\n"
        "  'setting': 'describe the location/environment',\n"
        "  'key_moments': [{'time': '0:04', 'description': 'what happens'}],\n"
        "  'brand_safety': 'safe | neutral | risky',\n"
        "  'tiktok_hook_score': '1-10',\n"
        "  'variation_briefs': ['brief 1', 'brief 2', 'brief 3']\n"
        "}\n"
        "Return ONLY JSON. No markdown."
    )

    response = _chat_create_with_fallback(
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "video_url", "video_url": video_url},
                ],
            }
        ]
    )

    if response is None:
        return dict(FALLBACK_DIRECTOR_BRIEF)

    try:
        raw_text = _extract_text_from_response(response)
        parsed = _safe_parse_json(raw_text)
    except Exception as exc:
        print(f"Reka analyze_video extraction failed: {exc}")
        return dict(FALLBACK_DIRECTOR_BRIEF)

    required_keys = {
        "hook",
        "vibe",
        "energy",
        "emotion",
        "pacing",
        "setting",
        "key_moments",
        "brand_safety",
        "tiktok_hook_score",
        "variation_briefs",
    }
    if not required_keys.issubset(set(parsed.keys())):
        print("Reka analyze_video response missing expected fields. Using fallback brief.")
        return dict(FALLBACK_DIRECTOR_BRIEF)

    return parsed


def brief_to_kling_prompt(brief: dict, brand: str, location: str) -> str:
    vibe = brief.get("vibe", "Clean Tech")
    setting = brief.get("setting", "city street")
    hook = brief.get("hook", "Immediate visual hook in first 3 seconds")
    key_moments = brief.get("key_moments", [])

    key_moments_text = ""
    if isinstance(key_moments, list) and key_moments:
        formatted = []
        for item in key_moments:
            if isinstance(item, dict):
                time = item.get("time", "")
                description = item.get("description", "")
                formatted.append(f"{time} {description}".strip())
            else:
                formatted.append(str(item))
        key_moments_text = "; ".join(part for part in formatted if part)

    prompt = (
        f"Create a vertical cinematic TikTok video for brand '{brand}'. "
        f"Vibe: {vibe}. "
        f"Primary setting: {setting}. "
        f"Location context: {location}. "
        f"Opening hook: {hook}. "
        f"Include dynamic key moments: {key_moments_text or 'fast montage and emotional reveal'}. "
        f"Show a visible billboard with the brand name '{brand}' in-scene. "
        "hyper-realistic cinematic 4K vertical TikTok format"
    )
    return prompt


def analyze_image(image_url: str) -> dict:
    print(f"Analyzing image with Reka: {image_url}")

    if not reka_client and not reka_fallback_client:
        print("Reka unavailable or REKA_API_KEY missing. Returning fallback thumbnail analysis.")
        return dict(FALLBACK_IMAGE_ANALYSIS)

    prompt = (
        "You are a viral TikTok content strategist. Analyze this image as a TikTok thumbnail and return ONLY valid JSON:\n"
        "{\n"
        "  'dominant_colors': ['color1', 'color2', 'color3'],\n"
        "  'vibe': 'TikTok aesthetic',\n"
        "  'clickbait_score': '1-10',\n"
        "  'emotion_conveyed': 'primary emotion',\n"
        "  'thumbnail_hook': 'short hook summary'\n"
        "}\n"
        "Return ONLY JSON. No markdown."
    )

    response = _chat_create_with_fallback(
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": image_url},
                ],
            }
        ]
    )

    if response is None:
        return dict(FALLBACK_IMAGE_ANALYSIS)

    try:
        raw_text = _extract_text_from_response(response)
        parsed = _safe_parse_json(raw_text)
    except Exception as exc:
        print(f"Reka analyze_image extraction failed: {exc}")
        return dict(FALLBACK_IMAGE_ANALYSIS)

    required = {"dominant_colors", "vibe", "clickbait_score", "emotion_conveyed", "thumbnail_hook"}
    if not required.issubset(set(parsed.keys())):
        return dict(FALLBACK_IMAGE_ANALYSIS)

    return parsed
