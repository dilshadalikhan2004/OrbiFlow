import uuid
import enum
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Enum, Uuid
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class NotificationType(str, enum.Enum):
    TASK_ASSIGNED  = "task_assigned"
    TASK_DONE      = "task_done"
    ORG_INVITE     = "org_invite"
    GENERAL        = "general"


class Notification(Base):
    __tablename__ = "notifications"

    id         = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    user_id    = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    message    = Column(String(500), nullable=False)
    type       = Column(Enum(NotificationType), default=NotificationType.GENERAL, nullable=False)
    read       = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="notifications")

    def __repr__(self):
        return f"<Notification(type='{self.type}', read={self.read})>"
