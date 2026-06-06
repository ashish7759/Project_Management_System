import logging
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, event, NVARCHAR
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
from sqlalchemy.ext.compiler import compiles

# Register compilation rule for SQLite for NVARCHAR("MAX")
@compiles(NVARCHAR, "sqlite")
def compile_nvarchar_sqlite(type_, compiler, **kw):
    if type_.length == "MAX" or type_.length == "max" or type_.length is None:
        return "TEXT"
    return f"NVARCHAR({type_.length})"

try:
    from config import settings
except ImportError:
    from backend.config import settings

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

DATABASE_URL = os.getenv("DATABASE_URL") or settings.DATABASE_URL

# Configure SQLAlchemy engine
try:
    connect_args = {}
    if DATABASE_URL.startswith("sqlite"):
        connect_args["check_same_thread"] = False

    engine = create_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
        connect_args=connect_args
    )

    # Register GETDATE function if using SQLite
    if DATABASE_URL.startswith("sqlite"):
        @event.listens_for(engine, "connect")
        def register_sqlite_functions(dbapi_connection, connection_record):
            import sqlite3
            if isinstance(dbapi_connection, sqlite3.Connection):
                dbapi_connection.create_function("GETDATE", 0, lambda: datetime.now().strftime('%Y-%m-%d %H:%M:%S'))

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    logger.critical(f"Failed to initialize SQLAlchemy database engine: {e}")
    engine = None
    SessionLocal = None

Base = declarative_base()

def get_db():
    if SessionLocal is None:
        raise RuntimeError("Database connection not initialized. Please verify DATABASE_URL in .env")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
