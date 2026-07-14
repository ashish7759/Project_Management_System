from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, date


class MilestoneCreate(BaseModel):
    target_date: date
    planned_progress: float = Field(..., ge=0, le=100)


class MilestoneResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    milestone_id: int
    project_id: str
    target_date: date
    planned_progress: float
    description: Optional[str] = None
    created_at: datetime


class ProgressUpdate(BaseModel):
    actual_progress: float = Field(..., ge=0, le=100)
    notes: Optional[str] = None


class ProgressHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    history_id: int
    project_id: str
    updated_by: Optional[int] = None
    actual_progress: float
    notes: Optional[str] = None
    updated_at: datetime
    updater_name: Optional[str] = None


class TaskCreate(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    status: str = Field("Pending", max_length=50)
    assigned_to: Optional[int] = None
    due_date: Optional[date] = None
    parent_id: Optional[int] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = Field(None, max_length=50)
    assigned_to: Optional[int] = None
    due_date: Optional[date] = None


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    task_id: int
    milestone_id: int
    parent_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    status: str
    assigned_to: Optional[int] = None
    assignee_name: Optional[str] = None
    due_date: Optional[date] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    subtasks: List["TaskResponse"] = []

