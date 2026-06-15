from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models.user import User
from models.project import Project
from models.progress import ProgressHistory, Milestone
from schemas.progress import MilestoneCreate, MilestoneResponse, ProgressUpdate, ProgressHistoryResponse
from routers.auth import get_current_user, require_role
from services.audit_service import log_action


router = APIRouter(prefix="/progress", tags=["Progress Tracking"])

def update_planned_progress_db(project: Project, db: Session):
    """
    Look up milestones for this project and update planned_progress column.
    Planned progress is the highest planned percentage among milestones with target_date <= today.
    """
    today = date.today()
    milestone = db.query(Milestone).filter(
        Milestone.project_id == project.project_id,
        Milestone.target_date <= today
    ).order_by(Milestone.planned_progress.desc()).first()
    
    if milestone:
        project.planned_progress = milestone.planned_progress
    else:
        project.planned_progress = 0.0
        
    db.commit()


@router.get("")
def list_progress_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager", "Operator", "Viewer"]))
):
    projects = db.query(Project).all()
    today = date.today()
    
    overview = []
    for proj in projects:
        # Auto-recalculate planned progress for presentation
        update_planned_progress_db(proj, db)
        
        # Auto-calculate status: If today > end_date and actual < 100% -> status = Delayed
        old_status = proj.status
        if proj.end_date and today > proj.end_date and proj.actual_progress < 100.0:
            proj.status = "Delayed"
        elif proj.actual_progress == 100.0:
            proj.status = "Completed"
        elif proj.actual_progress > 0.0 and proj.status in ["Pending", "Delayed"]:
            # If progress is starting but was delayed/pending, mark as In Progress if end_date has not passed
            if proj.end_date and today <= proj.end_date:
                proj.status = "In Progress"
                
        if old_status != proj.status:
            db.commit()
            log_action(
                db,
                user_id=None,
                username="SYSTEM",
                action_type="Auto Status Transition",
                module="Progress",
                details={"project_id": proj.project_id, "old_status": old_status, "new_status": proj.status}
            )

        variance = float(proj.actual_progress - proj.planned_progress)
        
        # Get last updated date from progress history
        last_history = db.query(ProgressHistory).filter(
            ProgressHistory.project_id == proj.project_id
        ).order_by(ProgressHistory.updated_at.desc()).first()
        
        last_updated = last_history.updated_at if last_history else proj.created_at

        # Get milestones for this project
        milestones = db.query(Milestone).filter(Milestone.project_id == proj.project_id).order_by(Milestone.target_date.asc()).all()
        milestones_data = [
            {
                "milestone_id": m.milestone_id,
                "target_date": str(m.target_date),
                "planned_progress": float(m.planned_progress),
                "description": m.description
            } for m in milestones
        ]

        overview.append({
            "project_id": proj.project_id,
            "project_name": proj.project_name,
            "department_name": proj.department.department_name if proj.department else "General",
            "planned_progress": float(proj.planned_progress),
            "actual_progress": float(proj.actual_progress),
            "variance": variance,
            "status": proj.status,
            "last_updated": last_updated,
            "milestones": milestones_data
        })

    return overview


@router.put("/{project_id}", response_model=ProgressHistoryResponse)
def update_actual_progress(
    project_id: str,
    req: ProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager", "Operator"]))
):
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Update actual progress % in Project
    project.actual_progress = req.actual_progress
    
    # Auto status updates
    today = date.today()
    if req.actual_progress == 100.0:
        project.status = "Completed"
    elif project.end_date and today > project.end_date and req.actual_progress < 100.0:
        project.status = "Delayed"
    elif req.actual_progress > 0.0:
        project.status = "In Progress"
        
    db.commit()

    # Create ProgressHistory record
    history = ProgressHistory(
        project_id=project_id,
        updated_by=current_user.user_id,
        actual_progress=req.actual_progress,
        notes=req.notes
    )
    db.add(history)
    db.commit()
    db.refresh(history)

    log_action(
        db,
        user_id=current_user.user_id,
        username=current_user.username,
        action_type="Update Project Progress",
        module="Progress",
        details={
            "project_id": project_id,
            "actual_progress": float(req.actual_progress),
            "status": project.status,
            "notes": req.notes
        }
    )

    # Attach updater name manually for the response
    res = ProgressHistoryResponse.model_validate(history)
    res.updater_name = current_user.full_name
    return res


@router.get("/{project_id}/history", response_model=List[ProgressHistoryResponse])
def get_progress_history(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager", "Operator", "Viewer"]))
):
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    history_records = db.query(ProgressHistory).filter(
        ProgressHistory.project_id == project_id
    ).order_by(ProgressHistory.updated_at.desc()).all()

    result = []
    for h in history_records:
        res = ProgressHistoryResponse.model_validate(h)
        res.updater_name = h.updater.full_name if h.updater else "System"
        result.append(res)
        
    return result


@router.post("/{project_id}/milestones", response_model=MilestoneResponse, status_code=status.HTTP_201_CREATED)
def create_planned_milestone(
    project_id: str,
    req: MilestoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager"]))
):
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Create Milestone
    milestone = Milestone(
        project_id=project_id,
        target_date=req.target_date,
        planned_progress=req.planned_progress
    )
    db.add(milestone)
    db.commit()
    db.refresh(milestone)

    # Recalculate project planned progress immediately
    update_planned_progress_db(project, db)

    log_action(
        db,
        user_id=current_user.user_id,
        username=current_user.username,
        action_type="Create Project Milestone",
        module="Progress",
        details={
            "project_id": project_id,
            "target_date": str(req.target_date),
            "planned_progress": float(req.planned_progress)
        }
    )

    return milestone
