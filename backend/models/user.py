from sqlalchemy import Column, Integer, NVARCHAR, DateTime, ForeignKey, text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "user_account"  # "user" is a reserved word in MS SQL Server, so we name the table "user_account"
    __table_args__ = {"implicit_returning": False}

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(NVARCHAR(100), nullable=False)
    employee_id = Column(NVARCHAR(50), unique=True, nullable=False)
    email = Column(NVARCHAR(100), unique=True, nullable=False)
    mobile = Column(NVARCHAR(20), nullable=False)
    username = Column(NVARCHAR(50), unique=True, nullable=False, index=True)
    password_hash = Column(NVARCHAR(255), nullable=False)
    department_id = Column(Integer, ForeignKey("department.department_id", ondelete="SET NULL"), nullable=True)
    role = Column(NVARCHAR(20), nullable=False)  # Admin, Manager, Operator, Viewer
    status = Column(NVARCHAR(20), default="Pending", nullable=False, index=True)  # Pending, Active, Inactive
    created_at = Column(DateTime, server_default=text("GETDATE()"), nullable=False)
    last_login = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, onupdate=func.now(), nullable=True)

    department = relationship("Department")
    audit_logs = relationship("AuditLog", back_populates="user")

