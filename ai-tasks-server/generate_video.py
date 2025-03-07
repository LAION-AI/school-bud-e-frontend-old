from dotenv import load_dotenv
from fish_audio_sdk import Session, TTSRequest, ReferenceAudio
import os
import re
import json
import time
import numpy as np
import openai
import torch
import requests
from loguru import logger
import whisper
import sentence_transformers
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from request_log import RequestLogger
from create_simulation import get_simulation
from typing import Dict, Any, Optional

current_dir = os.path.dirname(os.path.abspath(__file__))

# Load environment variables from .env file
load_dotenv(os.path.join(current_dir, '.env'))

# Create array to store processed segments

# -----------------------------
# Global Voice Assignments
# -----------------------------
global_voice_assignments = {}

sorted_segments = []
# No need for nest_asyncio since we're not in Jupyter and it causes issues with uvloop

# -------------------------
# API Keys and Fish Session
# -------------------------
FISH_API_KEY = os.environ.get("FISH_API_KEY")  # Get from environment variable
session = Session(FISH_API_KEY)

# -------------------------
# HyperLab API Key (for image generation)
# -------------------------
HYPRLAB_API_KEY = os.environ.get("HYPRLAB_API_KEY")
print("HyperLab API Key:", HYPRLAB_API_KEY)

# -------------------------
# Determine device
# -------------------------
device_flag = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Running on {device_flag}.")

# -------------------------
# Load writing cheat sheet from file (if present)
# -------------------------
CHEAT_SHEET_PATH = os.path.join(current_dir, "writing_cheat_sheet.txt")
if not os.path.isfile(CHEAT_SHEET_PATH):
    print(f"Error: Cheat sheet file '{CHEAT_SHEET_PATH}' not found.")
    cheat_sheet = ""
else:
    with open(CHEAT_SHEET_PATH, "r", encoding="utf-8") as f:
        cheat_sheet = f.read()

# -------------------------
# Load Whisper model into memory (for TTS reference processing)
# -------------------------
logger.info("Loading Whisper model into memory...")
whisper_model = whisper.load_model("base")
logger.info("Whisper-base loaded.")
print("Initial model loading complete.")

"""
Revised Audiobook Generation Script (with parallel requests to Fish and HyperLab APIs).
"""

# -----------------------------
# Helper Functions for XML Parsing
# -----------------------------
def clean_emotion_key(emotion_str):
    """
    Clean the emotion string by removing extraneous parts.
    """
    parts = emotion_str.split('_')
    if len(parts) >= 4:
        candidate = "_".join(parts[3:])
    else:
        candidate = emotion_str
    candidate_parts = candidate.split('_')
    if candidate_parts and candidate_parts[-1].isdigit():
        candidate = "_".join(candidate_parts[:-1])
    return candidate.replace("_", " ")

def parse_element(s, pos):
    """
    Recursively parse an XML element from the string starting at position pos.
    Extracts the text inside the opening tag, ignoring attributes after the first token.
    Returns a tuple (parsed_element, new_pos).
    """
    open_tag_match = re.match(r'<\s*([^>]+)>', s[pos:])
    if not open_tag_match:
        raise ValueError(f"No opening tag found at position {pos}")
    tag_full = open_tag_match.group(1).strip()
    tag = tag_full.split()[0]  # first token as the tag name
    end_open = s[pos:].find('>')
    if end_open == -1:
        raise ValueError(f"Malformed tag starting at position {pos}")
    pos += end_open + 1

    content = []
    while pos < len(s):
        if s[pos:pos+2] == '</':
            close_tag_match = re.match(r'</\s*([^>\s]+)', s[pos:])
            if not close_tag_match:
                print(f"ERROR: Expected closing tag for <{tag}> at position {pos}. Breaking out.")
                break
            closing_tag = close_tag_match.group(1).strip()
            if closing_tag != tag:
                print(f"ERROR: Mismatched closing tag: expected </{tag}> but found </{closing_tag}> at pos {pos}.")
            end_close = s[pos:].find('>')
            if end_close == -1:
                pos = len(s)
            else:
                pos += end_close + 1
            break
        elif s[pos] == '<':
            try:
                child, pos = parse_element(s, pos)
                content.append(child)
            except ValueError as e:
                print(f"WARNING: {e} Skipping malformed tag at position {pos}.")
                next_gt = s.find('>', pos)
                if next_gt == -1:
                    break
                pos += next_gt + 1
        else:
            next_lt = s.find('<', pos)
            if next_lt == -1:
                text = s[pos:].strip()
                pos = len(s)
            else:
                text = s[pos:next_lt].strip()
                pos = next_lt
            if text:
                content.append(text)
    if isinstance(content, list) and content and all(isinstance(x, str) for x in content):
        value = " ".join(content)
    elif len(content) == 1:
        value = content[0]
    else:
        value = content
    return {tag: value}, pos

def parse_string(s):
    """
    Parse the entire XML string into a list of elements.
    """
    pos = 0
    result = []
    while pos < len(s):
        while pos < len(s) and s[pos].isspace():
            pos += 1
        if pos >= len(s):
            break
        if s[pos] != '<':
            next_lt = s.find('<', pos)
            if next_lt == -1:
                break
            pos = next_lt
        element, pos = parse_element(s, pos)
        result.append(element)
    return result

def traverse_tree(speaker, node, current_emotion="default"):
    """
    Recursively traverse the parsed XML tree, extracting text/image segments.
    - If the current tag is one of the known speakers, we treat it as a speaker change.
    - If the current tag is "IMAGE...", it's an image segment.
    - Otherwise, treat the tag as an emotion indicator.
    """
    segments = []
    if isinstance(node, str):
        segments.append({
            "type": "text",
            "speaker": speaker,
            "emotion": current_emotion,
            "text": node
        })
    elif isinstance(node, dict):
        for key, value in node.items():
            lower_key = key.strip().lower()
            if lower_key == "assign_voice":
                # Skip the voice assignment block
                continue
            if key.strip().upper().startswith("IMAGE"):
                # It's an image
                caption = ""
                if isinstance(value, str):
                    caption = value.strip()
                elif isinstance(value, list):
                    caption = " ".join([str(item) for item in value if isinstance(item, str)]).strip()
                else:
                    caption = str(value).strip()
                segments.append({
                    "type": "image",
                    "image_tag": key,
                    "caption": caption
                })
            else:
                # Possibly a speaker or an emotion
                candidate = key.strip()
                known_speakers = {"STORYTELLER", "JOHN", "NICOLE", "JENNIFFER", "BARBARA", "HENRY"}
                if candidate.upper() in known_speakers:
                    new_speaker = candidate.upper()
                    segments.extend(traverse_tree(new_speaker, value, current_emotion=current_emotion))
                else:
                    segments.extend(traverse_tree(speaker, value, current_emotion=candidate))
    elif isinstance(node, list):
        for item in node:
            segments.extend(traverse_tree(speaker, item, current_emotion=current_emotion))
    return segments

def extract_segments_combined(parsed_data):
    """
    Extract only the <Audiobook Narration> or <Audiobook> blocks.
    Flatten them into a list of segments with an 'order' index.
    """
    segments = []
    for element in parsed_data:
        for key, content in element.items():
            lower_key = key.strip().lower()
            if lower_key in ["audiobook narration", "audiobook"]:
                segments.extend(traverse_tree("", content, current_emotion="default"))
    for i, seg in enumerate(segments):
        seg["order"] = i
    return segments


def extract_assign_voice_mappings(story_text, model, voice_profile_keys, voice_profile_embeddings, existing_assignments):
    print('Well this works')
    assign_pattern = re.compile(r'<ASSIGN_VOICE>(.*?)</ASSIGN_VOICE>', re.DOTALL | re.IGNORECASE)
    print('And this too')
    matches = assign_pattern.findall(story_text)
    print('Why did this work?')
    for match in matches:
        print("DEBUG: Found ASSIGN_VOICE content:", match)
        parts = match.split(';')
        for part in parts:
            part = part.strip()
            if not part:
                continue
            if '=' in part:
                name, voice_str = part.split('=', 1)
                name = name.strip().upper()
                voice_str = voice_str.strip()
                if name in existing_assignments:
                    print(f"  Speaker '{name}' already assigned to '{existing_assignments[name]}'.")
                    continue
                if voice_str in voice_profile_keys:
                    chosen_voice = voice_str
                    print(f"  Speaker '{name}': exact match found: '{chosen_voice}'")
                else:
                    print(f"  Speaker '{name}': no exact match for '{voice_str}'. Computing similarities.")
                    voice_str_emb = model.encode([voice_str], normalize_embeddings=True)
                    sims = np.dot(voice_profile_embeddings, voice_str_emb[0])
                    best_idx = np.argmax(sims)
                    chosen_voice = voice_profile_keys[best_idx]
                    print(f"    Best match: '{chosen_voice}' with similarity {sims[best_idx]:.4f}")
                existing_assignments[name] = chosen_voice
    story_cleaned = assign_pattern.sub("", story_text)
    return existing_assignments, story_cleaned

# -----------------------------
# Initialize Sentence Transformer
# -----------------------------
device_st = "cuda" if torch.cuda.is_available() else "cpu"
model_st = sentence_transformers.SentenceTransformer('BAAI/bge-small-en-v1.5', device=device_st)

# Load voice mapping
voice_mapping_path = os.path.join(current_dir, "emottsvoices", "folder_mp3_mapping.json")
with open(voice_mapping_path, "r", encoding="utf-8") as file:
    voice_emotion_reference_dict = json.load(file)

voice_profile_keys = list(voice_emotion_reference_dict.keys())
voice_profile_embeddings = model_st.encode(voice_profile_keys, normalize_embeddings=True)
print("DEBUG: Precomputed embeddings for voice profile keys:", len(voice_profile_keys))



# Prepare inner embeddings for each voice profile
inner_embeddings_dict = {}
for vp in voice_emotion_reference_dict:
    emotion_dict = voice_emotion_reference_dict[vp]
    raw_keys = list(emotion_dict.keys())
    cleaned_keys = [clean_emotion_key(k) for k in raw_keys]
    emb = model_st.encode(cleaned_keys, normalize_embeddings=True)
    inner_embeddings_dict[vp] = {
        "raw_keys": raw_keys,
        "cleaned_keys": cleaned_keys,
        "embeddings": emb
    }

# -----------------------------
# HyperLab API for Image Generation (with retry)
# -----------------------------
def generate_image_with_retry(prompt):
    print('image generation started')
    """
    Call the HyperLab API to generate an image for the given prompt.
    Retries with exponential backoff starting at 500ms up to 10 seconds.
    Returns the URL or None if unsuccessful.
    """
    url = "https://api.hyprlab.io/v1/images/generations"
    headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {HYPRLAB_API_KEY}"
    }
    data = {
    "model": "flux-1.1-pro",
    "prompt": prompt,
    "steps": 20,
    "height": 1024,
    "width": 1024,
    "response_format": "url",
    "output_format": "webp"
    }
    delays = [0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    for delay in delays:
        try:
            response = requests.post(url, headers=headers, json=data)
            if response.status_code == 200:
                res_json = response.json()
                print('image generation done')
                if "data" in res_json and len(res_json["data"]) > 0:
                    return res_json["data"][0]["url"]
            else:
                print(f"Error generating image (status {response.status_code}): {response.text}")
        except Exception as e:
            print(f"Exception generating image: {e}")
        time.sleep(delay)
    return None

# -----------------------------
# Helper for Fish API TTS generation with retry
# -----------------------------
def generate_tts_segment(seg, tts_request, out_path):
    """
    Call the Fish API TTS with the given TTSRequest.
    Retries with exponential backoff starting at 500ms up to 10 seconds.
    On success, writes the output to out_path and returns (segment order, out_path).
    """
    delays = [0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    for delay in delays:
        try:
            with open(out_path, "wb") as f:
                for chunk in session.tts(tts_request):
                    f.write(chunk)
            return (seg["order"], out_path)
        except Exception as e:
            print(f"Error generating TTS for segment {seg['order']} on attempt with delay {delay} s: {e}")
            time.sleep(delay)
    print(f"Segment {seg['order']} failed after all retries. Skipping.")
    return (seg["order"], None)

def generate_segments_from_prompt(prompt: str):
    """
    Generate segments from a prompt.
    """
    segments = []
    # ask ai
    response = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that generates segments from a prompt."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )
    segments = json.loads(response.choices[0].message.content)
    for segment in segments:
        segments.append({
            "type": segment["type"],
            "text": segment["text"],
            "speaker": segment["speaker"],
            "emotion": segment["emotion"]
        })
        
    return segments
    


def generate_video_logic(prompt: str, output_dir: str, request_log, config: Optional[Dict[str, Any]] = None, video_id: Optional[str] = None):
    """
    Main logic for generating a video novel based on a prompt.
    
    Args:
        prompt: The XML story input containing character dialogue and scene descriptions
        output_dir: Directory to save generated files
        request_log: Logger for sending progress updates
        config: Optional configuration parameters including style and custom instructions
    """
    try:
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Extract the video ID from the output directory
        request_log.log("videoId", video_id, videoId=video_id)
        
        
        # Extract voice assignments and clean the story text
        voice_assignments, cleaned_story = extract_assign_voice_mappings(
            prompt, 
            model_st, 
            voice_profile_keys, 
            voice_profile_embeddings, 
            global_voice_assignments
        )
        
        # Extract segments from the cleaned story
        segments = extract_segments_combined(parse_string(cleaned_story))
        
        # Track current segment for ordering
        current_segment = 0
        
        # Process each segment in order
        for segment in segments:
            current_segment += 1
            
            if segment["type"] == "image":
                # Generate image for scene
                image_prompt = segment["caption"]
                image_url = generate_image_with_retry(image_prompt)
                
                if image_url:
                    # Download and save the image
                    image_filename = f"segment_{current_segment}.webp"
                    image_path = os.path.join(output_dir, image_filename)
                    
                    response = requests.get(image_url)
                    if response.status_code == 200:
                        with open(image_path, "wb") as f:
                            f.write(response.content)
                        segment["image_url"] = image_url  # Store URL for video creation
                        request_log.log("file", image_filename, videoId=video_id, order=current_segment)
                        request_log.log("status", f"Generated image for scene: {image_prompt[:50]}...", videoId=video_id)
                    else:
                        request_log.log("status", f"Failed to download image for scene: {image_prompt[:50]}...", videoId=video_id)
                
            elif segment["type"] == "text":
                # Get the appropriate voice for this speaker
                speaker = segment["speaker"].upper()
                voice_preset = voice_assignments.get(speaker, "default")
                
                # Get the emotion for this segment
                emotion = segment["emotion"]
                
                # Find the most appropriate emotional voice variant
                if voice_preset in inner_embeddings_dict:
                    emotion_data = inner_embeddings_dict[voice_preset]
                    emotion_emb = model_st.encode([emotion], normalize_embeddings=True)
                    sims = np.dot(emotion_data["embeddings"], emotion_emb[0])
                    best_idx = np.argmax(sims)
                    voice_variant = emotion_data["raw_keys"][best_idx]
                else:
                    voice_variant = voice_preset
                
                # Generate audio for this segment
                audio_filename = f"segment_{current_segment}.mp3"
                audio_path = os.path.join(output_dir, audio_filename)
                
                tts_request = TTSRequest(
                    text=segment["text"],
                    voice_preset=voice_variant
                )
                
                try:
                    with open(audio_path, "wb") as f:
                        for chunk in session.tts(tts_request):
                            f.write(chunk)
                    segment["audio_file"] = audio_path  # Store path for video creation
                    request_log.log("file", audio_filename, videoId=video_id, order=current_segment)
                    request_log.log("status", f"Generated audio for {speaker}: {segment['text'][:50]}...", videoId=video_id)
                except Exception as e:
                    request_log.log("status", f"Failed to generate audio for {speaker}: {str(e)}", videoId=video_id)
            
            time.sleep(1)  # Small delay between generations
        
        # Store the processed segments for video creation
        global sorted_segments
        sorted_segments = segments
        
        # Finalize the generation
        request_log.log("status", "Finalizing video novel...", videoId=video_id)
        request_log.log("status", "Video novel generation complete!", videoId=video_id)
        request_log.log("complete", True)
        
    except Exception as e:
        request_log.log("status", f"Error: {str(e)}", videoId=video_id)
        raise
    finally:
        request_log.close_stream()

