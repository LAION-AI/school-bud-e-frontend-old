from fastapi import HTTPException
from markitdown import MarkItDown
from openai import OpenAI
import tempfile
import fitz  # PyMuPDF
import io
from PIL import Image

def use_markitdown(pdf_bytes, base_url=None, api_key=None, llm_model=None):
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="No PDF data received.")
    
    # Check if bytes are a list (from JSON) and convert to bytes
    if isinstance(pdf_bytes, list):
        pdf_bytes = bytes(pdf_bytes)
    
    # Validate PDF header
    if not pdf_bytes.startswith(b'%PDF-'):
        raise HTTPException(status_code=400, detail="Invalid PDF format")
    
    with tempfile.NamedTemporaryFile(suffix=".pdf", mode='wb', delete=False) as tmp:
        tmp.write(pdf_bytes)
        tmp_path = tmp.name

    client = OpenAI(
        base_url=base_url,
        api_key=api_key,
    )

    md = MarkItDown(llm_client=client, llm_model=llm_model)
    result = md.convert(tmp_path)
    
    # Extract images and convert them to text
    images = extract_images_from_pdf(pdf_bytes)
    if images:
        image_text = convert_images_to_text(images, base_url, api_key, llm_model)
        if image_text:
            # Append image text with a title
            combined_content = result.text_content + "\n\n## Images from the PDF\n\n" + image_text
            return {"content": combined_content}
    
    return {"content": result.text_content}

"""
Should return a list of images from the pdf 
"""
def extract_images_from_pdf(pdf_bytes):
    # Use the same PDF loading logic as in use_markitdown
    if not pdf_bytes:
        return []
    
    # Check if bytes are a list (from JSON) and convert to bytes
    if isinstance(pdf_bytes, list):
        pdf_bytes = bytes(pdf_bytes)
        
    with tempfile.NamedTemporaryFile(suffix=".pdf", mode='wb', delete=False) as tmp:
        tmp.write(pdf_bytes)
        tmp_path = tmp.name
    
    # Extract images using PyMuPDF
    images = []
    pdf = fitz.open(tmp_path)
    
    for page_num in range(len(pdf)):
        page = pdf[page_num]
        image_list = page.get_images(full=True)
        
        for img_index, img in enumerate(image_list):
            xref = img[0]
            base_image = pdf.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]  # Get the image extension/format from PyMuPDF
            
            # Open image from bytes
            image = Image.open(io.BytesIO(image_bytes))
            
            # Store original format if PIL didn't detect it
            if not image.format and image_ext:
                if image_ext.upper() in ('JPG', 'JPEG'):
                    image.format = 'JPEG'
                else:
                    image.format = image_ext.upper()
                    
            images.append(image)
    
    return images

"""
Should convert a list of images to a single text 
"""
def convert_images_to_text(images, base_url, api_key, llm_model):
    if not images:
        return ""
    
    base_url = base_url.replace("/chat/completions", "")
    # Create OpenAI client
    client = OpenAI(
        base_url=base_url,
        api_key=api_key,
    )
    
    # Create MarkItDown instance with the same configuration as use_markitdown
    md = MarkItDown(llm_client=client, llm_model=llm_model)
    
    # Save images to temporary files and process with MarkItDown
    combined_text = ""
    for idx, image in enumerate(images):
        print(f"Processing image {idx + 1} of {len(images)}")

        # Determine image format
        image_format = image.format if image.format else "PNG"
        suffix = f".{image_format.lower()}"
        
        with tempfile.NamedTemporaryFile(suffix=suffix, mode='wb', delete=False) as tmp:
            image.save(tmp, format=image_format)
            tmp_path = tmp.name
            
            # Use MarkItDown to extract text from the image
            result = md.convert(tmp_path)
            combined_text += result.text_content + "\n\n"
    
    return combined_text.strip()