import os
# Force tests to use a local SQLite test database
os.environ["DATABASE_URL"] = "sqlite:///./test.db"

import pytest
from database import engine, Base

@pytest.fixture(scope="session", autouse=True)
def setup_and_teardown_db():
    # Setup - remove any old SQLite file to ensure fresh database schema
    if os.path.exists("./test.db"):
        try:
            os.remove("./test.db")
        except Exception:
            pass
    # Create database tables
    Base.metadata.create_all(bind=engine)
    yield
    # Teardown - remove the SQLite file if it exists
    if os.path.exists("./test.db"):
        try:
            os.remove("./test.db")
        except Exception:
            pass
