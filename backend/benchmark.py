import time
from app.database import SessionLocal
from app.models.user import User
from app.models.organization import Organization, OrganizationUser
from app.services.organization_service import OrganizationService
from app.services.project_service import ProjectService
from app.services.task_service import TaskService
import logging

def test():
    db = SessionLocal()
    org_user = db.query(OrganizationUser).first()
    if not org_user:
        print("Missing data")
        return
    org = db.query(Organization).filter(Organization.id == org_user.organization_id).first()
    admin = db.query(User).filter(User.id == org_user.user_id).first()
        
    start = time.time()
    for _ in range(50):
        OrganizationService.get_members(db, org.id, admin)
    print("get_members (x50) took:", time.time() - start)
    
    start = time.time()
    for _ in range(50):
        ProjectService.list_projects(db, admin, organization_id=org.id)
    print("list_projects (x50) took:", time.time() - start)

    start = time.time()
    for _ in range(50):
        TaskService.list_tasks(db, admin, organization_id=org.id)
    print("list_tasks (x50) took:", time.time() - start)
    
if __name__ == '__main__':
    test()
