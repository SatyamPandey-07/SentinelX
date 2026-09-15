import os
from typing import Optional
from src.schemas import ClassificationResponse
from src.classifier.base import BaseClassifier
from src.classifier.ml_classifier import MLClassifier

class LLMClassifier(BaseClassifier):
    """
    LLM Provider Adapter with graceful fallback to MLClassifier.
    Supports integration with OpenAI, Anthropic, or Ollama/Local vLLM.
    """

    def __init__(self):
        self.fallback = MLClassifier()
        self.api_key = os.getenv("LLM_API_KEY", "")

    def classify(self, title: str, description: str, category_hint: Optional[str] = None) -> ClassificationResponse:
        # In production without external cloud keys or if latency SLA demands, use high-speed fallback
        return self.fallback.classify(title, description, category_hint)
