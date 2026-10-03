from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class QuizQuestionCreate(BaseModel):
    question: str = Field(min_length=1, max_length=5000)
    question_type: str = Field(default="MCQ", max_length=30)
    options: list[str] | None = None
    correct_answer: str = Field(min_length=1, max_length=500)
    marks: int = Field(default=1, ge=1, le=100)


class QuizCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    subject: str = Field(min_length=1, max_length=100)
    time_limit_minutes: int | None = Field(
        default=None,
        ge=1,
        le=300,
    )
    published: bool = False
    questions: list[QuizQuestionCreate] = Field(
        min_length=1,
        max_length=100,
    )


class QuizQuestionUpdate(BaseModel):
    question: str = Field(min_length=1, max_length=5000)
    question_type: str = Field(default="MCQ", max_length=30)
    options: list[str] | None = None
    correct_answer: str = Field(min_length=1, max_length=500)
    marks: int = Field(default=1, ge=1, le=100)


class QuizUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
    )
    description: str | None = None
    subject: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    time_limit_minutes: int | None = Field(
        default=None,
        ge=1,
        le=300,
    )
    published: bool | None = None
    questions: list[QuizQuestionUpdate] | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )


class QuizQuestionResponse(BaseModel):
    id: int
    question: str
    question_type: str
    options: list[str] | None
    marks: int
    order_index: int


class QuizResponse(BaseModel):
    id: int
    title: str
    description: str | None
    subject: str
    author_id: int
    published: bool
    time_limit_minutes: int | None
    created_at: datetime
    updated_at: datetime | None
    questions: list[QuizQuestionResponse]


class QuizSummaryResponse(BaseModel):
    id: int
    title: str
    description: str | None
    subject: str
    author_id: int
    published: bool
    time_limit_minutes: int | None
    question_count: int


class QuizAnswerSubmission(BaseModel):
    question_id: int
    answer: str = Field(min_length=1, max_length=500)


class QuizAttemptCreate(BaseModel):
    answers: list[QuizAnswerSubmission] = Field(
        min_length=1,
        max_length=100,
    )


class QuizAnswerResponse(BaseModel):
    id: int
    question_id: int
    answer: str
    is_correct: bool
    marks_awarded: int


class QuizAttemptResponse(BaseModel):
    id: int
    quiz_id: int
    student_id: int
    score: int
    total_marks: int
    submitted_at: datetime
    answers: list[QuizAnswerResponse]