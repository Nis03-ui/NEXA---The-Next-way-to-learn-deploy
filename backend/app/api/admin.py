
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_roles
from app.db.session import get_db
from app.models.chat import ChatSession
from app.models.content import Content
from app.models.course import Course
from app.models.quiz import Quiz
from app.models.notification import Notification
from app.models.user import Role, User
from app.schemas.admin import AdminUserOut, RoleUpdate


router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats")
async def stats(
    _: User = Depends(require_roles(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    user_count = (
        await db.execute(
            select(func.count(User.id))
        )
    ).scalar_one()

    teacher_count = (
        await db.execute(
            select(func.count(User.id))
            .where(User.role == Role.TEACHER)
        )
    ).scalar_one()

    student_count = (
        await db.execute(
            select(func.count(User.id))
            .where(User.role == Role.STUDENT)
        )
    ).scalar_one()

    admin_count = (
        await db.execute(
            select(func.count(User.id))
            .where(User.role == Role.ADMIN)
        )
    ).scalar_one()

    session_count = (
        await db.execute(
            select(func.count(ChatSession.id))
        )
    ).scalar_one()

    content_count = (
        await db.execute(
            select(func.count(Content.id))
        )
    ).scalar_one()

    published_content_count = (
        await db.execute(
            select(func.count(Content.id)).where(Content.published.is_(True))
        )
    ).scalar_one()

    course_count = (
        await db.execute(
            select(func.count(Course.id))
        )
    ).scalar_one()

    quiz_count = (
        await db.execute(
            select(func.count(Quiz.id))
        )
    ).scalar_one()

    return {
        "total_users": user_count,
        "total_students": student_count,
        "total_teachers": teacher_count,
        "total_admins": admin_count,
        "total_content": content_count,
        "published_content": published_content_count,
        "total_courses": course_count,
        "total_quizzes": quiz_count,
        "chat_sessions": session_count,
        "api_health": "ok",
    }


@router.get(
    "/users",
    response_model=list[AdminUserOut],
)
async def get_users(
    _: User = Depends(require_roles(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).order_by(User.created_at.desc())
    )

    return result.scalars().all()


@router.get(
    "/users/{user_id}",
    response_model=AdminUserOut,
)
async def get_user(
    user_id: int,
    _: User = Depends(require_roles(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, user_id)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return user


@router.patch(
    "/users/{user_id}/role",
    response_model=AdminUserOut,
)
async def update_user_role(
    user_id: int,
    data: RoleUpdate,
    admin: User = Depends(require_roles(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, user_id)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if user.id == admin.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot change your own role",
        )

    user.role = data.role

    await db.commit()
    await db.refresh(user)

    return user


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    admin: User = Depends(require_roles(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, user_id)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if user.id == admin.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot delete your own account",
        )

    await db.execute(
        delete(ChatSession).where(
            ChatSession.user_id == user.id
        )
    )

    await db.delete(user)
    await db.commit()

    return {
        "message": "User deleted successfully"
    }


@router.get("/announcements")
async def get_announcements(
    _: User = Depends(require_roles(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification)
        .where(Notification.type == "ANNOUNCEMENT")
        .order_by(Notification.created_at.desc())
    )
    rows = result.scalars().all()

    grouped = {}
    for row in rows:
        key = (row.title, row.message, row.created_at.replace(second=0, microsecond=0))
        if key not in grouped:
            grouped[key] = {
                "id": row.id,
                "title": row.title,
                "message": row.message,
                "created_at": row.created_at,
                "recipients": 0,
            }
        grouped[key]["recipients"] += 1

    return list(grouped.values())
