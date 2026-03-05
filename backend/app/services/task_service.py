import uuid
import asyncio
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc
from fastapi import HTTPException, status

from app.models.task import Task, TaskStatus, TaskPriority
from app.models.project import Project
from app.models.user import User, UserRole
from app.schemas.task import TaskCreate, TaskUpdate
from app.services.activity_service import ActivityService
from app.services.notification_service import NotificationService
from app.models.notification import NotificationType

def _broadcast(project_id: str, payload: dict):
    """Fire-and-forget WebSocket broadcast safely from sync context."""
    try:
        from app.ws.manager import manager
        manager.sync_broadcast(project_id, payload)
    except Exception:
        pass  # Never let WS errors break REST logic

class TaskService:
    @staticmethod
    def create_task(db: Session, payload: TaskCreate, current_user: User) -> Task:
        project = db.query(Project).filter(Project.id == payload.project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
            
        if payload.assignee_id:
            if not db.query(User).filter(User.id == payload.assignee_id).first():
                raise HTTPException(status_code=404, detail="Assigned user not found")

        task = Task(**payload.model_dump())
        db.add(task)
        db.commit()
        db.refresh(task)

        if project.organization_id:
            ActivityService.log_activity(
                db=db,
                organization_id=project.organization_id,
                user_id=current_user.id,
                action="TASK_CREATED",
                project_id=project.id,
                task_id=task.id,
                details=f"Created task '{task.title}'"
            )

        # Broadcast to project room
        _broadcast(str(task.project_id), {
            "event":    "task_created",
            "task_id":  str(task.id),
            "title":    task.title,
            "status":   task.status,
            "priority": task.priority,
            "assignee_id": str(task.assignee_id) if task.assignee_id else None,
        })

        return task

    @staticmethod
    def get_task(db: Session, task_id: uuid.UUID, current_user: User) -> Task:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

        if current_user.role == UserRole.EMPLOYEE and task.assignee_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied to this task")
            
        return task

    @staticmethod
    def list_tasks(
        db: Session, 
        current_user: User, 
        skip: int = 0, 
        limit: int = 100,
        status_filter: Optional[TaskStatus] = None,
        priority_filter: Optional[TaskPriority] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        project_id: Optional[uuid.UUID] = None,
        organization_id: Optional[uuid.UUID] = None,
        assignee_id: Optional[uuid.UUID] = None,
        search: Optional[str] = None
    ) -> list[Task]:
        query = db.query(Task)
        
        # Scope to organization
        if organization_id:
            query = query.join(Project).filter(Project.organization_id == organization_id)
        
        if project_id:
            query = query.filter(Task.project_id == project_id)
        
        # RBAC: Employees only see their own tasks
        if current_user.role == UserRole.EMPLOYEE:
            query = query.filter(Task.assignee_id == current_user.id)

        # Optional assignee filter (managers/admins)
        if assignee_id and current_user.role != UserRole.EMPLOYEE:
            query = query.filter(Task.assignee_id == assignee_id)

        # Full-text search on title + description
        if search:
            search_term = f"%{search}%"
            from sqlalchemy import or_
            query = query.filter(
                or_(Task.title.ilike(search_term), Task.description.ilike(search_term))
            )

        # Filtering
        if status_filter:
            query = query.filter(Task.status == status_filter)
        if priority_filter:
            query = query.filter(Task.priority == priority_filter)
            
        # Sorting
        sort_attr = getattr(Task, sort_by, Task.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_attr))
        else:
            query = query.order_by(asc(sort_attr))
            
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def update_task(db: Session, task_id: uuid.UUID, payload: TaskUpdate, current_user: User) -> Task:
        task = TaskService.get_task(db, task_id, current_user)
        update_data = payload.model_dump(exclude_unset=True)
        
        if current_user.role == UserRole.EMPLOYEE:
            if any(k for k in update_data.keys() if k != "status"):
                raise HTTPException(status_code=403, detail="Employees can only update task status")

        # Validate assignment if updated
        if "assignee_id" in update_data and update_data["assignee_id"]:
            from app.models.organization import OrganizationUser
            project = db.query(Project).filter(Project.id == task.project_id).first()
            if project and project.organization_id:
                org_user = db.query(OrganizationUser).filter(
                    OrganizationUser.organization_id == project.organization_id,
                    OrganizationUser.user_id == update_data["assignee_id"]
                ).first()
                if not org_user:
                    raise HTTPException(status_code=400, detail="User is not a member of the organization")
        
        for field, value in update_data.items():
            setattr(task, field, value)

        db.commit()
        db.refresh(task)

        project = db.query(Project).filter(Project.id == task.project_id).first()
        if project and project.organization_id:
            if "status" in update_data:
                ActivityService.log_activity(
                    db=db,
                    organization_id=project.organization_id,
                    user_id=current_user.id,
                    action="TASK_MOVED",
                    project_id=project.id,
                    task_id=task.id,
                    details=f"Moved task '{task.title}' to {task.status.replace('_', ' ')}"
                )
            # Notify assignee when task is DONE
            if task.status == "done" and task.assignee_id:
                NotificationService.create_notification(
                    db=db,
                    user_id=task.assignee_id,
                    message=f"Task '{task.title}' has been marked as Done.",
                    type=NotificationType.TASK_DONE
                )
            elif "assignee_id" in update_data:
                ActivityService.log_activity(
                    db=db,
                    organization_id=project.organization_id,
                    user_id=current_user.id,
                    action="TASK_ASSIGNED",
                    project_id=project.id,
                    task_id=task.id,
                    details=f"Assigned task '{task.title}'"
                )
            # Notify the assignee
            if task.assignee_id:
                NotificationService.create_notification(
                    db=db,
                    user_id=task.assignee_id,
                    message=f"You have been assigned to task '{task.title}'.",
                    type=NotificationType.TASK_ASSIGNED
                )
            else:
                ActivityService.log_activity(
                    db=db,
                    organization_id=project.organization_id,
                    user_id=current_user.id,
                    action="TASK_UPDATED",
                    project_id=project.id,
                    task_id=task.id,
                    details=f"Updated task '{task.title}'"
                )

        # WebSocket broadcast
        event_name = "task_moved" if "status" in update_data else "task_updated"
        _broadcast(str(task.project_id), {
            "event":       event_name,
            "task_id":     str(task.id),
            "title":       task.title,
            "status":      task.status,
            "priority":    task.priority,
            "assignee_id": str(task.assignee_id) if task.assignee_id else None,
        })

        return task

    @staticmethod
    def delete_task(db: Session, task_id: uuid.UUID, current_user: User) -> None:
        task = TaskService.get_task(db, task_id, current_user)
        if current_user.role == UserRole.EMPLOYEE:
             raise HTTPException(status_code=403, detail="Employees cannot delete tasks")
             
        # Capture project_id before deletion for broadcast
        project_id_str = str(task.project_id)
        task_id_str    = str(task.id)
        db.delete(task)
        db.commit()

        _broadcast(project_id_str, {
            "event":   "task_deleted",
            "task_id": task_id_str,
        })

    @staticmethod
    def assign_task(db: Session, task_id: uuid.UUID, assignee_id: uuid.UUID, current_user: User) -> Task:
        task = TaskService.get_task(db, task_id, current_user)
        
        if current_user.role == UserRole.EMPLOYEE:
            raise HTTPException(status_code=403, detail="Employees cannot assign tasks")

        # Validate assignee exists
        if not db.query(User).filter(User.id == assignee_id).first():
            raise HTTPException(status_code=404, detail="User not found")

        # Validate assignee belongs to organization
        from app.models.organization import OrganizationUser
        project = db.query(Project).filter(Project.id == task.project_id).first()
        if project and project.organization_id:
            org_user = db.query(OrganizationUser).filter(
                OrganizationUser.organization_id == project.organization_id,
                OrganizationUser.user_id == assignee_id
            ).first()
            if not org_user:
                raise HTTPException(status_code=400, detail="User is not a member of the organization")

        task.assignee_id = assignee_id
        db.commit()
        db.refresh(task)

        if project and project.organization_id:
            ActivityService.log_activity(
                db=db,
                organization_id=project.organization_id,
                user_id=current_user.id,
                action="TASK_ASSIGNED",
                project_id=project.id,
                task_id=task.id,
                details=f"Assigned task '{task.title}'"
            )

        # Notify the assignee
        NotificationService.create_notification(
            db=db,
            user_id=assignee_id,
            message=f"You have been assigned to task '{task.title}'.",
            type=NotificationType.TASK_ASSIGNED
        )

        return task

    @staticmethod
    def unassign_task(db: Session, task_id: uuid.UUID, current_user: User) -> Task:
        task = TaskService.get_task(db, task_id, current_user)
        
        if current_user.role == UserRole.EMPLOYEE:
            raise HTTPException(status_code=403, detail="Employees cannot unassign tasks")

        task.assignee_id = None
        db.commit()
        db.refresh(task)

        project = db.query(Project).filter(Project.id == task.project_id).first()
        if project and project.organization_id:
            ActivityService.log_activity(
                db=db,
                organization_id=project.organization_id,
                user_id=current_user.id,
                action="TASK_UPDATED",
                project_id=project.id,
                task_id=task.id,
                details=f"Unassigned task '{task.title}'"
            )

        return task
