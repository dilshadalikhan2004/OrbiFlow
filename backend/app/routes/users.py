from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import admin_only
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/", response_model=list[UserResponse], dependencies=[Depends(admin_only)])
def list_users(db: Session = Depends(get_db)):
    """[Admin Only] List all registered users."""
    return db.query(User).all()
