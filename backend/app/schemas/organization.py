import uuid
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.user import UserRole
from app.schemas.user import UserResponse

class OrganizationBase(BaseModel):
    name: str

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationResponse(OrganizationBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class OrganizationMemberInvite(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.EMPLOYEE

class OrganizationMemberResponse(BaseModel):
    organization_id: uuid.UUID
    user_id: uuid.UUID
    role: UserRole
    user: UserResponse
    model_config = ConfigDict(from_attributes=True)
