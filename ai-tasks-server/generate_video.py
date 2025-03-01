from dotenv import load_dotenv
from fish_audio_sdk import Session, TTSRequest, ReferenceAudio
import os
import re
import json
import time
import pprint
import numpy as np
import torch
import requests
from loguru import logger
import whisper
import sentence_transformers
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from request_manager import RequestLogger
from create_simulation import get_simulation
import random
import asyncio
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



def generate_video_logic(prompt: str, output_dir: str, request_log, config: Optional[Dict[str, Any]] = None):
    """
    Main logic for generating a video novel based on a prompt.
    
    Args:
        prompt: The text prompt to generate the video from
        output_dir: Directory to save generated files
        request_log: Logger for sending progress updates
        config: Optional configuration parameters including style and custom instructions
    """
    try:
        # Log the start of processing
        request_log.log("status", "Starting video novel generation...")
        
        # Extract configuration parameters
        style = "realistic"
        custom_instructions = ""
        
        if config:
            style = config.get("style", "realistic")
            custom_instructions = config.get("custom_instructions", "")
            
        # Log the configuration
        request_log.log("status", f"Using style: {style}")
        if custom_instructions:
            request_log.log("status", "Processing custom instructions...")
        
        # Extract the video ID from the output directory
        video_id = os.path.basename(output_dir)
        request_log.log("videoId", video_id)
        
        # Simulate processing time
        time.sleep(2)
        
        # Generate a few sample images and audio segments
        for i in range(1, 6):
            # Simulate image generation
            image_filename = f"segment_{i}.webp"
            image_path = os.path.join(output_dir, image_filename)
            
            # Create a placeholder image file
            with open(image_path, "w") as f:
                f.write("placeholder image content")
                
            # Log the image file with videoId
            request_log.log("file", image_filename, videoId=video_id, order=i)
            request_log.log("status", f"Generated image {i} of 5...")
            
            # Apply style if specified
            if style != "realistic":
                request_log.log("status", f"Applying {style} style to image {i}...")
                
            # Apply custom instructions if provided
            if custom_instructions:
                request_log.log("status", f"Applying custom instructions to image {i}...")
                
            # Simulate audio generation
            audio_filename = f"segment_{i}.mp3"
            audio_path = os.path.join(output_dir, audio_filename)
            
            # Create a placeholder audio file
            with open(audio_path, "w") as f:
                f.write("placeholder audio content")
                
            # Log the audio file with videoId
            request_log.log("file", audio_filename, videoId=video_id, order=i)
            request_log.log("status", f"Generated audio {i} of 5...")
            
            # Simulate processing time
            time.sleep(1)
        
        # Finalize the generation
        request_log.log("status", "Finalizing video novel...")
        time.sleep(1)
        
        # Complete the process
        request_log.log("status", "Video novel generation complete!")
        request_log.log("complete", True)
        
    except Exception as e:
        request_log.log("status", f"Error: {str(e)}")
        raise
    finally:
        request_log.close_stream()


def createMovie(sorted_segments):
    # List of tuples: (image_path, [list of audio_paths])
    media_entries = [
        # Add more entries as needed
    ]

    for i in range(len(sorted_segments)):
        segment = sorted_segments[i]
        if len(media_entries) == 0 and segment['type'] != 'image':
            print('Error: The first segment has to be an image.')
            break
        
        if segment['type'] == 'image':
            media_entries.append((segment['image_url'], []))
        elif segment['type'] == 'text':
            last_entry = media_entries[len(media_entries) - 1]
            last_entry[1].append(segment['audio_file'])
            
    print(media_entries)
    clips = []
    def download_image(url, save_path):
        response = requests.get(url)
        if response.status_code == 200:
            with open(save_path, 'wb') as file:
                file.write(response.content)
            print(f"Image successfully downloaded: {save_path}")
        else:
            print(f"Failed to retrieve image. HTTP Status code: {response.status_code}")

    save_path = './image.webp'
    # media_entries is assumed to be defined somewhere in your code.
    # It should be an iterable of (image_url, [list_of_audio_paths]) pairs.

    for image_path, audio_paths in media_entries:
        # Load each audio clip for the current image
        audio_clips = [AudioFileClip(os.path.join(current_dir, audio_path)) for audio_path in audio_paths]
        
        # Concatenate the audio clips sequentially
        combined_audio = concatenate_audioclips(audio_clips)
        
        # Image path is actually a url
        print('Trying to request: ' + image_path)
        download_image(image_path, save_path)
        
        # Option 1: Simply trim the audio so only the first 1/10 of the audio is used.
        image_clip = ImageClip(save_path).with_duration(combined_audio.duration)
        clip = image_clip.with_audio(combined_audio)
        
        # Option 2: Alternatively, if you want the entire audio to play at 10x speed so it fits the shortened duration,
        # uncomment the next three lines and comment out Option 1 above.
        # image_clip = ImageClip(save_path).with_duration(combined_audio.duration / 10)
        # sped_up_audio = combined_audio.fx(speedx, 10)
        # clip = image_clip.with_audio(sped_up_audio)
        
        print('Successfully requested: ' + image_path)
        clips.append(clip)

    # Concatenate all image clips into one final video
    final_video = concatenate_videoclips(clips)

    # Write the final video to a file with 24 fps
    final_video.write_videofile("output_video.mp4", fps=24)
