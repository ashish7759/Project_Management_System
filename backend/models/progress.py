from sqlalchemy import Column, Integer, NVARCHAR, DateTime, Date, DECIMAL, ForeignKey, text
from sqlalchemy.orm import relationship
try:
    from database import Base
except ImportError:
    from backend.database import Base


class Milestone(Base):
    """
    Manager sets planned milestones (% by date)
    """
    __tablename__ = "milestone"

    milestone_id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(NVARCHAR(100), ForeignKey("project.project_id", ondelete="CASCADE"), nullable=False, index=True)
    target_date = Column(Date, nullable=False)
    planned_progress = Column(DECIMAL(5, 2), nullable=False)
    created_at = Column(DateTime, server_default=text("GETDATE()"), nullable=False)

    project = relationship("Project")


class ProgressHistory(Base):
    """
    Tracks progress updates over time (who updated, when, value)
    """
    __tablename__ = "progress_history"

    history_id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(NVARCHAR(100), ForeignKey("project.project_id", ondelete="CASCADE"), nullable=False, index=True)
    updated_by = Column(Integer, ForeignKey("user_account.user_id", ondelete="SET NULL"), nullable=True, index=True)
    actual_progress = Column(DECIMAL(5, 2), nullable=False)
    notes = Column(NVARCHAR("MAX"), nullable=True)
    updated_at = Column(DateTime, server_default=text("GETDATE()"), nullable=False, index=True)

    project = relationship("Project")
    updater = relationship("User")
