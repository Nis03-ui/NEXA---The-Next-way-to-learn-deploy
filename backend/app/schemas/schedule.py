from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ScheduleEventCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    start_time: datetime
    end_time: datetime
    location: str | None = Field(default=None, max_length=300)
    meeting_url: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def validate_times(self):
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


class ScheduleEventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    start_time: datetime | None = None
    end_time: datetime | None = None
    location: str | None = Field(default=None, max_length=300)
    meeting_url: str | None = Field(default=None, max_length=1000)


class ScheduleEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    course_id: int
    title: str
    description: str | None
    start_time: datetime
    end_time: datetime
    location: str | None
    meeting_url: str | None
    created_by: int
    created_at: datetime
    updated_at: datetime