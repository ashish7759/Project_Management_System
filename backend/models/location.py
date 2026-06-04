from sqlalchemy import Column, Integer, NVARCHAR, DateTime, ForeignKey, text, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
try:
    from database import Base
except ImportError:
    from backend.database import Base

class Location(Base):
    __tablename__ = "location"

    location_id = Column(Integer, primary_key=True, autoincrement=True)
    location_name = Column(NVARCHAR(255), nullable=False)
    district = Column(NVARCHAR(100), nullable=False)
    state = Column(NVARCHAR(100), default="Jharkhand", nullable=False)
    pin_code = Column(NVARCHAR(20), nullable=True)
    project_id = Column(NVARCHAR(100), ForeignKey("project.project_id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime, server_default=text("GETDATE()"), nullable=False)
    updated_at = Column(DateTime, onupdate=func.now(), nullable=True)

    project = relationship("Project")
