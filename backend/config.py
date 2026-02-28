import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    tavily_api_key: str = os.getenv("TAVILY_API_KEY", "")
    reka_api_key: str = os.getenv("REKA_API_KEY", "")
    kie_api_key: str = os.getenv("KIE_API_KEY", "")
    kling_api_key: str = os.getenv("KLING_API_KEY", "")
    kling_base_url: str = os.getenv("KLING_BASE_URL", "https://api.kie.ai")
    flask_env: str = os.getenv("FLASK_ENV", "production")
    api_port: int = int(os.getenv("PORT", "5000"))


settings = Settings()
