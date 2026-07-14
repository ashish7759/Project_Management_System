from sqlalchemy import Column, Integer, NVARCHAR, DateTime, Date, DECIMAL, ForeignKey, text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base



class Milestone(Base):
    """
    Manager sets planned milestones (% by date)
    """
    __tablename__ = "milestone"
    __table_args__ = {"implicit_returning": False}

    milestone_id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(NVARCHAR(100), ForeignKey("project.project_id", ondelete="CASCADE"), nullable=False, index=True)
    target_date = Column(Date, nullable=False)
    planned_progress = Column(DECIMAL(5, 2), nullable=False)
    created_at = Column(DateTime, server_default=text("GETDATE()"), nullable=False)
    description = Column(NVARCHAR(255), nullable=True)
    title = Column(NVARCHAR(255), nullable=True)
    percentage = Column(DECIMAL(5, 2), nullable=True)
    status = Column(NVARCHAR(50), default="pending", nullable=True)
    source = Column(NVARCHAR(50), default="manual", nullable=True)

    project = relationship("Project")
    tasks = relationship("Task", back_populates="milestone", cascade="all, delete-orphan")


class Task(Base):
    """
    Tasks and subtasks under milestones
    """
    __tablename__ = "task"
    __table_args__ = {"implicit_returning": False}

    task_id = Column(Integer, primary_key=True, autoincrement=True)
    milestone_id = Column(Integer, ForeignKey("milestone.milestone_id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("task.task_id", ondelete="NO ACTION"), nullable=True, index=True)
    title = Column(NVARCHAR(255), nullable=False)
    description = Column(NVARCHAR("MAX"), nullable=True)
    status = Column(NVARCHAR(50), default="Pending", nullable=False, index=True)  # Pending, In Progress, Completed
    assigned_to = Column(Integer, ForeignKey("user_account.user_id", ondelete="SET NULL"), nullable=True, index=True)
    due_date = Column(Date, nullable=True)
    created_at = Column(DateTime, server_default=text("GETDATE()"), nullable=False)
    updated_at = Column(DateTime, onupdate=func.now(), nullable=True)

    milestone = relationship("Milestone", back_populates="tasks")
    parent = relationship("Task", remote_side=[task_id], back_populates="subtasks")
    subtasks = relationship("Task", back_populates="parent", cascade="all, delete-orphan")
    assignee = relationship("User", foreign_keys=[assigned_to])

    @property
    def assignee_name(self):
        return self.assignee.full_name if self.assignee else None




class ProgressHistory(Base):
    """
    Tracks progress updates over time (who updated, when, value)
    """
    __tablename__ = "progress_history"
    __table_args__ = {"implicit_returning": False}

    history_id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(NVARCHAR(100), ForeignKey("project.project_id", ondelete="CASCADE"), nullable=False, index=True)
    updated_by = Column(Integer, ForeignKey("user_account.user_id", ondelete="SET NULL"), nullable=True, index=True)
    actual_progress = Column(DECIMAL(5, 2), nullable=False)
    notes = Column(NVARCHAR("MAX"), nullable=True)
    updated_at = Column(DateTime, server_default=text("GETDATE()"), nullable=False, index=True)

    # Detailed progress tracking fields
    actual_percentage = Column(DECIMAL(5, 2), nullable=True)
    planned_percentage = Column(DECIMAL(5, 2), nullable=True)
    work_completed = Column(NVARCHAR("MAX"), nullable=True)
    issues = Column(NVARCHAR("MAX"), nullable=True)
    next_steps = Column(NVARCHAR("MAX"), nullable=True)
    report_date = Column(Date, nullable=True)
    reported_by = Column(NVARCHAR(255), nullable=True)
    source_document_id = Column(Integer, ForeignKey("master_document.document_id", ondelete="SET NULL"), nullable=True)
    source_file_name = Column(NVARCHAR(255), nullable=True)
    updated_by_user_id = Column(Integer, ForeignKey("user_account.user_id", ondelete="SET NULL"), nullable=True)
    status = Column(NVARCHAR(50), nullable=True)

    project = relationship("Project")
    updater = relationship("User", foreign_keys=[updated_by])

Progress = ProgressHistory

