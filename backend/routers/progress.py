from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models.user import User
from models.project import Project
from models.progress import ProgressHistory, Milestone, Task
from schemas.progress import (
    MilestoneCreate, 
    MilestoneResponse, 
    ProgressUpdate, 
    ProgressHistoryResponse,
    TaskCreate,
    TaskUpdate,
    TaskResponse
)
from routers.auth import get_current_user, require_role
from services.audit_service import log_action
from services.email_service import send_email
from services.email_templates import project_delayed_email
import asyncio



router = APIRouter(prefix="/progress", tags=["Progress Tracking"])

def update_planned_progress_db(project: Project, db: Session):
    """
    Look up milestones for this project and update planned_progress column.
    Planned progress is the highest planned percentage among milestones with target_date <= today.
    If no milestones have passed yet, we use the first upcoming milestone's planned progress.
    If there are no milestones at all, we leave the existing project.planned_progress unchanged.
    """
    today = date.today()
    
    # Check if there are any milestones at all
    has_milestones = db.query(Milestone).filter(Milestone.project_id == project.project_id).first() is not None
    if not has_milestones:
        return

    milestone = db.query(Milestone).filter(
        Milestone.project_id == project.project_id,
        Milestone.target_date <= today
    ).order_by(Milestone.planned_progress.desc()).first()
    
    if milestone:
        project.planned_progress = milestone.planned_progress
        db.commit()
    else:
        # If all milestones are in the future, use the first upcoming milestone
        upcoming = db.query(Milestone).filter(
            Milestone.project_id == project.project_id,
            Milestone.target_date > today
        ).order_by(Milestone.target_date.asc()).first()
        if upcoming:
            project.planned_progress = upcoming.planned_progress
            db.commit()
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
        
        # Get last updated date and latest progress details from progress history
        latest_progress = db.query(ProgressHistory).filter(
            ProgressHistory.project_id == proj.project_id
        ).order_by(ProgressHistory.updated_at.desc()).first()
        
        last_updated = latest_progress.updated_at if latest_progress else proj.created_at

        # Get milestones for this project
        milestones = db.query(Milestone).filter(
            Milestone.project_id == proj.project_id
        ).order_by(Milestone.created_at.asc()).all()
        
        milestones_data = [
            {
                "milestone_id": m.milestone_id,
                "title"       : m.title or m.description or "Milestone",
                "description" : m.description or m.title or "",
                "percentage"  : float(m.percentage) if m.percentage is not None else float(m.planned_progress),
                "planned_progress": float(m.planned_progress) if m.planned_progress is not None else float(m.percentage or 0.0),
                "target_date" : str(m.target_date) if m.target_date else None,
                "status"      : m.status or "pending",
                "source"      : m.source or "manual",
            }
            for m in milestones
        ]

        actual_percentage = None
        planned_percentage = None
        work_completed = None
        issues = None
        next_steps = None
        source_file_name = None
        reported_by = None
        updated_at = None
        updated_by = None

        if latest_progress:
            actual_percentage = float(latest_progress.actual_percentage) if latest_progress.actual_percentage is not None else float(latest_progress.actual_progress)
            planned_percentage = float(latest_progress.planned_percentage) if latest_progress.planned_percentage is not None else float(proj.planned_progress)
            work_completed = latest_progress.work_completed or latest_progress.notes or ""
            issues = latest_progress.issues or ""
            next_steps = latest_progress.next_steps or ""
            source_file_name = latest_progress.source_file_name
            reported_by = latest_progress.reported_by
            updated_at = latest_progress.updated_at.isoformat() if latest_progress.updated_at else None
            updated_by = latest_progress.updater.username if latest_progress.updater else None
        else:
            actual_percentage = float(proj.actual_progress)
            planned_percentage = float(proj.planned_progress)
            work_completed = ""
            issues = ""
            next_steps = ""
            updated_at = proj.created_at.isoformat() if proj.created_at else None

        overview.append({
            "project_id": proj.project_id,
            "project_name": proj.project_name,
            "department_name": proj.department.department_name if proj.department else "General",
            "planned_progress": float(proj.planned_progress),
            "actual_progress": float(proj.actual_progress),
            "variance": variance,
            "status": proj.status,
            "last_updated": last_updated,
            "milestones": milestones_data,
            # New fields
            "actual_percentage": actual_percentage,
            "planned_percentage": planned_percentage,
            "work_completed": work_completed,
            "issues": issues,
            "next_steps": next_steps,
            "source_file_name": source_file_name,
            "reported_by": reported_by,
            "updated_at": updated_at,
            "updated_by": updated_by
        })

    return overview


@router.put("/{project_id}", response_model=ProgressHistoryResponse)
async def update_actual_progress(
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

    # After saving progress update, check if status became Delayed
    if project.status == "Delayed":
        # Get all active managers
        managers = db.query(User).filter(
            User.role   == "Manager",
            User.status.in_(["Active", "active"]),
        ).all()

        manager_emails = [m.email for m in managers if m.email]

        if manager_emails:
            template = project_delayed_email(
                manager_name = "Manager",
                project_name = project.project_name,
                project_id   = project.project_id,
                planned_pct  = int(project.planned_progress),
                actual_pct   = int(project.actual_progress),
                end_date     = str(project.end_date),
                department   = project.department.department_name if project.department else "General",
            )
            asyncio.create_task(send_email(
                subject    = template["subject"],
                recipients = manager_emails,
                body_html  = template["body"],
                event_type = "Project Delayed"
            ))


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


@router.get("/milestones/{milestone_id}/tasks", response_model=List[TaskResponse])
def get_milestone_tasks(
    milestone_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager", "Operator", "Viewer"]))
):
    milestone = db.query(Milestone).filter(Milestone.milestone_id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    # Fetch only top-level tasks (parent_id is None). The relationships will load subtasks recursively.
    return db.query(Task).filter(Task.milestone_id == milestone_id, Task.parent_id == None).all()


@router.post("/milestones/{milestone_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_milestone_task(
    milestone_id: int,
    req: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager"]))
):
    milestone = db.query(Milestone).filter(Milestone.milestone_id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    if req.parent_id:
        parent_task = db.query(Task).filter(Task.task_id == req.parent_id).first()
        if not parent_task:
            raise HTTPException(status_code=404, detail="Parent task not found")
        if parent_task.milestone_id != milestone_id:
            raise HTTPException(status_code=400, detail="Parent task must belong to the same milestone")

    task = Task(
        milestone_id=milestone_id,
        parent_id=req.parent_id,
        title=req.title,
        description=req.description,
        status=req.status,
        assigned_to=req.assigned_to,
        due_date=req.due_date
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    log_action(
        db,
        user_id=current_user.user_id,
        username=current_user.username,
        action_type="Create Task",
        module="Progress",
        details={
            "task_id": task.task_id,
            "milestone_id": milestone_id,
            "title": task.title,
            "parent_id": task.parent_id
        }
    )

    return task


@router.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    req: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager", "Operator"]))
):
    task = db.query(Task).filter(Task.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # If user is Operator, they can ONLY update the status, not other fields
    if current_user.role == "Operator":
        if req.title is not None or req.description is not None or req.assigned_to is not None or req.due_date is not None:
            raise HTTPException(status_code=403, detail="Operators are only allowed to update task status")

    # Update parameters
    for key, value in req.model_dump(exclude_unset=True).items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)

    log_action(
        db,
        user_id=current_user.user_id,
        username=current_user.username,
        action_type="Update Task",
        module="Progress",
        details={
            "task_id": task_id,
            "title": task.title,
            "status": task.status
        }
    )

    return task


@router.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager"]))
):
    task = db.query(Task).filter(Task.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()

    log_action(
        db,
        user_id=current_user.user_id,
        username=current_user.username,
        action_type="Delete Task",
        module="Progress",
        details={
            "task_id": task_id,
            "title": task.title
        }
    )

    return {"success": True, "message": "Task and its subtasks deleted successfully."}

