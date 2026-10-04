from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import current_user, require_roles
from app.db.session import get_db
from app.models.course import Course, Enrollment
from app.models.user import Role, User
from app.models.message import Message

router = APIRouter(prefix="/messages", tags=["Messages"])

UPLOAD_DIR = Path("uploads/messages")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_FILE_SIZE = 10 * 1024 * 1024


async def _shared_course(
    sender: User,
    recipient_id: int,
    course_id: int | None,
    db: AsyncSession,
) -> Course:
    recipient = await db.get(User, recipient_id)
    if recipient is None:
        raise HTTPException(status_code=404, detail="User not found")

    if sender.role == recipient.role or {sender.role, recipient.role} != {Role.STUDENT, Role.TEACHER}:
        raise HTTPException(status_code=403, detail="Messaging is available between students and teachers")

    conditions = [
        Enrollment.status == "ACTIVE",
        Enrollment.course_id == Course.id,
    ]

    if sender.role == Role.STUDENT:
        conditions.extend([
            Enrollment.student_id == sender.id,
            Course.teacher_id == recipient_id,
        ])
    else:
        conditions.extend([
            Enrollment.student_id == recipient_id,
            Course.teacher_id == sender.id,
        ])

    if course_id is not None:
        conditions.append(Course.id == course_id)

    result = await db.execute(select(Course).join(Enrollment, Enrollment.course_id == Course.id).where(*conditions).limit(1))
    course = result.scalar_one_or_none()
    if course is None:
        raise HTTPException(status_code=403, detail="You can only message users connected through an enrolled course")
    return course


@router.get("/contacts")
async def contacts(
    user: User = Depends(require_roles(Role.STUDENT, Role.TEACHER)),
    db: AsyncSession = Depends(get_db),
):
    if user.role == Role.STUDENT:
        result = await db.execute(
            select(User, Course)
            .join(Course, Course.teacher_id == User.id)
            .join(Enrollment, Enrollment.course_id == Course.id)
            .where(Enrollment.student_id == user.id, Enrollment.status == "ACTIVE")
            .order_by(User.name.asc())
        )
    else:
        result = await db.execute(
            select(User, Course)
            .join(Enrollment, Enrollment.student_id == User.id)
            .join(Course, Course.id == Enrollment.course_id)
            .where(Course.teacher_id == user.id, Enrollment.status == "ACTIVE")
            .order_by(User.name.asc())
        )

    seen: set[int] = set()
    rows = []
    for person, course in result.all():
        if person.id in seen:
            continue
        seen.add(person.id)
        rows.append({
            "id": person.id,
            "name": person.name,
            "email": person.email,
            "role": person.role,
            "course_id": course.id,
            "course_title": course.title,
            "avatar_url": getattr(person, "avatar_url", None),
        })
    return rows


@router.get("/{user_id}")
async def get_messages(
    user_id: int,
    user: User = Depends(require_roles(Role.STUDENT, Role.TEACHER)),
    db: AsyncSession = Depends(get_db),
):
    await _shared_course(user, user_id, None, db)

    result = await db.execute(
        select(Message)
        .where(
            or_(
                and_(Message.sender_id == user.id, Message.recipient_id == user_id),
                and_(Message.sender_id == user_id, Message.recipient_id == user.id),
            )
        )
        .order_by(Message.created_at.asc())
    )
    messages = list(result.scalars().all())

    for message in messages:
        if message.recipient_id == user.id and not message.is_read:
            message.is_read = True
    await db.commit()

    return [
        {
            "id": item.id,
            "sender_id": item.sender_id,
            "recipient_id": item.recipient_id,
            "course_id": item.course_id,
            "body": item.body,
            "link_url": item.link_url,
            "file_url": item.file_url,
            "file_name": item.file_name,
            "file_type": item.file_type,
            "is_read": item.is_read,
            "created_at": item.created_at,
        }
        for item in messages
    ]


@router.post("/{user_id}")
async def send_message(
    user_id: int,
    body: str | None = Form(default=None),
    link_url: str | None = Form(default=None),
    course_id: int | None = Form(default=None),
    file: UploadFile | None = File(default=None),
    user: User = Depends(require_roles(Role.STUDENT, Role.TEACHER)),
    db: AsyncSession = Depends(get_db),
):
    course = await _shared_course(user, user_id, course_id, db)

    clean_body = body.strip() if body else None
    clean_link = link_url.strip() if link_url else None

    if not clean_body and not clean_link and file is None:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    file_url = None
    file_name = None
    file_type = None

    if file is not None:
        safe_name = Path(file.filename or "attachment").name
        extension = Path(safe_name).suffix
        stored_name = f"{uuid4().hex}{extension}"
        destination = UPLOAD_DIR / stored_name

        total = 0
        with destination.open("wb") as output:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                total += len(chunk)
                if total > MAX_FILE_SIZE:
                    destination.unlink(missing_ok=True)
                    raise HTTPException(status_code=413, detail="Message attachment must be 10 MB or smaller")
                output.write(chunk)

        file_url = f"/uploads/messages/{stored_name}"
        file_name = safe_name
        file_type = file.content_type

    message = Message(
        sender_id=user.id,
        recipient_id=user_id,
        course_id=course.id,
        body=clean_body,
        link_url=clean_link,
        file_url=file_url,
        file_name=file_name,
        file_type=file_type,
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)

    return {
        "id": message.id,
        "sender_id": message.sender_id,
        "recipient_id": message.recipient_id,
        "course_id": message.course_id,
        "body": message.body,
        "link_url": message.link_url,
        "file_url": message.file_url,
        "file_name": message.file_name,
        "file_type": message.file_type,
        "is_read": message.is_read,
        "created_at": message.created_at,
    }
