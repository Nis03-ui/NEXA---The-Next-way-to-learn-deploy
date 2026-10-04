from pathlib import Path
from uuid import uuid4
import asyncio

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, Query
from fastapi.responses import Response
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import current_user, require_roles
from app.db.session import get_db
from app.models.course import Course, Enrollment
from app.models.user import Role, User
from app.models.message import Message
from app.services.google_drive import upload_file, download_file

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
    drive_file_id = None

    if file is not None:
        safe_name = Path(file.filename or "attachment").name
        content = await file.read(MAX_FILE_SIZE + 1)
        await file.close()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="Message attachment must be 10 MB or smaller")

        drive_name = f"message-{user.id}-{user_id}-{uuid4().hex}-{safe_name}"
        try:
            drive_file_id = await asyncio.to_thread(upload_file, content, drive_name, file.content_type)
        except Exception as exc:
            raise HTTPException(status_code=503, detail="Unable to store message attachment. Please try again.") from exc
        file_name = safe_name
        file_type = file.content_type

    message = Message(
        sender_id=user.id,
        recipient_id=user_id,
        course_id=course.id,
        body=clean_body,
        link_url=clean_link,
        file_url=None,
        file_name=file_name,
        file_type=file_type,
        drive_file_id=drive_file_id,
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


@router.get("/{user_id}/files/{message_id}")
async def get_message_file(
    user_id: int,
    message_id: int,
    download: bool = Query(False),
    user: User = Depends(require_roles(Role.STUDENT, Role.TEACHER)),
    db: AsyncSession = Depends(get_db),
):
    await _shared_course(user, user_id, None, db)
    message = await db.get(Message, message_id)
    if not message or {message.sender_id, message.recipient_id} != {user.id, user_id}:
        raise HTTPException(status_code=404, detail="Message file not found")
    if not message.drive_file_id:
        raise HTTPException(status_code=404, detail="Message file is no longer available")
    try:
        content, mime_type = await asyncio.to_thread(download_file, message.drive_file_id)
    except Exception as exc:
        raise HTTPException(status_code=404, detail="Message file is no longer available") from exc
    filename = message.file_name or "message-attachment"
    return Response(content=content, media_type=mime_type, headers={
        "Content-Disposition": f'{"attachment" if download else "inline"}; filename="{filename}"'
    })
