from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class DepartmentMini(BaseModel):
    department_id: int
    department_name: str

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    user_id: int
    full_name: str
    employee_id: str
    email: EmailStr
    mobile: str
    username: str
    role: str
    status: str
    created_at: datetime
    last_login: Optional[datetime] = None
    department_id: Optional[int] = None
    department: Optional[DepartmentMini] = None

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    role: Optional[str] = None
    status: Optional[str] = None  # Pending, Active, Inactive

class UserResetPassword(BaseModel):
    new_password: str
