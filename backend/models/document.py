from sqlalchemy import Column, Integer, NVARCHAR, DateTime, ForeignKey, text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
try:
    from database import Base
except ImportError:
    from backend.database import Base


class MasterDocument(Base):
    __tablename__ = "master_document"

    document_id = Column(Integer, primary_key=True, autoincrement=True)
    original_file_path = Column(NVARCHAR(500), nullable=False)
    file_name = Column(NVARCHAR(255), nullable=False)
    file_type = Column(NVARCHAR(50), nullable=False)
    upload_date = Column(DateTime, server_default=text("GETDATE()"), nullable=False, index=True)
    uploaded_by = Column(Integer, ForeignKey("user_account.user_id", ondelete="SET NULL"), nullable=True, index=True)
    ocr_status = Column(NVARCHAR(20), default="Processing", nullable=False, index=True)  # Processing, Completed, Failed
    verification_status = Column(NVARCHAR(20), default="Pending", nullable=False, index=True)  # Pending, Approved, Rejected
    approved_by = Column(Integer, ForeignKey("user_account.user_id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    raw_ocr_text = Column(NVARCHAR("MAX"), nullable=True)  # NVARCHAR(max) in MS SQL Server mapped via NVARCHAR("MAX")
    ai_extracted_json = Column(NVARCHAR("MAX"), nullable=True)
    created_at = Column(DateTime, server_default=text("GETDATE()"), nullable=False)
    updated_at = Column(DateTime, onupdate=func.now(), nullable=True)

    uploader = relationship("User", foreign_keys=[uploaded_by])
    approver = relationship("User", foreign_keys=[approved_by])
