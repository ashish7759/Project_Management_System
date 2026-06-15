from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.project import Project
from models.document import MasterDocument
from models.contractor import Contractor
from models.progress import ProgressHistory, Milestone
from models.audit import AuditLog
from schemas.project import ProjectResponse, ProjectCreate, ProjectUpdate, ContractorResponse, LocationResponse, DepartmentMiniResponse
from routers.auth import get_current_user, require_role
from services.audit_service import log_action


router = APIRouter(prefix="/projects", tags=["Project Management"])

@router.get("/departments", response_model=List[DepartmentMiniResponse])
def list_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager", "Operator", "Viewer"]))
):
    from models.department import Department
    return db.query(Department).all()


@router.get("", response_model=List[ProjectResponse])
def list_projects(
    department_id: Optional[int] = None,
    status: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager", "Operator", "Viewer"]))
):
    query = db.query(Project)
    
    if department_id:
        query = query.filter(Project.department_id == department_id)
    if status:
        query = query.filter(Project.status == status)
    if start_date:
        query = query.filter(Project.start_date >= start_date)
    if end_date:
        query = query.filter(Project.end_date <= end_date)
        
    return query.all()


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    req: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager", "Operator"]))
):
    existing = db.query(Project).filter(Project.project_id == req.project_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Project ID already exists")

    new_project = Project(
        project_id=req.project_id,
        project_name=req.project_name,
        location=req.location,
        district=req.district,
        department_id=req.department_id,
        start_date=req.start_date,
        end_date=req.end_date,
        budget_amount=req.budget_amount,
        status=req.status
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    log_action(
        db,
        user_id=current_user.user_id,
        username=current_user.username,
        action_type="Create Project",
        module="Projects",
        details={"project_id": new_project.project_id, "project_name": new_project.project_name}
    )

    return new_project


@router.get("/{project_id}")
def get_project_details(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager", "Operator", "Viewer"]))
):
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Linked Documents
    documents = db.query(MasterDocument).filter(MasterDocument.document_id == project.document_id).all()
    # If the document_id FK is set, return it, otherwise try matching via Project ID in AI json
    if not documents:
        # Fallback query matching project_id inside OCR text or JSON
        documents = db.query(MasterDocument).filter(
            MasterDocument.ai_extracted_json.like(f"%/\"{project_id}/\"%") |
            MasterDocument.raw_ocr_text.like(f"%{project_id}%")
        ).limit(10).all()

    # Contractor Details
    contractors = db.query(Contractor).filter(Contractor.project_id == project_id).all()

    # Progress History Timeline
    progress_history = db.query(ProgressHistory).filter(ProgressHistory.project_id == project_id).order_by(ProgressHistory.updated_at.desc()).all()
    
    # Format progress history for UI
    timeline = []
    for h in progress_history:
        timeline.append({
            "history_id": h.history_id,
            "actual_progress": float(h.actual_progress),
            "notes": h.notes,
            "updated_at": h.updated_at,
            "updater_name": h.updater.full_name if h.updater else "System"
        })

    # Milestones (planned dates)
    milestones = db.query(Milestone).filter(Milestone.project_id == project_id).order_by(Milestone.target_date.asc()).all()

    # Audits Log related to this project
    # Simple search details match
    project_audits = db.query(AuditLog).filter(
        AuditLog.details.like(f"%{project_id}%")
    ).order_by(AuditLog.timestamp.desc()).limit(15).all()

    audits = []
    for a in project_audits:
        audits.append({
            "username": a.username,
            "action_type": a.action_type,
            "timestamp": a.timestamp
        })

    return {
        "project": {
            "project_id": project.project_id,
            "project_name": project.project_name,
            "location": project.location,
            "district": project.district,
            "start_date": project.start_date,
            "end_date": project.end_date,
            "budget_amount": float(project.budget_amount) if project.budget_amount else 0.0,
            "status": project.status,
            "actual_progress": float(project.actual_progress),
            "planned_progress": float(project.planned_progress),
            "department_name": project.department.department_name if project.department else None
        },
        "documents": [
            {
                "document_id": doc.document_id,
                "file_name": doc.file_name,
                "file_type": doc.file_type,
                "upload_date": doc.upload_date,
                "verification_status": doc.verification_status
            } for doc in documents
        ],
        "contractors": [
            {
                "contractor_id": c.contractor_id,
                "contractor_name": c.contractor_name,
                "work_order_number": c.work_order_number,
                "contact_info": c.contact_info
            } for c in contractors
        ],
        "timeline": timeline,
        "milestones": [
            {
                "milestone_id": m.milestone_id,
                "target_date": m.target_date,
                "planned_progress": float(m.planned_progress),
                "description": m.description
            } for m in milestones
        ],
        "activity_log": audits
    }


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: str,
    req: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager", "Operator"]))
):
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Update parameters
    for key, value in req.model_dump(exclude_unset=True).items():
        setattr(project, key, value)

    db.commit()
    db.refresh(project)

    log_action(
        db,
        user_id=current_user.user_id,
        username=current_user.username,
        action_type="Update Project Details",
        module="Projects",
        details={"project_id": project_id}
    )

    return project


@router.delete("/{project_id}")
def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager"]))
):
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(project)
    db.commit()

    log_action(
        db,
        user_id=current_user.user_id,
        username=current_user.username,
        action_type="Delete Project",
        module="Projects",
        details={"project_id": project_id, "project_name": project.project_name}
    )

    return {"success": True, "message": "Project deleted successfully."}
