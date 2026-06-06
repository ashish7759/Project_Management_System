from sqlalchemy import Column, Integer, NVARCHAR, DateTime, ForeignKey, text
from sqlalchemy.orm import relationship
try:
    from database import Base
except ImportError:
    from backend.database import Base


class AuditLog(Base):
    __tablename__ = "audit_log"

    log_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("user_account.user_id", ondelete="SET NULL"), nullable=True, index=True)
    username = Column(NVARCHAR(100), nullable=True)
    action_type = Column(NVARCHAR(100), nullable=False, index=True)  # Login, Upload, OCR_Start, etc.
    module = Column(NVARCHAR(100), nullable=False, index=True)       # Auth, Documents, Projects, etc.
    details = Column(NVARCHAR("MAX"), nullable=True)                 # JSON payload
    ip_address = Column(NVARCHAR(45), nullable=True)
    timestamp = Column(DateTime, server_default=text("GETDATE()"), nullable=False, index=True)

    user = relationship("User")
