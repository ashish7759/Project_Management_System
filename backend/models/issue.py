from sqlalchemy import Column, Integer, NVARCHAR, DateTime, ForeignKey, text
from sqlalchemy.orm import relationship
from database import Base

class ProjectIssue(Base):
    """
    Model representing a tracked issue linked to a specific project.
    """
    __tablename__ = "project_issue"
    __table_args__ = {"implicit_returning": False}

    issue_id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(NVARCHAR(100), ForeignKey("project.project_id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(NVARCHAR(255), nullable=False)
    description = Column(NVARCHAR(1000), nullable=True)
    status = Column(NVARCHAR(50), default="Open", nullable=False, index=True)  # Open, In Progress, Resolved
    severity = Column(NVARCHAR(50), default="Medium", nullable=False, index=True)  # Low, Medium, High, Critical
    reported_by = Column(NVARCHAR(255), nullable=True)
    reported_date = Column(DateTime, server_default=text("GETDATE()"), nullable=False)
    resolution_notes = Column(NVARCHAR(1000), nullable=True)
    resolved_date = Column(DateTime, nullable=True)
    resolved_by = Column(NVARCHAR(255), nullable=True)
    ai_suggestions = Column(NVARCHAR(4000), nullable=True)

    project = relationship("Project")
    actions = relationship("IssueAction", back_populates="issue", cascade="all, delete-orphan", order_by="IssueAction.action_date.asc()")

class IssueAction(Base):
    """
    Model representing an action taken on a tracked project issue (e.g. meetings, site visits, updates).
    """
    __tablename__ = "issue_action"
    __table_args__ = {"implicit_returning": False}

    action_id = Column(Integer, primary_key=True, autoincrement=True)
    issue_id = Column(Integer, ForeignKey("project_issue.issue_id", ondelete="CASCADE"), nullable=False, index=True)
    action_type = Column(NVARCHAR(100), nullable=False)  # Meeting, Site Visit, Resolution, Progress Update, Other
    action_date = Column(DateTime, server_default=text("GETDATE()"), nullable=False)
    meeting_date = Column(DateTime, nullable=True)
    notes = Column(NVARCHAR("MAX"), nullable=True)
    document_path = Column(NVARCHAR(500), nullable=True)
    document_name = Column(NVARCHAR(255), nullable=True)
    taken_by = Column(NVARCHAR(255), nullable=True)

    issue = relationship("ProjectIssue", back_populates="actions")

