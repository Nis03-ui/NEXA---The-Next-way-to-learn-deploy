from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import current_user, require_roles
from app.db.session import get_db
from app.models.notification import Notification
from app.models.user import User, Role
from app.schemas.notification import (
    NotificationReadResponse,
    NotificationResponse,
)



class AnnouncementCreate(BaseModel):
    title: str
    message: str
router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


@router.get(
    "",
    response_model=list[NotificationResponse],
)
async def get_notifications(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification)
        .where(Notification.recipient_id == user.id)
        .order_by(Notification.created_at.desc())
    )

    return result.scalars().all()


@router.get(
    "/unread-count",
)
async def get_unread_count(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(func.count(Notification.id))
        .where(
            Notification.recipient_id == user.id,
            Notification.is_read.is_(False),
        )
    )

    return {
        "unread_count": result.scalar_one()
    }


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationReadResponse,
)
async def mark_notification_read(
    notification_id: int,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.recipient_id == user.id,
        )
    )

    notification = result.scalar_one_or_none()

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found",
        )

    notification.is_read = True

    await db.commit()
    await db.refresh(notification)

    return {
        "id": notification.id,
        "is_read": notification.is_read,
    }


@router.patch(
    "/read-all",
)
async def mark_all_notifications_read(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        update(Notification)
        .where(
            Notification.recipient_id == user.id,
            Notification.is_read.is_(False),
        )
        .values(is_read=True)
    )

    await db.commit()

    return {
        "message": "All notifications marked as read"
    }

@router.post("/announcement", status_code=201)
async def create_college_announcement(
    data: AnnouncementCreate,
    user: User = Depends(require_roles(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User.id).where(User.role == Role.STUDENT)
    )
    student_ids = result.scalars().all()

    notifications = [
        Notification(
            recipient_id=student_id,
            type="ANNOUNCEMENT",
            title=data.title,
            message=data.message,
        )
        for student_id in student_ids
    ]

    if notifications:
        db.add_all(notifications)

    await db.commit()

    return {
        "message": "College-wide announcement created",
        "recipients": len(notifications),
    }
