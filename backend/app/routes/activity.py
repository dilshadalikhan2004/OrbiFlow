import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.organization import OrganizationUser
from app.schemas.activity import ActivityLogResponse
from app.services.activity_service import ActivityService

router = APIRouter(prefix="/activity", tags=["Activity"])

@router.get("/", response_model=List[ActivityLogResponse])
def get_activity_feed(
    organization_id: uuid.UUID = Query(...),
    project_id: Optional[uuid.UUID] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify user is in organization
    if current_user.role != UserRole.ADMIN:
        org_user = db.query(OrganizationUser).filter(
            OrganizationUser.organization_id == organization_id,
            OrganizationUser.user_id == current_user.id
        ).first()
        if not org_user:
            raise HTTPException(status_code=403, detail="Access denied to this organization")
            
    activities = ActivityService.get_activities(
        db, 
        organization_id=organization_id, 
        project_id=project_id, 
        limit=limit
    )
    return activities
