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
        else:
            raise HTTPException(status_code=415, detail="Unsupported media type")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))