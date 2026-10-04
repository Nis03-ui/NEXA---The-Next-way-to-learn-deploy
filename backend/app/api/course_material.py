from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pathlib import Path
from uuid import uuid4

from app.core.security import current_user, require_roles
from app.db.session import get_db
from app.services.notification import notify_course_students
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
    storage_dir = Path("uploads") / "materials" / str(course_id)
    storage_dir.mkdir(parents=True, exist_ok=True)
    suffix = Path(file.filename).suffix
    safe_name = f"{uuid4().hex}{suffix}"
    target = storage_dir / safe_name

    size = 0
    try:
        with target.open("wb") as output:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > max_size:
                    target.unlink(missing_ok=True)
                    raise HTTPException(status_code=413, detail="File must be 10 MB or smaller")
                output.write(chunk)
    finally:
        await file.close()

    material = CourseMaterial(
        course_id=course_id,
        uploaded_by=user.id,
        title=Path(file.filename).stem[:200],
        description=description,
        file_url=f"/uploads/materials/{course_id}/{safe_name}",
        published=published,
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

    result = await db.execute(
        select(CourseMaterial)
        .where(
            CourseMaterial.course_id == course_id,
            CourseMaterial.published.is_(True),
        )
        .order_by(CourseMaterial.created_at.desc())
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

    await db.delete(material)
    await db.commit()