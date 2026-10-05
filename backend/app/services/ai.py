from sqlalchemy.ext.asyncio import AsyncSession

from app.services.orchestrator import AIOrchestrator


orchestrator = AIOrchestrator()


async def answer(
    message: str,
    conversation: str = "",
    db: AsyncSession | None = None,
    mode: str = "normal",
    user_id: int | None = None,
    document_id: int | None = None,
):
    return await orchestrator.run(
        message=message,
        conversation=conversation,
        db=db,
        mode=mode,
        user_id=user_id,
        document_id=document_id,
    )