import pytest
import time
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from models.project import Project
from models.change_log import DatabaseChangeLog

def test_websocket_realtime_broadcast():
    """
    Verify that a database modification (which fires an engine trigger)
    successfully registers in change log, polls, and broadcasts to connected clients.
    """
    # Use context manager to trigger lifespan startup (which registers triggers and background task)
    with TestClient(app) as client:
        db = SessionLocal()
        try:
            # Clean up old records
            proj_id = "PROJ-WS-TEST"
            existing = db.query(Project).filter(Project.project_id == proj_id).first()
            if existing:
                db.delete(existing)
                db.commit()
                
            # Clear old change logs
            db.query(DatabaseChangeLog).delete()
            db.commit()

            # Connect to WebSocket
            with client.websocket_connect("/api/v1/ws") as websocket:
                # Insert a project record in the database
                proj = Project(
                    project_id=proj_id,
                    project_name="WebSocket Test Project",
                    status="Pending"
                )
                db.add(proj)
                db.commit()
                
                # Sleep briefly for the polling worker to fetch and broadcast
                time.sleep(2.0)
                
                # Assert that we receive the broadcast payload!
                data = websocket.receive_json()
                assert data["type"] == "database_update"
                assert any(c["table"] == "project" and c["action"] == "INSERT" and c["row_id"] == proj_id for c in data["changes"])
                
        finally:
            # Cleanup
            proj = db.query(Project).filter(Project.project_id == "PROJ-WS-TEST").first()
            if proj:
                db.delete(proj)
            db.query(DatabaseChangeLog).delete()
            db.commit()
            db.close()


def test_websocket_realtime_department_broadcast():
    """
    Verify that a department database modification (which fires the department trigger)
    successfully registers in change log, polls, and broadcasts to connected clients.
    """
    with TestClient(app) as client:
        db = SessionLocal()
        try:
            from models.department import Department
            # Clean up old records if any
            dept_name = "Realtime Test Dept"
            existing = db.query(Department).filter(Department.department_name == dept_name).first()
            if existing:
                db.delete(existing)
                db.commit()

            # Clear old change logs
            db.query(DatabaseChangeLog).delete()
            db.commit()

            # Connect to WebSocket
            with client.websocket_connect("/api/v1/ws") as websocket:
                # Insert a department record in the database
                dept = Department(
                    department_name=dept_name,
                    department_head="Test Head",
                    contact_email="test@dept.co.in"
                )
                db.add(dept)
                db.commit()
                db.refresh(dept)
                dept_id = str(dept.department_id)

                # Sleep briefly for the polling worker to fetch and broadcast
                time.sleep(2.0)

                # Assert that we receive the broadcast payload!
                data = websocket.receive_json()
                assert data["type"] == "database_update"
                assert any(c["table"] == "department" and c["action"] == "INSERT" and c["row_id"] == dept_id for c in data["changes"])

        finally:
            # Cleanup
            from models.department import Department
            dept = db.query(Department).filter(Department.department_name == "Realtime Test Dept").first()
            if dept:
                db.delete(dept)
            db.query(DatabaseChangeLog).delete()
            db.commit()
            db.close()


def test_websocket_realtime_user_and_contractor_broadcast():
    """
    Verify that user_account and contractor database modifications
    successfully register in change log, poll, and broadcast.
    """
    with TestClient(app) as client:
        db = SessionLocal()
        try:
            from models.user import User
            from models.contractor import Contractor
            
            # Clean up old test data if present
            username_test = "realtime_test_user"
            existing_user = db.query(User).filter(User.username == username_test).first()
            if existing_user:
                db.delete(existing_user)
                db.commit()

            contractor_id_test = "CONTR-WS-TEST"
            existing_contractor = db.query(Contractor).filter(Contractor.contractor_id == contractor_id_test).first()
            if existing_contractor:
                db.delete(existing_contractor)
                db.commit()

            db.query(DatabaseChangeLog).delete()
            db.commit()

            # Connect to WebSocket
            with client.websocket_connect("/api/v1/ws") as websocket:
                # Insert a user record
                user = User(
                    full_name="Realtime Test User",
                    employee_id="EMP-WS-TEST",
                    email="ws_test@jbvnl.co.in",
                    mobile="9999999999",
                    username=username_test,
                    password_hash="fakehash",
                    role="Viewer",
                    status="Active"
                )
                db.add(user)
                
                # Insert a contractor record
                contractor = Contractor(
                    contractor_id=contractor_id_test,
                    contractor_name="Contractor WS Test",
                    contact_info="Test Info"
                )
                db.add(contractor)
                db.commit()
                db.refresh(user)
                
                user_id = str(user.user_id)

                # Sleep briefly for the polling worker
                time.sleep(2.0)

                # Receive broadcast
                data = websocket.receive_json()
                assert data["type"] == "database_update"
                
                # Verify that changes have user_account and contractor entries
                has_user = any(c["table"] == "user_account" and c["action"] == "INSERT" and c["row_id"] == user_id for c in data["changes"])
                has_contractor = any(c["table"] == "contractor" and c["action"] == "INSERT" and c["row_id"] == contractor_id_test for c in data["changes"])
                assert has_user
                assert has_contractor

        finally:
            from models.user import User
            from models.contractor import Contractor
            u = db.query(User).filter(User.username == "realtime_test_user").first()
            if u:
                db.delete(u)
            c = db.query(Contractor).filter(Contractor.contractor_id == "CONTR-WS-TEST").first()
            if c:
                db.delete(c)
            db.query(DatabaseChangeLog).delete()
            db.commit()
            db.close()

