import os
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone

from database import get_db
from config import settings
from models.user import User
from models.project import Project
from models.issue import ProjectIssue, IssueAction
from routers.auth import get_current_user, require_role
from services.audit_service import log_action
from services.ai_extraction_service import suggest_issue_solution

router = APIRouter(prefix="/issues", tags=["Issues"])

# Pydantic Schemas
class IssueCreate(BaseModel):
    project_id: str
    title: str
    description: Optional[str] = None
    severity: Optional[str] = "Medium"

class IssueResolve(BaseModel):
    resolution_notes: str

class IssueActionResponse(BaseModel):
    action_id: int
    issue_id: int
    action_type: str
    action_date: str
    meeting_date: Optional[str] = None
    notes: Optional[str] = None
    document_path: Optional[str] = None
    document_name: Optional[str] = None
    taken_by: Optional[str] = None

    class Config:
        from_attributes = True

class IssueResponse(BaseModel):
    issue_id: int
    project_id: str
    project_name: str
    title: str
    description: Optional[str]
    status: str
    severity: str
    reported_by: Optional[str]
    reported_date: str
    resolution_notes: Optional[str]
    resolved_date: Optional[str]
    resolved_by: Optional[str]
    ai_suggestions: Optional[str]
    actions: List[IssueActionResponse] = []

    class Config:
        from_attributes = True

def make_issue_response(issue: ProjectIssue, project_name: str) -> IssueResponse:
    return IssueResponse(
        issue_id=issue.issue_id,
        project_id=issue.project_id,
        project_name=project_name,
        title=issue.title,
        description=issue.description,
        status=issue.status,
        severity=issue.severity,
        reported_by=issue.reported_by,
        reported_date=issue.reported_date.isoformat(),
        resolution_notes=issue.resolution_notes,
        resolved_date=issue.resolved_date.isoformat() if issue.resolved_date else None,
        resolved_by=issue.resolved_by,
        ai_suggestions=issue.ai_suggestions,
        actions=[
            IssueActionResponse(
                action_id=act.action_id,
                issue_id=act.issue_id,
                action_type=act.action_type,
                action_date=act.action_date.isoformat(),
                meeting_date=act.meeting_date.isoformat() if act.meeting_date else None,
                notes=act.notes,
                document_path=act.document_path,
                document_name=act.document_name,
                taken_by=act.taken_by
            ) for act in issue.actions
        ] if hasattr(issue, 'actions') and issue.actions else []
    )

class InstantSuggestRequest(BaseModel):
    title: str
    description: str
    project_id: Optional[str] = None

class InstantSuggestResponse(BaseModel):

    suggestions: str


@router.get("", response_model=List[IssueResponse])
def list_issues(
    project_id: Optional[str] = None,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager", "Operator", "Viewer"]))
):
    query = db.query(ProjectIssue).join(Project, ProjectIssue.project_id == Project.project_id)
    
    if project_id:
        query = query.filter(ProjectIssue.project_id == project_id)
    if status:
        query = query.filter(ProjectIssue.status == status)
    if severity:
        query = query.filter(ProjectIssue.severity == severity)
        
    issues = query.order_by(ProjectIssue.reported_date.desc()).all()
    
    res = []
    for issue in issues:
        res.append(make_issue_response(issue, issue.project.project_name))
    return res


@router.post("", response_model=IssueResponse, status_code=status.HTTP_201_CREATED)
def create_issue(
    payload: IssueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager", "Operator"]))
):
    # Verify project exists
    project = db.query(Project).filter(Project.project_id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    new_issue = ProjectIssue(
        project_id=payload.project_id,
        title=payload.title,
        description=payload.description,
        severity=payload.severity or "Medium",
        status="Open",
        reported_by=current_user.full_name or current_user.username,
        reported_date=datetime.now()
    )
    
    db.add(new_issue)
    db.commit()
    db.refresh(new_issue)
    
    log_action(
        db=db,
        user_id=current_user.user_id,
        username=current_user.username,
        action_type="CREATE_ISSUE",
        module="ISSUES",
        details={
            "issue_id": new_issue.issue_id,
            "project_id": new_issue.project_id,
            "title": new_issue.title,
            "severity": new_issue.severity
        }
    )
    
    return make_issue_response(new_issue, project.project_name)


@router.post("/{issue_id}/resolve", response_model=IssueResponse)
def resolve_issue(
    issue_id: int,
    payload: IssueResolve,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager", "Operator"]))
):
    issue = db.query(ProjectIssue).filter(ProjectIssue.issue_id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    issue.status = "Resolved"
    issue.resolution_notes = payload.resolution_notes
    issue.resolved_date = datetime.now()
    issue.resolved_by = current_user.full_name or current_user.username
    
    # Check if a resolution action already exists; if not, add one to the history timeline as well!
    res_action = IssueAction(
        issue_id=issue_id,
        action_type="Resolution",
        notes=payload.resolution_notes,
        taken_by=current_user.full_name or current_user.username
    )
    db.add(res_action)
    
    db.commit()
    db.refresh(issue)
    
    log_action(
        db=db,
        user_id=current_user.user_id,
        username=current_user.username,
        action_type="RESOLVE_ISSUE",
        module="ISSUES",
        details={
            "issue_id": issue.issue_id,
            "project_id": issue.project_id,
            "resolution_notes": payload.resolution_notes
        }
    )
    
    return make_issue_response(issue, issue.project.project_name)


@router.post("/{issue_id}/ai-suggest", response_model=IssueResponse)
def get_ai_suggestions(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager", "Operator", "Viewer"]))
):
    issue = db.query(ProjectIssue).filter(ProjectIssue.issue_id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    project = db.query(Project).filter(Project.project_id == issue.project_id).first()
    dept_name = project.department.department_name if project and project.department else "General Engineering"
    
    suggestions = suggest_issue_solution(
        project_name=project.project_name if project else "General JBVNL Grid Work",
        department_name=dept_name,
        title=issue.title,
        description=issue.description or ""
    )
    
    issue.ai_suggestions = suggestions
    db.commit()
    db.refresh(issue)
    
    log_action(
        db=db,
        user_id=current_user.user_id,
        username=current_user.username,
        action_type="GENERATE_AI_SUGGESTION",
        module="ISSUES",
        details={
            "issue_id": issue.issue_id,
            "project_id": issue.project_id
        }
    )
    
    return make_issue_response(issue, project.project_name if project else "General JBVNL Grid Work")


@router.post("/{issue_id}/actions", response_model=IssueResponse)
async def add_issue_action(
    issue_id: int,
    action_type: str = Form(...),
    notes: Optional[str] = Form(None),
    meeting_date: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager", "Operator"]))
):
    issue = db.query(ProjectIssue).filter(ProjectIssue.issue_id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    parsed_meeting_date = None
    if meeting_date:
        try:
            if "T" in meeting_date:
                parsed_meeting_date = datetime.fromisoformat(meeting_date.replace("Z", ""))
            else:
                parsed_meeting_date = datetime.strptime(meeting_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid meeting_date format. Use YYYY-MM-DD or ISO 8601 format.")

    saved_filepath = None
    original_filename = None
    if file:
        file.file.seek(0, os.SEEK_END)
        size_in_bytes = file.file.tell()
        file.file.seek(0)
        
        max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        if size_in_bytes > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File exceeds maximum size of {settings.MAX_FILE_SIZE_MB}MB"
            )

        from routers.documents import ACCEPTED_MIME_TYPES
        if file.content_type not in ACCEPTED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported file format. Supported formats: PDF, JPG, PNG, TIFF, DOCX, XLSX"
            )

        now = datetime.now()
        timestamp = int(now.timestamp())
        original_filename = file.filename or "attached_file"
        base, ext = os.path.splitext(original_filename)
        if not ext:
            ext = ACCEPTED_MIME_TYPES.get(file.content_type, ".bin")
        
        safe_base = "".join([c if c.isalnum() or c in " _-" else "_" for c in base]).strip()
        saved_filename = f"{safe_base}_{timestamp}{ext}"

        upload_subdir = os.path.join(settings.UPLOAD_DIR, "issues", str(issue_id))
        os.makedirs(upload_subdir, exist_ok=True)
        saved_filepath = os.path.abspath(os.path.join(upload_subdir, saved_filename))

        try:
            with open(saved_filepath, "wb") as f:
                content = file.file.read()
                f.write(content)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Could not save uploaded file: {e}"
            )

        saved_filepath = f"/uploads/issues/{issue_id}/{saved_filename}"

    action = IssueAction(
        issue_id=issue_id,
        action_type=action_type,
        meeting_date=parsed_meeting_date,
        notes=notes,
        document_path=saved_filepath,
        document_name=original_filename,
        taken_by=current_user.full_name or current_user.username
    )
    db.add(action)

    if status:
        issue.status = status
        if status == "Resolved":
            issue.resolved_date = datetime.now()
            issue.resolved_by = current_user.full_name or current_user.username
            if notes:
                issue.resolution_notes = notes
        else:
            issue.resolved_date = None
            issue.resolved_by = None
            issue.resolution_notes = None

    db.commit()
    db.refresh(issue)

    log_action(
        db=db,
        user_id=current_user.user_id,
        username=current_user.username,
        action_type="RECORD_ISSUE_ACTION",
        module="ISSUES",
        details={
            "issue_id": issue.issue_id,
            "action_type": action_type,
            "new_status": status
        }
    )

    project_name = issue.project.project_name if issue.project else "General JBVNL Grid Work"
    return make_issue_response(issue, project_name)





@router.post("/instant-suggest", response_model=InstantSuggestResponse)
def get_instant_suggest(
    payload: InstantSuggestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project_name = "General JBVNL Grid Work"
    dept_name = "General Engineering"
    
    if payload.project_id:
        project = db.query(Project).filter(Project.project_id == payload.project_id).first()
        if project:
            project_name = project.project_name
            if project.department:
                dept_name = project.department.department_name
                
    suggestions = suggest_issue_solution(
        project_name=project_name,
        department_name=dept_name,
        title=payload.title,
        description=payload.description
    )
    
    log_action(
        db=db,
        user_id=current_user.user_id,
        username=current_user.username,
        action_type="GENERATE_INSTANT_AI_SUGGESTION",
        module="ISSUES",
        details={
            "project_id": payload.project_id,
            "title": payload.title
        }
    )
    
    return InstantSuggestResponse(suggestions=suggestions)
