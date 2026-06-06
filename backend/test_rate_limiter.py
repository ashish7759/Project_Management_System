import pytest
from fastapi.testclient import TestClient
from main import app
from middleware.rate_limiter import login_limiter

client = TestClient(app)

def test_login_rate_limiter_flow():
    # Reset limiter for clean state
    login_limiter.attempts.clear()
    
    # 1. Attempt login with bad credentials
    response = client.post("/api/v1/auth/login", json={
        "username": "nonexistentuser",
        "password": "wrongpassword"
    })
    # This should fail with 400 Bad Request
    assert response.status_code == 400
    
    # 2. Attempt login again (correct or incorrect)
    # Let's see if the next request hangs or works
    response = client.post("/api/v1/auth/login", json={
        "username": "nonexistentuser",
        "password": "wrongpassword"
    })
    assert response.status_code == 400
