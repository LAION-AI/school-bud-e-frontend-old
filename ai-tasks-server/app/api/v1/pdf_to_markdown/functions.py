from fastapi import HTTPException
from markitdown import MarkItDown
from openai import OpenAI
import tempfile
from app.core.config import settings
import fitz  # PyMuPDF
import io
from PIL import Image

def use_markitdown(pdf_bytes, base_url="https://api.groq.com/openai/v1", api_key=settings.MARKITDOWN_VLM_API_KEY, llm_model="llama-3.2-90b-vision-preview"):
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="No PDF data received.")
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(pdf_bytes)
        tmp_path = tmp.name

    client = OpenAI(
        base_url=base_url,
        api_key=api_key,
    )

    md = MarkItDown(llm_client=client, llm_model=llm_model)
    result = md.convert(tmp_path)
    print(result.text_content)
    
    # Extract images and convert them to text
    images = extract_images_from_pdf(pdf_bytes)
    if images:
        print(f"Found {len(images)} images in the PDF")
        image_text = convert_images_to_text(images)
        if image_text:
            # Append image text with a title
            combined_content = result.text_content + "\n\n## Images from the PDF\n\n" + image_text
            print(combined_content)
            return {"content": combined_content}
    
    return {"content": result.text_content}

"""
Should return a list of images from the pdf 
"""
def extract_images_from_pdf(pdf_bytes):
    # Use the same PDF loading logic as in use_markitdown
    if not pdf_bytes:
        return []
        
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
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
            
            image = Image.open(io.BytesIO(image_bytes))
            images.append(image)
    
    return images

"""
Should convert a list of images to a single text 
"""
def convert_images_to_text(images):
    if not images:
        return ""
    
    # Create OpenAI client
    client = OpenAI(
        base_url='https://api.groq.com/openai/v1',
        api_key=settings.MARKITDOWN_VLM_API_KEY,
    )
    
    # Create MarkItDown instance with the same configuration as use_markitdown
    md = MarkItDown(llm_client=client, llm_model="llama-3.2-90b-vision-preview")
    
    # Save images to temporary files and process with MarkItDown
    combined_text = ""
    for idx, image in enumerate(images):
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            image.save(tmp, format="PNG")
            tmp_path = tmp.name
            
            # Use MarkItDown to extract text from the image
            result = md.convert(tmp_path)
            combined_text += result.text_content + "\n\n"
    
    return combined_text.strip()