from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
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
