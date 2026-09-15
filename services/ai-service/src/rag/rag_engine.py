from typing import List
from src.schemas import RagQueryRequest, RagQueryResponse, RagCitation
from src.rag.qdrant_store import QdrantVectorStore

class RagEngine:
    """
    Grounded RAG Pipeline (Section 13).
    Ensures answers are synthesized strictly from retrieved official SOPs.
    Zero hallucination of emergency procedures.
    """

    def __init__(self):
        self.vector_store = QdrantVectorStore()

    def query(self, request: RagQueryRequest) -> RagQueryResponse:
        results = self.vector_store.search_similar(request.query, top_k=request.max_citations)

        citations: List[RagCitation] = []
        for doc, score in results:
            citations.append(RagCitation(
                document_name=doc["document_name"],
                section=doc["section"],
                content=doc["content"],
                relevance_score=round(score, 4)
            ))

        if not citations or citations[0].relevance_score < 0.10:
            return RagQueryResponse(
                answer="No official campus procedure precisely matches your specific query. Please contact Campus Safety dispatch immediately for live guidance.",
                citations=[],
                confidence=0.20
            )

        top_doc = citations[0]
        answer = (
            f"According to {top_doc.document_name} ({top_doc.section}):\n\n"
            f"{top_doc.content}\n\n"
            f"Immediate Actions Required: Follow the referenced protocol above. If you are in immediate danger, dial 911 or activate a campus emergency blue light phone."
        )

        return RagQueryResponse(
            answer=answer,
            citations=citations,
            confidence=min(0.99, max(0.60, top_doc.relevance_score * 1.5))
        )
