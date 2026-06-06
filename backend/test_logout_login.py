import pytest
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from models.user import User
from routers.auth import get_password_hash

client = TestClient(app)

def test_login_logout_login():
    db = SessionLocal()
    try:
        # Create a test user
        username = "test_login_user"
        password = "testpassword123"
        
        # Clean up existing if any
        existing = db.query(User).filter(User.username == username).first()
        if existing:
            db.delete(existing)
            db.commit()
            
        new_user = User(
            full_name="Test User",
            employee_id="EMP-TEST-LOGIN",
            email="test_login@jbvnl.co.in",
            mobile="9876543210",
            username=username,
            password_hash=get_password_hash(password),
            role="Viewer",
            status="Active"
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # 1. Login
        response = client.post("/api/v1/auth/login", json={
            "username": username,
            "password": password
        })
        assert response.status_code == 200
        token = response.json()["access_token"]
        
        # 2. Logout
        response = client.post("/api/v1/auth/logout", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        
        # 3. Login again
        response = client.post("/api/v1/auth/login", json={
            "username": username,
            "password": password
        })
        assert response.status_code == 200
        
    finally:
        # Clean up
        user = db.query(User).filter(User.username == "test_login_user").first()
        if user:
            db.delete(user)
            db.commit()
        db.close()
