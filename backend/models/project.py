from sqlalchemy import Column, NVARCHAR, DateTime, Date, DECIMAL, ForeignKey, text, Integer
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base



class Project(Base):
    __tablename__ = "project"

    project_id = Column(NVARCHAR(100), primary_key=True)  # Alphanumeric Project ID from OCR or manual entries
    project_name = Column(NVARCHAR(255), nullable=False)
    location = Column(NVARCHAR(255), nullable=True)
    district = Column(NVARCHAR(100), nullable=True)
    department_id = Column(Integer, ForeignKey("department.department_id", ondelete="SET NULL"), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    budget_amount = Column(DECIMAL(18, 2), nullable=True)
    status = Column(NVARCHAR(50), default="Pending", nullable=False, index=True)  # Completed, In Progress, Pending, Delayed
    actual_progress = Column(DECIMAL(5, 2), default=0.00, nullable=False)
    planned_progress = Column(DECIMAL(5, 2), default=0.00, nullable=False)
    document_id = Column(Integer, ForeignKey("master_document.document_id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime, server_default=text("GETDATE()"), nullable=False)
    updated_at = Column(DateTime, onupdate=func.now(), nullable=True)

    department = relationship("Department")
    document = relationship("MasterDocument")
