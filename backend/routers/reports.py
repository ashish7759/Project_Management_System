from typing import List, Optional, Dict, Any
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, case, extract

try:
    from database import get_db
    from models.user import User
    from models.project import Project
    from models.document import MasterDocument
    from models.contractor import Contractor
    from models.department import Department
    from models.progress import ProgressHistory
    from routers.auth import get_current_user, require_role
    from services.report_service import generate_excel_report, generate_pdf_report
    from services.audit_service import log_action
except ImportError:
    from backend.database import get_db
    from backend.models.user import User
    from backend.models.project import Project
    from backend.models.document import MasterDocument
    from backend.models.contractor import Contractor
    from backend.models.department import Department
    from backend.models.progress import ProgressHistory
    from backend.routers.auth import get_current_user, require_role
    from backend.services.report_service import generate_excel_report, generate_pdf_report
    from backend.services.audit_service import log_action

router = APIRouter(prefix="/reports", tags=["Report Generation"])

def query_report_data(
    report_type: int,
    start_date: Optional[date],
    end_date: Optional[date],
    department_id: Optional[int],
    project_id: Optional[str],
    status_filter: Optional[str],
    db: Session
) -> Dict[str, Any]:
    """
    Execute custom database queries matching the requested report type and filter sets.
    Returns: {"headers": [...], "keys": [...], "data": [...], "title": "..."}
    """
    headers = []
    keys = []
    data = []
    title = ""

    # 1. Project-wise Report
    if report_type == 1:
        title = "Project-wise Detail Report"
        headers = ["Project ID", "Project Name", "Department", "Location", "Start Date", "End Date", "Budget (INR)", "Status", "Progress %"]
        keys = ["project_id", "project_name", "department_name", "location", "start_date", "end_date", "budget_amount", "status", "actual_progress"]
        
        query = db.query(Project)
        if department_id:
            query = query.filter(Project.department_id == department_id)
        if project_id:
            query = query.filter(Project.project_id == project_id)
        if status_filter:
            query = query.filter(Project.status == status_filter)
        if start_date:
            query = query.filter(Project.start_date >= start_date)
        if end_date:
            query = query.filter(Project.end_date <= end_date)
            
        projects = query.all()
        for p in projects:
            data.append({
                "project_id": p.project_id,
                "project_name": p.project_name,
                "department_name": p.department.department_name if p.department else "General",
                "location": p.location or "N/A",
                "start_date": p.start_date,
                "end_date": p.end_date,
                "budget_amount": float(p.budget_amount) if p.budget_amount else 0.0,
                "status": p.status,
                "actual_progress": float(p.actual_progress)
            })

    # 2. Department-wise Summary Report
    elif report_type == 2:
        title = "Department-wise Progress Summary"
        headers = ["Department Name", "Total Projects", "Total Budget (INR)", "Average Progress %", "Completed Projects", "Delayed Projects"]
        keys = ["department_name", "total_projects", "total_budget", "avg_progress", "completed_count", "delayed_count"]
        
        # Subquery aggregating projects by department
        query = db.query(
            Department.department_name,
            func.count(Project.project_id).label("total_projects"),
            func.sum(Project.budget_amount).label("total_budget"),
            func.avg(Project.actual_progress).label("avg_progress"),
            func.sum(case((Project.status == 'Completed', 1), else_=0)).label("completed_count"),
            func.sum(case((Project.status == 'Delayed', 1), else_=0)).label("delayed_count")
        ).outerjoin(Project, Department.department_id == Project.department_id)
        
        if department_id:
            query = query.filter(Department.department_id == department_id)
            
        results = query.group_by(Department.department_name).all()
        for r in results:
            data.append({
                "department_name": r.department_name,
                "total_projects": r.total_projects or 0,
                "total_budget": float(r.total_budget) if r.total_budget else 0.0,
                "avg_progress": float(r.avg_progress) if r.avg_progress else 0.0,
                "completed_count": r.completed_count or 0,
                "delayed_count": r.delayed_count or 0
            })

    # 3. Document Status Report
    elif report_type == 3:
        title = "Document Upload & Processing Audit"
        headers = ["Doc ID", "File Name", "File Type", "Upload Date", "Uploader", "OCR Status", "Verification Status"]
        keys = ["document_id", "file_name", "file_type", "upload_date", "uploader_name", "ocr_status", "verification_status"]
        
        query = db.query(MasterDocument)
        if start_date:
            query = query.filter(MasterDocument.upload_date >= datetime.combine(start_date, datetime.min.time()))
        if end_date:
            query = query.filter(MasterDocument.upload_date <= datetime.combine(end_date, datetime.max.time()))
        if status_filter:
            query = query.filter(MasterDocument.verification_status == status_filter)
            
        docs = query.order_by(MasterDocument.upload_date.desc()).all()
        for d in docs:
            data.append({
                "document_id": d.document_id,
                "file_name": d.file_name,
                "file_type": d.file_type,
                "upload_date": d.upload_date,
                "uploader_name": d.uploader.full_name if d.uploader else "System",
                "ocr_status": d.ocr_status,
                "verification_status": d.verification_status
            })

    # 4. Progress Summary Report
    elif report_type == 4:
        title = "Project Milestones & Progress Variance"
        headers = ["Project ID", "Project Name", "Planned %", "Actual %", "Variance %", "Status", "Start Date", "End Date"]
        keys = ["project_id", "project_name", "planned_progress", "actual_progress", "variance", "status", "start_date", "end_date"]
        
        query = db.query(Project)
        if department_id:
            query = query.filter(Project.department_id == department_id)
        if project_id:
            query = query.filter(Project.project_id == project_id)
        if status_filter:
            query = query.filter(Project.status == status_filter)
            
        projects = query.all()
        for p in projects:
            data.append({
                "project_id": p.project_id,
                "project_name": p.project_name,
                "planned_progress": float(p.planned_progress),
                "actual_progress": float(p.actual_progress),
                "variance": float(p.actual_progress - p.planned_progress),
                "status": p.status,
                "start_date": p.start_date,
                "end_date": p.end_date
            })

    # 5. Monthly Upload Report
    elif report_type == 5:
        title = "Monthly Document Upload Volume"
        headers = ["Year", "Month", "Total Uploads", "Completed OCR", "Failed OCR"]
        keys = ["year", "month", "total_uploads", "completed_ocr", "failed_ocr"]
        
        # SQL group by Year and Month
        query = db.query(
            extract('year', MasterDocument.upload_date).label('year'),
            extract('month', MasterDocument.upload_date).label('month'),
            func.count(MasterDocument.document_id).label('total_uploads'),
            func.sum(case((MasterDocument.ocr_status == 'Completed', 1), else_=0)).label('completed_ocr'),
            func.sum(case((MasterDocument.ocr_status == 'Failed', 1), else_=0)).label('failed_ocr')
        )
        
        # Filters
        if start_date:
            query = query.filter(MasterDocument.upload_date >= datetime.combine(start_date, datetime.min.time()))
        if end_date:
            query = query.filter(MasterDocument.upload_date <= datetime.combine(end_date, datetime.max.time()))
            
        results = query.group_by(
            extract('year', MasterDocument.upload_date),
            extract('month', MasterDocument.upload_date)
        ).order_by(
            extract('year', MasterDocument.upload_date).desc(),
            extract('month', MasterDocument.upload_date).desc()
        ).all()
        
        for r in results:
            data.append({
                "year": int(r.year) if r.year else 0,
                "month": int(r.month) if r.month else 0,
                "total_uploads": r.total_uploads or 0,
                "completed_ocr": r.completed_ocr or 0,
                "failed_ocr": r.failed_ocr or 0
            })

    # 6. Contractor Report
    elif report_type == 6:
        title = "Active Contractor & Work Order List"
        headers = ["Contractor ID", "Contractor Name", "Work Order No", "Project ID", "Project Name", "Budget (INR)"]
        keys = ["contractor_id", "contractor_name", "work_order_number", "project_id", "project_name", "budget"]
        
        query = db.query(Contractor).join(Project, Contractor.project_id == Project.project_id)
        if project_id:
            query = query.filter(Contractor.project_id == project_id)
            
        contractors = query.all()
        for c in contractors:
            data.append({
                "contractor_id": c.contractor_id,
                "contractor_name": c.contractor_name,
                "work_order_number": c.work_order_number or "N/A",
                "project_id": c.project_id,
                "project_name": c.project.project_name if c.project else "N/A",
                "budget": float(c.project.budget_amount) if c.project and c.project.budget_amount else 0.0
            })

    # 7. Custom Report (fallback to all projects metadata)
    else:
        title = "Custom Project Scope Report"
        headers = ["Project ID", "Project Name", "Location", "Budget (INR)", "Status", "Progress %"]
        keys = ["project_id", "project_name", "location", "budget_amount", "status", "actual_progress"]
        
        query = db.query(Project)
        if department_id:
            query = query.filter(Project.department_id == department_id)
        if status_filter:
            query = query.filter(Project.status == status_filter)
            
        projects = query.all()
        for p in projects:
            data.append({
                "project_id": p.project_id,
                "project_name": p.project_name,
                "location": p.location or "N/A",
                "budget_amount": float(p.budget_amount) if p.budget_amount else 0.0,
                "status": p.status,
                "actual_progress": float(p.actual_progress)
            })

    return {
        "title": title,
        "headers": headers,
        "keys": keys,
        "data": data
    }


@router.get("/generate")
def preview_report(
    report_type: int = Query(..., description="Report Type ID (1-7)"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    department_id: Optional[int] = None,
    project_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager", "Operator", "Viewer"]))
):
    result = query_report_data(report_type, start_date, end_date, department_id, project_id, status, db)
    
    # Audit log report preview
    log_action(
        db,
        user_id=current_user.user_id,
        username=current_user.username,
        action_type="Preview Report",
        module="Reports",
        details={"report_type": report_type, "filters": {"department_id": department_id, "status": status}}
    )
    
    return {
        "success": True,
        "title": result["title"],
        "headers": result["headers"],
        "keys": result["keys"],
        "data": result["data"]
    }


@router.get("/export/pdf")
def export_pdf(
    report_type: int = Query(..., description="Report Type ID (1-7)"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    department_id: Optional[int] = None,
    project_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager", "Viewer"]))
):
    result = query_report_data(report_type, start_date, end_date, department_id, project_id, status, db)
    
    # Formulate filters description
    filters_desc = []
    if start_date:
        filters_desc.append(f"From {start_date}")
    if end_date:
        filters_desc.append(f"To {end_date}")
    if status:
        filters_desc.append(f"Status: {status}")
    if department_id:
        dept = db.query(Department).filter(Department.department_id == department_id).first()
        if dept:
            filters_desc.append(f"Dept: {dept.department_name}")
            
    desc_str = ", ".join(filters_desc) if filters_desc else "All Records"

    pdf_bytes = generate_pdf_report(
        data=result["data"],
        title=result["title"],
        headers=result["headers"],
        keys=result["keys"],
        filters_desc=desc_str
    )

    log_action(
        db,
        user_id=current_user.user_id,
        username=current_user.username,
        action_type="Export PDF Report",
        module="Reports",
        details={"report_type": report_type}
    )

    # Return as streamable bytes
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=report_{report_type}_{int(datetime.now().timestamp())}.pdf"}
    )


@router.get("/export/excel")
def export_excel(
    report_type: int = Query(..., description="Report Type ID (1-7)"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    department_id: Optional[int] = None,
    project_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager", "Viewer"]))
):
    result = query_report_data(report_type, start_date, end_date, department_id, project_id, status, db)

    excel_bytes = generate_excel_report(
        data=result["data"],
        title=result["title"],
        headers=result["headers"],
        keys=result["keys"]
    )

    log_action(
        db,
        user_id=current_user.user_id,
        username=current_user.username,
        action_type="Export Excel Report",
        module="Reports",
        details={"report_type": report_type}
    )

    return StreamingResponse(
        io.BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=report_{report_type}_{int(datetime.now().timestamp())}.xlsx"}
    )
