from functools import lru_cache

from sentence_transformers import SentenceTransformer


MODEL_NAME = "all-MiniLM-L6-v2"


@lru_cache(maxsize=1)
def get_embedding_model() -> SentenceTransformer:
    """
    Load the embedding model only when an embedding operation
    is actually requested, then reuse it.
    """
    return SentenceTransformer(MODEL_NAME)


class EmbeddingService:

    def __init__(self):
        # Lazy loading: do not load the transformer during service creation.
        self.model = None

    @property
    def _model(self) -> SentenceTransformer:
        return get_embedding_model()

    def embed(self, text: str) -> list[float]:
        """
        Convert text into a 384-dimensional embedding vector.
        """
        vector = self._model.encode(
            text,
            normalize_embeddings=True,
        )

        return vector.tolist()

    def embed_many(
        self,
        texts: list[str],
    ) -> list[list[float]]:
        """
        Convert multiple texts into embedding vectors.
        """
        vectors = self._model.encode(
            texts,
            normalize_embeddings=True,
        )

        return vectors.tolist()
