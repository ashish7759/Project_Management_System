try:
    from database import Base
    from models.department import Department
    from models.user import User
    from models.document import MasterDocument
    from models.project import Project
    from models.contractor import Contractor
    from models.location import Location
    from models.progress import Milestone, ProgressHistory
    from models.audit import AuditLog
except ImportError:
    from backend.database import Base
    from backend.models.department import Department
    from backend.models.user import User
    from backend.models.document import MasterDocument
    from backend.models.project import Project
    from backend.models.contractor import Contractor
    from backend.models.location import Location
    from backend.models.progress import Milestone, ProgressHistory
    from backend.models.audit import AuditLog

__all__ = [
    "Base",
    "Department",
    "User",
    "MasterDocument",
    "Project",
    "Contractor",
    "Location",
    "Milestone",
    "ProgressHistory",
    "AuditLog"
]
