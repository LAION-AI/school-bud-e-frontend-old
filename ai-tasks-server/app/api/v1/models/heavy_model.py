from pydantic import BaseModel
from typing import Optional, Dict, Any

class VideoRequest(BaseModel):
    prompt: str
    style: Optional[str] = "realistic"
    customInstructions: Optional[str] = "" 