import uuid
from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.organization import Organization, OrganizationUser
from app.models.user import User, UserRole
from app.schemas.organization import OrganizationCreate, OrganizationMemberInvite

class OrganizationService:

    @staticmethod
    def create_organization(db: Session, org_in: OrganizationCreate, current_user: User) -> Organization:
        org = Organization(
            name=org_in.name,
            owner_id=current_user.id
        )
        db.add(org)
        db.flush() # flush to get org.id
        
        # Add owner to OrganizationUser with ADMIN role
        org_user = OrganizationUser(
            user_id=current_user.id,
            organization_id=org.id,
            role=UserRole.ADMIN
        )
        db.add(org_user)
        db.commit()
        db.refresh(org)
        return org

    @staticmethod
    def get_organizations(db: Session, current_user: User) -> List[Organization]:
        # Return orgs where user is a member or owner
        orgs = db.query(Organization).join(OrganizationUser).filter(
            OrganizationUser.user_id == current_user.id
        ).all()
        return orgs

    @staticmethod
    def get_organization(db: Session, org_id: uuid.UUID, current_user: User) -> Organization:
        org = db.query(Organization).filter(Organization.id == org_id).first()
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
            
        # Check membership
        membership = db.query(OrganizationUser).filter(
            OrganizationUser.organization_id == org_id,
            OrganizationUser.user_id == current_user.id
        ).first()
        
        if not membership and current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Not a member of this organization")
            
        return org

    @staticmethod
    def invite_member(db: Session, org_id: uuid.UUID, invite: OrganizationMemberInvite, current_user: User):
        org = OrganizationService.get_organization(db, org_id, current_user)
        
        # Check if current_user is admin or manager in this org
        membership = db.query(OrganizationUser).filter(
            OrganizationUser.organization_id == org_id,
            OrganizationUser.user_id == current_user.id
        ).first()
        
        if current_user.role != UserRole.ADMIN:
            if not membership or membership.role == UserRole.EMPLOYEE:
                raise HTTPException(status_code=403, detail="Not authorized to invite members")
        
        target_user = db.query(User).filter(User.email == invite.email).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="User with this email not found")
            
        existing_member = db.query(OrganizationUser).filter(
            OrganizationUser.organization_id == org_id,
            OrganizationUser.user_id == target_user.id
        ).first()
        
        if existing_member:
            raise HTTPException(status_code=400, detail="User is already a member")
            
        new_member = OrganizationUser(
            user_id=target_user.id,
            organization_id=org_id,
            role=invite.role
        )
        db.add(new_member)
        db.commit()
        db.refresh(new_member)

        # Notify the invited user
        from app.services.notification_service import NotificationService
        from app.models.notification import NotificationType
        NotificationService.create_notification(
            db=db,
            user_id=target_user.id,
            message=f"You have been invited to join '{org.name}' as {invite.role}.",
            type=NotificationType.ORG_INVITE
        )

        return new_member

    @staticmethod
    def get_members(db: Session, org_id: uuid.UUID, current_user: User):
        # ensure user has access
        OrganizationService.get_organization(db, org_id, current_user)
        members = db.query(OrganizationUser).filter(
            OrganizationUser.organization_id == org_id
        ).all()
        return members
