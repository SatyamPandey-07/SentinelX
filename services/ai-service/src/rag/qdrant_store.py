import os
import logging
from typing import List, Dict, Tuple

import numpy as np
from fastembed import TextEmbedding
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

from src.rag.knowledge_base import CAMPUS_EMERGENCY_POLICIES

logger = logging.getLogger(__name__)

# BAAI/bge-small-en-v1.5: a real dense-embedding model (384-dim), run locally
# via fastembed's ONNX runtime. No API key required, no torch dependency —
# a good fit for a portfolio-scale service, unlike calling a paid embeddings
# API that would need yet another credential.
EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"
COLLECTION_NAME = "campus_emergency_policies"


class QdrantVectorStore:
    """
    Vector Database integration (Section 14): real Qdrant client for
    storage/ANN search, real embeddings via fastembed (local ONNX model, not
    the CRC32 hash trick this used to fake). PostgreSQL/OpenSearch remain the
    transactional stores; this only ever backs semantic retrieval.

    Resilience (Section 23): if Qdrant is unreachable — at startup or on a
    later call — this falls back to brute-force cosine similarity over the
    same embeddings held in memory, so RAG answers keep working (possibly
    slower, never absent) until Qdrant recovers.
    """

    def __init__(self):
        self.host = os.getenv("QDRANT_HOST", "localhost")
        self.port = int(os.getenv("QDRANT_PORT", "6333"))
        self.docs = list(CAMPUS_EMERGENCY_POLICIES)

        self.embedder = TextEmbedding(model_name=EMBEDDING_MODEL)
        self.doc_vectors: List[np.ndarray] = list(self.embedder.embed(
            [f"{d['document_name']} {d['section']} {d['content']}" for d in self.docs]
        ))
        self.dimension = len(self.doc_vectors[0])

        self.client: QdrantClient | None = None
        try:
            self.client = QdrantClient(host=self.host, port=self.port, timeout=3)
            self._ensure_collection()
            self._upsert_documents()
        except Exception as e:
            logger.warning(
                "Qdrant unavailable at startup (%s); RAG will serve from in-memory "
                "embeddings until Qdrant recovers.", e,
            )
            self.client = None

    def _ensure_collection(self):
        if not self.client.collection_exists(COLLECTION_NAME):
            self.client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=self.dimension, distance=Distance.COSINE),
            )
            logger.info("Created Qdrant collection '%s' (dim=%d)", COLLECTION_NAME, self.dimension)

    def _upsert_documents(self):
        points = [
            PointStruct(id=i, vector=vec.tolist(), payload=doc)
            for i, (doc, vec) in enumerate(zip(self.docs, self.doc_vectors))
        ]
        self.client.upsert(collection_name=COLLECTION_NAME, points=points)

    def search_similar(self, query: str, top_k: int = 3) -> List[Tuple[Dict[str, str], float]]:
        query_vector = list(self.embedder.embed([query]))[0]

        if self.client is not None:
            try:
                return self._search_qdrant(query_vector, top_k)
            except Exception as e:
                logger.warning("Qdrant search failed, falling back to in-memory embeddings: %s", e)

        return self._search_local(query_vector, top_k)

    def _search_qdrant(self, query_vector: np.ndarray, top_k: int) -> List[Tuple[Dict[str, str], float]]:
        response = self.client.query_points(
            collection_name=COLLECTION_NAME,
            query=query_vector.tolist(),
            limit=top_k,
        )
        return [(point.payload, point.score) for point in response.points]

    def _search_local(self, query_vector: np.ndarray, top_k: int) -> List[Tuple[Dict[str, str], float]]:
        scored = []
        for doc, vec in zip(self.docs, self.doc_vectors):
            denom = (np.linalg.norm(query_vector) * np.linalg.norm(vec)) or 1e-9
            sim = float(np.dot(query_vector, vec) / denom)
            scored.append((doc, sim))
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]
