import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, Uuid, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
from app.models.user import UserRole

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), nullable=False)
    owner_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    owner = relationship("User", back_populates="owned_organizations")
    members = relationship("OrganizationUser", back_populates="organization", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="organization", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Organization(name='{self.name}')>"

class OrganizationUser(Base):
    __tablename__ = "organization_users"

    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    organization_id = Column(Uuid, ForeignKey("organizations.id", ondelete="CASCADE"), primary_key=True)
    role = Column(SQLEnum(UserRole), default=UserRole.EMPLOYEE, nullable=False)

    user = relationship("User", back_populates="organizations")
    organization = relationship("Organization", back_populates="members")

    def __repr__(self):
        return f"<OrganizationUser(user_id='{self.user_id}', organization_id='{self.organization_id}', role='{self.role}')>"
