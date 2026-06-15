import pytest
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from models.user import User
from models.document import MasterDocument
from models.project import Project
from models.progress import Milestone, ProgressHistory
from routers.auth import get_password_hash
from datetime import date

client = TestClient(app)

def test_document_verification_flow():
    db = SessionLocal()
    try:
        # Create an admin user to approve documents
        username = "admin_verify_user"
        password = "adminpassword123"
        
        # Clean up existing if any
        existing_user = db.query(User).filter(User.username == username).first()
        if existing_user:
            db.delete(existing_user)
            db.commit()
            
        admin_user = User(
            full_name="Admin User",
            employee_id="EMP-ADMIN-VERIFY",
            email="admin_verify@jbvnl.co.in",
            mobile="9876543211",
            username=username,
            password_hash=get_password_hash(password),
            role="Admin",
            status="Active"
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        # Log in to get the access token
        from middleware.rate_limiter import RateLimitMiddleware
        RateLimitMiddleware.requests.clear()
        
        login_res = client.post("/api/v1/auth/login", json={
            "username": username,
            "password": password
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create a document
        doc = MasterDocument(
            original_file_path="C:\\mock\\path.pdf",
            file_name="mock_inspection_report.pdf",
            file_type="PDF",
            uploaded_by=admin_user.user_id,
            ocr_status="Completed",
            verification_status="Pending"
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        
        # Clean up any existing projects with this ID
        proj_id = "PROJ-VERIFY-TEST"
        existing_proj = db.query(Project).filter(Project.project_id == proj_id).first()
        if existing_proj:
            # Delete milestones and history first
            db.query(Milestone).filter(Milestone.project_id == proj_id).delete()
            db.query(ProgressHistory).filter(ProgressHistory.project_id == proj_id).delete()
            db.delete(existing_proj)
            db.commit()

        # Approve the document with actual_progress = 62.0 and some milestones
        verify_payload = {
            "project_name": "Test Verify Project",
            "project_id": proj_id,
            "location": "Ranchi",
            "district": "Ranchi",
            "contractor_name": "Test Contractor",
            "contractor_id": "CONT-VERIFY-TEST",
            "work_order_number": "WO-9999",
            "budget_amount": 1500000.0,
            "start_date": "2026-01-01",
            "end_date": "2026-12-31",
            "department": "Engineering",
            "document_type": "Inspection Report",
            "status": "In Progress",
            "notes": "Verify test notes",
            "action": "Approve",
            "actual_progress": 62.0,
            "custom_fields": [{"key": "custom_key", "label": "Custom Field", "value": "Custom Val"}],
            "milestones": [
                {
                    "target_date": "2026-03-31",
                    "planned_progress": 40.0,
                    "description": "Milestone Phase 1: Cable laying"
                },
                {
                    "target_date": "2026-08-31",
                    "planned_progress": 70.0,
                    "description": "Milestone Phase 2: Transformer setup"
                }
            ]
        }
        
        verify_res = client.put(f"/api/v1/documents/{doc.document_id}/verify", json=verify_payload, headers=headers)
        assert verify_res.status_code == 200
        assert verify_res.json()["success"] is True
        
        # Verify changes in DB
        db.expire_all()
        
        # 1. Document status should be Approved
        doc_db = db.query(MasterDocument).filter(MasterDocument.document_id == doc.document_id).first()
        assert doc_db.verification_status == "Approved"
        
        # 2. Project should be created with correct actual progress
        proj_db = db.query(Project).filter(Project.project_id == proj_id).first()
        assert proj_db is not None
        assert proj_db.actual_progress == 62.0
        assert proj_db.status == "In Progress"
        
        # 3. Milestones should be created
        milestones_db = db.query(Milestone).filter(Milestone.project_id == proj_id).all()
        assert len(milestones_db) == 2
        
        # Sort by progress to check descriptions
        milestones_db.sort(key=lambda m: m.planned_progress)
        assert milestones_db[0].description == "Milestone Phase 1: Cable laying"
        assert milestones_db[0].planned_progress == 40.0
        assert milestones_db[1].description == "Milestone Phase 2: Transformer setup"
        assert milestones_db[1].planned_progress == 70.0
        
        # 4. Progress history should be logged
        history_db = db.query(ProgressHistory).filter(ProgressHistory.project_id == proj_id).all()
        assert len(history_db) > 0
        assert any("Automatically updated progress to 62.0%" in h.notes for h in history_db)
        
        # Let's perform another verification update with actual_progress = 100.0
        verify_payload["actual_progress"] = 100.0
        verify_payload["action"] = "Approve"
        
        verify_res2 = client.put(f"/api/v1/documents/{doc.document_id}/verify", json=verify_payload, headers=headers)
        assert verify_res2.status_code == 200
        
        db.expire_all()
        proj_db2 = db.query(Project).filter(Project.project_id == proj_id).first()
        assert proj_db2.actual_progress == 100.0
        assert proj_db2.status == "Completed"

        # Now test that deleting the document also deletes the project and related tables
        doc_id = doc.document_id
        delete_res = client.delete(f"/api/v1/documents/{doc_id}", headers=headers)
        assert delete_res.status_code == 200
        assert delete_res.json()["success"] is True

        db.expire_all()
        # Verify the document is gone
        doc_gone = db.query(MasterDocument).filter(MasterDocument.document_id == doc_id).first()
        assert doc_gone is None

        # Verify the project is gone
        proj_gone = db.query(Project).filter(Project.project_id == proj_id).first()
        assert proj_gone is None

        # Verify the milestones are gone
        milestones_gone = db.query(Milestone).filter(Milestone.project_id == proj_id).all()
        assert len(milestones_gone) == 0

        # Verify the progress history is gone
        history_gone = db.query(ProgressHistory).filter(ProgressHistory.project_id == proj_id).all()
        assert len(history_gone) == 0
        
    finally:
        # Cleanup
        db.query(Milestone).filter(Milestone.project_id == "PROJ-VERIFY-TEST").delete()
        db.query(ProgressHistory).filter(ProgressHistory.project_id == "PROJ-VERIFY-TEST").delete()
        
        proj = db.query(Project).filter(Project.project_id == "PROJ-VERIFY-TEST").first()
        if proj:
            db.delete(proj)
            
        doc = db.query(MasterDocument).filter(MasterDocument.file_name == "mock_inspection_report.pdf").first()
        if doc:
            db.delete(doc)
            
        user = db.query(User).filter(User.username == "admin_verify_user").first()
        if user:
            db.delete(user)
            
        db.commit()
        db.close()
