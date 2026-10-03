from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)

    recipient_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    course_id: Mapped[int | None] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    assignment_id: Mapped[int | None] = mapped_column(
        ForeignKey("assignments.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    quiz_id: Mapped[int | None] = mapped_column(
        ForeignKey("quizzes.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    schedule_event_id: Mapped[int | None] = mapped_column(
        ForeignKey("schedule_events.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    is_read: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    recipient = relationship("User")
    course = relationship("Course")
    assignment = relationship("Assignment")
    quiz = relationship("Quiz")
    schedule_event = relationship("ScheduleEvent")