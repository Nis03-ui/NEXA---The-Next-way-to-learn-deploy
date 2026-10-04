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
from app.models.assignment import Assignment, AssignmentSubmission
from app.models.notification import Notification
from app.models.course import Course, Enrollment
from app.models.user import Role, User
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentResponse,
    AssignmentSubmissionCreate,
    AssignmentSubmissionResponse,
    AssignmentUpdate,
)
from app.services.notification import notify_course_students
from app.services.google_drive import upload_file, download_file, delete_file

router = APIRouter(tags=["Assignments"])


def normalize_datetime(value):
    """Store timezone-aware API datetimes as UTC-naive values for TIMESTAMP WITHOUT TIME ZONE columns."""
    if value is not None and value.tzinfo is not None:
        from datetime import timezone
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    return value


async def get_course_or_404(course_id: int, db: AsyncSession):
    course = await db.get(Course, course_id)

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found",
        )

    return course


async def check_course_teacher(
    course_id: int,
    user: User,
    db: AsyncSession,
):
    course = await get_course_or_404(course_id, db)

    if user.role != Role.ADMIN and course.teacher_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="You do not own this course",
        )

    return course


async def check_student_enrollment(
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
# TEACHER: CREATE ASSIGNMENT
# ---------------------------------------------------------

@router.post(
    "/courses/{course_id}/assignments",
    response_model=AssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_assignment(
    course_id: int,
    data: AssignmentCreate,
    user: User = Depends(
        require_roles(Role.TEACHER, Role.ADMIN)
    ),
    db: AsyncSession = Depends(get_db),
):
    await check_course_teacher(course_id, user, db)

    values = data.model_dump()
    if values.get("due_date") is not None:
        values["due_date"] = normalize_datetime(values["due_date"])

    assignment = Assignment(
        course_id=course_id,
        created_by=user.id,
        **values,
    )

    db.add(assignment)
    await db.flush()

    await notify_course_students(
    db=db,
    course_id=course_id,
    notification_type="ASSIGNMENT",
    title="New Assignment",
    message=f"New assignment: {assignment.title}",
    assignment_id=assignment.id,
)

    await db.commit()
    await db.refresh(assignment)

    return assignment


# ---------------------------------------------------------
# TEACHER: UPLOAD ASSIGNMENT FILE
# ---------------------------------------------------------

@router.post(
    "/courses/{course_id}/assignments/upload",
    response_model=AssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_assignment(
    course_id: int,
    file: UploadFile = File(...),
    title: str = Form(...),
    instructions: str | None = Form(None),
    due_date: str | None = Form(None),
    max_marks: int = Form(100),
    published: bool = Form(True),
    user: User = Depends(require_roles(Role.TEACHER, Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    await check_course_teacher(course_id, user, db)

    if not file.filename:
        raise HTTPException(status_code=400, detail="A file is required")
    if not title.strip():
        raise HTTPException(status_code=422, detail="Assignment title is required")
    if max_marks < 1:
        raise HTTPException(status_code=422, detail="Maximum marks must be greater than zero")

    parsed_due_date = None
    if due_date:
        from datetime import datetime
        try:
            parsed_due_date = normalize_datetime(datetime.fromisoformat(due_date.replace("Z", "+00:00")))
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid due date")

    max_size = 10 * 1024 * 1024
    content = await file.read(max_size + 1)
    await file.close()
    if len(content) > max_size:
        raise HTTPException(status_code=413, detail="File must be 10 MB or smaller")

    original_name = Path(file.filename).name
    drive_name = f"assignment-{course_id}-{uuid4().hex}-{original_name}"
    try:
        drive_file_id = await asyncio.to_thread(
            upload_file, content, drive_name, file.content_type
        )
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to store assignment file. Please try again.",
        ) from exc

    assignment = Assignment(
        course_id=course_id,
        created_by=user.id,
        title=title.strip()[:200],
        instructions=instructions,
        due_date=parsed_due_date,
        max_marks=max_marks,
        file_url=None,
        drive_file_id=drive_file_id,
        published=published,
    )
    db.add(assignment)
    await db.flush()
    assignment.file_url = f"/api/v1/assignments/{assignment.id}/file"
    await notify_course_students(
        db=db,
        course_id=course_id,
        notification_type="ASSIGNMENT",
        title="New Assignment",
        message=f"New assignment: {assignment.title}",
        assignment_id=assignment.id,
    )
    await db.commit()
    await db.refresh(assignment)
    return assignment


# ---------------------------------------------------------
# VIEW ASSIGNMENTS
# ---------------------------------------------------------

@router.get(
    "/courses/{course_id}/assignments",
    response_model=list[AssignmentResponse],
)
async def get_assignments(
    course_id: int,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    course = await get_course_or_404(course_id, db)

    if user.role == Role.STUDENT:
        await check_student_enrollment(
            course_id,
            user.id,
            db,
        )

    elif user.role == Role.TEACHER:
        if course.teacher_id != user.id:
            raise HTTPException(
                status_code=403,
                detail="You do not own this course",
            )

    elif user.role != Role.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Access denied",
        )

    query = select(Assignment).where(
        Assignment.course_id == course_id
    )

    if user.role == Role.STUDENT:
        query = query.where(
            Assignment.published.is_(True)
        )

    query = query.order_by(
        Assignment.due_date.asc().nulls_last(),
        Assignment.created_at.desc(),
    )

    result = await db.execute(query)

    return result.scalars().all()


# ---------------------------------------------------------
# TEACHER: UPDATE ASSIGNMENT
# ---------------------------------------------------------

@router.put(
    "/courses/{course_id}/assignments/{assignment_id}",
    response_model=AssignmentResponse,
)
async def update_assignment(
    course_id: int,
    assignment_id: int,
    data: AssignmentUpdate,
    user: User = Depends(
        require_roles(Role.TEACHER, Role.ADMIN)
    ),
    db: AsyncSession = Depends(get_db),
):
    await check_course_teacher(course_id, user, db)

    assignment = await db.get(
        Assignment,
        assignment_id,
    )

    if not assignment or assignment.course_id != course_id:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found",
        )

    values = data.model_dump(exclude_unset=True)
    if values.get("due_date") is not None:
        values["due_date"] = normalize_datetime(values["due_date"])

    for field, value in values.items():
        setattr(assignment, field, value)

    await db.commit()
    await db.refresh(assignment)

    return assignment


# ---------------------------------------------------------
# TEACHER: DELETE ASSIGNMENT
# ---------------------------------------------------------

@router.delete(
    "/courses/{course_id}/assignments/{assignment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_assignment(
    course_id: int,
    assignment_id: int,
    user: User = Depends(
        require_roles(Role.TEACHER, Role.ADMIN)
    ),
    db: AsyncSession = Depends(get_db),
):
    await check_course_teacher(course_id, user, db)

    assignment = await db.get(
        Assignment,
        assignment_id,
    )

    if not assignment or assignment.course_id != course_id:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found",
        )

    if assignment.drive_file_id:
        try:
            await asyncio.to_thread(delete_file, assignment.drive_file_id)
        except Exception:
            pass

    await db.delete(assignment)
    await db.commit()


# ---------------------------------------------------------
# VIEW ASSIGNMENT FILE
# ---------------------------------------------------------

@router.get("/assignments/{assignment_id}/file")
async def get_assignment_file(
    assignment_id: int,
    download: bool = Query(False),
    user: User = Depends(require_roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    assignment = await db.get(Assignment, assignment_id)
    if not assignment or not assignment.file_url:
        raise HTTPException(status_code=404, detail="Assignment file not found")

    if user.role == Role.STUDENT:
        await check_student_enrollment(assignment.course_id, user.id, db)
        if not assignment.published:
            raise HTTPException(status_code=404, detail="Assignment file not found")
    elif user.role == Role.TEACHER:
        await check_course_teacher(assignment.course_id, user, db)

    if not assignment.drive_file_id:
        raise HTTPException(status_code=404, detail="Assignment file is no longer available")

    try:
        content, mime_type = await asyncio.to_thread(download_file, assignment.drive_file_id)
    except Exception as exc:
        raise HTTPException(status_code=404, detail="Assignment file is no longer available") from exc

    filename = assignment.title or "assignment"
    return Response(
        content=content,
        media_type=mime_type,
        headers={
            "Content-Disposition": (
                f'{"attachment" if download else "inline"}; filename="{filename}"'
            )
        },
    )


# ---------------------------------------------------------
# STUDENT: SUBMIT ASSIGNMENT
# ---------------------------------------------------------

@router.post(
    "/assignments/{assignment_id}/submit",
    response_model=AssignmentSubmissionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def submit_assignment(
    assignment_id: int,
    data: AssignmentSubmissionCreate,
    user: User = Depends(
        require_roles(Role.STUDENT)
    ),
    db: AsyncSession = Depends(get_db),
):
    assignment = await db.get(
        Assignment,
        assignment_id,
    )

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found",
        )

    if not assignment.published:
        raise HTTPException(
            status_code=400,
            detail="Assignment is not published",
        )

    await check_student_enrollment(
        assignment.course_id,
        user.id,
        db,
    )

    existing_result = await db.execute(
        select(AssignmentSubmission).where(
            AssignmentSubmission.assignment_id
            == assignment_id,
            AssignmentSubmission.student_id
            == user.id,
        )
    )

    existing = existing_result.scalar_one_or_none()

    if existing:
        existing.file_url = data.file_url
        existing.external_url = data.external_url
        existing.status = "SUBMITTED"

        await db.commit()
        await db.refresh(existing)

        return existing

    submission = AssignmentSubmission(
        assignment_id=assignment_id,
        student_id=user.id,
        file_url=data.file_url,
        external_url=data.external_url,
        status="SUBMITTED",
    )

    db.add(submission)

    await db.commit()
    await db.refresh(submission)

    return submission


# ---------------------------------------------------------
# STUDENT: UPLOAD FILE SUBMISSION
# ---------------------------------------------------------

@router.post(
    "/assignments/{assignment_id}/submit-file",
    response_model=AssignmentSubmissionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def submit_assignment_file(
    assignment_id: int,
    file: UploadFile = File(...),
    external_url: str | None = Form(None),
    user: User = Depends(require_roles(Role.STUDENT)),
    db: AsyncSession = Depends(get_db),
):
    assignment = await db.get(Assignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if not assignment.published:
        raise HTTPException(status_code=400, detail="Assignment is not published")
    await check_student_enrollment(assignment.course_id, user.id, db)
    if not file.filename:
        raise HTTPException(status_code=400, detail="A file is required")

    max_size = 10 * 1024 * 1024
    content = await file.read(max_size + 1)
    await file.close()
    if len(content) > max_size:
        raise HTTPException(status_code=413, detail="File must be 10 MB or smaller")

    original_name = Path(file.filename).name
    drive_name = f"submission-{assignment_id}-{user.id}-{uuid4().hex}-{original_name}"
    try:
        drive_file_id = await asyncio.to_thread(
            upload_file, content, drive_name, file.content_type
        )
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to store submission file. Please try again.",
        ) from exc

    existing_result = await db.execute(
        select(AssignmentSubmission).where(
            AssignmentSubmission.assignment_id == assignment_id,
            AssignmentSubmission.student_id == user.id,
        )
    )
    submission = existing_result.scalar_one_or_none()
    file_url = None

    if submission:
        if submission.drive_file_id and submission.drive_file_id != drive_file_id:
            try:
                await asyncio.to_thread(delete_file, submission.drive_file_id)
            except Exception:
                pass
        submission.file_url = file_url
        submission.drive_file_id = drive_file_id
        submission.external_url = external_url
        submission.status = "SUBMITTED"
    else:
        submission = AssignmentSubmission(
            assignment_id=assignment_id,
            student_id=user.id,
            file_url=file_url,
            drive_file_id=drive_file_id,
            external_url=external_url,
            status="SUBMITTED",
        )
        db.add(submission)

    await db.commit()
    await db.refresh(submission)
    return submission


# ---------------------------------------------------------
# STUDENT: VIEW OWN SUBMISSION
# ---------------------------------------------------------

@router.get(
    "/assignments/{assignment_id}/submission",
    response_model=AssignmentSubmissionResponse | None,
)
async def get_my_submission(
    assignment_id: int,
    user: User = Depends(
        require_roles(Role.STUDENT)
    ),
    db: AsyncSession = Depends(get_db),
):
    assignment = await db.get(
        Assignment,
        assignment_id,
    )

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found",
        )

    await check_student_enrollment(
        assignment.course_id,
        user.id,
        db,
    )

    result = await db.execute(
        select(AssignmentSubmission).where(
            AssignmentSubmission.assignment_id
            == assignment_id,
            AssignmentSubmission.student_id
            == user.id,
        )
    )

    return result.scalar_one_or_none()


# ---------------------------------------------------------
# VIEW SUBMITTED FILE
# ---------------------------------------------------------

@router.get("/assignments/{assignment_id}/submissions/{submission_id}/file")
async def get_submission_file(
    assignment_id: int,
    submission_id: int,
    download: bool = Query(False),
    user: User = Depends(require_roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    assignment = await db.get(Assignment, assignment_id)
    submission = await db.get(AssignmentSubmission, submission_id)
    if not assignment or not submission or submission.assignment_id != assignment_id:
        raise HTTPException(status_code=404, detail="Submission file not found")

    if user.role == Role.STUDENT and submission.student_id != user.id:
        raise HTTPException(status_code=403, detail="You can only access your own submission")
    if user.role == Role.STUDENT:
        await check_student_enrollment(assignment.course_id, user.id, db)
    else:
        await check_course_teacher(assignment.course_id, user, db)

    if not submission.file_url:
        raise HTTPException(status_code=404, detail="This submission has no file")

    if not submission.drive_file_id:
        raise HTTPException(status_code=404, detail="Submitted file is no longer available")

    try:
        content, mime_type = await asyncio.to_thread(download_file, submission.drive_file_id)
    except Exception as exc:
        raise HTTPException(status_code=404, detail="Submitted file is no longer available") from exc

    filename = f"submission-{submission.id}"
    return Response(
        content=content,
        media_type=mime_type,
        headers={
            "Content-Disposition": (
                f'{"attachment" if download else "inline"}; filename="{filename}"'
            )
        },
    )

# ---------------------------------------------------------
# TEACHER: VIEW SUBMISSIONS
# ---------------------------------------------------------

@router.get(
    "/assignments/{assignment_id}/submissions",
    response_model=list[AssignmentSubmissionResponse],
)
async def get_submissions(
    assignment_id: int,
    user: User = Depends(
        require_roles(Role.TEACHER, Role.ADMIN)
    ),
    db: AsyncSession = Depends(get_db),
):
    assignment = await db.get(
        Assignment,
        assignment_id,
    )

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found",
        )

    await check_course_teacher(
        assignment.course_id,
        user,
        db,
    )

    result = await db.execute(
        select(AssignmentSubmission)
        .where(
            AssignmentSubmission.assignment_id
            == assignment_id
        )
        .order_by(
            AssignmentSubmission.submitted_at.desc()
        )
    )

    return result.scalars().all()


# ---------------------------------------------------------
# TEACHER: GRADE SUBMISSION
# ---------------------------------------------------------

@router.put(
    "/assignments/{assignment_id}/submissions/{submission_id}/grade",
    response_model=AssignmentSubmissionResponse,
)
async def grade_submission(
    assignment_id: int,
    submission_id: int,
    marks: int,
    feedback: str | None = None,
    user: User = Depends(
        require_roles(Role.TEACHER, Role.ADMIN)
    ),
    db: AsyncSession = Depends(get_db),
):
    assignment = await db.get(
        Assignment,
        assignment_id,
    )

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found",
        )

    await check_course_teacher(
        assignment.course_id,
        user,
        db,
    )

    if marks < 0 or marks > assignment.max_marks:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Marks must be between 0 and "
                f"{assignment.max_marks}"
            ),
        )

    submission = await db.get(
        AssignmentSubmission,
        submission_id,
    )

    if (
        not submission
        or submission.assignment_id != assignment_id
    ):
        raise HTTPException(
            status_code=404,
            detail="Submission not found",
        )

    submission.marks = marks
    submission.feedback = feedback
    submission.status = "GRADED"

    db.add(
        Notification(
            recipient_id=submission.student_id,
            type="GRADE",
            title="Assignment Graded",
            message=(
                f"Your assignment '{assignment.title}' has been graded: "
                f"{marks}/{assignment.max_marks}."
            ),
            course_id=assignment.course_id,
            assignment_id=assignment.id,
        )
    )

    await db.commit()
    await db.refresh(submission)

    return submission