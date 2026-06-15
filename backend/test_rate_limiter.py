import pytest
from fastapi.testclient import TestClient
from main import app

from middleware.rate_limiter import RateLimitMiddleware

client = TestClient(app)

def test_login_rate_limiter_flow():
    # Clear requests in middleware to ensure clean state
    RateLimitMiddleware.requests.clear()

    # 1. First 5 attempts should return 400 Bad Request (not 429)

    for _ in range(5):
        response = client.post("/api/v1/auth/login", json={
            "username": "nonexistentuser",
            "password": "wrongpassword"
        })
        assert response.status_code == 400

    # 2. 6th attempt should be rate limited with status 429
    response = client.post("/api/v1/auth/login", json={
        "username": "nonexistentuser",
        "password": "wrongpassword"
    })
    assert response.status_code == 429
    assert response.json()["success"] is False
    assert "Too many login attempts" in response.json()["message"]

