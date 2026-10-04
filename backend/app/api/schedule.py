from fastapi import APIRouter, Depends, HTTPException, status


def normalize_datetime(value):
    """Store timezone-aware API datetimes in the existing UTC-naive DB columns."""
    if value.tzinfo is not None:
        from datetime import timezone
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    return value

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import current_user, require_roles
from app.db.session import get_db
from app.models.course import Course, Enrollment
from app.models.schedule import ScheduleEvent
from app.models.user import Role, User
from app.schemas.schedule import (
    ScheduleEventCreate,
    ScheduleEventResponse,
    ScheduleEventUpdate,
)
from app.services.notification import notify_course_students

router = APIRouter(
    prefix="/courses",
    tags=["Schedule"],
)


async def get_course(course_id: int, db: AsyncSession):
    course = await db.get(Course, course_id)

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found",
        )

    return course


async def verify_teacher(
    course: Course,
    user: User,
):
    if user.role != Role.ADMIN and course.teacher_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="You do not own this course",
        )


async def verify_enrollment(
    course_id: int,
    student_id: int,
    db: AsyncSession,
):
    result = await db.execute(
        select(Enrollment).where(
            Enrollment.course_id == course_id,
            Enrollment.student_id == student_id,
            Enrollment.status == "ACTIVE",
        )
    )

    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=403,
            detail="You are not enrolled in this course",
        )


# ---------------------------------------------------------
# CREATE EVENT
# ---------------------------------------------------------

@router.post(
    "/{course_id}/schedule",
    response_model=ScheduleEventResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_event(
    course_id: int,
    data: ScheduleEventCreate,
    user: User = Depends(
        require_roles(Role.TEACHER, Role.ADMIN)
    ),
    db: AsyncSession = Depends(get_db),
):
    course = await get_course(course_id, db)
    await verify_teacher(course, user)

    event = ScheduleEvent(
        course_id=course_id,
        created_by=user.id,
        **{\n            **data.model_dump(),\n            "start_time": normalize_datetime(data.start_time),\n            "end_time": normalize_datetime(data.end_time),\n        },
    )

    db.add(event)
    await db.flush()

    await notify_course_students(
        db=db,
        course_id=course_id,
        notification_type="SCHEDULE",
        title="New Schedule Event",
        message=f"New event: {event.title}",
        schedule_event_id=event.id,
    )

    await db.commit()
    await db.refresh(event)

    return event


@router.get(
    "/{course_id}/schedule",
    response_model=list[ScheduleEventResponse],
)
async def get_schedule(
    course_id: int,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    course = await get_course(course_id, db)

    if user.role == Role.STUDENT:
        await verify_enrollment(
            course_id,
            user.id,
            db,
        )

    elif user.role == Role.TEACHER:
        await verify_teacher(course, user)

    elif user.role != Role.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Access denied",
        )

    result = await db.execute(
        select(ScheduleEvent)
        .where(
            ScheduleEvent.course_id == course_id
        )
        .order_by(
            ScheduleEvent.start_time.asc()
        )
    )

    return result.scalars().all()


# ---------------------------------------------------------
# UPDATE EVENT
# ---------------------------------------------------------

@router.put(
    "/{course_id}/schedule/{event_id}",
    response_model=ScheduleEventResponse,
)
async def update_event(
    course_id: int,
    event_id: int,
    data: ScheduleEventUpdate,
    user: User = Depends(
        require_roles(Role.TEACHER, Role.ADMIN)
    ),
    db: AsyncSession = Depends(get_db),
):
    course = await get_course(course_id, db)
    await verify_teacher(course, user)

    event = await db.get(
        ScheduleEvent,
        event_id,
    )

    if not event or event.course_id != course_id:
        raise HTTPException(
            status_code=404,
            detail="Schedule event not found",
        )

    values = data.model_dump(exclude_unset=True)

    new_start = values.get(
        "start_time",
        event.start_time,
    )

    new_end = values.get(
        "end_time",
        event.end_time,
    )

    if new_end <= new_start:
        raise HTTPException(
            status_code=400,
            detail="end_time must be after start_time",
        )

    for field, value in values.items():
        setattr(event, field, value)

    await db.commit()
    await db.refresh(event)

    return event


# ---------------------------------------------------------
# DELETE EVENT
# ---------------------------------------------------------

@router.delete(
    "/{course_id}/schedule/{event_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_event(
    course_id: int,
    event_id: int,
    user: User = Depends(
        require_roles(Role.TEACHER, Role.ADMIN)
    ),
    db: AsyncSession = Depends(get_db),
):
    course = await get_course(course_id, db)
    await verify_teacher(course, user)

    event = await db.get(
        ScheduleEvent,
        event_id,
    )

    if not event or event.course_id != course_id:
        raise HTTPException(
            status_code=404,
            detail="Schedule event not found",
        )

    await db.delete(event)
    await db.commit()