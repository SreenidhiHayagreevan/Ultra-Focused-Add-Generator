import json
from dataclasses import dataclass
from urllib.parse import parse_qs, urlparse
from typing import Any

import requests


@dataclass
class TavilyPost:
    platform: str
    content_type: str
    title: str
    url: str
    snippet: str
    relevance_score: float
    topic: str
    published_date: str
    viral_signals: list[str]


@dataclass
class TavilyScoutOutput:
    posts: list[Any]
    total_found: int


class TavilySocialScout:
    def __init__(self, api_key: str):
        from tavily import TavilyClient

        self.client = TavilyClient(api_key=api_key)
        self.platform_domains = {
            "twitter": ["x.com", "twitter.com"],
            "reddit": ["reddit.com"],
            "youtube": ["youtube.com", "youtu.be"],
            "linkedin": ["linkedin.com"],
            "blogs": [],
            "instagram": ["instagram.com"],
        }

    def run(
        self,
        topics: list[str],
        platforms: dict[str, bool],
        recency: str = "week",
        max_results: int = 5,
    ) -> TavilyScoutOutput:
        posts: list[TavilyPost] = []
        seen_urls = set()

        recency_hint = "last week" if recency == "week" else recency

        for topic in topics:
            for platform, enabled in platforms.items():
                if not enabled:
                    continue

                query = f"{topic} {platform} discussion {recency_hint}"
                search_kwargs: dict[str, Any] = {
                    "query": query,
                    "search_depth": "advanced",
                    "max_results": max_results,
                }
                domains = self.platform_domains.get(platform, [])
                if domains:
                    search_kwargs["include_domains"] = domains

                try:
                    response = self.client.search(**search_kwargs)
                except Exception:
                    continue

                for result in response.get("results", []):
                    url = str(result.get("url", ""))
                    if not url or url in seen_urls:
                        continue
                    seen_urls.add(url)

                    content = str(result.get("content", ""))
                    viral_signals = []
                    lowered = content.lower()
                    if "like" in lowered:
                        viral_signals.append("likes")
                    if "retweet" in lowered or "share" in lowered:
                        viral_signals.append("retweets")

                    posts.append(
                        TavilyPost(
                            platform=platform,
                            content_type="post",
                            title=str(result.get("title", "")),
                            url=url,
                            snippet=content[:400],
                            relevance_score=float(result.get("score", 0.0) or 0.0),
                            topic=topic,
                            published_date=str(result.get("published_date", "")),
                            viral_signals=viral_signals,
                        )
                    )

        posts.sort(key=lambda p: p.relevance_score, reverse=True)
        return TavilyScoutOutput(posts=posts, total_found=len(posts))


def filter_and_rank(
    posts: list[dict],
    top_n: int = 15,
    min_score: float = 0.10,
    max_per_platform: int = 5,
) -> tuple[list[dict], dict]:
    normalized = []
    for post in posts:
        if hasattr(post, "__dict__"):
            item = dict(vars(post))
        elif isinstance(post, dict):
            item = dict(post)
        else:
            continue

        relevance = float(item.get("relevance_score", 0.0) or 0.0)
        viral_signals = item.get("viral_signals", [])
        if not isinstance(viral_signals, list):
            viral_signals = []

        final_score = max(0.0, relevance) + (len(viral_signals) * 0.05)
        item["final_score"] = round(final_score, 4)
        normalized.append(item)

    scored = [p for p in normalized if p.get("final_score", 0.0) >= min_score]
    scored.sort(key=lambda p: p.get("final_score", 0.0), reverse=True)

    per_platform = {}
    limited = []
    for post in scored:
        platform = str(post.get("platform", "unknown"))
        per_platform.setdefault(platform, 0)
        if per_platform[platform] >= max_per_platform:
            continue
        per_platform[platform] += 1
        limited.append(post)
        if len(limited) >= top_n:
            break

    stats = {
        "input_count": len(posts),
        "scored_count": len(normalized),
        "after_threshold": len(scored),
        "returned_count": len(limited),
        "per_platform": per_platform,
    }

    return limited, stats


class YouTubeScout:
    def __init__(self, api_key: str):
        from tavily import TavilyClient

        self.client = TavilyClient(api_key=api_key)

    def search_youtube_videos(self, topic: str, max_per_query: int = 7) -> list:
        queries = [
            f"{topic} AI tool review youtube 2025",
            f"{topic} viral demo youtube",
            f"{topic} developer reaction youtube",
            f"{topic} breakdown explained youtube",
            f"{topic} honest review rant youtube",
        ]

        seen = set()
        videos = []

        for query in queries:
            try:
                response = self.client.search(
                    query=query,
                    search_depth="advanced",
                    max_results=max_per_query,
                    include_domains=["youtube.com"],
                )
            except Exception:
                continue

            results = response.get("results", []) if isinstance(response, dict) else []
            for result in results:
                url = str(result.get("url", ""))
                if "youtube.com/watch" not in url and "youtu.be/" not in url:
                    continue
                if url in seen:
                    continue

                seen.add(url)
                content = str(result.get("content", ""))
                videos.append(
                    {
                        "url": url,
                        "title": result.get("title", ""),
                        "snippet": content[:300],
                        "published_date": result.get("published_date", ""),
                        "tavily_score": result.get("score", 0.0),
                        "query_used": query,
                        "viral_signals": self.count_viral_keywords(content),
                    }
                )

        return videos

    def count_viral_keywords(self, text: str) -> int:
        keywords = [
            "viral",
            "trending",
            "million views",
            "blew up",
            "everyone is talking",
            "breaking",
            "leaked",
            "exposed",
            "honest",
            "brutally",
            "real talk",
            "changed my mind",
            "actually good",
            "surprisingly",
            "best ever",
        ]
        haystack = (text or "").lower()
        return sum(1 for keyword in keywords if keyword in haystack)

    def rank_videos(self, videos: list) -> list:
        def score_video(video: dict) -> float:
            tavily_score = float(video.get("tavily_score", 0.0) or 0.0)
            viral_signals = int(video.get("viral_signals", 0) or 0)
            published_date = str(video.get("published_date", "") or "")

            recency_bonus = 0
            if "2025" in published_date:
                recency_bonus = 30
            elif published_date:
                recency_bonus = 10

            return (tavily_score * 50) + (viral_signals * 10) + recency_bonus

        return sorted(videos, key=score_video, reverse=True)

    def extract_video_id(self, url: str) -> str | None:
        if not url:
            return None

        parsed = urlparse(url)
        hostname = parsed.netloc.lower()

        if "youtube.com" in hostname and parsed.path == "/watch":
            video_id = parse_qs(parsed.query).get("v", [None])[0]
            return video_id

        if "youtu.be" in hostname:
            path_parts = parsed.path.strip("/").split("/")
            if path_parts and path_parts[0]:
                return path_parts[0]

        return None

    def enrich_with_youtube_api(self, videos: list, youtube_api_key: str) -> list:
        if not youtube_api_key or not youtube_api_key.strip():
            return videos

        enriched = []

        for video in videos:
            video_data = dict(video)
            video_id = self.extract_video_id(video_data.get("url", ""))
            views = 0
            likes = 0
            comments = 0

            if video_id:
                try:
                    response = requests.get(
                        "https://www.googleapis.com/youtube/v3/videos",
                        params={
                            "part": "statistics",
                            "id": video_id,
                            "key": youtube_api_key,
                        },
                        timeout=20,
                    )
                    response.raise_for_status()
                    payload = response.json()
                    items = payload.get("items", [])
                    if items:
                        stats = items[0].get("statistics", {})
                        views = int(stats.get("viewCount", 0) or 0)
                        likes = int(stats.get("likeCount", 0) or 0)
                        comments = int(stats.get("commentCount", 0) or 0)
                except Exception:
                    views = 0
                    likes = 0
                    comments = 0

            video_data["views"] = views
            video_data["likes"] = likes
            video_data["comments"] = comments
            video_data["final_score"] = (
                views
                + (likes * 5)
                + (comments * 3)
                + (int(video_data.get("viral_signals", 0) or 0) * 10000)
            )
            enriched.append(video_data)

        return sorted(enriched, key=lambda item: item.get("final_score", 0), reverse=True)

    def scout(self, topic: str, youtube_api_key: str = "") -> dict:
        print(f"🔍 Searching YouTube for: {topic}")

        videos = self.search_youtube_videos(topic)
        ranked = self.rank_videos(videos)

        if youtube_api_key and youtube_api_key.strip():
            ranked = self.enrich_with_youtube_api(ranked, youtube_api_key)

        top5 = ranked[:5]

        with open("youtube_scout_output.json", "w", encoding="utf-8") as output_file:
            json.dump(top5, output_file, indent=2)

        top_urls = [video.get("url", "") for video in top5]
        with open("youtube_scout_urls.json", "w", encoding="utf-8") as urls_file:
            json.dump(top_urls, urls_file, indent=2)

        print(f"📊 Found {len(videos)} unique videos across 5 queries")
        if top5:
            print(f"🏆 Top video: {top5[0].get('title', '')} — {top5[0].get('url', '')}")
        else:
            print("🏆 Top video:  — ")

        return {
            "topic": topic,
            "total_found": len(videos),
            "top_videos": top5,
            "top_url": top5[0]["url"] if top5 else "",
            "top_title": top5[0]["title"] if top5 else "",
            "trend_summary": self.build_trend_summary(top5, topic),
        }

    def build_trend_summary(self, videos: list, topic: str) -> str:
        if not videos:
            return f"No YouTube videos found for {topic}."

        top_video = videos[0]
        return (
            f"Found {len(videos)} viral YouTube videos about {topic}. "
            f"Top result: '{top_video.get('title', '')}' with viral signals score of "
            f"{top_video.get('viral_signals', 0)}."
        )

    def get_direct_video_url(self, topic: str) -> str:
        queries = [
            f"{topic} tech demo site:pexels.com",
            f"{topic} viral video site:pixabay.com filetype:mp4",
        ]

        for query in queries:
            try:
                response = self.client.search(
                    query=query,
                    search_depth="advanced",
                    max_results=7,
                )
            except Exception:
                continue

            results = response.get("results", []) if isinstance(response, dict) else []
            for result in results:
                url = str(result.get("url", ""))
                if url.lower().endswith(".mp4"):
                    return url

        return "https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_30fps.mp4"


if __name__ == "__main__":
    import os

    from dotenv import load_dotenv

    load_dotenv()

    scout = YouTubeScout(api_key=os.environ["TAVILY_API_KEY"])

    result = scout.scout("OpenAI GPT", youtube_api_key="")
    print("\n=== SCOUT RESULT ===")
    print(f"Total found: {result['total_found']}")
    print(f"Top URL: {result['top_url']}")
    print(f"Summary: {result['trend_summary']}")

    mp4_url = scout.get_direct_video_url("OpenAI")
    print(f"\nDirect MP4 for Reka: {mp4_url}")
