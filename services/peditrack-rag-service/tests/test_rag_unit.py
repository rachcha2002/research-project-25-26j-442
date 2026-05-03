import sys
import pytest
from unittest.mock import MagicMock, patch
import numpy as np

# ── Stub heavy ML libs so no models are downloaded at test time ───────────────
for _mod in ('sentence_transformers', 'faiss', 'torch'):
    sys.modules.setdefault(_mod, MagicMock())
# ─────────────────────────────────────────────────────────────────────────────


@pytest.fixture
def service():
    """RetrievalService with all ML dependencies replaced by lightweight mocks."""
    mock_emb = MagicMock()
    mock_emb.get_embedding_dimension.return_value = 384
    mock_emb.embed_text.return_value = np.zeros(384, dtype=np.float32)

    mock_vs = MagicMock()
    mock_vs.load.return_value = True
    mock_vs.index.ntotal = 100
    mock_vs.search.return_value = ([], [])

    with patch('services.retrieval_service.get_embedding_service', return_value=mock_emb), \
         patch('services.retrieval_service.get_vector_store', return_value=mock_vs):
        from services.retrieval_service import RetrievalService
        svc = RetrievalService()

    # Expose mocks on the instance so individual tests can reconfigure them
    svc.embedding_service = mock_emb
    svc.vector_store = mock_vs
    return svc


class TestPreprocessQuery:

    def test_collapses_extra_whitespace_to_single_spaces(self, service):
        result = service._preprocess_query("  baby   fever   treatment  ")
        assert "  " not in result
        assert result == result.strip()

    def test_expands_dr_abbreviation_to_full_word_doctor(self, service):
        result = service._preprocess_query("See dr. Smith for the child")
        assert "doctor" in result.lower()
        assert "dr." not in result

    def test_strips_special_chars_while_keeping_alphanumeric_and_hyphens(self, service):
        result = service._preprocess_query("child fever @home #urgent!")
        assert "@" not in result
        assert "#" not in result
        assert "child" in result
        assert "fever" in result


class TestBuildContext:

    def test_returns_empty_string_when_document_list_is_empty(self, service):
        assert service._build_context([]) == ""

    def test_formats_document_entry_with_source_name_and_relevance_score(self, service):
        docs = [
            {"text": "Iron is important for toddler development.", "source": "CDC",
             "score": 0.85, "lankan": False}
        ]
        result = service._build_context(docs)
        assert "CDC" in result
        assert "0.85" in result
        assert "Iron is important for toddler development." in result

    def test_appends_local_tag_for_sri_lankan_sourced_documents(self, service):
        docs = [
            {"text": "SL infant dietary guidelines.", "source": "SL_FOOD_GUIDE",
             "score": 0.90, "lankan": True}
        ]
        result = service._build_context(docs)
        assert "[LOCAL]" in result
        assert "SL_FOOD_GUIDE" in result


class TestRetrieve:

    def test_lankan_documents_receive_higher_effective_score_than_non_lankan(self, service):
        service.embedding_service.embed_text.return_value = np.zeros(384, dtype=np.float32)
        service.vector_store.search.return_value = (
            [0.50, 0.50],
            [
                {"text": "Local SL food guide content", "source": "SL_FOOD_GUIDE", "lankan": True},
                {"text": "CDC international growth data", "source": "CDC", "lankan": False},
            ]
        )
        docs, _ = service.retrieve("infant feeding guidelines", top_k=5, similarity_threshold=0.0)
        lankan = next(d for d in docs if d["lankan"])
        non_lankan = next(d for d in docs if not d["lankan"])
        assert lankan["score"] > non_lankan["score"]

    def test_filters_out_documents_that_fall_below_the_similarity_threshold(self, service):
        service.embedding_service.embed_text.return_value = np.zeros(384, dtype=np.float32)
        service.vector_store.search.return_value = (
            [0.20, 0.85],
            [
                {"text": "Low relevance document", "source": "OTHER", "lankan": False},
                {"text": "Highly relevant nutrition doc", "source": "CDC", "lankan": False},
            ]
        )
        docs, _ = service.retrieve("toddler nutrition advice", top_k=5, similarity_threshold=0.50)
        assert all(d["score"] >= 0.50 for d in docs)
        assert len(docs) == 1

    def test_returns_empty_list_and_empty_context_when_no_docs_clear_threshold(self, service):
        service.embedding_service.embed_text.return_value = np.zeros(384, dtype=np.float32)
        service.vector_store.search.return_value = (
            [0.10, 0.12],
            [
                {"text": "Unrelated document one", "source": "SRC1", "lankan": False},
                {"text": "Unrelated document two", "source": "SRC2", "lankan": False},
            ]
        )
        docs, context = service.retrieve("child fever remedies", top_k=5, similarity_threshold=0.90)
        assert docs == []
        assert context == ""
