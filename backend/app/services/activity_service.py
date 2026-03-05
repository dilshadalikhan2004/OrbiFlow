import uuid
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.activity import ActivityLog
from app.models.task import Task
from app.models.project import Project

class ActivityService:
    @staticmethod
    def log_activity(
        db: Session,
        organization_id: uuid.UUID,
        user_id: uuid.UUID,
        action: str,
        project_id: Optional[uuid.UUID] = None,
        task_id: Optional[uuid.UUID] = None,
        details: Optional[str] = None
    ):
        activity = ActivityLog(
            organization_id=organization_id,
            project_id=project_id,
            task_id=task_id,
            user_id=user_id,
            action=action,
            details=details
        )
        db.add(activity)
        db.commit()

    @staticmethod
    def get_activities(
        db: Session, 
        organization_id: uuid.UUID, 
        project_id: Optional[uuid.UUID] = None, 
        limit: int = 50
    ) -> list[ActivityLog]:
        query = db.query(ActivityLog).filter(ActivityLog.organization_id == organization_id)
        if project_id:
            query = query.filter(ActivityLog.project_id == project_id)
        
        return query.order_by(desc(ActivityLog.created_at)).limit(limit).all()
