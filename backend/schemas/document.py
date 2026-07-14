from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date


class AIExtractedFields(BaseModel):
    project_name: Optional[str] = None
    project_id: Optional[str] = None
    location: Optional[str] = None
    district: Optional[str] = None
    contractor_name: Optional[str] = None
    contractor_id: Optional[str] = None
    work_order_number: Optional[str] = None
    budget_amount: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    department: Optional[str] = None
    document_type: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    actual_progress: Optional[float] = None


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    document_id: int
    file_name: str
    file_type: str
    original_file_path: str
    upload_date: datetime
    uploaded_by: Optional[int] = None
    ocr_status: str
    verification_status: str
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    raw_ocr_text: Optional[str] = None
    ai_extracted_json: Optional[str] = None
    confidence_scores: Optional[dict] = None
    overall_confidence: Optional[int] = None


class TaskVerification(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    status: Optional[str] = "Pending"
    assigned_to: Optional[int] = None
    due_date: Optional[date] = None
    subtasks: Optional[List["TaskVerification"]] = None

TaskVerification.model_rebuild()


class MilestoneVerification(BaseModel):
    target_date: date
    planned_progress: float
    description: Optional[str] = None
    tasks: Optional[List[TaskVerification]] = None


class DocumentVerifyRequest(BaseModel):
    project_name: Optional[str] = None
    project_id: Optional[str] = None
    location: Optional[str] = None
    district: Optional[str] = None
    contractor_name: Optional[str] = None
    contractor_id: Optional[str] = None
    work_order_number: Optional[str] = None
    budget_amount: Optional[float] = 0.0
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    department: Optional[str] = None
    document_type: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    action: str = Field(..., description="Approve or Reject or SaveDraft")
    reject_reason: Optional[str] = None

    actual_progress: Optional[float] = 0.0
    custom_fields: Optional[List[Dict[str, Any]]] = None
    milestones: Optional[List[MilestoneVerification]] = None

    @field_validator(
        'start_date', 'end_date', 'project_name', 'project_id',
        'location', 'district', 'contractor_name', 'contractor_id',
        'work_order_number', 'department', 'document_type', 'status',
        mode='before'
    )
    @classmethod
    def empty_string_to_none(cls, v):
        if v == "":
            return None
        return v
