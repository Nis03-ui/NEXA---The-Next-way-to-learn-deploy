from sqlalchemy.ext.asyncio import AsyncSession

from app.models.student_document import (
    StudentDocument,
    StudentDocumentChunk,
)
from app.services.chunking import ChunkingService
from app.services.embedding import EmbeddingService


class StudentDocumentIndexingService:
    """
    Indexes private student documents for semantic retrieval.

    Documents are stored separately from teacher course content.
    """

    def __init__(
        self,
        chunking_service: ChunkingService | None = None,
        embedding_service: EmbeddingService | None = None,
    ):
        self.chunking_service = (
            chunking_service or ChunkingService()
        )

        self.embedding_service = (
            embedding_service or EmbeddingService()
        )

    async def index_document(
        self,
        document: StudentDocument,
        db: AsyncSession,
    ) -> None:

        chunks = self.chunking_service.chunk(
            document.extracted_text
        )

        if not chunks:
            raise ValueError(
                "Document does not contain indexable text."
            )

        embeddings = self.embedding_service.embed_many(
            chunks
        )

        for index, (chunk_text, embedding) in enumerate(
            zip(chunks, embeddings)
        ):
            chunk = StudentDocumentChunk(
                document_id=document.id,
                chunk_index=index,
                text=chunk_text,
                embedding=embedding,
            )

            db.add(chunk)