from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.organization import Organization, OrganizationUser
from app.models.project import Project

def run_migration():
    db = SessionLocal()
    
    # Check if there's any org
    if db.query(Organization).count() == 0:
        # Create a default org for each admin? Or just one global default org.
        admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if admin:
            org = Organization(name="Default Workspace", owner_id=admin.id)
            db.add(org)
            db.commit()
            db.refresh(org)
            
            # Map all users to this org
            users = db.query(User).all()
            for u in users:
                org_user = OrganizationUser(organization_id=org.id, user_id=u.id, role=u.role)
                db.add(org_user)
            
            # Map all projects to this org
            db.execute(Project.__table__.update().values(organization_id=org.id))
            db.commit()
            print("Migration completed: Created Default Workspace")
        else:
            print("No admin found. Cannot create default workspace.")
    else:
        print("Organizations already exist. Skipping.")

if __name__ == '__main__':
    run_migration()
