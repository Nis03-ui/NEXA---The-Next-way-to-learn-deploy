from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    recipient_id: int
    type: str
    title: str
    message: str
    course_id: int | None
    assignment_id: int | None
    quiz_id: int | None
    schedule_event_id: int | None
    is_read: bool
    created_at: datetime


class NotificationReadResponse(BaseModel):
    id: int
    is_read: bool