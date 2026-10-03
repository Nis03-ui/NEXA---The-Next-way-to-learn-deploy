import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import require_roles
from app.db.session import get_db
from app.models.quiz import (
    Quiz,
    QuizAnswer,
    QuizAttempt,
    QuizQuestion,
)
from app.models.user import Role, User
from app.schemas.quiz import (
    QuizAttemptCreate,
    QuizAttemptResponse,
    QuizCreate,
    QuizQuestionResponse,
    QuizResponse,
    QuizSummaryResponse,
    QuizUpdate,
)


router = APIRouter(
    prefix="/quizzes",
    tags=["Quizzes"],
)


def encode_options(options: list[str] | None) -> str | None:
    if options is None:
        return None

    return json.dumps(options)


def decode_options(options: str | None) -> list[str] | None:
    if not options:
        return None

    try:
        value = json.loads(options)

        if isinstance(value, list):
            return value

    except (json.JSONDecodeError, TypeError):
        pass

    return None


def serialize_question(
    question: QuizQuestion,
) -> QuizQuestionResponse:
    return QuizQuestionResponse(
        id=question.id,
        question=question.question,
        question_type=question.question_type,
        options=decode_options(question.options),
        marks=question.marks,
        order_index=question.order_index,
    )


async def get_quiz(
    quiz_id: int,
    db: AsyncSession,
) -> Quiz:
    result = await db.execute(
        select(Quiz)
        .options(
            selectinload(Quiz.questions),
        )
        .where(Quiz.id == quiz_id)
    )

    quiz = result.scalar_one_or_none()

    if quiz is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found",
        )

    return quiz


def build_quiz_response(
    quiz: Quiz,
) -> QuizResponse:
    questions = sorted(
        quiz.questions,
        key=lambda question: question.order_index,
    )

    return QuizResponse(
        id=quiz.id,
        title=quiz.title,
        description=quiz.description,
        subject=quiz.subject,
        author_id=quiz.author_id,
        published=quiz.published,
        time_limit_minutes=quiz.time_limit_minutes,
        created_at=quiz.created_at,
        updated_at=quiz.updated_at,
        questions=[
            serialize_question(question)
            for question in questions
        ],
    )


@router.post(
    "",
    response_model=QuizResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_quiz(
    data: QuizCreate,
    user: User = Depends(
        require_roles(Role.TEACHER, Role.ADMIN)
    ),
    db: AsyncSession = Depends(get_db),
):
    quiz = Quiz(
        title=data.title,
        description=data.description,
        subject=data.subject,
        author_id=user.id,
        published=data.published,
        time_limit_minutes=data.time_limit_minutes,
    )

    for index, question_data in enumerate(data.questions):
        question = QuizQuestion(
            question=question_data.question,
            question_type=question_data.question_type,
            options=encode_options(
                question_data.options
            ),
            correct_answer=question_data.correct_answer,
            marks=question_data.marks,
            order_index=index,
        )

        quiz.questions.append(question)

    db.add(quiz)

    await db.commit()

    await db.refresh(quiz)

    quiz = await get_quiz(
        quiz.id,
        db,
    )

    return build_quiz_response(quiz)


@router.get(
    "",
    response_model=list[QuizSummaryResponse],
)
async def list_quizzes(
    user: User = Depends(
        require_roles(
            Role.STUDENT,
            Role.TEACHER,
            Role.ADMIN,
        )
    ),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(
            Quiz.id,
            Quiz.title,
            Quiz.description,
            Quiz.subject,
            Quiz.author_id,
            Quiz.published,
            Quiz.time_limit_minutes,
            func.count(QuizQuestion.id).label(
                "question_count"
            ),
        )
        .outerjoin(
            QuizQuestion,
            QuizQuestion.quiz_id == Quiz.id,
        )
        .group_by(Quiz.id)
    )

    if user.role == Role.STUDENT:
        query = query.where(
            Quiz.published.is_(True)
        )

    elif user.role == Role.TEACHER:
        query = query.where(
            Quiz.author_id == user.id
        )

    result = await db.execute(
        query.order_by(
            Quiz.created_at.desc()
        )
    )

    return [
        QuizSummaryResponse(
            id=row.id,
            title=row.title,
            description=row.description,
            subject=row.subject,
            author_id=row.author_id,
            published=row.published,
            time_limit_minutes=row.time_limit_minutes,
            question_count=row.question_count,
        )
        for row in result
    ]


@router.get(
    "/{quiz_id}",
    response_model=QuizResponse,
)
async def get_quiz_by_id(
    quiz_id: int,
    user: User = Depends(
        require_roles(
            Role.STUDENT,
            Role.TEACHER,
            Role.ADMIN,
        )
    ),
    db: AsyncSession = Depends(get_db),
):
    quiz = await get_quiz(
        quiz_id,
        db,
    )

    if not quiz.published:
        if user.role == Role.STUDENT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This quiz is not published",
            )

        if (
            user.role == Role.TEACHER
            and quiz.author_id != user.id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access your own quizzes",
            )

    return build_quiz_response(quiz)


@router.patch(
    "/{quiz_id}",
    response_model=QuizResponse,
)
async def update_quiz(
    quiz_id: int,
    data: QuizUpdate,
    user: User = Depends(
        require_roles(Role.TEACHER, Role.ADMIN)
    ),
    db: AsyncSession = Depends(get_db),
):
    quiz = await get_quiz(
        quiz_id,
        db,
    )

    if (
        user.role == Role.TEACHER
        and quiz.author_id != user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only modify your own quizzes",
        )

    updates = data.model_dump(
        exclude_unset=True,
        exclude={"questions"},
    )

    for field, value in updates.items():
        setattr(
            quiz,
            field,
            value,
        )

    if data.questions is not None:
        for question in list(quiz.questions):
            await db.delete(question)

        await db.flush()

        for index, question_data in enumerate(
            data.questions
        ):
            question = QuizQuestion(
                quiz_id=quiz.id,
                question=question_data.question,
                question_type=question_data.question_type,
                options=encode_options(
                    question_data.options
                ),
                correct_answer=question_data.correct_answer,
                marks=question_data.marks,
                order_index=index,
            )

            db.add(question)

    await db.commit()

    quiz = await get_quiz(
        quiz.id,
        db,
    )

    return build_quiz_response(quiz)


@router.delete(
    "/{quiz_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_quiz(
    quiz_id: int,
    user: User = Depends(
        require_roles(Role.TEACHER, Role.ADMIN)
    ),
    db: AsyncSession = Depends(get_db),
):
    quiz = await get_quiz(
        quiz_id,
        db,
    )

    if (
        user.role == Role.TEACHER
        and quiz.author_id != user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own quizzes",
        )

    await db.delete(quiz)

    await db.commit()


@router.post(
    "/{quiz_id}/attempt",
    response_model=QuizAttemptResponse,
    status_code=status.HTTP_201_CREATED,
)
async def submit_quiz(
    quiz_id: int,
    data: QuizAttemptCreate,
    user: User = Depends(
        require_roles(Role.STUDENT)
    ),
    db: AsyncSession = Depends(get_db),
):
    quiz = await get_quiz(
        quiz_id,
        db,
    )

    if not quiz.published:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This quiz is not published",
        )

    questions = {
        question.id: question
        for question in quiz.questions
    }

    submitted_ids = {
        answer.question_id
        for answer in data.answers
    }

    invalid_ids = (
        submitted_ids - questions.keys()
    )

    if invalid_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more question IDs are invalid",
        )

    total_marks = sum(
        question.marks
        for question in quiz.questions
    )

    attempt = QuizAttempt(
        quiz_id=quiz.id,
        student_id=user.id,
        score=0,
        total_marks=total_marks,
    )

    db.add(attempt)

    await db.flush()

    score = 0

    for submitted in data.answers:
        question = questions[
            submitted.question_id
        ]

        is_correct = (
            submitted.answer.strip().lower()
            == question.correct_answer.strip().lower()
        )

        marks_awarded = (
            question.marks
            if is_correct
            else 0
        )

        score += marks_awarded

        answer = QuizAnswer(
            attempt_id=attempt.id,
            question_id=question.id,
            answer=submitted.answer,
            is_correct=is_correct,
            marks_awarded=marks_awarded,
        )

        db.add(answer)

    attempt.score = score

    await db.commit()

    result = await db.execute(
        select(QuizAttempt)
        .options(
            selectinload(
                QuizAttempt.answers
            )
        )
        .where(
            QuizAttempt.id == attempt.id
        )
    )

    return result.scalar_one()


@router.get(
    "/{quiz_id}/attempts",
    response_model=list[QuizAttemptResponse],
)
async def list_quiz_attempts(
    quiz_id: int,
    user: User = Depends(
        require_roles(
            Role.STUDENT,
            Role.TEACHER,
            Role.ADMIN,
        )
    ),
    db: AsyncSession = Depends(get_db),
):
    quiz = await get_quiz(
        quiz_id,
        db,
    )

    query = select(
        QuizAttempt
    ).options(
        selectinload(
            QuizAttempt.answers
        )
    )

    if user.role == Role.STUDENT:
        query = query.where(
            QuizAttempt.quiz_id == quiz.id,
            QuizAttempt.student_id == user.id,
        )

    elif user.role == Role.TEACHER:
        if quiz.author_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view attempts for your quizzes",
            )

        query = query.where(
            QuizAttempt.quiz_id == quiz.id
        )

    else:
        query = query.where(
            QuizAttempt.quiz_id == quiz.id
        )

    query = query.order_by(
        QuizAttempt.submitted_at.desc()
    )

    result = await db.execute(query)

    return list(result.scalars().all())