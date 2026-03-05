import os
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.models.project import Project
from app.schemas.task import TaskCreate
from app.services.task_service import TaskService
import traceback

def test_create_task():
    db = SessionLocal()
    try:
        user = db.query(User).first()
        project = db.query(Project).first()
        
        if not user or not project:
            print("No user or project found.")
            return

        payload = TaskCreate(
            title="Locally Tested Task",
            description="Testing via python script",
            project_id=project.id,
            assignee_id=user.id,
            priority="high",
        )
        try:
            task = TaskService.create_task(db=db, payload=payload, current_user=user)
            print("Task created successfully:", task.id)
        except Exception as e:
            print("Failed to create task:")
            traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_create_task()
