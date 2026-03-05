import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from sqlalchemy import asc, desc
from typing import Optional
from app.models.project import Project
from app.models.user import User, UserRole
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.services.activity_service import ActivityService

class ProjectService:
    @staticmethod
    def create_project(db: Session, payload: ProjectCreate, owner: User) -> Project:
        project = Project(
            name=payload.name,
            description=payload.description,
            owner_id=owner.id,
            organization_id=payload.organization_id,
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        
        if project.organization_id:
            ActivityService.log_activity(
                db=db,
                organization_id=project.organization_id,
                user_id=owner.id,
                action="PROJECT_CREATED",
                project_id=project.id,
                details=f"Created project '{project.name}'"
            )
            
        return project

    @staticmethod
    def get_project(db: Session, project_id: uuid.UUID) -> Project:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        return project

    @staticmethod
    def list_projects(
        db: Session,
        current_user: User,
        skip: int = 0,
        limit: int = 100,
        owner_id: Optional[uuid.UUID] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        organization_id: Optional[uuid.UUID] = None
    ) -> list[Project]:
        query = db.query(Project)
        
        from app.models.organization import OrganizationUser
        # Enforce organization filtering if provided, or only organizations the user belongs to
        user_orgs = db.query(OrganizationUser.organization_id).filter(OrganizationUser.user_id == current_user.id).all()
        user_org_ids = [o[0] for o in user_orgs]

        if organization_id:
            if organization_id not in user_org_ids and current_user.role != UserRole.ADMIN:
                # Can't see orgs you aren't in unless admin
                return []
            query = query.filter(Project.organization_id == organization_id)
        else:
            if current_user.role != UserRole.ADMIN:
                # If no org specified, show projects from all user's orgs (plus projects with null org for backward compat)
                query = query.filter(Project.organization_id.in_(user_org_ids) | (Project.organization_id == None))
        
        # Filtering by owner
        if owner_id:
            query = query.filter(Project.owner_id == owner_id)
            
        # RBAC: Employees only see projects where they have assigned tasks (Performance optimized)
        if current_user.role == UserRole.EMPLOYEE:
            from app.models.task import Task
            query = query.join(Task).filter(Task.assignee_id == current_user.id).distinct()
            
        # Sorting
        sort_attr = getattr(Project, sort_by, Project.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_attr))
        else:
            query = query.order_by(asc(sort_attr))
            
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def update_project(
        db: Session,
        project_id: uuid.UUID,
        payload: ProjectUpdate,
        current_user: User,
    ) -> Project:
        project = ProjectService.get_project(db, project_id)
        
        if current_user.role != UserRole.ADMIN and project.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the project owner or an admin can update this project",
            )

        update_data = payload.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(project, field, value)

        db.commit()
        db.refresh(project)
        return project

    @staticmethod
    def delete_project(db: Session, project_id: uuid.UUID, current_user: User) -> None:
        project = ProjectService.get_project(db, project_id)
        
        if current_user.role != UserRole.ADMIN and project.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the project owner or an admin can delete this project",
            )

        db.delete(project)
        db.commit()
