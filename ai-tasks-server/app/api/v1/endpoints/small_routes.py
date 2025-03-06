from fastapi import APIRouter, HTTPException, Response
import os
from app.core.config import settings
from app.api.v1.models.small_model import EditRequest
from request_log import RequestLogger

router = APIRouter()

@router.get("/edit_status/{edit_hash}")
def get_edit_status(edit_hash: str):
    session = RequestLogger.session_manager.get_session(edit_hash)
    if not session:
        raise HTTPException(status_code=404, detail="Edit session not found")
    return session.to_dict()

@router.get("/media/image")
def get_image():
    image_path = os.path.join(settings.BASE_DIR, "image.webp")
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Image not found")
    with open(image_path, "rb") as f:
        image_bytes = f.read()
    return Response(content=image_bytes, media_type="image/webp")

@router.get("/media/audio/{filename}")
def get_audio(filename: str):
    audio_path = os.path.join(settings.TTS_SEGMENTS_DIR, filename)
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    with open(audio_path, "rb") as f:
        audio_bytes = f.read()
    return Response(content=audio_bytes, media_type="audio/mpeg")

@router.get("/segments/{hash}/{filename}")
def get_segment(filename: str, hash: str):
    segments_dir = os.path.join(settings.SEGMENTS_DIR, hash)
    file_path = os.path.join(segments_dir, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    if filename.endswith('.webp'):
        media_type = "image/webp"
    else:
        media_type = "audio/mpeg"
        
    with open(file_path, "rb") as f:
        file_bytes = f.read()
    return Response(content=file_bytes, media_type=media_type) 