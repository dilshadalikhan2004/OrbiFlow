import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import manager_or_admin, get_current_user
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.services.project_service import ProjectService

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(manager_or_admin)
):
    return ProjectService.create_project(db, project_in, current_user)

@router.get("/", response_model=List[ProjectResponse])
def list_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    owner_id: Optional[uuid.UUID] = Query(None),
    sort_by: str = Query("created_at", enum=["name", "created_at"]),
    sort_order: str = Query("desc", enum=["asc", "desc"]),
    organization_id: Optional[uuid.UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List projects with pagination, owner filtering, and sorting.
    """
    return ProjectService.list_projects(
        db, 
        current_user, 
        skip=skip, 
        limit=limit, 
        owner_id=owner_id, 
        sort_by=sort_by, 
        sort_order=sort_order,
        organization_id=organization_id
    )

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Authorization logic is handled in the service via get_project if needed 
    # but currently get_project is straightforward.
    return ProjectService.get_project(db, project_id)

@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: uuid.UUID,
    project_in: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ProjectService.update_project(db, project_id, project_in, current_user)

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ProjectService.delete_project(db, project_id, current_user)
    return None
