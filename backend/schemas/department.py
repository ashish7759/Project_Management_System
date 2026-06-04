from pydantic import BaseModel, EmailStr
from typing import Optional

class DepartmentCreate(BaseModel):
    department_name: str
    department_head: Optional[str] = None
    contact_email: Optional[EmailStr] = None

class DepartmentResponse(BaseModel):
    department_id: int
    department_name: str
    department_head: Optional[str] = None
    contact_email: Optional[EmailStr] = None

    class Config:
        from_attributes = True
