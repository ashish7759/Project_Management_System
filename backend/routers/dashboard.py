from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta, timezone

from database import get_db
from models.user import User
from models.project import Project
from models.document import MasterDocument
from models.department import Department
from models.audit import AuditLog
from routers.auth import get_current_user, require_role


router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager", "Operator", "Viewer"]))
):
    # KPI 1: Total Documents Uploaded
    total_docs = db.query(MasterDocument).count()

    # KPI 2 & 3: Projects status counts
    active_projects = db.query(Project).filter(Project.status == "In Progress").count()
    completed_projects = db.query(Project).filter(Project.status == "Completed").count()
    pending_projects = db.query(Project).filter(Project.status == "Pending").count()

    # KPI 5: Documents Pending Verification
    pending_verification = db.query(MasterDocument).filter(MasterDocument.verification_status == "Pending").count()

    # 1. Bar Chart: Project progress by department
    # Returns: [{"department": "Engineering", "average_progress": 45.2}]
    dept_progress_query = db.query(
        Department.department_name,
        func.avg(Project.actual_progress).label("avg_progress")
    ).join(Project, Department.department_id == Project.department_id)\
     .group_by(Department.department_name).all()

    bar_chart_data = [
        {"department": r[0], "progress": float(r[1]) if r[1] is not None else 0.0}
        for r in dept_progress_query
    ]

    # If empty, add standard mock items for placeholder view
    if not bar_chart_data:
        bar_chart_data = [
            {"department": "Engineering", "progress": 0.0},
            {"department": "Finance", "progress": 0.0},
            {"department": "Operations", "progress": 0.0}
        ]

    # 2. Pie Chart: Document types distribution
    # Returns: [{"type": "Work Order", "value": 15}]
    # We can parse the document_type from paths or query doc counts.
    # Since MasterDocument stores original file details, let's group by file_type or we can query status counts.
    # To group by document_type, we can parse the ai_extracted_json metadata or use file extension as type count.
    # Let's count by file type first, or group by ocr_status, or extract document_type.
    # Since we organize uploaded files by document_type in the directory, we can run a count on doc types.
    # For robust count, let's group by MasterDocument.file_type:
    doc_type_query = db.query(
        MasterDocument.file_type,
        func.count(MasterDocument.document_id).label("count")
    ).group_by(MasterDocument.file_type).all()

    pie_chart_data = [
        {"name": r[0] or "UNKNOWN", "value": r[1]}
        for r in doc_type_query
    ]
    if not pie_chart_data:
        pie_chart_data = [{"name": "PDF", "value": 0}, {"name": "IMG", "value": 0}]

    # 3. Line Chart: Monthly uploads over last 6 months
    # Group uploads count by month
    six_months_ago = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=180)
    monthly_upload_query = db.query(
        extract('year', MasterDocument.upload_date).label('year'),
        extract('month', MasterDocument.upload_date).label('month'),
        func.count(MasterDocument.document_id).label('count')
    ).filter(MasterDocument.upload_date >= six_months_ago)\
     .group_by(
        extract('year', MasterDocument.upload_date),
        extract('month', MasterDocument.upload_date)
     ).all()

    # Generate months list (last 6 months)
    line_chart_data = []
    # Fill in monthly details
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    # Sort results or build a calendar sequence
    monthly_map = {(int(r.year), int(r.month)): r.count for r in monthly_upload_query if r.year and r.month}
    
    current_date = datetime.now()
    for i in range(5, -1, -1):
        target_date = current_date - timedelta(days=i*30)
        year_month = (target_date.year, target_date.month)
        count = monthly_map.get(year_month, 0)
        line_chart_data.append({
            "name": f"{month_names[target_date.month - 1]} {target_date.year}",
            "uploads": count
        })

    # Pending Verifications: Last 5 documents with verification_status == "Pending"
    recent_pending = db.query(MasterDocument).filter(
        MasterDocument.verification_status == "Pending"
    ).order_by(MasterDocument.upload_date.desc()).limit(5).all()

    pending_verifications = [
        {
            "document_id": d.document_id,
            "file_name": d.file_name,
            "file_type": d.file_type,
            "overall_confidence": d.overall_confidence,
            "upload_date": d.upload_date.isoformat() if d.upload_date else None
        }
        for d in recent_pending
    ]

    return {
        "kpis": {
            "total_documents": total_docs,
            "active_projects": active_projects,
            "completed_projects": completed_projects,
            "pending_tasks": pending_projects,  # pending projects stand for pending tasks in the office
            "pending_verification": pending_verification
        },
        "charts": {
            "bar_chart": bar_chart_data,
            "pie_chart": pie_chart_data,
            "line_chart": line_chart_data
        },
        "pending_verifications": pending_verifications
    }
