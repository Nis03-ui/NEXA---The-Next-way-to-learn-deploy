from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class AssignmentCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    instructions: str | None = Field(default=None, max_length=10000)
    due_date: datetime | None = None
    max_marks: int = Field(default=100, ge=1, le=10000)
    file_url: str | None = Field(default=None, max_length=1000)
    external_url: str | None = Field(default=None, max_length=1000)
    published: bool = True


class AssignmentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    instructions: str | None = Field(default=None, max_length=10000)
    due_date: datetime | None = None
    max_marks: int | None = Field(default=None, ge=1, le=10000)
    file_url: str | None = Field(default=None, max_length=1000)
    external_url: str | None = Field(default=None, max_length=1000)
    published: bool | None = None


class AssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    course_id: int
    title: str
    instructions: str | None
    due_date: datetime | None
    max_marks: int
    file_url: str | None
    external_url: str | None
    published: bool
    created_by: int
    created_at: datetime
    updated_at: datetime


class AssignmentSubmissionCreate(BaseModel):
    file_url: str | None = Field(default=None, max_length=1000)
    external_url: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def validate_submission_source(self):
        if not self.file_url and not self.external_url:
            raise ValueError(
                "Either file_url or external_url is required"
            )
        return self


class AssignmentSubmissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    assignment_id: int
    student_id: int
    file_url: str | None
    external_url: str | None
    submitted_at: datetime
    marks: int | None
    feedback: str | None
    status: str