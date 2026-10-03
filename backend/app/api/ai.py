from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import current_user
from app.db.session import get_db
from app.models.chat import ChatMessage, ChatSession
from app.models.student_document import StudentDocument
from app.models.user import User
from app.schemas.ai import (
    AISource,
    ChatRequest,
    ChatResponse,
    ChatSessionDetail,
    ChatSessionOut,
)
from app.services.ai import answer
from app.services.pdf import PDFExtractionService
from app.services.student_documents import StudentDocumentIndexingService


router = APIRouter(
    prefix="/ai",
    tags=["AI"],
)


# ============================================================
# CHAT SESSION HELPERS
# ============================================================


async def get_owned_session(
    session_id: int,
    user_id: int,
    db: AsyncSession,
) -> ChatSession:
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == user_id,
        )
    )

    session = result.scalar_one_or_none()

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found.",
        )

    return session


async def build_conversation(
    session_id: int,
    db: AsyncSession,
    limit: int = 20,
) -> str:
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(limit)
    )

    messages = list(reversed(result.scalars().all()))

    conversation_parts = []

    for message in messages:
        role = (
            "Student"
            if message.role == "user"
            else "NEXA"
        )

        conversation_parts.append(
            f"{role}: {message.content}"
        )

    return "\n\n".join(conversation_parts)


def build_sources(result) -> list[AISource]:
    sources = []

    for source in result.sources:
        sources.append(
            AISource(
                source_type=source.source_type,
                content_id=source.content_id,
                document_id=source.document_id,
                title=source.title,
                subject=source.subject,
                filename=source.filename,
                chunk_index=source.chunk_index,
                distance=source.distance,
            )
        )

    return sources


# ============================================================
# STUDENT DOCUMENT UPLOAD
# ============================================================


@router.post(
    "/documents/upload",
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    file: UploadFile = File(...),
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a private PDF for the authenticated student.

    Pipeline:

    PDF
        ↓
    Text extraction
        ↓
    Chunking
        ↓
    Embeddings
        ↓
    pgvector
    """

    try:
        filename = file.filename or "document.pdf"

        # --------------------------------------------------------
        # Extract PDF text
        # --------------------------------------------------------

        extracted_text, page_count = (
            await PDFExtractionService().extract(file)
        )

        # --------------------------------------------------------
        # Create document record
        # --------------------------------------------------------

        document = StudentDocument(
            owner_id=user.id,
            filename=filename,
            title=filename.rsplit(
                ".",
                1,
            )[0][:200],
            content_type="application/pdf",
            extracted_text=extracted_text,
        )

        db.add(document)

        # Generate document ID before creating chunks.
        await db.flush()

        # --------------------------------------------------------
        # Chunk + embed + index
        # --------------------------------------------------------

        await StudentDocumentIndexingService().index_document(
            document=document,
            db=db,
        )

        # --------------------------------------------------------
        # Commit
        # --------------------------------------------------------

        await db.commit()

        await db.refresh(document)

        return {
            "id": document.id,
            "filename": document.filename,
            "title": document.title,
            "pages": page_count,
            "message": "Document uploaded and indexed successfully.",
        }

    except HTTPException:
        await db.rollback()
        raise

    except Exception as exc:
        await db.rollback()

        print(
            "NEXA DOCUMENT UPLOAD ERROR:",
            repr(exc),
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process the uploaded document.",
        ) from exc


# ============================================================
# CHAT
# ============================================================


@router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
)
async def chat(
    data: ChatRequest,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Send a message to NEXA.

    Behavior:

    - Creates a new session when session_id is omitted.
    - Reuses an existing session when provided.
    - Stores the user's message.
    - Builds recent conversation history.
    - Runs the NEXA agent system.
    - Stores the assistant response.
    - Returns the answer, selected agent, and RAG sources.
    """

    try:
        # --------------------------------------------------------
        # Resolve or create chat session
        # --------------------------------------------------------

        session: ChatSession | None = None

        if data.session_id is not None:
            session = await get_owned_session(
                session_id=data.session_id,
                user_id=user.id,
                db=db,
            )

        if session is None:
            session = ChatSession(
                user_id=user.id,
                title=data.message[:50],
            )

            db.add(session)

            # Generate session ID before creating
            # the first message.
            await db.flush()

        # --------------------------------------------------------
        # Save user message
        # --------------------------------------------------------

        user_message = ChatMessage(
            session_id=session.id,
            role="user",
            content=data.message,
        )

        db.add(user_message)

        await db.flush()

        # --------------------------------------------------------
        # Build conversation history
        # --------------------------------------------------------

        conversation = await build_conversation(
            session_id=session.id,
            db=db,
            limit=20,
        )

        # --------------------------------------------------------
        # Run NEXA
        # --------------------------------------------------------

        result = await answer(
            message=data.message,
            conversation=conversation,
            db=db,
            mode=data.mode,
            user_id=user.id,
        )

        # --------------------------------------------------------
        # Save assistant response
        # --------------------------------------------------------

        assistant_message = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=result.answer,
        )

        db.add(assistant_message)

        # --------------------------------------------------------
        # Commit conversation
        # --------------------------------------------------------

        await db.commit()

        return ChatResponse(
            answer=result.answer,
            session_id=session.id,
            agent=result.agent,
            sources=build_sources(result),
        )

    except HTTPException:
        await db.rollback()
        raise

    except Exception as exc:
        await db.rollback()

        # Temporary diagnostic logging.
        # Remove or replace with proper application logging
        # after the RAG issue is diagnosed.
        print(
            "NEXA CHAT ERROR:",
            repr(exc),
        )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="NEXA AI service is currently unavailable.",
        ) from exc


# ============================================================
# CHAT SESSIONS
# ============================================================


@router.get(
    "/sessions",
    response_model=list[ChatSessionOut],
)
async def get_sessions(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Return the current user's chat sessions.
    """

    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == user.id)
        .order_by(ChatSession.created_at.desc())
    )

    return list(result.scalars().all())


@router.get(
    "/sessions/{session_id}",
    response_model=ChatSessionDetail,
)
async def get_session(
    session_id: int,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Return one chat session and its messages.
    """

    session = await get_owned_session(
        session_id=session_id,
        user_id=user.id,
        db=db,
    )

    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.asc())
    )

    messages = list(result.scalars().all())

    return ChatSessionDetail(
        id=session.id,
        title=session.title,
        created_at=session.created_at,
        messages=messages,
    )


@router.delete(
    "/sessions/{session_id}",
    status_code=status.HTTP_200_OK,
)
async def delete_session(
    session_id: int,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete one of the current user's chat sessions.
    """

    session = await get_owned_session(
        session_id=session_id,
        user_id=user.id,
        db=db,
    )

    await db.delete(session)

    await db.commit()

    return {
        "message": "Chat session deleted successfully.",
    }