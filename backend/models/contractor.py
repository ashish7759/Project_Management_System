from sqlalchemy import Column, NVARCHAR, DateTime, ForeignKey, text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
try:
    from database import Base
except ImportError:
    from backend.database import Base


class Contractor(Base):
    __tablename__ = "contractor"

    contractor_id = Column(NVARCHAR(100), primary_key=True)  # Alphanumeric Contractor ID from OCR or manual
    contractor_name = Column(NVARCHAR(255), nullable=False)
    work_order_number = Column(NVARCHAR(100), nullable=True)
    project_id = Column(NVARCHAR(100), ForeignKey("project.project_id", ondelete="SET NULL"), nullable=True, index=True)
    contact_info = Column(NVARCHAR(255), nullable=True)
    registration_number = Column(NVARCHAR(100), nullable=True)
    created_at = Column(DateTime, server_default=text("GETDATE()"), nullable=False)
    updated_at = Column(DateTime, onupdate=func.now(), nullable=True)

    project = relationship("Project")
