import io
import csv
from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.audit import AuditLog
from schemas.audit import AuditLogResponse
from routers.auth import require_role


router = APIRouter(prefix="/audit-logs", tags=["Audit Trail"])

# All routes in this file require Admin role
admin_dependency = require_role(["Admin"])

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
    username: Optional[str] = None,
    action_type: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_dependency)
):
    query = db.query(AuditLog)
    
    if username:
        query = query.filter(AuditLog.username.like(f"%{username}%"))
    if action_type:
        query = query.filter(AuditLog.action_type == action_type)
    if start_date:
        query = query.filter(AuditLog.timestamp >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.filter(AuditLog.timestamp <= datetime.combine(end_date, datetime.max.time()))
        
    # Return last 500 audit logs by default
    return query.order_by(AuditLog.timestamp.desc()).limit(500).all()


@router.get("/export")
def export_audit_logs_csv(
    username: Optional[str] = None,
    action_type: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_dependency)
):
    query = db.query(AuditLog)
    
    if username:
        query = query.filter(AuditLog.username.like(f"%{username}%"))
    if action_type:
        query = query.filter(AuditLog.action_type == action_type)
    if start_date:
        query = query.filter(AuditLog.timestamp >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.filter(AuditLog.timestamp <= datetime.combine(end_date, datetime.max.time()))
        
    logs = query.order_by(AuditLog.timestamp.desc()).all()

    # Generate CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header row
    writer.writerow(["Log ID", "User ID", "Username", "Action Type", "Module", "IP Address", "Timestamp", "Details"])
    
    for log in logs:
        writer.writerow([
            log.log_id,
            log.user_id or "N/A",
            log.username or "SYSTEM",
            log.action_type,
            log.module,
            log.ip_address or "N/A",
            log.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            log.details or ""
        ])

    output.seek(0)
    
    # Return StreamingResponse
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=audit_log_{int(datetime.now().timestamp())}.csv"}
    )
