import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    API_PREFIX: str = ""
    DEBUG: bool = True
    
    # Directory paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    SEGMENTS_DIR: str = os.path.join(BASE_DIR, "segments")
    TTS_SEGMENTS_DIR: str = os.path.join(BASE_DIR, "tts_segments")

settings = Settings() 