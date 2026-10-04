from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import current_user, require_roles
from app.db.session import get_db
from app.models.course import Course, Enrollment
from app.models.user import Role, User
from app.schemas.course import (
    CourseCreate,
    CourseResponse,
    CourseUpdate,
    CourseWithEnrollment,
    EnrollmentResponse,
    AdminCourseResponse,
)

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    payload: CourseCreate,
    user: User = Depends(require_roles(Role.TEACHER, Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    course = Course(
        title=payload.title,
        description=payload.description,
        subject=payload.subject,
        thumbnail_url=payload.thumbnail_url,
        teacher_id=user.id,
        published=False,
    )
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course


@router.get("/mine", response_model=list[CourseResponse])
async def get_my_courses_as_teacher(
    user: User = Depends(require_roles(Role.TEACHER, Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Course)
        .where(Course.teacher_id == user.id)
        .order_by(Course.created_at.desc())
    )
    return list(result.scalars().all())


@router.get("/my", response_model=list[CourseWithEnrollment])
async def get_my_enrolled_courses(
    user: User = Depends(require_roles(Role.STUDENT)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Course, Enrollment)
        .join(Enrollment, Enrollment.course_id == Course.id)
        .where(
            Enrollment.student_id == user.id,
            Enrollment.status == "ACTIVE",
        )
        .order_by(Enrollment.enrolled_at.desc())
    )

    return [
        CourseWithEnrollment(
            id=course.id,
            title=course.title,
            description=course.description,
            subject=course.subject,
            thumbnail_url=course.thumbnail_url,
            teacher_id=course.teacher_id,
            published=course.published,
            created_at=course.created_at,
            updated_at=course.updated_at,
            enrollment_id=enrollment.id,
            enrollment_status=enrollment.status,
        )
        for course, enrollment in result.all()
    ]


@router.get("/admin/overview", response_model=list[AdminCourseResponse])
async def get_admin_course_overview(
    user: User = Depends(require_roles(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Course, User)
        .join(User, User.id == Course.teacher_id)
        .order_by(Course.created_at.desc())
    )

    rows = []
    for course, teacher in result.all():
        enrollment_result = await db.execute(
            select(Enrollment).where(
                Enrollment.course_id == course.id,
                Enrollment.status == "ACTIVE",
            )
        )
        rows.append(AdminCourseResponse(
            id=course.id,
            title=course.title,
            description=course.description,
            subject=course.subject,
            thumbnail_url=course.thumbnail_url,
            teacher_id=course.teacher_id,
            teacher_name=teacher.name,
            teacher_email=teacher.email,
            published=course.published,
            enrolled_students=len(enrollment_result.scalars().all()),
            created_at=course.created_at,
            updated_at=course.updated_at,
        ))
    return rows


@router.get("/{course_id}/teacher")
async def get_course_teacher(
    course_id: int,
    user: User = Depends(require_roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    course = await db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")

    if user.role == Role.STUDENT:
        enrolled = await db.execute(
            select(Enrollment).where(
                Enrollment.course_id == course_id,
                Enrollment.student_id == user.id,
                Enrollment.status == "ACTIVE",
            )
        )
        if enrolled.scalar_one_or_none() is None:
            raise HTTPException(status_code=403, detail="You are not enrolled in this course")

    teacher = await db.get(User, course.teacher_id)
    if teacher is None:
        raise HTTPException(status_code=404, detail="Teacher not found")

    return {
        "id": teacher.id,
        "name": teacher.name,
        "email": teacher.email,
        "role": teacher.role,
        "avatar_url": getattr(teacher, "avatar_url", None),
        "bio": getattr(teacher, "bio", None),
    }


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: int,
    user: User = Depends(require_roles(Role.TEACHER, Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    course = await db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    if user.role != Role.ADMIN and course.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="You do not own this course")
    return course


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: int,
    payload: CourseUpdate,
    user: User = Depends(require_roles(Role.TEACHER, Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    course = await db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    if user.role != Role.ADMIN and course.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="You do not own this course")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(course, field, value)

    await db.commit()
    await db.refresh(course)
    return course


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: int,
    user: User = Depends(require_roles(Role.TEACHER, Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    course = await db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    if user.role != Role.ADMIN and course.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="You do not own this course")

    await db.delete(course)
    await db.commit()


@router.post("/{course_id}/publish", response_model=CourseResponse)
async def publish_course(
    course_id: int,
    user: User = Depends(require_roles(Role.TEACHER, Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    course = await db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    if user.role != Role.ADMIN and course.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="You do not own this course")

    course.published = True
    await db.commit()
    await db.refresh(course)
    return course


@router.get("", response_model=list[CourseResponse])
async def browse_courses(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Course)
        .where(Course.published.is_(True))
        .order_by(Course.created_at.desc())
    )
    return list(result.scalars().all())


@router.get("/{course_id}/students")
async def get_course_students(
    course_id: int,
    user: User = Depends(require_roles(Role.TEACHER, Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    course = await db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    if user.role == Role.TEACHER and course.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="You can only manage students in your own courses")

    result = await db.execute(
        select(Enrollment, User)
        .join(User, User.id == Enrollment.student_id)
        .where(Enrollment.course_id == course_id)
        .order_by(Enrollment.enrolled_at.desc())
    )

    return [
        {
            "enrollment_id": enrollment.id,
            "student_id": student.id,
            "name": student.name,
            "email": student.email,
            "status": enrollment.status,
            "enrolled_at": enrollment.enrolled_at,
        }
        for enrollment, student in result.all()
    ]


@router.delete("/{course_id}/students/{student_id}")
async def remove_course_student(
    course_id: int,
    student_id: int,
    user: User = Depends(require_roles(Role.TEACHER, Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    course = await db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    if user.role == Role.TEACHER and course.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="You can only manage students in your own courses")

    result = await db.execute(
        select(Enrollment).where(
            Enrollment.course_id == course_id,
            Enrollment.student_id == student_id,
        )
    )
    enrollment = result.scalar_one_or_none()
    if enrollment is None:
        raise HTTPException(status_code=404, detail="Student is not enrolled in this course")

    enrollment.status = "REMOVED"
    await db.commit()
    return {"message": "Student removed from course"}


@router.post("/{course_id}/enroll", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
async def enroll_in_course(
    course_id: int,
    user: User = Depends(require_roles(Role.STUDENT)),
    db: AsyncSession = Depends(get_db),
):
    course = await db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    if not course.published:
        raise HTTPException(status_code=400, detail="Course is not published")

    result = await db.execute(
        select(Enrollment).where(
            Enrollment.course_id == course_id,
            Enrollment.student_id == user.id,
        )
    )
    enrollment = result.scalar_one_or_none()

    if enrollment is not None:
        if enrollment.status != "ACTIVE":
            enrollment.status = "ACTIVE"
            await db.commit()
            await db.refresh(enrollment)
            return enrollment
        raise HTTPException(status_code=409, detail="Already enrolled in this course")

    enrollment = Enrollment(
        course_id=course_id,
        student_id=user.id,
        status="ACTIVE",
    )
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)
    return enrollment
