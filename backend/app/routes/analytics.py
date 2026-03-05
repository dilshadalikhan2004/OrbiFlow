import uuid
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.organization import OrganizationUser
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard")
def get_dashboard_analytics(
    organization_id: uuid.UUID = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify membership
    membership = db.query(OrganizationUser).filter(
        OrganizationUser.organization_id == organization_id,
        OrganizationUser.user_id == current_user.id,
    ).first()

    if not membership and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not a member of this organization")

    return AnalyticsService.get_dashboard(db, organization_id)
