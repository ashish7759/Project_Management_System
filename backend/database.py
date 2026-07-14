from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings
import logging

logger = logging.getLogger(__name__)

DATABASE_URL = settings.DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_recycle=3600,
    implicit_returning=False,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_db_connection():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database connection successful.")
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False

# Register SQLite compatibility event listeners and compile rules
from sqlalchemy import event, NVARCHAR
from sqlalchemy.ext.compiler import compiles
from datetime import datetime

@compiles(NVARCHAR, "sqlite")
def compile_nvarchar_sqlite(type_, compiler, **kw):
    if type_.length == "MAX" or type_.length == "max" or type_.length is None:
        return "TEXT"
    return f"NVARCHAR({type_.length})"

if DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def register_sqlite_functions(dbapi_connection, connection_record):
        import sqlite3
        if isinstance(dbapi_connection, sqlite3.Connection):
            dbapi_connection.create_function("GETDATE", 0, lambda: datetime.now().strftime('%Y-%m-%d %H:%M:%S'))


