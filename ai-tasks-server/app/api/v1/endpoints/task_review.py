from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import tempfile
import fitz  # PyMuPDF
import io
from PIL import Image
from openai import OpenAI
import base64
from ..pdf_to_markdown.functions import extract_images_from_pdf, use_markitdown

router = APIRouter()

class TaskReviewRequest(BaseModel):
    base_url: str
    api_key: str
    llm_model: str
    pdf_bytes: List[int]  # PDF as bytes array

class StudentResponse(BaseModel):
    student_id: str
    student_name: str
    responses: List[Dict[str, Any]]
    score: float
    max_score: float
    
class TaskIdentification(BaseModel):
    task_id: str
    task_text: str
    task_type: str  # "multiple_choice", "short_answer", "essay", "calculation"
    image_data: Optional[str] = None  # Base64 encoded image
    max_points: float
    page_number: int

class ReviewResult(BaseModel):
    tasks: List[TaskIdentification]
    students: List[StudentResponse]
    total_students: int
    
@router.post("/analyze-assignment", response_model=ReviewResult)
async def analyze_assignment(request: TaskReviewRequest):
    """
    Analyze a PDF containing student assignments to:
    1. Identify tasks and questions
    2. Extract student responses 
    3. Provide AI-generated ratings
    """
    try:
        # Convert list to bytes
        pdf_bytes = bytes(request.pdf_bytes)
        
        # Extract text content and images from PDF
        markdown_result = use_markitdown(
            pdf_bytes, 
            request.base_url, 
            request.api_key, 
            request.llm_model
        )
        
        # Extract images for visual context
        images = extract_images_from_pdf(pdf_bytes)
        
        # Analyze PDF with AI to identify tasks and student responses
        analysis_result = await analyze_pdf_content(
            markdown_result["content"],
            images,
            request.base_url,
            request.api_key,
            request.llm_model
        )
        
        return analysis_result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze assignment: {str(e)}")

async def analyze_pdf_content(content: str, images: List[Image.Image], base_url: str, api_key: str, llm_model: str) -> ReviewResult:
    """Use AI to analyze the PDF content and identify tasks and student responses"""
    
    # Convert images to base64 for AI analysis
    image_data_list = []
    for i, image in enumerate(images):
        buffer = io.BytesIO()
        image_format = image.format if image.format else "PNG"
        image.save(buffer, format=image_format)
        image_b64 = base64.b64encode(buffer.getvalue()).decode()
        image_data_list.append(f"data:image/{image_format.lower()};base64,{image_b64}")
    
    # Create OpenAI client
    base_url = base_url.replace("/chat/completions", "")
    client = OpenAI(base_url=base_url, api_key=api_key)
    
    # AI prompt to analyze the content
    system_prompt = """You are an expert teacher assistant that analyzes student assignments. 
    Your task is to:
    1. Identify all tasks/questions in the assignment
    2. Identify student responses for each task
    3. Provide suggested scores based on correctness and quality
    4. Extract any relevant images associated with tasks
    
    Return your analysis as a JSON object with this structure:
    {
        "tasks": [
            {
                "task_id": "unique_id",
                "task_text": "The question or task description",
                "task_type": "multiple_choice|short_answer|essay|calculation|other",
                "max_points": 10.0,
                "page_number": 1
            }
        ],
        "students": [
            {
                "student_id": "unique_student_id",
                "student_name": "Student Name",
                "responses": [
                    {
                        "task_id": "task_id_reference",
                        "response_text": "Student's answer",
                        "suggested_score": 8.5,
                        "feedback": "Explanation of scoring"
                    }
                ],
                "score": 85.0,
                "max_score": 100.0
            }
        ],
        "total_students": 1
    }"""
    
    user_prompt = f"""Please analyze this assignment content and identify all tasks and student responses:

CONTENT:
{content}

IMAGES AVAILABLE: {len(image_data_list)} images are included in this assignment.

Please provide a detailed analysis identifying:
1. Each task/question with its type and point value
2. Each student's responses to each task
3. Suggested scoring for each response with justification
4. Overall performance summary

Format your response as the JSON structure specified in the system prompt."""
    
    try:
        response = client.chat.completions.create(
            model=llm_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3
        )
        
        # Parse AI response
        ai_response = response.choices[0].message.content
        
        # Extract JSON from response (handle cases where AI adds extra text)
        import re
        json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
        if json_match:
            json_str = json_match.group()
            analysis_data = json.loads(json_str)
        else:
            # Fallback if no JSON found
            analysis_data = json.loads(ai_response)
        
        # Convert to our models
        tasks = [
            TaskIdentification(
                task_id=task["task_id"],
                task_text=task["task_text"],
                task_type=task["task_type"],
                max_points=task["max_points"],
                page_number=task.get("page_number", 1),
                image_data=image_data_list[0] if image_data_list else None
            )
            for task in analysis_data.get("tasks", [])
        ]
        
        students = [
            StudentResponse(
                student_id=student["student_id"],
                student_name=student["student_name"],
                responses=student["responses"],
                score=student["score"],
                max_score=student["max_score"]
            )
            for student in analysis_data.get("students", [])
        ]
        
        return ReviewResult(
            tasks=tasks,
            students=students,
            total_students=analysis_data.get("total_students", len(students))
        )
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

@router.post("/regrade-response")
async def regrade_response(
    student_id: str,
    task_id: str,
    new_score: float,
    feedback: str = ""
):
    """Allow teachers to adjust AI-generated scores"""
    # This would typically update a database
    # For now, return success response
    return {
        "success": True,
        "student_id": student_id,
        "task_id": task_id,
        "new_score": new_score,
        "feedback": feedback,
        "updated_at": "2024-01-01T00:00:00Z"
    } 