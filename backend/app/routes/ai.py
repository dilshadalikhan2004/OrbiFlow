from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.ai.task_parser import parse_task_prompt

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


class TaskPromptRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=500, description="Natural language task description")


class ParsedTaskResponse(BaseModel):
    title: str
    description: str
    priority: str
    due_date: str | None
    assignee_hint: str | None
    source: str  # "gemini" or "local"


@router.post("/parse-task", response_model=ParsedTaskResponse)
def parse_task(
    body: TaskPromptRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Parse a natural-language prompt into a structured task.
    Uses Gemini AI when GEMINI_API_KEY is set, otherwise uses local NLP.
    """
    try:
        result = parse_task_prompt(body.prompt)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI parsing failed: {str(e)}")
