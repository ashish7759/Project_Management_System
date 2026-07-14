from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
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

from config import settings
import shutil, os, uuid
from datetime import datetime
from services.ocr_service import extract_text_from_file
from services.ai_extraction_service import extract_progress_from_document

Document = MasterDocument
Progress = ProgressHistory


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


def serialize_task(task):
    return {
        "task_id": task.task_id,
        "milestone_id": task.milestone_id,
        "parent_id": task.parent_id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "assigned_to": task.assigned_to,
        "assignee_name": task.assignee_name,
        "due_date": str(task.due_date) if task.due_date else None,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "subtasks": [serialize_task(sub) for sub in task.subtasks]
    }


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
                "description": m.description,
                "tasks": [serialize_task(t) for t in m.tasks if t.parent_id is None]
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


@router.post("/{project_id}/update-document")
async def update_project_with_document(
    project_id   : str,
    file         : UploadFile = File(...),
    db           : Session    = Depends(get_db),
    current_user              = Depends(get_current_user),
):
    # Verify project exists
    project = db.query(Project).filter(
        Project.project_id == project_id
    ).first()
    if not project:
        raise HTTPException(status_code=404,
                            detail="Project not found")

    # Save uploaded file
    upload_dir = os.path.join(
        settings.UPLOAD_DIR,
        "project_updates",
        project_id,
    )
    os.makedirs(upload_dir, exist_ok=True)

    file_ext      = os.path.splitext(file.filename)[1]
    unique_name   = f"{uuid.uuid4()}{file_ext}"
    file_path     = os.path.join(upload_dir, unique_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Step 1: OCR
    try:
        extracted_text = extract_text_from_file(file_path)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"OCR failed: {str(e)}"
        )

    # Step 2: AI Progress Extraction
    try:
        progress_data = await extract_progress_from_document(
            extracted_text
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI extraction failed: {str(e)}"
        )

    # Save document record
    doc = Document(
        file_name           = file.filename,
        file_path           = file_path,
        file_type           = file.content_type,
        document_type       = "Project Update",
        project_id          = project_id,
        uploaded_by         = current_user.user_id,
        ocr_status          = "completed",
        verification_status = "approved",
        raw_ocr_text        = extracted_text,
        overall_confidence  = progress_data.get("confidence", 0),
    )
    db.add(doc)
    db.flush()

    return {
        "success"        : True,
        "document_id"    : doc.document_id,
        "file_name"      : file.filename,
        "extracted_text" : extracted_text[:200] + "...",
        "extracted_data" : {
            "actual_percentage" :
                progress_data.get("actual_percentage"),
            "planned_percentage":
                progress_data.get("planned_percentage"),
            "work_completed"    :
                progress_data.get("work_completed", ""),
            "issues"            :
                progress_data.get("issues", ""),
            "next_steps"        :
                progress_data.get("next_steps", ""),
            "report_date"       :
                progress_data.get("report_date", ""),
            "reported_by"       :
                progress_data.get("reported_by", ""),
            "confidence"        :
                progress_data.get("confidence", 0),
            "milestones"        :
                progress_data.get("milestones", []),
        },
        "document_id_ref": doc.document_id,
    }


@router.post("/{project_id}/save-progress")
async def save_project_progress(
    project_id   : str,
    data         : dict,
    db           : Session = Depends(get_db),
    current_user           = Depends(get_current_user),
):
    from datetime import datetime

    project = db.query(Project).filter(
        Project.project_id == project_id
    ).first()
    if not project:
        raise HTTPException(status_code=404,
                            detail="Project not found")

    # Parse report date
    report_date = None
    if data.get("report_date"):
        try:
            report_date = datetime.strptime(
                data["report_date"], "%Y-%m-%d"
            )
        except ValueError:
            report_date = None

    # Calculate status
    actual  = data.get("actual_percentage", 0) or 0
    planned = data.get("planned_percentage", 0) or 0

    if actual >= 100:
        status = "Completed"
    elif actual == 0 and planned == 0:
        status = "Pending"
    elif actual < planned - 10:
        status = "Delayed"
    elif actual >= planned:
        status = "On Track"
    else:
        status = "In Progress"

    # Save progress record
    progress = Progress(
        project_id         = project_id,
        actual_percentage  = actual,
        planned_percentage = planned,
        work_completed     = data.get("work_completed"),
        issues             = data.get("issues"),
        next_steps         = data.get("next_steps"),
        report_date        = report_date,
        reported_by        = data.get("reported_by"),
        source_document_id = data.get("document_id_ref"),
        source_file_name   = data.get("source_file_name"),
        updated_by_user_id = current_user.user_id,
        status             = status,
        updated_at         = datetime.now(),
        # For compatibility with legacy actual_progress column which is DECIMAL and NOT NULL
        actual_progress    = actual
    )
    db.add(progress)

    # Save milestones
    from models.progress import Milestone
    db.query(Milestone).filter(Milestone.project_id == project_id).delete()
    for m_data in data.get("milestones", []):
        target_date_val = None
        if m_data.get("target_date"):
            try:
                target_date_val = datetime.strptime(
                    m_data["target_date"].split('T')[0], "%Y-%m-%d"
                ).date()
            except ValueError:
                target_date_val = None
                
        if not target_date_val:
            target_date_val = project.end_date or datetime.today().date()
            
        m = Milestone(
            project_id=project_id,
            title=m_data.get("title") or m_data.get("description") or "Milestone",
            description=m_data.get("description") or m_data.get("title") or "",
            percentage=m_data.get("percentage") or m_data.get("planned_progress") or 0.0,
            planned_progress=m_data.get("percentage") or m_data.get("planned_progress") or 0.0,
            target_date=target_date_val,
            status=m_data.get("status") or "pending",
            source=m_data.get("source") or "ai"
        )
        db.add(m)

    # Update project status, actual progress and planned progress
    project.status = status
    project.actual_progress = actual
    project.planned_progress = planned
    db.commit()

    # Log audit
    from services.audit_service import log_action
    log_action(
        db          = db,
        user_id     = current_user.user_id,
        username    = current_user.username,
        action_type = "PROGRESS_UPDATE",
        module      = "Projects",
        details     = {
            "project_id": project_id,
            "actual_pct": actual,
            "status"    : status,
        },
    )

    return {
        "success"   : True,
        "message"   : "Progress saved successfully",
        "status"    : status,
        "updated_at": datetime.now().isoformat(),
    }
