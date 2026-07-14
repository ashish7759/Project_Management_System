import pytest
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from models.user import User
from models.email_log import EmailLog
from models.document import MasterDocument
from models.project import Project
from routers.auth import get_password_hash
from config import settings

# Disable actual SMTP mailing during tests to prevent connection errors/delays
settings.MAIL_ENABLED = False

client = TestClient(app)

def test_email_system_flows():
    db = SessionLocal()
    try:
        # Create an admin user for authentication
        username = "email_admin_user"
        password = "adminpassword456"
        
        # Cleanup existing
        existing_user = db.query(User).filter(User.username == username).first()
        if existing_user:
            db.delete(existing_user)
            db.commit()
            
        admin_user = User(
            full_name="Email Test Admin",
            employee_id="EMP-EMAIL-ADMIN",
            email="email_admin@jbvnl.co.in",
            mobile="9876543210",
            username=username,
            password_hash=get_password_hash(password),
            role="Admin",
            status="Active"
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        # Log in to get token
        login_res = client.post("/api/v1/auth/login", json={
            "username": username,
            "password": password
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Clear existing email logs for clean assert
        db.query(EmailLog).delete()
        db.commit()
        
        # 1. Test POST /test-email
        test_email_res = client.post("/api/v1/users/test-email", headers=headers)
        assert test_email_res.status_code == 200
        assert test_email_res.json()["success"] is True
        
        # Check that the email log was created in DB
        logs = db.query(EmailLog).all()
        assert len(logs) == 1
        assert logs[0].event_type == "Test Email"
        assert logs[0].status == "Skipped"
        assert logs[0].recipients == admin_user.email
        
        # 2. Test POST /send-monthly-summary
        db.query(EmailLog).delete()
        db.commit()
        
        summary_res = client.post("/api/v1/reports/send-monthly-summary", headers=headers)
        assert summary_res.status_code == 200
        assert summary_res.json()["success"] is True
        
        # Check email log (at least 1 for the admin user themselves since status is Active)
        logs = db.query(EmailLog).all()
        assert len(logs) >= 1
        assert any(log.event_type == "Monthly Summary" for log in logs)
        
        # 3. Test user approval and deactivation triggers
        # Create a pending user
        pending_username = "pending_test_user"
        existing_pending = db.query(User).filter(User.username == pending_username).first()
        if existing_pending:
            db.delete(existing_pending)
            db.commit()
            
        pending_user = User(
            full_name="Pending Test User",
            employee_id="EMP-PENDING-TEST",
            email="pending_test@jbvnl.co.in",
            mobile="9876543299",
            username=pending_username,
            password_hash=get_password_hash("password123"),
            role="Viewer",
            status="Pending"
        )
        db.add(pending_user)
        db.commit()
        db.refresh(pending_user)
        
        db.query(EmailLog).delete()
        db.commit()
        
        # Approve the user (Active status)
        approve_res = client.put(f"/api/v1/users/{pending_user.user_id}", json={
            "status": "Active"
        }, headers=headers)
        assert approve_res.status_code == 200
        
        db.expire_all()
        logs = db.query(EmailLog).all()
        assert len(logs) == 1
        assert logs[0].event_type == "Account Approved"
        assert logs[0].recipients == pending_user.email
        
        # Deactivate the user (Inactive status)
        db.query(EmailLog).delete()
        db.commit()
        
        deactivate_res = client.put(f"/api/v1/users/{pending_user.user_id}", json={
            "status": "Inactive"
        }, headers=headers)
        assert deactivate_res.status_code == 200
        
        db.expire_all()
        logs = db.query(EmailLog).all()
        assert len(logs) == 1
        assert logs[0].event_type == "Account Deactivated"
        assert logs[0].recipients == pending_user.email
        
    finally:
        # Cleanup
        db.query(EmailLog).delete()
        
        pending = db.query(User).filter(User.username == "pending_test_user").first()
        if pending:
            db.delete(pending)
            
        admin = db.query(User).filter(User.username == "email_admin_user").first()
        if admin:
            db.delete(admin)
            
        db.commit()
        db.close()
