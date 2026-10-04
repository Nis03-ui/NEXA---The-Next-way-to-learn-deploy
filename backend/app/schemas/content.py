from datetime import datetime
from pydantic import BaseModel, Field


class ContentCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=500)
    body: str = Field(min_length=1)
    subject: str = Field(min_length=2, max_length=100)
    published: bool = False


class ContentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=500)
    body: str | None = Field(default=None, min_length=1)
    subject: str | None = Field(default=None, min_length=2, max_length=100)
    published: bool | None = None


class ContentOut(BaseModel):
    id: int
    title: str
    description: str | None
    body: str
    subject: str
    course_id: int | None
    author_id: int
    published: bool
    file_url: str | None
    created_at: datetime
    updated_at: datetime | None

    model_config = {"from_attributes": True}
