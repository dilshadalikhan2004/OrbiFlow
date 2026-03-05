import uuid
from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.models.notification import NotificationType


class NotificationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    message: str
    type: NotificationType
    read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
