from abc import ABC, abstractmethod
from typing import Optional
from src.schemas import ClassificationResponse

class BaseClassifier(ABC):
    """
    Abstract Classifier Interface (Section 12).
    Enables swapping between Rule-based, ML heuristics, and LLM providers.
    """

    @abstractmethod
    def classify(self, title: str, description: str, category_hint: Optional[str] = None) -> ClassificationResponse:
        pass
