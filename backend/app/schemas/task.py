import uuid
from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.models.task import TaskStatus, TaskPriority
from app.schemas.user import UserResponse

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: uuid.UUID
    assignee_id: Optional[uuid.UUID] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    deadline: Optional[datetime] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    deadline: Optional[datetime] = None
    assignee_id: Optional[uuid.UUID] = None

class TaskStatusUpdate(BaseModel):
    status: TaskStatus

class TaskAssign(BaseModel):
    assignee_id: Optional[uuid.UUID] = None

class TaskResponse(TaskBase):
    id: uuid.UUID
    status: TaskStatus
    created_at: datetime
    assignee: Optional[UserResponse] = None
    model_config = ConfigDict(from_attributes=True)
