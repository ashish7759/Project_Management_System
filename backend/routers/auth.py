from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
import bcrypt
from sqlalchemy.orm import Session

try:
    from database import get_db
    from config import settings
    from models.user import User
    from models.department import Department
    from schemas.auth import RegisterRequest, LoginRequest, TokenResponse
    from schemas.user import UserResponse
    from services.audit_service import log_action
except ImportError:
    from backend.database import get_db
    from backend.config import settings
    from backend.models.user import User
    from backend.models.department import Department
    from backend.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
    from backend.schemas.user import UserResponse
    from backend.services.audit_service import log_action

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc).replace(tzinfo=None) + expires_delta
    else:
        expire = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
        
    if user.status != "Active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User account is {user.status}. Please contact an administrator."
        )
        
    return user


def require_role(roles: list[str]):
    """
    Dependency to enforce role-based access controls on endpoints.
    """
    def check_user_role(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource"
            )
        return current_user
    return check_user_role


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    # Check if username, email, or employee ID already exists
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.employee_id == req.employee_id).first():
        raise HTTPException(status_code=400, detail="Employee ID already registered")

    # Find or create department
    dept = db.query(Department).filter(Department.department_name == req.department).first()
    if not dept:
        # Dynamically create standard department if missing
        dept = Department(
            department_name=req.department,
            department_head="Pending Assignment",
            contact_email=req.email
        )
        db.add(dept)
        db.commit()
        db.refresh(dept)

    # First user registered in the system is automatically Admin and Active for bootstrap purposes
    user_count = db.query(User).count()
    assigned_role = "Admin" if user_count == 0 else "Viewer"
    assigned_status = "Active" if user_count == 0 else "Pending"

    new_user = User(
        full_name=req.full_name,
        employee_id=req.employee_id,
        email=req.email,
        mobile=req.mobile,
        username=req.username,
        password_hash=get_password_hash(req.password),
        department_id=dept.department_id,
        role=assigned_role,
        status=assigned_status
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Log action
    log_action(
        db, 
        user_id=new_user.user_id, 
        username=new_user.username, 
        action_type="User Register", 
        module="Auth", 
        details={"assigned_role": assigned_role, "status": assigned_status}
    )

    message = "Registration submitted. Awaiting admin approval."
    if assigned_role == "Admin":
        message = "Admin user bootstrapped successfully. Account active."

    return {
        "success": True,
        "message": message,
        "data": {
            "username": new_user.username,
            "role": new_user.role,
            "status": new_user.status
        }
    }


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.password_hash):
        log_action(
            db,
            user_id=None,
            username=req.username,
            action_type="Failed Login",
            module="Auth",
            details={"reason": "Invalid credentials"},
            ip_address=request.client.host if request.client else None
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect username or password"
        )

    if user.status == "Pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is awaiting administrator approval."
        )
    elif user.status == "Inactive":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact an administrator."
        )

    # Update last login
    user.last_login = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()

    # Generate JWT
    access_token = create_access_token(data={"sub": user.username})

    log_action(
        db,
        user_id=user.user_id,
        username=user.username,
        action_type="Login Success",
        module="Auth",
        ip_address=request.client.host if request.client else None
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "full_name": user.full_name,
        "status": user.status
    }


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log_action(
        db,
        user_id=current_user.user_id,
        username=current_user.username,
        action_type="Logout",
        module="Auth"
    )
    return {"success": True, "message": "Successfully logged out."}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
