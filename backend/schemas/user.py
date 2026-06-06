from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime


class DepartmentMini(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    department_id: int
    department_name: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

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


class UserUpdate(BaseModel):
    role: Optional[str] = None
    status: Optional[str] = None  # Pending, Active, Inactive


class UserResetPassword(BaseModel):
    new_password: str
