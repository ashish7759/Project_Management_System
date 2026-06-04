import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

try:
    from config import settings
except ImportError:
    from backend.config import settings

import urllib.parse

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL
using_fallback = False

# Fallback from pyodbc to pymssql if pyodbc is not installed or supported
if "mssql+pyodbc" in db_url:
    try:
        import pyodbc
    except ImportError:
        logger.warning("pyodbc is not available. Falling back to pymssql driver.")
        parsed = urllib.parse.urlparse(db_url)
        # pymssql connection string format: mssql+pymssql://user:password@host/dbname
        # We strip the driver parameter as pymssql does not use ODBC drivers
        db_url = f"mssql+pymssql://{parsed.netloc}{parsed.path}"
        using_fallback = True

# Configure SQLAlchemy engine for MS SQL Server
try:
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_recycle=1800,
        pool_size=10,
        max_overflow=20
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    logger.critical(f"Failed to initialize SQLAlchemy database engine: {e}")
    # Create a dummy engine/session to prevent import crashes
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
