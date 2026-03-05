import uuid
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.notification import Notification, NotificationType


class NotificationService:

    @staticmethod
    def create_notification(
        db: Session,
        user_id: uuid.UUID,
        message: str,
        type: NotificationType = NotificationType.GENERAL,
    ) -> Notification:
        notif = Notification(user_id=user_id, message=message, type=type)
        db.add(notif)
        db.commit()
        return notif

    @staticmethod
    def get_notifications(db: Session, user_id: uuid.UUID, limit: int = 30) -> list[Notification]:
        return (
            db.query(Notification)
            .filter(Notification.user_id == user_id)
            .order_by(desc(Notification.created_at))
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_unread_count(db: Session, user_id: uuid.UUID) -> int:
        return (
            db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.read == False)
            .count()
        )

    @staticmethod
    def mark_read(db: Session, notification_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Notification]:
        notif = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        if notif:
            notif.read = True
            db.commit()
            db.refresh(notif)
        return notif

    @staticmethod
    def mark_all_read(db: Session, user_id: uuid.UUID) -> int:
        updated = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.read == False
        ).update({"read": True})
        db.commit()
        return updated

    @staticmethod
    def delete_notification(db: Session, notification_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        notif = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        if notif:
            db.delete(notif)
            db.commit()
            return True
        return False
