from fastapi import APIRouter, HTTPException, Request
from .functions import use_markitdown

router = APIRouter()

@router.post("/pdf_to_markdown/")
async def pdf_to_markdown_route(request: Request):
    try:
        # Get JSON data if content type is JSON
        if request.headers.get("content-type") == "application/json":
            data = await request.json()
            pdf_bytes = data.get("pdf_bytes")
            base_url = data.get("api_url")
            api_key = data.get("api_key")
            model = data.get("api_model")
            return use_markitdown(pdf_bytes, base_url=base_url, api_key=api_key, llm_model=model)
        # Otherwise get raw PDF bytes
        else:
            pdf_bytes = await request.body()
            return use_markitdown(pdf_bytes)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))