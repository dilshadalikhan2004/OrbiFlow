from app.database import SessionLocal
from app.models.user import User, UserRole

def upgrade():
    db = SessionLocal()
    user = db.query(User).filter(User.email == 'dilshadalikhanji123@gmail.com').first()
    if user:
        user.role = UserRole.ADMIN
        db.commit()
        print("Updated user to ADMIN")
    else:
        print("User not found")
    db.close()

if __name__ == '__main__':
    upgrade()
