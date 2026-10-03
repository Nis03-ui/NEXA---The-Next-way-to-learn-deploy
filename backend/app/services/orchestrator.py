from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.base import AgentResult
from app.agents.general import GeneralAgent
from app.agents.knowledge import KnowledgeAgent
from app.agents.study import StudyAgent
from app.services.gemini import GeminiClient


class AIOrchestrator:
    """
    Central controller for NEXA's AI agent system.

    Responsibilities:

    1. Route the user's message.
    2. Respect an explicitly selected tutor mode.
    3. Select the appropriate agent.
    4. Provide required dependencies.
    5. Provide the authenticated user's identity when needed.
    6. Return the structured agent result.
    """

    def __init__(self):
        gemini = GeminiClient()

        self.agents = {
            "study": StudyAgent(gemini),
            "knowledge": KnowledgeAgent(gemini),
            "general": GeneralAgent(gemini),
        }

    def select_agent(
        self,
        message: str,
        mode: str = "normal",
    ) -> str:

        # ---------------------------------------------------------
        # EXPLICIT TUTOR MODE
        # ---------------------------------------------------------

        if mode in {
            "explain",
            "study",
            "code",
            "quiz",
        }:
            return "study"

        # ---------------------------------------------------------
        # NORMAL MODE
        # ---------------------------------------------------------

        message_lower = message.lower().strip()

        # ---------------------------------------------------------
        # KNOWLEDGE AGENT
        # ---------------------------------------------------------

        knowledge_signals = [
            "according to the notes",
            "according to my notes",
            "according to the lesson",
            "according to the lecture",
            "according to the course",
            "according to nexa",
            "from the notes",
            "from my notes",
            "from the lesson",
            "from the lecture",
            "from the course",
            "in the notes",
            "in my notes",
            "in the lesson",
            "in the lecture",
            "nexa material",
            "course material",
            "lecture material",
            "study material",
        ]

        if any(
            signal in message_lower
            for signal in knowledge_signals
        ):
            return "knowledge"

        knowledge_keywords = [
            "course",
            "lesson",
            "lecture",
            "notes",
            "chapter",
            "resource",
            "material",
            "pdf",
            "document",
            "uploaded",
            "my file",
            "my files",
            "my document",
            "my documents",
        ]

        if any(
            keyword in message_lower
            for keyword in knowledge_keywords
        ):
            return "knowledge"

        # ---------------------------------------------------------
        # STUDY AGENT
        # ---------------------------------------------------------

        study_keywords = [
            "explain",
            "learn",
            "study",
            "what is",
            "what are",
            "how does",
            "how do",
            "why",
            "difference between",
            "compare",
            "solve",
            "calculate",
            "code",
            "programming",
            "python",
            "javascript",
            "typescript",
            "java",
            "c#",
            "database",
            "sql",
            "algorithm",
            "data structure",
            "machine learning",
            "deep learning",
            "artificial intelligence",
            "neural network",
            "networking",
            "operating system",
            "computer science",
        ]

        if any(
            keyword in message_lower
            for keyword in study_keywords
        ):
            return "study"

        # ---------------------------------------------------------
        # GENERAL AGENT
        # ---------------------------------------------------------

        return "general"

    async def run(
        self,
        message: str,
        conversation: str = "",
        db: AsyncSession | None = None,
        mode: str = "normal",
        user_id: int | None = None,
    ) -> AgentResult:

        agent_name = self.select_agent(
            message=message,
            mode=mode,
        )

        agent = self.agents[agent_name]

        if (
            agent_name == "knowledge"
            and db is None
        ):
            raise ValueError(
                "Database session is required for Knowledge Agent."
            )

        return await agent.run(
            message=message,
            conversation=conversation,
            db=db,
            mode=mode,
            user_id=user_id,
        )