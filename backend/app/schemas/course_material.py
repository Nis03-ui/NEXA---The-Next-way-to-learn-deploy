from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class CourseMaterialCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    file_url: str | None = Field(default=None, max_length=1000)
    external_url: str | None = Field(default=None, max_length=1000)
    published: bool = True

    @model_validator(mode="after")
    def validate_material_source(self):
        if not self.file_url and not self.external_url:
            raise ValueError("Either file_url or external_url is required")
        return self


class CourseMaterialUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    file_url: str | None = Field(default=None, max_length=1000)
    external_url: str | None = Field(default=None, max_length=1000)
    published: bool | None = None


class CourseMaterialResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    course_id: int
    title: str
    description: str | None
    file_url: str | None
    external_url: str | None
    published: bool
    uploaded_by: int
    created_at: datetime
    updated_at: datetime