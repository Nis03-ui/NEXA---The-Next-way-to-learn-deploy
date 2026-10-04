from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status, Query
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pathlib import Path
from uuid import uuid4
import asyncio

from app.core.security import current_user, require_roles
from app.core.config import settings
from app.db.session import get_db
from app.services.notification import notify_course_students
from app.services.google_drive import upload_file, download_file, delete_file
from app.models.course import Course, Enrollment
from app.models.course_material import CourseMaterial
from app.models.user import Role, User
from app.schemas.course_material import (
    CourseMaterialCreate,
    CourseMaterialResponse,
    CourseMaterialUpdate,
)

router = APIRouter(
    prefix="/courses",
    tags=["Course Materials"],
)


@router.post(
    "/{course_id}/materials",
    response_model=CourseMaterialResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_material(
    course_id: int,
    data: CourseMaterialCreate,
    user: User = Depends(require_roles(Role.TEACHER, Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    course = await db.get(Course, course_id)

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found",
        )

    if user.role != Role.ADMIN and course.teacher_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="You do not own this course",
        )

    material = CourseMaterial(
        course_id=course_id,
        uploaded_by=user.id,
        **data.model_dump(),
    )

    db.add(material)
    await db.flush()

    await notify_course_students(
        db=db,
        course_id=course_id,
        notification_type="MATERIAL",
        title="New Course Material",
        message=f"New material: {material.title}",
    )

    await db.commit()
    await db.refresh(material)

    return material




@router.post(
    "/{course_id}/materials/upload",
    response_model=CourseMaterialResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_material(
    course_id: int,
    file: UploadFile = File(...),
    title: str | None = Form(None),
    description: str | None = Form(None),
    published: bool = Form(True),
    user: User = Depends(require_roles(Role.TEACHER, Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if user.role != Role.ADMIN and course.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="You do not own this course")
    if not file.filename:
        raise HTTPException(status_code=400, detail="A file is required")

    max_size = 10 * 1024 * 1024
    content = await file.read(max_size + 1)
    await file.close()
    if len(content) > max_size:
        raise HTTPException(status_code=413, detail="File must be 10 MB or smaller")

    original_name = Path(file.filename).name
    drive_name = f"material-{course_id}-{uuid4().hex}-{original_name}"
    try:
        drive_file_id = await asyncio.to_thread(
            upload_file, content, drive_name, file.content_type
        )
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to store material file. Please try again.",
        ) from exc

    material = CourseMaterial(
        course_id=course_id,
        uploaded_by=user.id,
        title=(title or Path(file.filename).stem).strip()[:200],
        description=description,
        file_url=None,
        drive_file_id=drive_file_id,
        published=published,
    )
    db.add(material)
    await db.flush()
    material.file_url = f"/api/v1/courses/{course_id}/materials/{material.id}/file"
    await notify_course_students(
        db=db,
        course_id=course_id,
        notification_type="MATERIAL",
        title="New Course Material",
        message=f"New material: {material.title}",
    )
    await db.commit()
    await db.refresh(material)
    return material
@router.get(
    "/{course_id}/materials/{material_id}/file",
)
async def get_material_file(
    course_id: int,
    material_id: int,
    download: bool = Query(False),
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if user.role == Role.STUDENT:
        enrollment = await db.execute(
            select(Enrollment).where(
                Enrollment.course_id == course_id,
                Enrollment.student_id == user.id,
                Enrollment.status == "ACTIVE",
            )
        )
        if not enrollment.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="You are not enrolled in this course")
    elif user.role == Role.TEACHER and course.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="You do not own this course")
    elif user.role not in (Role.STUDENT, Role.TEACHER, Role.ADMIN):
        raise HTTPException(status_code=403, detail="Access denied")

    material = await db.get(CourseMaterial, material_id)
    if not material or material.course_id != course_id or not material.file_url:
        raise HTTPException(status_code=404, detail="Material file not found")

    if user.role == Role.STUDENT and not material.published:
        raise HTTPException(status_code=404, detail="Material file not found")

    if not material.drive_file_id:
        raise HTTPException(status_code=404, detail="Material file is no longer available")

    try:
        content, mime_type = await asyncio.to_thread(download_file, material.drive_file_id)
    except Exception as exc:
        raise HTTPException(status_code=404, detail="Material file is no longer available") from exc

    suffix = Path(material.title or "course-material").suffix
    filename = f"{material.title or 'course-material'}{suffix}"
    return Response(
        content=content,
        media_type=mime_type,
        headers={
            "Content-Disposition": (
                f'{"attachment" if download else "inline"}; filename="{filename}"'
            )
        },
    )


@router.get(
    "/{course_id}/materials",
    response_model=list[CourseMaterialResponse],
)
async def get_course_materials(
    course_id: int,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    course = await db.get(Course, course_id)

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found",
        )

    # Teachers/admins can view their course materials.
    if user.role in (Role.TEACHER, Role.ADMIN):
        if user.role == Role.TEACHER and course.teacher_id != user.id:
            raise HTTPException(
                status_code=403,
                detail="You do not own this course",
            )

    # Students must be actively enrolled.
    elif user.role == Role.STUDENT:
        enrollment_result = await db.execute(
            select(Enrollment).where(
                Enrollment.course_id == course_id,
                Enrollment.student_id == user.id,
                Enrollment.status == "ACTIVE",
            )
        )

        if not enrollment_result.scalar_one_or_none():
            raise HTTPException(
                status_code=403,
                detail="You are not enrolled in this course",
            )

    else:
        raise HTTPException(
            status_code=403,
            detail="Access denied",
        )

    query = select(CourseMaterial).where(
        CourseMaterial.course_id == course_id,
    )

    if user.role == Role.STUDENT:
        query = query.where(CourseMaterial.published.is_(True))

    result = await db.execute(
        query.order_by(CourseMaterial.created_at.desc())
    )

    return result.scalars().all()


@router.put(
    "/{course_id}/materials/{material_id}",
    response_model=CourseMaterialResponse,
)
async def update_material(
    course_id: int,
    material_id: int,
    data: CourseMaterialUpdate,
    user: User = Depends(require_roles(Role.TEACHER, Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    material = await db.get(CourseMaterial, material_id)

    if not material or material.course_id != course_id:
        raise HTTPException(
            status_code=404,
            detail="Material not found",
        )

    course = await db.get(Course, course_id)

    if user.role != Role.ADMIN and course.teacher_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="You do not own this course",
        )

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(material, field, value)

    await db.commit()
    await db.refresh(material)

    return material


@router.delete(
    "/{course_id}/materials/{material_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_material(
    course_id: int,
    material_id: int,
    user: User = Depends(require_roles(Role.TEACHER, Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    material = await db.get(CourseMaterial, material_id)

    if not material or material.course_id != course_id:
        raise HTTPException(
            status_code=404,
            detail="Material not found",
        )

    course = await db.get(Course, course_id)

    if user.role != Role.ADMIN and course.teacher_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="You do not own this course",
        )

    if material.drive_file_id:
        try:
            await asyncio.to_thread(delete_file, material.drive_file_id)
        except Exception:
            pass

    await db.delete(material)
    await db.commit()