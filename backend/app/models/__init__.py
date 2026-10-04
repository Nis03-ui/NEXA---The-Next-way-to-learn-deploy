from app.models.user import User, Role
from app.models.chat import ChatSession, ChatMessage
from app.models.content import Content
from app.models.content_chunk import ContentChunk
from app.models.auth_session import AuthSession
from app.models.password_reset import PasswordResetToken
from app.models.email_verification import EmailVerificationToken
from app.models.quiz import (
    Quiz,
    QuizQuestion,
    QuizAttempt,
    QuizAnswer,
)
from app.models.student_document import (
    StudentDocument,
    StudentDocumentChunk,
)
from app.models.course import Course, Enrollment
from app.models.course_material import CourseMaterial
from app.models.assignment import Assignment, AssignmentSubmission
from app.models.schedule import ScheduleEvent
from app.models.notification import Notification

from app.models.user_profile import UserProfile
