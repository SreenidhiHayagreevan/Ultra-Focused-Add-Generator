import dataclasses
import json
import time
from dataclasses import dataclass
from datetime import datetime

import requests


@dataclass
class Tweet:
    tweet_id: str
    url: str
    text: str
    author: str
    username: str
    verified: bool
    author_followers: int
    likes: int
    retweets: int
    replies: int
    engagement: int  # likes + retweets*3 + replies*2
    created_at: str
    topic: str
    platform: str = "twitter"
    content_type: str = "post"


class YutoriTwitterScout:
    def __init__(self, bearer_token: str):
        self.bearer_token = bearer_token
        self.headers = {"Authorization": f"Bearer {bearer_token}"}
        self.base_url = "https://api.twitter.com/2/tweets/search/recent"

    def search_recent(self, query: str, topic: str, max_results: int = 20) -> list[Tweet]:
        params = {
            "query": f"{query} -is:retweet lang:en",
            "max_results": min(max_results, 100),
            "tweet.fields": "public_metrics,created_at,author_id,entities",
            "expansions": "author_id",
            "user.fields": "name,username,verified,public_metrics",
        }

        resp = None
        for attempt in range(2):
            try:
                resp = requests.get(
                    self.base_url,
                    headers=self.headers,
                    params=params,
                    timeout=30,
                )
            except requests.RequestException as exc:
                print(f"Warning: Twitter request failed: {exc}")
                return []

            if resp.status_code == 200:
                break

            if resp.status_code == 429 and attempt == 0:
                print("Rate limited, waiting 15s")
                time.sleep(15)
                continue

            if resp.status_code == 401:
                raise Exception("Invalid Twitter Bearer Token")

            print(f"Warning: Twitter API error {resp.status_code}: {resp.text}")
            return []

        if resp is None or resp.status_code != 200:
            print("Warning: Twitter API did not return success")
            return []

        try:
            data = resp.json()
        except Exception as exc:
            print(f"Warning: Could not parse Twitter response JSON: {exc}")
            return []

        tweets = data.get("data", [])
        users = {u.get("id", ""): u for u in data.get("includes", {}).get("users", [])}

        parsed_tweets = []
        for tweet in tweets:
            tweet_id = str(tweet.get("id", ""))
            if not tweet_id:
                continue

            author_id = str(tweet.get("author_id", ""))
            user = users.get(author_id, {})
            username = user.get("username", "")
            author = user.get("name", "")
            verified = bool(user.get("verified", False))
            author_followers = int(user.get("public_metrics", {}).get("followers_count", 0) or 0)

            metrics = tweet.get("public_metrics", {})
            likes = int(metrics.get("like_count", 0) or 0)
            retweets = int(metrics.get("retweet_count", 0) or 0)
            replies = int(metrics.get("reply_count", 0) or 0)
            engagement = likes + retweets * 3 + replies * 2

            parsed_tweets.append(
                Tweet(
                    tweet_id=tweet_id,
                    url=f"https://twitter.com/{username}/status/{tweet_id}",
                    text=tweet.get("text", ""),
                    author=author,
                    username=username,
                    verified=verified,
                    author_followers=author_followers,
                    likes=likes,
                    retweets=retweets,
                    replies=replies,
                    engagement=engagement,
                    created_at=tweet.get("created_at", ""),
                    topic=topic,
                )
            )

        parsed_tweets.sort(key=lambda t: t.engagement, reverse=True)
        return parsed_tweets

    def scout(self, topics: list[str], max_per_topic: int = 10) -> dict:
        all_tweets = []
        seen = set()

        for topic in topics:
            print(f"🐦 Twitter scouting: '{topic}'")
            queries = [
                f"{topic} AI viral",
                f"{topic} CEO founder announcement",
                f"{topic} developer review reaction",
            ]

            for query in queries:
                tweets = self.search_recent(query=query, topic=topic, max_results=max_per_topic)

                for tweet in tweets:
                    if tweet.tweet_id in seen:
                        continue
                    seen.add(tweet.tweet_id)
                    all_tweets.append(tweet)
                    print(
                        f"   ❤️ {tweet.likes}  🔁 {tweet.retweets}  💬 {tweet.replies} | "
                        f"@{tweet.username}: {tweet.text[:80]}"
                    )

                time.sleep(0.3)

        all_tweets.sort(key=lambda t: t.engagement, reverse=True)
        top_tweets = all_tweets[:20]

        result = {
            "agent": "yutori_twitter_scout",
            "timestamp": datetime.utcnow().isoformat(),
            "topics_scouted": topics,
            "total_found": len(all_tweets),
            "tweets": [dataclasses.asdict(t) for t in top_tweets],
            "top_tweet": dataclasses.asdict(top_tweets[0]) if top_tweets else None,
            "trend_summary": self.build_summary(top_tweets, topics),
        }

        with open("yutori_twitter_output.json", "w", encoding="utf-8") as file:
            json.dump(result, file, indent=2)

        return result

    def build_summary(self, tweets: list[Tweet], topics: list[str]) -> str:
        if not tweets:
            return f"No Twitter data found for {topics}."

        top = tweets[0]
        joined_topics = "/".join(topics)
        return (
            f"Found {len(tweets)} tweets about {joined_topics} on Twitter. "
            f"Top post by @{top.username} has {top.engagement} engagement "
            f"({top.likes} likes, {top.retweets} retweets): '{top.text[:100]}'"
        )

    def get_top_urls(self, tweets: list[Tweet], limit: int = 5) -> list[str]:
        ranked = sorted(tweets, key=lambda t: t.engagement, reverse=True)
        return [tweet.url for tweet in ranked[:limit]]

    def to_tavily_format(self, tweets: list[Tweet] | list[dict]) -> list[dict]:
        formatted = []
        for tweet in tweets:
            if isinstance(tweet, dict):
                engagement = int(tweet.get("engagement", 0) or 0)
                text = str(tweet.get("text", ""))
                platform = str(tweet.get("platform", "twitter"))
                content_type = str(tweet.get("content_type", "post"))
                url = str(tweet.get("url", ""))
                topic = str(tweet.get("topic", ""))
                created_at = str(tweet.get("created_at", ""))
            else:
                engagement = int(tweet.engagement)
                text = tweet.text
                platform = tweet.platform
                content_type = tweet.content_type
                url = tweet.url
                topic = tweet.topic
                created_at = tweet.created_at

            formatted.append(
                {
                    "platform": platform,
                    "content_type": content_type,
                    "title": text[:80],
                    "url": url,
                    "snippet": text,
                    "relevance_score": min(engagement / 10000, 1.0),
                    "topic": topic,
                    "published_date": created_at,
                    "viral_signals": ["likes", "retweets"] if engagement > 100 else [],
                }
            )
        return formatted


if __name__ == "__main__":
    import os

    from dotenv import load_dotenv

    load_dotenv()

    token = os.environ.get("TWITTER_BEARER_TOKEN", "")
    if not token:
        print("❌ TWITTER_BEARER_TOKEN not set")
        exit(1)

    scout = YutoriTwitterScout(bearer_token=token)
    result = scout.scout(
        topics=["Claude AI", "OpenAI", "Google Gemini"],
        max_per_topic=10,
    )

    print(f"\n✅ Found: {result['total_found']} tweets")
    print(f"Summary: {result['trend_summary']}")
    print("Saved: yutori_twitter_output.json")
