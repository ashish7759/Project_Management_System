from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.department import Department
from models.document import MasterDocument
from models.progress import ProgressHistory
from models.audit import AuditLog
from schemas.user import UserResponse, UserUpdate, UserResetPassword
from routers.auth import require_role, get_password_hash
from services.audit_service import log_action


router = APIRouter(prefix="/users", tags=["User Management"])

# All routes in this file require Admin role
admin_dependency = require_role(["Admin"])

@router.get("", response_model=List[UserResponse])
def list_users(
    department: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_dependency)
):
    query = db.query(User)
    
    if department:
        query = query.join(Department).filter(Department.department_name == department)
    if role:
        query = query.filter(User.role == role)
    if status:
        query = query.filter(User.status == status)
        
    return query.all()


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    req: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_dependency)
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.user_id == current_user.user_id and req.status == "Inactive":
        raise HTTPException(status_code=400, detail="Admins cannot deactivate themselves")

    if req.role is not None:
        if req.role not in ["Admin", "Manager", "Operator", "Viewer"]:
            raise HTTPException(status_code=400, detail="Invalid role assigned")
        old_role = user.role
        user.role = req.role
        log_action(
            db,
            user_id=current_user.user_id,
            username=current_user.username,
            action_type="Change User Role",
            module="Users",
            details={"target_user_id": user.user_id, "old_role": old_role, "new_role": req.role}
        )

    if req.status is not None:
        if req.status not in ["Pending", "Active", "Inactive"]:
            raise HTTPException(status_code=400, detail="Invalid status assigned")
        old_status = user.status
        user.status = req.status
        log_action(
            db,
            user_id=current_user.user_id,
            username=current_user.username,
            action_type="Change User Status",
            module="Users",
            details={"target_user_id": user.user_id, "old_status": old_status, "new_status": req.status}
        )

    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    req: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_dependency)
):
    if not req.role:
        raise HTTPException(status_code=400, detail="Role is required")
    return update_user(user_id, UserUpdate(role=req.role), db, current_user)


@router.put("/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: int,
    req: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_dependency)
):
    if not req.status:
        raise HTTPException(status_code=400, detail="Status is required")
    return update_user(user_id, UserUpdate(status=req.status), db, current_user)


@router.put("/{user_id}/reset-password")
def reset_password(
    user_id: int,
    req: UserResetPassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_dependency)
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = get_password_hash(req.new_password)
    db.commit()

    log_action(
        db,
        user_id=current_user.user_id,
        username=current_user.username,
        action_type="Admin Password Reset",
        module="Users",
        details={"target_user_id": user.user_id}
    )
    return {"success": True, "message": "Password reset successfully."}


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_dependency)
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="Admins cannot delete their own account")

    # Set references in master_document to NULL
    db.query(MasterDocument).filter(MasterDocument.uploaded_by == user_id).update({MasterDocument.uploaded_by: None})
    db.query(MasterDocument).filter(MasterDocument.approved_by == user_id).update({MasterDocument.approved_by: None})
    
    # Set references in progress_history to NULL
    db.query(ProgressHistory).filter(ProgressHistory.updated_by == user_id).update({ProgressHistory.updated_by: None})
    
    # Set references in audit_log to NULL
    db.query(AuditLog).filter(AuditLog.user_id == user_id).update({AuditLog.user_id: None})

    db.delete(user)
    db.commit()

    log_action(
        db,
        user_id=current_user.user_id,
        username=current_user.username,
        action_type="Delete User Account",
        module="Users",
        details={"deleted_user_id": user_id, "deleted_username": user.username}
    )
    return {"success": True, "message": "User deleted successfully."}
