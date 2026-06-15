import pytest
from fastapi.testclient import TestClient

from main import app
from database import Base
from models import User, Department, MasterDocument, Project, Contractor, Location, Milestone, ProgressHistory, AuditLog


client = TestClient(app)

def test_imports_succeeded():
    """
    Verify all SQLAlchemy models can be resolved and metadata compiles without syntax or name errors.
    """
    assert Base.metadata is not None
    assert User.__tablename__ == "user_account"
    assert Department.__tablename__ == "department"
    assert MasterDocument.__tablename__ == "master_document"
    assert Project.__tablename__ == "project"
    assert Contractor.__tablename__ == "contractor"
    assert Location.__tablename__ == "location"
    assert Milestone.__tablename__ == "milestone"
    assert ProgressHistory.__tablename__ == "progress_history"
    assert AuditLog.__tablename__ == "audit_log"

def test_api_root():
    """
    Verify the base API endpoint is live and returning HTML landing page.
    """
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "JBO API Gateway" in response.text
    assert "Jharkhand" in response.text
