"""
tests/test_health_endpoint.py
Tests for GET /health — the ML service status endpoint.
Uses the mocked `client` fixture from conftest.py (no real models needed).
"""

import pytest


class TestHealthEndpoint:
    """Test suite for GET /health"""

    def test_returns_200(self, client):
        """Health endpoint must always return HTTP 200."""
        response = client.get("/health")
        assert response.status_code == 200

    def test_response_has_status_field(self, client):
        """Response body must include 'status' key."""
        data = client.get("/health").json()
        assert "status" in data

    def test_response_has_models_loaded_field(self, client):
        """Response body must include 'models_loaded' dict."""
        data = client.get("/health").json()
        assert "models_loaded" in data
        assert isinstance(data["models_loaded"], dict)

    def test_models_loaded_has_both_models(self, client):
        """models_loaded must report on pic_growth and srilanka_risks."""
        data = client.get("/health").json()
        assert "pic_growth" in data["models_loaded"]
        assert "srilanka_risks" in data["models_loaded"]

    def test_status_is_healthy_when_both_models_loaded(self, client):
        """Status is 'healthy' when both model flags are True."""
        data = client.get("/health").json()
        # The conftest sets both to True
        assert data["status"] == "healthy"

    def test_response_has_version_field(self, client):
        """Response body must include 'version' string."""
        data = client.get("/health").json()
        assert "version" in data
        assert data["version"] == "2.0.0"

    def test_status_degraded_when_model_not_loaded(self, client):
        """Status becomes 'degraded' when at least one model flag is False."""
        import app.main as m
        original = dict(m.models_status)
        try:
            m.models_status = {"pic_growth": False, "srilanka_risks": True}
            data = client.get("/health").json()
            assert data["status"] == "degraded"
        finally:
            m.models_status = original

    def test_response_is_json(self, client):
        """Content-Type must be application/json."""
        response = client.get("/health")
        assert "application/json" in response.headers.get("content-type", "")

    def test_models_loaded_values_are_bool(self, client):
        """models_loaded values must be booleans."""
        data = client.get("/health").json()
        for val in data["models_loaded"].values():
            assert isinstance(val, bool)
