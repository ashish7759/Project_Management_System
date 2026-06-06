from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    employee_id: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    mobile: str = Field(..., min_length=10, max_length=15)
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=100)
    confirm_password: str = Field(...)
    department: str = Field(..., description="Department name, e.g. Engineering")

    @field_validator("confirm_password")
    def passwords_match(cls, v, info):
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v

    @field_validator("mobile")
    def validate_mobile(cls, v):
        if not v.replace("+", "").replace("-", "").replace(" ", "").isdigit():
            raise ValueError("Mobile number must contain only digits")
        return v


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str
    full_name: str
    status: str
