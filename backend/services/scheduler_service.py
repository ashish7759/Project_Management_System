import asyncio
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from database import SessionLocal
from models.document import MasterDocument
from models.project import Project
from models.user import User
from services.email_service import send_email
from services.email_templates import monthly_summary_email

logger = logging.getLogger(__name__)

async def send_monthly_summary():
    db: Session = SessionLocal()
    try:
        now        = datetime.now()
        month_year = now.strftime("%B %Y")

        total_docs         = db.query(MasterDocument).count()
        approved_docs      = db.query(MasterDocument).filter(
            MasterDocument.verification_status.in_(["Approved", "approved"])
        ).count()
        pending_docs       = db.query(MasterDocument).filter(
            MasterDocument.verification_status.in_(["Pending", "pending"])
        ).count()
        total_projects     = db.query(Project).count()
        delayed_projects   = db.query(Project).filter(
            Project.status.in_(["Delayed", "delayed"])
        ).count()
        completed_projects = db.query(Project).filter(
            Project.status.in_(["Completed", "completed"])
        ).count()

        admins_and_managers = db.query(User).filter(
            User.role.in_(["Admin", "Manager"]),
            User.status.in_(["Active", "active"]),
        ).all()

        for user in admins_and_managers:
            if not user.email:
                continue
            template = monthly_summary_email(
                recipient_name     = user.full_name,
                month_year         = month_year,
                total_docs         = total_docs,
                approved_docs      = approved_docs,
                pending_docs       = pending_docs,
                total_projects     = total_projects,
                delayed_projects   = delayed_projects,
                completed_projects = completed_projects,
            )
            # Log this monthly summary trigger with event_type="Monthly Summary"
            await send_email(
                subject    = template["subject"],
                recipients = [user.email],
                body_html  = template["body"],
                event_type = "Monthly Summary"
            )
            logger.info(f"Monthly summary sent to {user.email}")

    except Exception as e:
        logger.error(f"Monthly summary failed: {e}")
    finally:
        db.close()
