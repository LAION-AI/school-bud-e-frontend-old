import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    API_PREFIX: str = ""
    DEBUG: bool = True
    PROJECT_NAME: str = "AI Tasks Server"
    MARKITDOWN_VLM_API_KEY: str = os.getenv("MARKITDOWN_VLM_API_KEY", "")
    
    # Directory paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    SEGMENTS_DIR: str = os.path.join(BASE_DIR, "segments")
    TTS_SEGMENTS_DIR: str = os.path.join(BASE_DIR, "tts_segments")

settings = Settings() 