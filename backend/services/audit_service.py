import json
from typing import Optional, Any, Dict
from sqlalchemy.orm import Session

try:
    from models.audit import AuditLog
except ImportError:
    from backend.models.audit import AuditLog

def log_action(
    db: Session,
    user_id: Optional[int],
    username: Optional[str],
    action_type: str,
    module: str,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None
) -> None:
    """
    Persist user operations into the database audit log table.
    """
    try:
        details_str = None
        if details is not None:
            details_str = json.dumps(details)

        db_log = AuditLog(
            user_id=user_id,
            username=username,
            action_type=action_type,
            module=module,
            details=details_str,
            ip_address=ip_address
        )
        db.add(db_log)
        db.commit()
    except Exception as e:
        db.rollback()
        # Log to stderr/stdout but don't fail user requests due to audit log failure
        import sys
        print(f"ERROR logging action '{action_type}' in module '{module}': {e}", file=sys.stderr)
