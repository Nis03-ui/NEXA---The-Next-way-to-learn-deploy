from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class ScheduleCompletion(Base):
    __tablename__ = "schedule_completions"
    __table_args__ = (UniqueConstraint("event_id", "student_id", name="uq_schedule_completion_event_student"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("schedule_events.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    event = relationship("ScheduleEvent")
    student = relationship("User")
