import xml.etree.ElementTree as ET
from fastapi import HTTPException
from typing import Optional

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