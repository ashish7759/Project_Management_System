from sqlalchemy import Column, Integer, NVARCHAR, DateTime, text
from sqlalchemy.sql import func
try:
    from database import Base
except ImportError:
    from backend.database import Base


class Department(Base):
    __tablename__ = "department"

    department_id = Column(Integer, primary_key=True, autoincrement=True)
    department_name = Column(NVARCHAR(100), unique=True, nullable=False)
    department_head = Column(NVARCHAR(100), nullable=True)
    contact_email = Column(NVARCHAR(100), nullable=True)
    created_at = Column(DateTime, server_default=text("GETDATE()"), nullable=False)
    updated_at = Column(DateTime, onupdate=func.now(), nullable=True)
