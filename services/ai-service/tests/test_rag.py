import pytest
from src.rag.rag_engine import RagEngine
from src.schemas import RagQueryRequest

@pytest.fixture
def rag_engine():
    return RagEngine()

def test_rag_fire_evacuation_procedure(rag_engine):
    request = RagQueryRequest(
        query="What should I do if a building fire alarm goes off?",
        max_citations=2
    )
    res = rag_engine.query(request)

    assert res.confidence > 0.5
    assert len(res.citations) > 0
    assert "SOP-01" in res.citations[0].document_name or "Fire" in res.citations[0].document_name
    assert "evacuate" in res.answer.lower()
    assert "disclaimer" in res.model_dump()
