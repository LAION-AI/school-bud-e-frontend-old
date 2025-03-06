from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse

router = APIRouter()

@router.post("/test-stream/")
async def test_stream():
    request_log = RequestLogger(None)
    
    request_log.log("file", "https://picsum.photos/300/300.webp", order=1)
    request_log.log("file", "/segments/hash2/segment_11.mp3", order=2)
    request_log.log("file", "https://picsum.photos/300/300.webp", order=3)
    request_log.log("file", "/segments/hash2/segment_11.mp3", order=4)
    request_log.log("file", "/segments/hash2/segment_11.mp3", order=5)
    request_log.log("file", "/segments/hash2/segment_11.mp3", order=6)
    
    request_log.log("status", "Done")

    async def json_stream():
        async for item in request_log.create_stream():
            yield JSONResponse(content=item).body + b"\n"
            
    return StreamingResponse(json_stream(), media_type="application/json") 

from app.api.v1.models.heavy_model import VideoRequest
from app.api.v1.models.small_model import EditRequest
from app.utils.helpers import isolate_xml_segment, validate_edit_continuity
from request_log import unique_hash, RequestLogger, init_request_logger
from generate_video import generate_video_logic
import asyncio
import os
import tempfile
import shutil
from app.core.config import settings
from typing import Dict, Any

@router.post("/api/generate/video")
async def generate_video(request: Request):
    request_log = None
    try:
        body = await request.json()
        video_request = VideoRequest(**body)
        
        # Create a configuration object to pass to the generation logic
        config: Dict[str, Any] = {
            'style': video_request.style,
            'custom_instructions': video_request.customInstructions
        }

        hash = unique_hash()
        hash_dir = os.path.join(settings.SEGMENTS_DIR, hash)
        os.makedirs(hash_dir, exist_ok=True)
        request_log = RequestLogger(request)
        request_log.log("videoId", hash, videoId=hash)
        
        # Pass the config to the generation logic
        asyncio.create_task(asyncio.to_thread(
            generate_video_logic, 
            video_request.prompt, 
            hash_dir, 
            request_log, 
            config
        ))
        
        async def json_stream():
            async for item in request_log.create_stream():
                # Remove any videoId field that might have been added
                if 'videoId' in item and item['type'] != 'videoId':
                    del item['videoId']
                yield JSONResponse(content=item).body + b"\n"
                
        return StreamingResponse(json_stream(), media_type="application/json")

    except Exception as e:
        print(e)
        if request_log:
            request_log.close_stream()
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@router.post("/edit_story/{original_hash}")
async def edit_story(original_hash: str, request: Request):
    request_log = None
    try:
        body = await request.json()
        edit_request = EditRequest(**body)
        
        # Create a configuration object
        config: Dict[str, Any] = {
            'custom_instructions': edit_request.customInstructions
        }
        
        # Create new session
        request_log = init_request_logger(request)
        session = request_log.session_manager.create_session(original_hash)
        
        # Set up workspace
        original_dir = os.path.join(settings.SEGMENTS_DIR, original_hash)
        edit_dir = os.path.join(settings.SEGMENTS_DIR, session.edit_hash)
        
        # Copy original workspace
        if not os.path.exists(original_dir):
            raise HTTPException(status_code=404, detail="Original story not found")
        os.makedirs(edit_dir, exist_ok=True)
        shutil.copytree(original_dir, edit_dir, dirs_exist_ok=True)
        
        # Read original XML
        xml_path = os.path.join(original_dir, "final_audiobook_input.xml")
        if not os.path.exists(xml_path):
            raise HTTPException(status_code=404, detail="Original XML not found")
            
        with open(xml_path, "r") as f:
            original_xml = f.read()
            
        # Isolate and validate segment
        original_segment = isolate_xml_segment(original_xml, edit_request.segment_id)
        if not original_segment:
            raise HTTPException(status_code=404, detail="Segment not found")
            
        if not validate_edit_continuity(original_segment, edit_request.edit_content):
            raise HTTPException(status_code=400, detail="Invalid edit - breaks story continuity")
            
        # Update session status
        request_log.session_manager.update_session_status(session.edit_hash, "processing")
        
        # Process edit in isolated workspace with custom instructions
        asyncio.create_task(asyncio.to_thread(
            generate_video_logic,
            edit_request.edit_content,
            edit_dir,
            request_log,
            config
        ))
        
        async def json_stream():
            async for item in request_log.create_stream():
                # Remove any videoId field that might have been added
                if 'videoId' in item and item['type'] != 'videoId':
                    del item['videoId']
                yield JSONResponse(content=item).body + b"\n"
                
        return StreamingResponse(json_stream(), media_type="application/json")

    except Exception as e:
        print(e)
        if request_log:
            request_log.session_manager.update_session_status(
                session.edit_hash,
                "failed",
                str(e)
            )
            request_log.close_stream()
        raise HTTPException(status_code=500, detail=str(e))
