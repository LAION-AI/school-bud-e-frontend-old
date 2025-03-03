import tempfile
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from markitdown import MarkItDown
import subprocess
import os
import uvicorn
from generate_video import generate_video_logic
from request_log import unique_hash, RequestLogger, init_request_logger
from fastapi.responses import StreamingResponse, JSONResponse
import asyncio
import multiprocessing_logging
import xml.etree.ElementTree as ET
from typing import Optional, Dict, Any
import shutil

multiprocessing_logging.install_mp_handler()

app = FastAPI(debug=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def isolate_xml_segment(xml_content: str, segment_id: str) -> Optional[str]:
    """
    Extract a specific segment from the XML content.
    Returns None if segment not found.
    """
    try:
        root = ET.fromstring(xml_content)
        # Find segment by ID attribute or position
        for segment in root.findall(".//segment[@id='{}']".format(segment_id)):
            return ET.tostring(segment, encoding='unicode')
        return None
    except ET.ParseError:
        raise HTTPException(status_code=400, detail="Invalid XML format")

def validate_edit_continuity(original_segment: str, edited_segment: str) -> bool:
    """
    Validate that the edited segment maintains story continuity.
    Returns True if valid, False otherwise.
    """
    try:
        orig_root = ET.fromstring(original_segment)
        edit_root = ET.fromstring(edited_segment)
        
        # Basic structure validation
        if orig_root.tag != edit_root.tag:
            return False
            
        # Ensure critical attributes are preserved
        required_attrs = ['id', 'type', 'speaker']
        for attr in required_attrs:
            if orig_root.get(attr) != edit_root.get(attr):
                return False
                
        return True
    except ET.ParseError:
        return False

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/pdf_to_markdown/")
async def pdf_to_markdown(request: Request):
    try:
        pdf_bytes = await request.body()
        if not pdf_bytes:
            raise HTTPException(status_code=400, detail="No PDF data received.")

        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(pdf_bytes)
            tmp_path = tmp.name

        md = MarkItDown()
        result = md.convert(tmp_path)

        return {"content": result.text_content}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate/video")
async def generate_video(request: Request):
    request_log = None
    try:
        body = await request.json()
        if 'prompt' not in body:
            raise HTTPException(status_code=400, detail="Prompt is required")
        
        prompt = body['prompt']
        if not isinstance(prompt, str):
            raise HTTPException(status_code=400, detail="Prompt must be a string")
            
        # Extract optional parameters
        style = body.get('style', 'realistic')
        custom_instructions = body.get('customInstructions', '')
        
        # Create a configuration object to pass to the generation logic
        config: Dict[str, Any] = {
            'style': style,
            'custom_instructions': custom_instructions
        }

        hash = unique_hash()
        current_dir = os.path.dirname(os.path.abspath(__file__))
        hash_dir = os.path.join(current_dir, "segments", hash)
        os.makedirs(hash_dir, exist_ok=True)
        request_log = RequestLogger(request)
        request_log.log("videoId", hash, videoId=hash)
        
        # Pass the config to the generation logic
        asyncio.create_task(asyncio.to_thread(
            generate_video_logic, 
            prompt, 
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

    except subprocess.CalledProcessError as e:
        print(e)
        if request_log:
            request_log.close_stream()
        raise HTTPException(status_code=500, detail=f"Failed to generate video: {str(e)}")
    except Exception as e:
        print(e)
        if request_log:
            request_log.close_stream()
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.post("/edit_story/{original_hash}")
async def edit_story(original_hash: str, request: Request):
    request_log = None
    try:
        body = await request.json()
        if 'segment_id' not in body or 'edit_content' not in body:
            raise HTTPException(status_code=400, detail="segment_id and edit_content are required")
        
        segment_id = body['segment_id']
        edit_content = body['edit_content']
        
        # Extract optional parameters
        custom_instructions = body.get('customInstructions', '')
        
        # Create a configuration object
        config: Dict[str, Any] = {
            'custom_instructions': custom_instructions
        }
        
        # Create new session
        request_log = init_request_logger(request)
        session = request_log.session_manager.create_session(original_hash)
        
        # Set up workspace
        current_dir = os.path.dirname(os.path.abspath(__file__))
        original_dir = os.path.join(current_dir, "segments", original_hash)
        edit_dir = os.path.join(current_dir, "segments", session.edit_hash)
        
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
        original_segment = isolate_xml_segment(original_xml, segment_id)
        if not original_segment:
            raise HTTPException(status_code=404, detail="Segment not found")
            
        if not validate_edit_continuity(original_segment, edit_content):
            raise HTTPException(status_code=400, detail="Invalid edit - breaks story continuity")
            
        # Update session status
        request_log.session_manager.update_session_status(session.edit_hash, "processing")
        
        # Process edit in isolated workspace with custom instructions
        asyncio.create_task(asyncio.to_thread(
            generate_video_logic,
            edit_content,
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

@app.get("/edit_status/{edit_hash}")
def get_edit_status(edit_hash: str):
    session = RequestLogger.session_manager.get_session(edit_hash)
    if not session:
        raise HTTPException(status_code=404, detail="Edit session not found")
    return session.to_dict()

@app.get("/media/image")
def get_image():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    image_path = os.path.join(current_dir, "image.webp")
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Image not found")
    with open(image_path, "rb") as f:
        image_bytes = f.read()
    return Response(content=image_bytes, media_type="image/webp")

@app.get("/media/audio/{filename}")
def get_audio(filename: str):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    audio_path = os.path.join(current_dir, "tts_segments", filename)
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    with open(audio_path, "rb") as f:
        audio_bytes = f.read()
    return Response(content=audio_bytes, media_type="audio/mpeg")

@app.post("/test-stream/")
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

@app.get("/segments/{hash}/{filename}")
def get_segment(filename: str, hash: str):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    segments_dir = os.path.join(current_dir, "segments", hash)
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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8083)
