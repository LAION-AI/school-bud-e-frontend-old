from pydantic import BaseModel
from typing import Optional, Dict, Any

class EditRequest(BaseModel):
    segment_id: str
    edit_content: str
    customInstructions: Optional[str] = "" 