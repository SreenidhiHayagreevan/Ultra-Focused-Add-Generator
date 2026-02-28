import asyncio
import logging
import os
from typing import Any, Callable

from kling_agent import API_BASE_URL as KLING_API_BASE_URL
from kling_agent import KlingAgent
from reka_agent import FALLBACK_DIRECTOR_BRIEF, analyze_video, brief_to_kling_prompt
from tavily_agent import TavilySocialScout, filter_and_rank
from yutori_agent import YutoriTwitterScout

logger = logging.getLogger("trendhijack.pipeline")

ProgressCallback = Callable[[str, int, str], None]

FALLBACK_MP4_URL = "https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_30fps.mp4"
REKA_MODEL = "reka-flash"
KLING_MODEL = "kling-3.0/video"
KLING_ENDPOINT = f"{KLING_API_BASE_URL}/jobs/createTask"
DEFAULT_RECENCY = "week"
DEFAULT_PLATFORMS = {
    "twitter": True,
    "reddit": True,
    "youtube": True,
    "linkedin": True,
    "blogs": True,
    "instagram": False,
}


def _report_progress(on_progress: ProgressCallback | None, step: str, percent: int, message: str) -> None:
    if on_progress is None:
        return
    try:
        on_progress(step, percent, message)
    except Exception as exc:
        logger.warning("Progress callback failed at %s: %s", step, exc)


def _safe_float(value: Any) -> float | int | None:
    if value is None:
        return None
    try:
        return float(value)
    except Exception:
        return None


def _clean_string(value: Any, max_len: int = 1000) -> str:
    text = str(value or "")
    return text[:max_len]


def _normalize_post(post: Any) -> dict[str, Any]:
    if hasattr(post, "__dict__"):
        item = vars(post)
    elif isinstance(post, dict):
        item = post
    else:
        item = {}

    return {
        "title": _clean_string(item.get("title", ""), 240),
        "url": _clean_string(item.get("url", ""), 500),
        "snippet": _clean_string(item.get("snippet", ""), 500),
        "platform": _clean_string(item.get("platform", "unknown"), 80),
        "score": _safe_float(item.get("final_score", item.get("relevance_score"))),
    }


def _redact_sensitive(payload: Any) -> Any:
    exact_sensitive = {
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
        if key_l in exact_sensitive:
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
            cleaned[key] = _redact_sensitive(value)
        return cleaned

    if isinstance(payload, list):
        return [_redact_sensitive(item) for item in payload]

    if isinstance(payload, str):
        if "bearer " in payload.lower():
            return "[REDACTED]"
        return payload

    return payload


def _default_explain(brand: str, competitor: str, location: str) -> dict[str, Any]:
    discovery_topics = [competitor, f"{competitor} vs {brand}", f"{brand} alternative"]
    yutori_topics = [competitor, brand, f"{competitor} {location}"]

    return {
        "discovery": {
            "tavily": {
                "enabled": bool(os.environ.get("TAVILY_API_KEY", "").strip()),
                "recency": DEFAULT_RECENCY,
                "platforms": dict(DEFAULT_PLATFORMS),
                "query_topics": discovery_topics,
                "total_found": 0,
                "results": [],
                "top_urls": [],
            },
            "yutori": {
                "enabled": bool(os.environ.get("TWITTER_BEARER_TOKEN", "").strip()),
                "topics": yutori_topics,
                "total_found": 0,
                "tweets": [],
                "top_urls": [],
                "summary": "",
            },
            "merged": {
                "total_posts": 0,
                "top_posts_for_reka": 0,
                "filter_stats": {},
                "shortlist": [],
            },
            "mp4_for_reka": "",
        },
        "analysis": {
            "provider": "reka",
            "model": REKA_MODEL,
            "media_url": "",
            "director_brief": {},
            "used_fallback": False,
        },
        "generation": {
            "provider": "kling",
            "model": KLING_MODEL,
            "endpoint": KLING_ENDPOINT,
            "prompt": "",
            "duration": "5",
            "mode": "std",
            "aspect_ratio": "9:16",
            "task_id": None,
            "video_url": None,
        },
        "errors": [],
    }


def _build_smoke_result(brand: str, competitor: str, location: str) -> dict[str, Any]:
    explain = _default_explain(brand=brand, competitor=competitor, location=location)

    tavily_results = [
        {
            "title": f"{competitor} feature breakdown that went viral",
            "url": "https://www.youtube.com/watch?v=smoke0001",
            "snippet": "Creator teardown showing why this demo format is getting high watch time.",
            "platform": "youtube",
            "score": 0.91,
        },
        {
            "title": f"Thread: Why builders are switching from {competitor}",
            "url": "https://x.com/example/status/1000000000000000001",
            "snippet": "Founder thread with strong repost velocity and quote tweets.",
            "platform": "twitter",
            "score": 0.87,
        },
        {
            "title": f"Real-world {competitor} vs {brand} workflow review",
            "url": "https://www.reddit.com/r/Entrepreneur/comments/smoke02",
            "snippet": "Practical benchmark and comments from operators.",
            "platform": "reddit",
            "score": 0.83,
        },
        {
            "title": f"Founder post: 30-day growth playbook in {location}",
            "url": "https://www.linkedin.com/posts/example-smoke-03",
            "snippet": "B2B launch narrative with campaign checkpoints.",
            "platform": "linkedin",
            "score": 0.79,
        },
        {
            "title": f"Case study: converting {competitor} traffic into trials",
            "url": "https://example.com/case-study-smoke-04",
            "snippet": "Landing-page and creative angle optimization case study.",
            "platform": "blogs",
            "score": 0.74,
        },
    ]

    yutori_tweets = [
        {
            "text": f"Hot take: {competitor} just got leapfrogged for speed.",
            "url": "https://x.com/example/status/1000000000000000001",
            "author": "Example Founder",
            "created_at": "2026-02-28T10:00:00Z",
        },
        {
            "text": f"{brand} positioning is landing well with technical buyers.",
            "url": "https://x.com/example/status/1000000000000000002",
            "author": "Growth Operator",
            "created_at": "2026-02-28T10:20:00Z",
        },
    ]

    shortlist = tavily_results[:5]
    filter_stats = {
        "input_posts": 18,
        "filtered_posts": 10,
        "dropped_low_score": 5,
        "dropped_platform_cap": 3,
    }

    director_brief = {
        "hook": "A bold split-screen opens with an underdog brand overtaking the incumbent in 3 seconds.",
        "vibe": "Clean Tech x Startup Documentary",
        "energy": "high",
        "emotion": "confidence",
        "pacing": "fast",
        "setting": f"modern downtown streets in {location}",
        "key_moments": [
            {"time": "0:02", "description": "Fast logo reveal with kinetic camera push-in"},
            {"time": "0:05", "description": "User reaction montage with rapid text overlays"},
            {"time": "0:09", "description": "Billboard hero shot with product CTA"},
        ],
        "brand_safety": "safe",
        "tiktok_hook_score": "8",
        "variation_briefs": [
            "Street interview style opener",
            "Founder POV with direct challenge line",
            "Product cinematic with social proof overlays",
        ],
    }

    kling_prompt = (
        f"Vertical cinematic ad in {location}: {brand} challenges {competitor} with bold typography, "
        "street-level realism, and high-energy transitions, ending on a hero billboard reveal. "
        "hyper-realistic cinematic 4K vertical TikTok format"
    )

    explain["discovery"]["tavily"].update(
        {
            "total_found": 12,
            "results": tavily_results,
            "top_urls": [item["url"] for item in tavily_results[:5]],
        }
    )
    explain["discovery"]["yutori"].update(
        {
            "total_found": 6,
            "tweets": yutori_tweets,
            "top_urls": [item["url"] for item in yutori_tweets[:5]],
            "summary": f"Found 6 tweets about {competitor}/{brand}; top posts focus on switching momentum.",
        }
    )
    explain["discovery"]["merged"].update(
        {
            "total_posts": 18,
            "top_posts_for_reka": 10,
            "filter_stats": filter_stats,
            "shortlist": shortlist,
        }
    )
    explain["discovery"]["mp4_for_reka"] = FALLBACK_MP4_URL

    explain["analysis"].update(
        {
            "media_url": FALLBACK_MP4_URL,
            "director_brief": director_brief,
            "used_fallback": True,
        }
    )
    explain["generation"].update(
        {
            "prompt": kling_prompt,
            "duration": "5",
            "mode": "std",
            "aspect_ratio": "9:16",
            "task_id": "smoke-task-0001",
            "video_url": FALLBACK_MP4_URL,
        }
    )

    result = {
        "status": "success",
        "brand": brand,
        "competitor": competitor,
        "location": location,
        "trend_summary": (
            f"Trend monitoring shows sustained short-form momentum around {competitor}. "
            f"Audience response is strongest when {brand} is positioned as a faster, clearer alternative. "
            "The winning creative pattern combines blunt hooks, fast cuts, and social-proof framing."
        ),
        "tavily_posts_found": 12,
        "twitter_posts_found": 6,
        "top_posts_for_reka": 10,
        "filter_stats": filter_stats,
        "director_brief": director_brief,
        "kling_prompt": kling_prompt,
        "video_url": FALLBACK_MP4_URL,
        "top_content_sources": shortlist,
        "explain": explain,
        "output": {
            "trend_summary": (
                f"Trend monitoring shows sustained short-form momentum around {competitor}. "
                f"Audience response is strongest when {brand} is positioned as a faster, clearer alternative."
            ),
            "director_brief": director_brief,
            "video_url": FALLBACK_MP4_URL,
            "top_content_sources": shortlist,
        },
    }
    return _redact_sensitive(result)


def get_direct_mp4(topic: str, scout: TavilySocialScout) -> str:
    """Search Tavily for a direct MP4 URL for Reka video analysis."""
    try:
        resp = scout.client.search(
            query=f"{topic} tech demo site:pexels.com OR site:pixabay.com",
            search_depth="basic",
            max_results=5,
        )
        for r in resp.get("results", []):
            url = r.get("url", "")
            if url.endswith(".mp4"):
                return url
    except Exception as e:
        print(f"⚠️ MP4 search failed: {e}")
    return FALLBACK_MP4_URL


class TrendHijackPipeline:
    def __init__(self) -> None:
        self.kling_agent = KlingAgent()

    async def run_pipeline(
        self,
        brand: str,
        competitor: str,
        location: str,
        on_progress: ProgressCallback | None = None,
    ) -> dict[str, Any]:
        logger.info(
            "Pipeline start competitor='%s' brand='%s' location='%s'",
            competitor,
            brand,
            location,
        )

        if os.environ.get("SMOKE_MODE", "0") == "1":
            _report_progress(on_progress, "STEP 1 — discovery start", 10, "SMOKE_MODE discovery")
            _report_progress(on_progress, "STEP 1 — discovery end", 30, "SMOKE_MODE discovery complete")
            _report_progress(on_progress, "STEP 2 — reka analysis start", 40, "SMOKE_MODE analysis")
            _report_progress(on_progress, "STEP 2 — reka analysis end", 60, "SMOKE_MODE analysis complete")
            _report_progress(on_progress, "STEP 3 — prompt generation start", 70, "SMOKE_MODE prompt build")
            _report_progress(on_progress, "STEP 3 — prompt generation end", 85, "SMOKE_MODE prompt ready")
            _report_progress(on_progress, "STEP 4 — kling generation start", 90, "SMOKE_MODE generation")
            _report_progress(on_progress, "STEP 4 — kling generation end", 98, "SMOKE_MODE generation complete")
            return _build_smoke_result(brand=brand, competitor=competitor, location=location)

        explain = _default_explain(brand=brand, competitor=competitor, location=location)
        discovery_topics = explain["discovery"]["tavily"]["query_topics"]
        yutori_topics = explain["discovery"]["yutori"]["topics"]
        top_posts: list[dict[str, Any]] = []
        filter_stats: dict[str, Any] = {}
        twitter_posts: list[dict[str, Any]] = []
        yutori_summary = ""
        direct_mp4_url = FALLBACK_MP4_URL

        # STEP 1 — DISCOVERY
        _report_progress(on_progress, "STEP 1 — discovery start", 10, "Discovering trends across platforms")
        try:
            tavily_scout = TavilySocialScout(api_key=os.environ["TAVILY_API_KEY"])
            tavily_output = tavily_scout.run(
                topics=discovery_topics,
                platforms=dict(DEFAULT_PLATFORMS),
                recency=DEFAULT_RECENCY,
                max_results=5,
            )

            tavily_results = [_normalize_post(post) for post in tavily_output.posts]
            explain["discovery"]["tavily"]["total_found"] = int(tavily_output.total_found)
            explain["discovery"]["tavily"]["results"] = tavily_results
            explain["discovery"]["tavily"]["top_urls"] = [
                item["url"] for item in tavily_results if item.get("url")
            ][:5]

            twitter_bearer = os.environ.get("TWITTER_BEARER_TOKEN", "")
            explain["discovery"]["yutori"]["enabled"] = bool(twitter_bearer.strip())
            if twitter_bearer.strip():
                yutori_scout = YutoriTwitterScout(bearer_token=twitter_bearer)
                yutori_result = yutori_scout.scout(topics=yutori_topics, max_per_topic=10)
                yutori_summary = str(yutori_result.get("trend_summary", "") or "")
                explain["discovery"]["yutori"]["summary"] = yutori_summary
                explain["discovery"]["yutori"]["total_found"] = int(yutori_result.get("total_found", 0) or 0)

                tweets_raw = yutori_result.get("tweets", [])
                yutori_tweets = []
                for tweet in tweets_raw:
                    if not isinstance(tweet, dict):
                        continue
                    yutori_tweets.append(
                        {
                            "text": _clean_string(tweet.get("text", ""), 400),
                            "url": _clean_string(tweet.get("url", ""), 500),
                            "author": _clean_string(tweet.get("author", ""), 120),
                            "created_at": _clean_string(tweet.get("created_at", ""), 80),
                        }
                    )

                explain["discovery"]["yutori"]["tweets"] = yutori_tweets
                explain["discovery"]["yutori"]["top_urls"] = [
                    item["url"] for item in yutori_tweets if item.get("url")
                ][:5]

                twitter_posts = yutori_scout.to_tavily_format(tweets_raw)

            all_posts = tavily_output.posts + twitter_posts
            explain["discovery"]["merged"]["total_posts"] = len(all_posts)

            top_posts, filter_stats = filter_and_rank(
                posts=[p.__dict__ if hasattr(p, "__dict__") else p for p in all_posts],
                top_n=15,
                min_score=0.10,
                max_per_platform=5,
            )

            shortlist = [_normalize_post(post) for post in top_posts]
            explain["discovery"]["merged"]["top_posts_for_reka"] = len(top_posts)
            explain["discovery"]["merged"]["filter_stats"] = dict(filter_stats)
            explain["discovery"]["merged"]["shortlist"] = shortlist

            tavily_mp4_scout = TavilySocialScout(api_key=os.environ["TAVILY_API_KEY"])
            direct_mp4_url = get_direct_mp4(competitor, tavily_mp4_scout)
            explain["discovery"]["mp4_for_reka"] = direct_mp4_url

            trend_summary = f"Tavily: {tavily_output.total_found} posts across platforms. "
            if yutori_summary:
                trend_summary += f"Twitter: {yutori_summary}"

            print(f"✅ Step 1 complete — {len(top_posts)} filtered posts ready for Reka")
            print(f"   MP4 for Reka analysis: {direct_mp4_url}")
            _report_progress(on_progress, "STEP 1 — discovery end", 30, "Discovery complete")
        except Exception as exc:
            explain["errors"].append({"step": "STEP 1 — discovery", "error": str(exc)})
            raise Exception(f"STEP 1 — discovery failed: {exc}") from exc

        # STEP 2 — REKA ANALYSIS
        _report_progress(on_progress, "STEP 2 — reka analysis start", 40, "Running Reka analysis")
        try:
            director_brief = analyze_video(direct_mp4_url)
            used_fallback = director_brief == FALLBACK_DIRECTOR_BRIEF
            explain["analysis"].update(
                {
                    "media_url": direct_mp4_url,
                    "director_brief": director_brief,
                    "used_fallback": bool(used_fallback),
                }
            )
            print("✅ Step 2 complete")
            _report_progress(on_progress, "STEP 2 — reka analysis end", 60, "Reka analysis complete")
        except Exception as exc:
            explain["errors"].append({"step": "STEP 2 — reka analysis", "error": str(exc)})
            raise Exception(f"STEP 2 — reka analysis failed: {exc}") from exc

        # STEP 3 — KLING PROMPT
        _report_progress(on_progress, "STEP 3 — prompt generation start", 70, "Generating Kling prompt")
        try:
            kling_prompt = brief_to_kling_prompt(
                brief=director_brief,
                brand=competitor,
                location=director_brief.get("setting", "global"),
            )

            top_title = ""
            if top_posts:
                first_post = vars(top_posts[0]) if hasattr(top_posts[0], "__dict__") else top_posts[0]
                top_title = str(first_post.get("title", ""))
            if top_title:
                kling_prompt = f"{kling_prompt}. Context from top trend title: {top_title}."

            explain["generation"]["prompt"] = kling_prompt
            print("✅ Step 3 complete")
            _report_progress(on_progress, "STEP 3 — prompt generation end", 85, "Kling prompt ready")
        except Exception as exc:
            explain["errors"].append({"step": "STEP 3 — prompt generation", "error": str(exc)})
            raise Exception(f"STEP 3 — prompt generation failed: {exc}") from exc

        # STEP 4 — KLING GENERATION
        _report_progress(on_progress, "STEP 4 — kling generation start", 90, "Generating final video")
        try:
            generation_mode = "std"
            requested_mode = director_brief.get("vibe", "dynamic")
            if requested_mode in {"std", "pro"}:
                generation_mode = requested_mode

            explain["generation"]["mode"] = generation_mode
            generation = await self.kling_agent.generate_video(
                prompt=kling_prompt,
                style=generation_mode,
            )
            task_id = generation.get("task_id") if isinstance(generation, dict) else None
            video_url = generation.get("video_url", "") if isinstance(generation, dict) else str(generation)

            explain["generation"]["task_id"] = task_id
            explain["generation"]["video_url"] = video_url or None
            print("✅ Step 4 complete")
            _report_progress(on_progress, "STEP 4 — kling generation end", 98, "Video generation complete")
        except Exception as exc:
            explain["errors"].append({"step": "STEP 4 — kling generation", "error": str(exc)})
            raise Exception(f"STEP 4 — kling generation failed: {exc}") from exc

        # STEP 5 — RETURN
        result = {
            "status": "success",
            "brand": brand,
            "competitor": competitor,
            "location": location,
            "trend_summary": trend_summary,
            "tavily_posts_found": int(explain["discovery"]["tavily"]["total_found"]),
            "twitter_posts_found": len(twitter_posts),
            "top_posts_for_reka": len(top_posts),
            "filter_stats": dict(filter_stats),
            "director_brief": director_brief,
            "kling_prompt": kling_prompt,
            "video_url": video_url,
            "top_content_sources": [_normalize_post(post) for post in top_posts[:5]],
            "explain": explain,
            "output": {
                "trend_summary": trend_summary,
                "director_brief": director_brief,
                "video_url": video_url,
                "top_content_sources": [_normalize_post(post) for post in top_posts[:5]],
            },
        }
        print("✅ Step 5 complete")
        return _redact_sensitive(result)

    async def run(self, query: str, on_progress: ProgressCallback | None = None) -> dict[str, Any]:
        competitor = query
        brand = os.environ.get("BRAND_NAME", "TrendHijack")
        location = os.environ.get("TARGET_LOCATION", "Global")
        return await self.run_pipeline(
            brand=brand,
            competitor=competitor,
            location=location,
            on_progress=on_progress,
        )


def run_pipeline(
    brand: str,
    competitor: str,
    location: str,
    on_progress: ProgressCallback | None = None,
) -> dict[str, Any]:
    runner = TrendHijackPipeline()
    return asyncio.run(
        runner.run_pipeline(
            brand=brand,
            competitor=competitor,
            location=location,
            on_progress=on_progress,
        )
    )
