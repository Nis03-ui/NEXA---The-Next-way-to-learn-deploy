from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.student_document import StudentDocument, StudentDocumentChunk
from app.services.embedding import EmbeddingService


@dataclass(frozen=True)
class StudentDocumentSearchResult:
    chunk: StudentDocumentChunk
    document: StudentDocument
    distance: float


class StudentDocumentSearchService:
    def __init__(self, embedding_service=None):
        self.embedding_service = embedding_service or EmbeddingService()

    async def search(
        self,
        query: str,
        owner_id: int,
        db: AsyncSession,
        top_k: int = 5,
        max_distance: float = 0.80,
    ) -> list[StudentDocumentSearchResult]:
        query_embedding = self.embedding_service.embed(query)

        distance = StudentDocumentChunk.embedding.cosine_distance(
            query_embedding
        )

        result = await db.execute(
            select(
                StudentDocumentChunk,
                StudentDocument,
                distance.label("distance"),
            )
            .join(
                StudentDocument,
                StudentDocument.id == StudentDocumentChunk.document_id,
            )
            .where(
                StudentDocument.owner_id == owner_id,
                StudentDocumentChunk.embedding.is_not(None),
                distance <= max_distance,
            )
            .order_by(distance)
            .limit(top_k)
        )

        return [
            StudentDocumentSearchResult(
                chunk=chunk,
                document=document,
                distance=float(distance_value),
            )
            for chunk, document, distance_value in result.all()
        ]