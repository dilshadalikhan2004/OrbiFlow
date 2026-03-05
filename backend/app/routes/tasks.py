import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import manager_or_admin, get_current_user
from app.models.user import User
from app.models.task import TaskStatus, TaskPriority
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskAssign
from app.services.task_service import TaskService

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: TaskCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(manager_or_admin)
):
    return TaskService.create_task(db, task_in, current_user)

@router.get("/", response_model=List[TaskResponse])
def list_tasks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[TaskStatus] = Query(None),
    priority: Optional[TaskPriority] = Query(None),
    sort_by: str = Query("created_at", enum=["created_at", "deadline", "priority"]),
    sort_order: str = Query("desc", enum=["asc", "desc"]),
    project_id: Optional[uuid.UUID] = Query(None),
    organization_id: Optional[uuid.UUID] = Query(None),
    assignee_id: Optional[uuid.UUID] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List tasks with pagination, multi-field filtering, and sorting.
    """
    return TaskService.list_tasks(
        db, 
        current_user, 
        skip=skip, 
        limit=limit, 
        status_filter=status, 
        priority_filter=priority,
        sort_by=sort_by,
        sort_order=sort_order,
        project_id=project_id,
        organization_id=organization_id,
        assignee_id=assignee_id,
        search=search
    )

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return TaskService.get_task(db, task_id, current_user)

@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: uuid.UUID,
    task_in: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return TaskService.update_task(db, task_id, task_in, current_user)

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    TaskService.delete_task(db, task_id, current_user)
    return None

@router.post("/{task_id}/assign", response_model=TaskResponse)
def assign_task(
    task_id: uuid.UUID,
    payload: TaskAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return TaskService.assign_task(db, task_id, payload.assignee_id, current_user)

@router.post("/{task_id}/unassign", response_model=TaskResponse)
def unassign_task(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return TaskService.unassign_task(db, task_id, current_user)
