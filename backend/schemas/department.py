from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional


class DepartmentCreate(BaseModel):
    department_name: str
    department_head: Optional[str] = None
    contact_email: Optional[EmailStr] = None


class DepartmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    department_id: int
    department_name: str
    department_head: Optional[str] = None
    contact_email: Optional[EmailStr] = None
