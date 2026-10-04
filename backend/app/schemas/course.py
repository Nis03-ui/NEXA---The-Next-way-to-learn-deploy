from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CourseCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    subject: str = Field(min_length=1, max_length=100)


class CourseUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    subject: str | None = Field(default=None, min_length=1, max_length=100)
    published: bool | None = None


class CourseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    subject: str
    teacher_id: int
    published: bool
    created_at: datetime
    updated_at: datetime


class EnrollmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    course_id: int
    student_id: int
    enrolled_at: datetime
    status: str


class CourseWithEnrollment(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    subject: str
    teacher_id: int
    published: bool
    created_at: datetime
    updated_at: datetime
    enrollment_id: int | None = None
    enrollment_status: str | None = None


class EnrollmentStudentResponse(BaseModel):
    enrollment_id: int
    student_id: int
    name: str
    email: str
    status: str
    enrolled_at: datetime


class AdminCourseResponse(BaseModel):
    id: int
    title: str
    description: str | None
    subject: str
    teacher_id: int
    teacher_name: str
    teacher_email: str
    published: bool
    enrolled_students: int
    created_at: datetime
    updated_at: datetime
