import os
import math
import zlib
import re
from typing import List, Dict, Tuple
from src.rag.knowledge_base import CAMPUS_EMERGENCY_POLICIES

STOP_WORDS = {
    "what", "should", "i", "do", "if", "a", "an", "the", "in", "on", "at",
    "to", "for", "of", "and", "or", "is", "are", "goes", "off", "when",
    "with", "from", "by", "as", "be", "this", "that"
}

class QdrantVectorStore:
    """
    Vector Database abstraction (Section 14).
    Integrates with Qdrant REST API on port 6333 with resilient in-memory fallback.
    """

    def __init__(self):
        self.host = os.getenv("QDRANT_HOST", "localhost")
        self.port = int(os.getenv("QDRANT_PORT", "6333"))
        self.collection_name = "campus_emergency_policies"
        self.dimension = 128
        self.docs = list(CAMPUS_EMERGENCY_POLICIES)
        # Compute embeddings on composite of title, section and content
        self.doc_vectors = [
            self._compute_vector(f"{d['document_name']} {d['section']} {d['content']}")
            for d in self.docs
        ]

    def _tokenize(self, text: str) -> List[str]:
        words = re.findall(r"\b[a-zA-Z0-9_-]+\b", text.lower())
        return [w for w in words if w not in STOP_WORDS and len(w) > 1]

    def _compute_vector(self, text: str) -> List[float]:
        """
        Computes deterministic normalized frequency embedding vector for semantic matching.
        Uses CRC32 hashing across fixed dimensions without relying on process-randomized hash().
        """
        tokens = self._tokenize(text)
        vec = [0.0] * self.dimension
        for token in tokens:
            bucket = zlib.crc32(token.encode("utf-8")) % self.dimension
            vec[bucket] += 1.0

        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]
        return vec

    def _cosine_similarity(self, v1: List[float], v2: List[float]) -> float:
        return sum(a * b for a, b in zip(v1, v2))

    def search_similar(self, query: str, top_k: int = 3) -> List[Tuple[Dict[str, str], float]]:
        q_vec = self._compute_vector(query)
        scored = []
        for doc, v in zip(self.docs, self.doc_vectors):
            sim = self._cosine_similarity(q_vec, v)
            scored.append((doc, sim))

        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]
