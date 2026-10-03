from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Enrollment
from app.models.notification import Notification


async def notify_course_students(
    db: AsyncSession,
    course_id: int,
    notification_type: str,
    title: str,
    message: str,
    assignment_id: int | None = None,
    quiz_id: int | None = None,
    schedule_event_id: int | None = None,
):
    result = await db.execute(
        select(Enrollment.student_id).where(
            Enrollment.course_id == course_id,
            Enrollment.status == "ACTIVE",
        )
    )

    student_ids = result.scalars().all()

    notifications = [
        Notification(
            recipient_id=student_id,
            type=notification_type,
            title=title,
            message=message,
            course_id=course_id,
            assignment_id=assignment_id,
            quiz_id=quiz_id,
            schedule_event_id=schedule_event_id,
        )
        for student_id in student_ids
    ]

    if notifications:
        db.add_all(notifications)

    return len(notifications)
