from fastapi import APIRouter, HTTPException, Request
from .functions import use_markitdown

router = APIRouter()

@router.post("/pdf_to_markdown/")
async def pdf_to_markdown_route(request: Request):
    try:
        pdf_bytes = await request.body()

        return use_markitdown(pdf_bytes)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))