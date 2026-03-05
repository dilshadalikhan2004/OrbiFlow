import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, Index, Uuid
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(2000), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Foreign Key: Link to the owner (User)
    owner_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    organization_id = Column(Uuid, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True) # nullable true initially for backward compat
    
    # Relationships
    owner = relationship("User", back_populates="owned_projects")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    organization = relationship("Organization", back_populates="projects")

    # Indexes for performance
    __table_args__ = (
        Index("ix_projects_owner_id", "owner_id"),
        Index("ix_projects_created_at", "created_at"),
        Index("ix_projects_organization_id", "organization_id"),
    )

    def __repr__(self):
        return f"<Project(name='{self.name}')>"
