import pytest
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from models.user import User
from models.project import Project
from models.progress import Milestone, Task
from models.document import MasterDocument
from routers.auth import get_password_hash
from datetime import date

client = TestClient(app)

def test_tasks_crud_endpoints():
    from middleware.rate_limiter import RateLimitMiddleware
    RateLimitMiddleware.requests.clear()
    db = SessionLocal()
    try:
        # Create users
        admin_username = "admin_task_test"
        operator_username = "operator_task_test"
        password = "testpassword123"

        # Clean up existing users
        db.query(User).filter(User.username.in_([admin_username, operator_username])).delete()
        db.commit()

        admin_user = User(
            full_name="Admin Task Tester",
            employee_id="EMP-ADMIN-TASK",
            email="admin_task@jbvnl.co.in",
            mobile="9876543001",
            username=admin_username,
            password_hash=get_password_hash(password),
            role="Admin",
            status="Active"
        )
        operator_user = User(
            full_name="Operator Task Tester",
            employee_id="EMP-OPER-TASK",
            email="oper_task@jbvnl.co.in",
            mobile="9876543002",
            username=operator_username,
            password_hash=get_password_hash(password),
            role="Operator",
            status="Active"
        )
        db.add_all([admin_user, operator_user])
        db.commit()

        # Log in Admin
        login_admin = client.post("/api/v1/auth/login", json={"username": admin_username, "password": password})
        assert login_admin.status_code == 200
        admin_headers = {"Authorization": f"Bearer {login_admin.json()['access_token']}"}

        # Log in Operator
        login_operator = client.post("/api/v1/auth/login", json={"username": operator_username, "password": password})
        assert login_operator.status_code == 200
        operator_headers = {"Authorization": f"Bearer {login_operator.json()['access_token']}"}

        # Create Project
        proj_id = "PROJ-TASK-TEST-ID"
        db.query(Project).filter(Project.project_id == proj_id).delete()
        db.commit()

        project = Project(
            project_id=proj_id,
            project_name="Task Integration Test Project",
            status="Pending"
        )
        db.add(project)
        db.commit()

        # Create Milestone
        milestone = Milestone(
            project_id=proj_id,
            target_date=date.today(),
            planned_progress=10.0,
            description="Milestone for Task Testing"
        )
        db.add(milestone)
        db.commit()
        db.refresh(milestone)

        m_id = milestone.milestone_id

        # 1. Create a Top-Level Task
        task_payload = {
            "title": "Top Task",
            "description": "Top-level test task description",
            "status": "Pending",
            "assigned_to": operator_user.user_id,
            "due_date": str(date.today())
        }
        res_create = client.post(f"/api/v1/progress/milestones/{m_id}/tasks", json=task_payload, headers=admin_headers)
        assert res_create.status_code == 201
        top_task_id = res_create.json()["task_id"]
        assert res_create.json()["title"] == "Top Task"
        assert res_create.json()["assignee_name"] == "Operator Task Tester"

        # 2. Create a Subtask
        subtask_payload = {
            "title": "Sub Task",
            "description": "Sub-level test task description",
            "status": "Pending",
            "parent_id": top_task_id
        }
        res_sub = client.post(f"/api/v1/progress/milestones/{m_id}/tasks", json=subtask_payload, headers=admin_headers)
        assert res_sub.status_code == 201
        sub_task_id = res_sub.json()["task_id"]
        assert res_sub.json()["parent_id"] == top_task_id

        # 3. Verify Project Details Nesting
        res_project = client.get(f"/api/v1/projects/{proj_id}", headers=admin_headers)
        assert res_project.status_code == 200
        proj_data = res_project.json()
        assert "milestones" in proj_data
        milestones_list = proj_data["milestones"]
        assert len(milestones_list) == 1
        m_data = milestones_list[0]
        assert "tasks" in m_data
        tasks_list = m_data["tasks"]
        assert len(tasks_list) == 1  # Only top level
        assert tasks_list[0]["task_id"] == top_task_id
        assert len(tasks_list[0]["subtasks"]) == 1
        assert tasks_list[0]["subtasks"][0]["task_id"] == sub_task_id

        # 4. Operator role restriction test (Operator cannot update description or title, only status)
        res_op_fail = client.put(
            f"/api/v1/progress/tasks/{top_task_id}", 
            json={"title": "Hack Title"}, 
            headers=operator_headers
        )
        assert res_op_fail.status_code == 403

        # Operator can update status
        res_op_ok = client.put(
            f"/api/v1/progress/tasks/{top_task_id}", 
            json={"status": "In Progress"}, 
            headers=operator_headers
        )
        assert res_op_ok.status_code == 200
        assert res_op_ok.json()["status"] == "In Progress"

        # 5. Delete Top Task and check cascade deletes subtask
        res_delete = client.delete(f"/api/v1/progress/tasks/{top_task_id}", headers=admin_headers)
        assert res_delete.status_code == 200

        db.expire_all()
        assert db.query(Task).filter(Task.task_id == top_task_id).first() is None
        assert db.query(Task).filter(Task.task_id == sub_task_id).first() is None

    finally:
        # Cleanup
        db.query(Task).filter(Task.title.in_(["Top Task", "Sub Task"])).delete()
        db.query(Milestone).filter(Milestone.project_id == "PROJ-TASK-TEST-ID").delete()
        db.query(Project).filter(Project.project_id == "PROJ-TASK-TEST-ID").delete()
        db.query(User).filter(User.username.in_(["admin_task_test", "operator_task_test"])).delete()
        db.commit()
        db.close()


def test_verify_document_with_milestone_tasks():
    from middleware.rate_limiter import RateLimitMiddleware
    RateLimitMiddleware.requests.clear()
    db = SessionLocal()
    try:
        # Setup admin
        admin_username = "admin_verify_test"
        password = "testpassword123"
        
        db.query(User).filter(User.username == admin_username).delete()
        db.commit()
        
        admin_user = User(
            full_name="Admin Verify Tester",
            employee_id="EMP-ADMIN-VERIFY",
            email="admin_verify@jbvnl.co.in",
            mobile="9876543003",
            username=admin_username,
            password_hash=get_password_hash(password),
            role="Admin",
            status="Active"
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        # Log in
        login_res = client.post("/api/v1/auth/login", json={"username": admin_username, "password": password})
        assert login_res.status_code == 200
        headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}
        
        # Setup master document
        doc_id = 99999
        db.query(MasterDocument).filter(MasterDocument.document_id == doc_id).delete()
        db.commit()
        
        doc = MasterDocument(
            document_id=doc_id,
            file_name="test_work_order.pdf",
            file_type="PDF",
            original_file_path="dummy_path.pdf",
            uploaded_by=admin_user.user_id,
            ocr_status="Completed",
            verification_status="Pending"
        )
        db.add(doc)
        db.commit()
        
        # Verification request payload containing milestone and nested tasks/subtasks
        payload = {
            "project_name": "Verify Document Test Project",
            "project_id": "PROJ-VERIFY-TEST-ID",
            "location": "Ranchi",
            "district": "Ranchi",
            "contractor_name": "Test Contractor",
            "contractor_id": "CONT-VERIFY-TEST",
            "work_order_number": "WO-VERIFY-TEST",
            "budget_amount": 500000.0,
            "start_date": str(date.today()),
            "end_date": str(date.today()),
            "department": "Engineering",
            "document_type": "Work Order",
            "status": "Pending",
            "notes": "Verify test notes",
            "action": "Approve",
            "actual_progress": 0.0,
            "custom_fields": [],
            "milestones": [
                {
                    "target_date": str(date.today()),
                    "planned_progress": 100.0,
                    "description": "Verification Milestone",
                    "tasks": [
                        {
                            "title": "Verification Task",
                            "description": "Task created via verify",
                            "status": "Pending",
                            "assigned_to": admin_user.user_id,
                            "due_date": str(date.today()),
                            "subtasks": [
                                {
                                    "title": "Verification Subtask",
                                    "description": "Subtask created via verify",
                                    "status": "Pending",
                                    "assigned_to": admin_user.user_id,
                                    "due_date": str(date.today()),
                                    "subtasks": []
                                }
                            ]
                        }
                    ]
                }
            ]
        }
        
        # Approve verification
        res_verify = client.put(f"/api/v1/documents/{doc_id}/verify", json=payload, headers=headers)
        assert res_verify.status_code == 200
        
        # Verify in database
        db.expire_all()
        project = db.query(Project).filter(Project.project_id == "PROJ-VERIFY-TEST-ID").first()
        assert project is not None
        
        milestones = db.query(Milestone).filter(Milestone.project_id == "PROJ-VERIFY-TEST-ID").all()
        assert len(milestones) == 1
        milestone = milestones[0]
        assert milestone.description == "Verification Milestone"
        
        # Verify tasks are inserted and nested
        tasks = db.query(Task).filter(Task.milestone_id == milestone.milestone_id, Task.parent_id == None).all()
        assert len(tasks) == 1
        task = tasks[0]
        assert task.title == "Verification Task"
        
        assert len(task.subtasks) == 1
        subtask = task.subtasks[0]
        assert subtask.title == "Verification Subtask"
        assert subtask.parent_id == task.task_id
        
    finally:
        # Cleanup
        db.query(Task).filter(Task.title.in_(["Verification Task", "Verification Subtask"])).delete()
        db.query(Milestone).filter(Milestone.project_id == "PROJ-VERIFY-TEST-ID").delete()
        db.query(Project).filter(Project.project_id == "PROJ-VERIFY-TEST-ID").delete()
        db.query(MasterDocument).filter(MasterDocument.document_id == 99999).delete()
        db.query(User).filter(User.username == "admin_verify_test").delete()
        db.commit()
        db.close()
