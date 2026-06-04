try:
    from schemas.auth import RegisterRequest, LoginRequest, TokenResponse
    from schemas.user import UserResponse, UserUpdate, UserResetPassword
    from schemas.department import DepartmentCreate, DepartmentResponse
    from schemas.document import AIExtractedFields, DocumentResponse, DocumentVerifyRequest
    from schemas.project import ProjectResponse, ProjectCreate, ProjectUpdate, ContractorResponse, LocationResponse
    from schemas.progress import MilestoneCreate, MilestoneResponse, ProgressUpdate, ProgressHistoryResponse
    from schemas.audit import AuditLogResponse
except ImportError:
    from backend.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
    from backend.schemas.user import UserResponse, UserUpdate, UserResetPassword
    from backend.schemas.department import DepartmentCreate, DepartmentResponse
    from backend.schemas.document import AIExtractedFields, DocumentResponse, DocumentVerifyRequest
    from backend.schemas.project import ProjectResponse, ProjectCreate, ProjectUpdate, ContractorResponse, LocationResponse
    from backend.schemas.progress import MilestoneCreate, MilestoneResponse, ProgressUpdate, ProgressHistoryResponse
    from backend.schemas.audit import AuditLogResponse

__all__ = [
    "RegisterRequest", "LoginRequest", "TokenResponse",
    "UserResponse", "UserUpdate", "UserResetPassword",
    "DepartmentCreate", "DepartmentResponse",
    "AIExtractedFields", "DocumentResponse", "DocumentVerifyRequest",
    "ProjectResponse", "ProjectCreate", "ProjectUpdate", "ContractorResponse", "LocationResponse",
    "MilestoneCreate", "MilestoneResponse", "ProgressUpdate", "ProgressHistoryResponse",
    "AuditLogResponse"
]
