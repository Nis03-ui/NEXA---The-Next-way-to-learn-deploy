from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Literal

from sqlalchemy.ext.asyncio import AsyncSession


AgentSourceType = Literal[
    "course_content",
    "student_document",
]


@dataclass(frozen=True)
class AgentSource:
    source_type: AgentSourceType

    content_id: int | None
    document_id: int | None

    title: str
    subject: str | None
    filename: str | None

    chunk_index: int
    distance: float


@dataclass
class AgentResult:
    answer: str
    agent: str
    sources: list[AgentSource] = field(
        default_factory=list
    )


class BaseAgent(ABC):
    """
    Common contract for all NEXA AI agents.
    """

    name: str

    def __init__(self, gemini):
        self.gemini = gemini

    @abstractmethod
    async def run(
        self,
        message: str,
        conversation: str = "",
        db: AsyncSession | None = None,
        mode: str = "normal",
        user_id: int | None = None,
    ) -> AgentResult:
        """
        Execute the agent and return a structured result.
        """
        raise NotImplementedError