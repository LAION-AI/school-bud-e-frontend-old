import pytest
from fastapi.testclient import TestClient
from main import app, isolate_xml_segment, validate_edit_continuity
from request_manager import RequestLogger, EditSession
import os
import json
import xml.etree.ElementTree as ET

client = TestClient(app)

# Test data
SAMPLE_XML = """
<audiobook>
    <segment id="1" type="text" speaker="STORYTELLER">
        <content>Once upon a time</content>
    </segment>
    <segment id="2" type="image">
        <caption>A beautiful forest</caption>
    </segment>
    <segment id="3" type="text" speaker="JOHN">
        <content>Hello there!</content>
    </segment>
</audiobook>
"""

VALID_EDIT = """
<segment id="1" type="text" speaker="STORYTELLER">
    <content>Once upon a time in a magical land</content>
</segment>
"""

INVALID_EDIT = """
<segment id="1" type="text" speaker="JOHN">
    <content>Breaking continuity by changing speaker</content>
</segment>
"""

@pytest.fixture
def setup_test_files(tmp_path):
    """Set up test files and directories"""
    segments_dir = tmp_path / "segments"
    segments_dir.mkdir()
    test_hash = "test123"
    story_dir = segments_dir / test_hash
    story_dir.mkdir()
    
    xml_file = story_dir / "final_audiobook_input.xml"
    xml_file.write_text(SAMPLE_XML)
    
    return {
        "base_dir": tmp_path,
        "segments_dir": segments_dir,
        "test_hash": test_hash,
        "story_dir": story_dir,
        "xml_file": xml_file
    }

def test_isolate_xml_segment():
    """Test XML segment isolation"""
    # Test valid segment
    result = isolate_xml_segment(SAMPLE_XML, "1")
    assert result is not None
    assert "Once upon a time" in result
    
    # Test non-existent segment
    result = isolate_xml_segment(SAMPLE_XML, "999")
    assert result is None
    
    # Test invalid XML
    with pytest.raises(HTTPException) as exc:
        isolate_xml_segment("<invalid>xml", "1")
    assert exc.value.status_code == 400

def test_validate_edit_continuity():
    """Test edit continuity validation"""
    original = isolate_xml_segment(SAMPLE_XML, "1")
    
    # Test valid edit
    assert validate_edit_continuity(original, VALID_EDIT) is True
    
    # Test invalid edit (speaker change)
    assert validate_edit_continuity(original, INVALID_EDIT) is False
    
    # Test invalid XML
    assert validate_edit_continuity(original, "<invalid>xml") is False

def test_session_management():
    """Test session management functionality"""
    # Initialize session manager
    request_log = RequestLogger(None)
    
    # Create new session
    original_hash = "test123"
    session = request_log.session_manager.create_session(original_hash)
    
    # Verify session creation
    assert session.original_hash == original_hash
    assert session.status == "pending"
    assert session.error is None
    
    # Update session status
    request_log.session_manager.update_session_status(session.edit_hash, "processing")
    updated = request_log.session_manager.get_session(session.edit_hash)
    assert updated.status == "processing"
    
    # Test error handling
    error_msg = "Test error"
    request_log.session_manager.update_session_status(session.edit_hash, "failed", error_msg)
    failed = request_log.session_manager.get_session(session.edit_hash)
    assert failed.status == "failed"
    assert failed.error == error_msg

def test_edit_story_endpoint(setup_test_files):
    """Test the edit_story endpoint"""
    files = setup_test_files
    
    # Test valid edit request
    response = client.post(
        f"/edit_story/{files['test_hash']}",
        json={
            "segment_id": "1",
            "edit_content": VALID_EDIT
        }
    )
    assert response.status_code == 200
    
    # Test invalid segment ID
    response = client.post(
        f"/edit_story/{files['test_hash']}",
        json={
            "segment_id": "999",
            "edit_content": VALID_EDIT
        }
    )
    assert response.status_code == 404
    
    # Test invalid edit content
    response = client.post(
        f"/edit_story/{files['test_hash']}",
        json={
            "segment_id": "1",
            "edit_content": INVALID_EDIT
        }
    )
    assert response.status_code == 400

def test_edit_status_endpoint():
    """Test the edit_status endpoint"""
    # Create a test session
    request_log = RequestLogger(None)
    session = request_log.session_manager.create_session("test123")
    
    # Test valid status request
    response = client.get(f"/edit_status/{session.edit_hash}")
    assert response.status_code == 200
    data = response.json()
    assert data["original_hash"] == "test123"
    assert data["status"] == "pending"
    
    # Test non-existent session
    response = client.get("/edit_status/nonexistent")
    assert response.status_code == 404

def test_workspace_isolation(setup_test_files):
    """Test workspace isolation for edits"""
    files = setup_test_files
    
    # Create an edit session
    response = client.post(
        f"/edit_story/{files['test_hash']}",
        json={
            "segment_id": "1",
            "edit_content": VALID_EDIT
        }
    )
    assert response.status_code == 200
    
    # Verify that original workspace is unchanged
    original_xml = (files['story_dir'] / "final_audiobook_input.xml").read_text()
    assert original_xml == SAMPLE_XML
    
    # Verify that edit workspace exists
    segments_dir = files['segments_dir']
    edit_dirs = [d for d in segments_dir.iterdir() if d.name != files['test_hash']]
    assert len(edit_dirs) > 0

def test_concurrent_edits(setup_test_files):
    """Test handling of concurrent edits"""
    files = setup_test_files
    
    # Create multiple edit sessions
    sessions = []
    for i in range(3):
        response = client.post(
            f"/edit_story/{files['test_hash']}",
            json={
                "segment_id": "1",
                "edit_content": VALID_EDIT
            }
        )
        assert response.status_code == 200
        sessions.append(response)
    
    # Verify each edit got its own workspace
    segments_dir = files['segments_dir']
    edit_dirs = [d for d in segments_dir.iterdir() if d.name != files['test_hash']]
    assert len(edit_dirs) >= 3

if __name__ == "__main__":
    pytest.main([__file__])
