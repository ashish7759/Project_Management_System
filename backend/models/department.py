from sqlalchemy import Column, Integer, NVARCHAR, DateTime, text
from sqlalchemy.sql import func
from database import Base



class Department(Base):
    __tablename__ = "department"
    __table_args__ = {"implicit_returning": False}

    department_id = Column(Integer, primary_key=True, autoincrement=True)
    department_name = Column(NVARCHAR(100), unique=True, nullable=False)
    department_head = Column(NVARCHAR(100), nullable=True)
    contact_email = Column(NVARCHAR(100), nullable=True)
    created_at = Column(DateTime, server_default=text("GETDATE()"), nullable=False)
    updated_at = Column(DateTime, onupdate=func.now(), nullable=True)
