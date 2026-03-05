from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationResponse,
    OrganizationMemberInvite,
    OrganizationMemberResponse
)
from app.services.organization_service import OrganizationService

router = APIRouter(prefix="/organizations", tags=["Organizations"])

@router.post("/", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
def create_organization(
    org_in: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return OrganizationService.create_organization(db, org_in, current_user)

@router.get("/", response_model=List[OrganizationResponse])
def get_organizations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return OrganizationService.get_organizations(db, current_user)

@router.get("/{id}", response_model=OrganizationResponse)
def get_organization(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return OrganizationService.get_organization(db, id, current_user)

@router.post("/{id}/invite", response_model=OrganizationMemberResponse, status_code=status.HTTP_201_CREATED)
def invite_member(
    id: uuid.UUID,
    invite: OrganizationMemberInvite,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return OrganizationService.invite_member(db, id, invite, current_user)

@router.get("/{id}/members", response_model=List[OrganizationMemberResponse])
def get_members(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return OrganizationService.get_members(db, id, current_user)
