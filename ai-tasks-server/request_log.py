from fastapi import Request
import asyncio
import atexit
import uuid
import hashlib
import json
import os
from datetime import datetime
from typing import Dict, Optional

class EditSession:
    def __init__(self, original_hash: str, edit_hash: str):
        self.original_hash = original_hash
        self.edit_hash = edit_hash
        self.status = "pending"  # pending, processing, completed, failed
        self.created_at = datetime.now().isoformat()
        self.completed_at: Optional[str] = None
        self.error: Optional[str] = None

    def to_dict(self):
        return {
            "original_hash": self.original_hash,
            "edit_hash": self.edit_hash,
            "status": self.status,
            "created_at": self.created_at,
            "completed_at": self.completed_at,
            "error": self.error
        }

class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, EditSession] = {}
        self._load_sessions()

    def create_session(self, original_hash: str) -> EditSession:
        """Create a new edit session"""
        edit_hash = self.generate_hash(original_hash)
        session = EditSession(original_hash, edit_hash)
        self.sessions[edit_hash] = session
        self._save_sessions()
        return session

    def get_session(self, edit_hash: str) -> Optional[EditSession]:
        """Get session by edit hash"""
        return self.sessions.get(edit_hash)

    def update_session_status(self, edit_hash: str, status: str, error: Optional[str] = None):
        """Update session status"""
        if session := self.sessions.get(edit_hash):
            session.status = status
            if status in ["completed", "failed"]:
                session.completed_at = datetime.now().isoformat()
            if error:
                session.error = error
            self._save_sessions()

    def generate_hash(self, original_hash: str) -> str:
        """Generate a unique hash for the edit session"""
        unique_id = f"{original_hash}_{uuid.uuid4()}"
        hash_obj = hashlib.sha256(unique_id.encode())
        return hash_obj.hexdigest()

    def _save_sessions(self):
        """Save sessions to disk"""
        sessions_data = {
            hash_: session.to_dict() 
            for hash_, session in self.sessions.items()
        }
        current_dir = os.path.dirname(os.path.abspath(__file__))
        with open(os.path.join(current_dir, "sessions.json"), "w") as f:
            json.dump(sessions_data, f, indent=2)

    def _load_sessions(self):
        """Load sessions from disk"""
        current_dir = os.path.dirname(os.path.abspath(__file__))
        try:
            with open(os.path.join(current_dir, "sessions.json"), "r") as f:
                sessions_data = json.load(f)
                for hash_, data in sessions_data.items():
                    session = EditSession(data["original_hash"], hash_)
                    session.status = data["status"]
                    session.created_at = data["created_at"]
                    session.completed_at = data.get("completed_at")
                    session.error = data.get("error")
                    self.sessions[hash_] = session
        except FileNotFoundError:
            pass

def unique_hash():
    """Generate a unique hash for new story requests"""
    unique_id = str(uuid.uuid4())
    hash_obj = hashlib.sha256(unique_id.encode())
    return hash_obj.hexdigest()

class RequestLogger:
    _active_loggers = set()
    session_manager = SessionManager()

    def __init__(self, request_obj: Request):
        """
        Initialize request logger with FastAPI request object.
        
        Args:
            request_obj: FastAPI request object
        """
        self.request = request_obj
        self._stream_queue = []
        self._is_streaming = True
        RequestLogger._active_loggers.add(self)

    def log(self, type_name, data, videoId=None, order=None):
        """
        Add data to the response stream.
        
        Args:
            type_name (str): Type of data being streamed
            data: Content to stream
            order (Optional[int]): Order of the segment
        """
        self._stream_queue.append({
            'type': type_name,
            'data': data,
            'order': order,
            'videoId': videoId
        })

    async def create_stream(self):
        """
        Create async stream that yields new data as it arrives.
        
        Yields:
            dict: Stream of data entries as they are logged
        """
        while self._is_streaming or self._stream_queue:
            if self._stream_queue:
                yield self._stream_queue.pop(0)
            await asyncio.sleep(0.1)  # Prevent busy waiting

    def close_stream(self):
        """
        Mark the stream as complete and remove from active loggers.
        """
        self._is_streaming = False
        RequestLogger._active_loggers.discard(self)

    @classmethod
    def close_all_streams(cls):
        """
        Close all active request logger streams.
        """
        for logger in cls._active_loggers.copy():
            logger.close_stream()

def init_request_logger(request):
    """
    Initialize a new RequestLogger instance.
    
    Args:
        request: FastAPI request object
    
    Returns:
        RequestLogger: New logger instance for the request
    """
    return RequestLogger(request)

# Register close_all_streams to run on program exit
atexit.register(RequestLogger.close_all_streams)
