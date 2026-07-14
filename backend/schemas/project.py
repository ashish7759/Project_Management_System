from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime, date


class DepartmentMiniResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    department_id: int
    department_name: str


class ContractorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    contractor_id: str
    contractor_name: str
    work_order_number: Optional[str] = None
    contact_info: Optional[str] = None
    registration_number: Optional[str] = None
    created_at: datetime


class LocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    location_id: int
    location_name: str
    district: str
    state: str
    pin_code: Optional[str] = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    project_id: str
    project_name: str
    location: Optional[str] = None
    district: Optional[str] = None
    department_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget_amount: Optional[float] = None
    status: str
    actual_progress: float
    planned_progress: float
    document_id: Optional[int] = None
    created_at: datetime
    department: Optional[DepartmentMiniResponse] = None
    work_order_number: Optional[str] = None


class ProjectCreate(BaseModel):
    project_id: str
    project_name: str
    location: Optional[str] = None
    district: Optional[str] = None
    department_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget_amount: Optional[float] = None
    status: str = "Pending"
    document_id: Optional[int] = None


class ProjectUpdate(BaseModel):
    project_name: Optional[str] = None
    location: Optional[str] = None
    district: Optional[str] = None
    department_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget_amount: Optional[float] = None
    status: Optional[str] = None
    actual_progress: Optional[float] = None
    planned_progress: Optional[float] = None
