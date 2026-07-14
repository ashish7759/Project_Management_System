import pytest
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from models.user import User
from models.project import Project
from models.issue import ProjectIssue, IssueAction
from routers.auth import get_password_hash
from datetime import datetime, date
import os
import shutil

client = TestClient(app)

def test_issue_actions_and_uploads():
    from middleware.rate_limiter import RateLimitMiddleware
    RateLimitMiddleware.requests.clear()
    db = SessionLocal()
    try:
        # Create user
        username = "admin_action_test"
        password = "testpassword123"

        # Clean up existing users
        db.query(User).filter(User.username == username).delete()
        db.commit()

        user = User(
            full_name="Admin Action Tester",
            employee_id="EMP-ADMIN-ACTION",
            email="admin_action@jbvnl.co.in",
            mobile="9876543100",
            username=username,
            password_hash=get_password_hash(password),
            role="Admin",
            status="Active"
        )
        db.add(user)
        db.commit()

        # Log in User
        login_res = client.post("/api/v1/auth/login", json={"username": username, "password": password})
        assert login_res.status_code == 200
        headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

        # Create Project
        proj_id = "PROJ-ACTION-TEST"
        db.query(Project).filter(Project.project_id == proj_id).delete()
        db.commit()

        project = Project(
            project_id=proj_id,
            project_name="Action Integration Test Project",
            status="Pending"
        )
        db.add(project)
        db.commit()

        # Create ProjectIssue
        issue = ProjectIssue(
            project_id=proj_id,
            title="Transformer Overheating",
            description="Substation transformer T1 running at 95C",
            severity="High",
            status="Open",
            reported_by="Admin Action Tester",
            reported_date=datetime.now()
        )
        db.add(issue)
        db.commit()
        db.refresh(issue)
        issue_id = issue.issue_id

        # 1. Add simple meeting action (No upload)
        action_payload = {
            "action_type": "Meeting",
            "notes": "Emergency meeting with substation engineers",
            "meeting_date": "2026-07-06",
            "status": "In Progress"
        }
        res_action1 = client.post(
            f"/api/v1/issues/{issue_id}/actions", 
            data=action_payload, 
            headers=headers
        )
        assert res_action1.status_code == 200
        data1 = res_action1.json()
        assert data1["status"] == "In Progress"
        assert len(data1["actions"]) == 1
        assert data1["actions"][0]["action_type"] == "Meeting"
        assert data1["actions"][0]["notes"] == "Emergency meeting with substation engineers"
        assert data1["actions"][0]["meeting_date"] is not None
        assert "2026-07-06" in data1["actions"][0]["meeting_date"]

        # 2. Add action with file upload
        test_file_name = "test_resolution_diagram.png"
        file_payload = {
            "action_type": "Resolution",
            "notes": "Replaced the cooling fan and oil filter. Temperatures stabilized.",
            "status": "Resolved"
        }
        
        file_data = {"file": (test_file_name, b"fake png data", "image/png")}
        res_action2 = client.post(
            f"/api/v1/issues/{issue_id}/actions", 
            data=file_payload, 
            files=file_data,
            headers=headers
        )
        assert res_action2.status_code == 200
        data2 = res_action2.json()
        assert data2["status"] == "Resolved"
        assert len(data2["actions"]) == 2
        
        # Check resolution details on the parent issue (backward compatibility sync)
        assert data2["resolution_notes"] == "Replaced the cooling fan and oil filter. Temperatures stabilized."
        
        # Check second action properties
        act2 = data2["actions"][1]
        assert act2["action_type"] == "Resolution"
        assert act2["document_name"] == test_file_name
        assert act2["document_path"] is not None
        assert act2["document_path"].startswith("/uploads/issues/")
        
        # Verify physical file existence in uploads directory
        # document_path is e.g. /uploads/issues/X/test_resolution_diagram_12345.png
        relative_path = act2["document_path"].lstrip("/")
        physical_path = os.path.join(".", relative_path)
        assert os.path.exists(physical_path)

        # 3. Test cascade delete of issue deletes actions
        db.expire_all()
        assert db.query(IssueAction).filter(IssueAction.issue_id == issue_id).count() == 2
        
        res_delete_issue = db.query(ProjectIssue).filter(ProjectIssue.issue_id == issue_id).first()
        db.delete(res_delete_issue)
        db.commit()

        assert db.query(IssueAction).filter(IssueAction.issue_id == issue_id).count() == 0

    finally:
        # Cleanup uploaded files directory for this issue
        try:
            shutil.rmtree(os.path.join(".", "uploads", "issues"))
        except:
            pass

        # Cleanup DB
        db.query(IssueAction).filter(IssueAction.issue_id == issue_id).delete()
        db.query(ProjectIssue).filter(ProjectIssue.project_id == "PROJ-ACTION-TEST").delete()
        db.query(Project).filter(Project.project_id == "PROJ-ACTION-TEST").delete()
        db.query(User).filter(User.username == "admin_action_test").delete()
        db.commit()
        db.close()
