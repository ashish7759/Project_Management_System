from pydantic import BaseModel, Field, ConfigDict
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


class MilestoneVerification(BaseModel):
    target_date: date
    planned_progress: float
    description: Optional[str] = None


class DocumentVerifyRequest(BaseModel):
    project_name: str
    project_id: str
    location: str
    district: str
    contractor_name: str
    contractor_id: str
    work_order_number: str
    budget_amount: float
    start_date: date
    end_date: date
    department: str
    document_type: str
    status: str
    notes: Optional[str] = None
    action: str = Field(..., description="Approve or Reject or SaveDraft")
    reject_reason: Optional[str] = None

    actual_progress: Optional[float] = 0.0
    custom_fields: Optional[List[Dict[str, Any]]] = None
    milestones: Optional[List[MilestoneVerification]] = None
