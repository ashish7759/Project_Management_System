import os
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, status
from sqlalchemy.orm import Session

try:
    from database import get_db
    from config import settings
    from models.user import User
    from models.document import MasterDocument
    from models.project import Project
    from models.contractor import Contractor
    from models.location import Location
    from models.department import Department
    from schemas.document import DocumentResponse, DocumentVerifyRequest
    from routers.auth import get_current_user, require_role
    from services.ocr_service import process_document_ocr
    from services.ai_extraction_service import extract_project_metadata_ai
    from services.audit_service import log_action
except ImportError:
    from backend.database import get_db
    from backend.config import settings
    from backend.models.user import User
    from backend.models.document import MasterDocument
    from backend.models.project import Project
    from backend.models.contractor import Contractor
    from backend.models.location import Location
    from backend.models.department import Department
    from backend.schemas.document import DocumentResponse, DocumentVerifyRequest
    from backend.routers.auth import get_current_user, require_role
    from backend.services.ocr_service import process_document_ocr
    from backend.services.ai_extraction_service import extract_project_metadata_ai
    from backend.services.audit_service import log_action

router = APIRouter(prefix="/documents", tags=["Document Management"])

# Valid MIME Types
ACCEPTED_MIME_TYPES = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/tiff": ".tiff",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx"
}

def run_async_ocr_pipeline(document_id: int, file_path: str):
    """
    Background worker that runs OCR, sends text to GPT-4o, and writes back metadata.
    Uses its own DB session to avoid session sharing issues.
    """
    from database import SessionLocal
    db = SessionLocal()
    try:
        doc = db.query(MasterDocument).filter(MasterDocument.document_id == document_id).first()
        if not doc:
            return

        log_action(db, user_id=None, username="SYSTEM", action_type="OCR Start", module="OCR", details={"document_id": document_id})

        # Step 2 & 3: Run OCR
        extracted_text, ocr_status = process_document_ocr(file_path)
        doc.raw_ocr_text = extracted_text
        doc.ocr_status = ocr_status
        db.commit()

        log_action(db, user_id=None, username="SYSTEM", action_type="OCR Complete", module="OCR", details={"document_id": document_id, "status": ocr_status})

        if ocr_status == "Completed" and extracted_text:
            # Step 4: OpenAI Metadata Extraction
            ai_data = extract_project_metadata_ai(extracted_text)
            doc.ai_extracted_json = json.dumps(ai_data)
            db.commit()
            log_action(db, user_id=None, username="SYSTEM", action_type="AI Extraction Complete", module="OCR", details={"document_id": document_id})
        else:
            doc.ocr_status = "Failed"
            db.commit()
    except Exception as e:
        import sys
        print(f"Background OCR Pipeline failed: {e}", file=sys.stderr)
        try:
            doc = db.query(MasterDocument).filter(MasterDocument.document_id == document_id).first()
            if doc:
                doc.ocr_status = "Failed"
                db.commit()
        except:
            pass
    finally:
        db.close()


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    document_type: str = Form(...),
    department: str = Form(...),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    project_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager", "Operator"]))
):
    # Validation 1: Max file size (20MB)
    # Read file content length to verify
    file.file.seek(0, os.SEEK_END)
    size_in_bytes = file.file.tell()
    file.file.seek(0)
    
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if size_in_bytes > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum size of {settings.MAX_FILE_SIZE_MB}MB"
        )

    # Validation 2: Validate MIME type
    if file.content_type not in ACCEPTED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Supported formats: PDF, JPG, PNG, TIFF, DOCX, XLSX"
        )

    # Organize folder layout: /uploads/{year}/{month}/{document_type}/
    now = datetime.now()
    year_str = str(now.year)
    month_str = f"{now.month:02d}"
    
    # Sanitize document type to prevent path traversal
    safe_doc_type = "".join([c if c.isalnum() or c in " _-" else "_" for c in document_type]).strip()
    
    upload_subdir = os.path.join(settings.UPLOAD_DIR, year_str, month_str, safe_doc_type)
    os.makedirs(upload_subdir, exist_ok=True)
    
    # Save original file with timestamp to prevent collisions
    timestamp = int(now.timestamp())
    original_filename = file.filename or "uploaded_file"
    base, ext = os.path.splitext(original_filename)
    # Ensure correct extension
    if not ext:
        ext = ACCEPTED_MIME_TYPES.get(file.content_type, ".bin")
        
    safe_base = "".join([c if c.isalnum() or c in " _-" else "_" for c in base]).strip()
    saved_filename = f"{safe_base}_{timestamp}{ext}"
    saved_filepath = os.path.abspath(os.path.join(upload_subdir, saved_filename))
    
    # Write to local storage
    try:
        with open(saved_filepath, "wb") as f:
            content = file.file.read()
            f.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save uploaded file: {e}"
        )

    # Create MasterDocument Record
    doc = MasterDocument(
        original_file_path=saved_filepath,
        file_name=original_filename,
        file_type=ext.replace(".", "").upper(),
        uploaded_by=current_user.user_id,
        ocr_status="Processing",
        verification_status="Pending"
    )
    
    db.add(doc)
    db.commit()
    db.refresh(doc)

    log_action(
        db,
        user_id=current_user.user_id,
        username=current_user.username,
        action_type="Upload Document",
        module="Documents",
        details={
            "document_id": doc.document_id,
            "file_name": doc.file_name,
            "document_type": safe_doc_type,
            "department": department
        }
    )

    # Trigger OCR and AI Extraction pipeline asynchronously in background
    background_tasks.add_task(run_async_ocr_pipeline, doc.document_id, saved_filepath)

    return doc


@router.get("", response_model=List[DocumentResponse])
def list_documents(
    search: Optional[str] = None,
    doc_type: Optional[str] = None,
    ocr_status: Optional[str] = None,
    verification_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager", "Operator", "Viewer"]))
):
    query = db.query(MasterDocument)
    
    if search:
        query = query.filter(MasterDocument.file_name.like(f"%{search}%"))
    if doc_type:
        query = query.filter(MasterDocument.file_type == doc_type.upper())
    if ocr_status:
        query = query.filter(MasterDocument.ocr_status == ocr_status)
    if verification_status:
        query = query.filter(MasterDocument.verification_status == verification_status)
        
    return query.order_by(MasterDocument.upload_date.desc()).all()


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager", "Operator", "Viewer"]))
):
    doc = db.query(MasterDocument).filter(MasterDocument.document_id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.put("/{document_id}/verify")
def verify_document(
    document_id: int,
    req: DocumentVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager", "Operator"]))
):
    doc = db.query(MasterDocument).filter(MasterDocument.document_id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Approved data locks the record (no further edits by anyone, unless reset by Admin/Manager)
    if doc.verification_status == "Approved" and current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Approved documents are locked. Edits are not allowed."
        )

    # Actions: Approve, Reject, SaveDraft
    if req.action == "SaveDraft":
        # Save edited metadata fields back to JSON string in master document
        draft_fields = {
            "project_name": req.project_name,
            "project_id": req.project_id,
            "location": req.location,
            "district": req.district,
            "contractor_name": req.contractor_name,
            "contractor_id": req.contractor_id,
            "work_order_number": req.work_order_number,
            "budget_amount": req.budget_amount,
            "start_date": str(req.start_date),
            "end_date": str(req.end_date),
            "department": req.department,
            "document_type": req.document_type,
            "status": req.status,
            "notes": req.notes
        }
        doc.ai_extracted_json = json.dumps(draft_fields)
        db.commit()

        log_action(
            db,
            user_id=current_user.user_id,
            username=current_user.username,
            action_type="Save Draft Verification",
            module="Documents",
            details={"document_id": document_id}
        )
        return {"success": True, "message": "Draft saved successfully."}

    # Only Manager or Admin can Approve or Reject
    if current_user.role not in ["Admin", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Managers and Administrators can Approve or Reject documents."
        )

    if req.action == "Reject":
        doc.verification_status = "Rejected"
        # Save notes and reject reason in the json
        rejected_fields = {
            "reject_reason": req.reject_reason,
            "notes": req.notes
        }
        doc.ai_extracted_json = json.dumps(rejected_fields)
        db.commit()

        log_action(
            db,
            user_id=current_user.user_id,
            username=current_user.username,
            action_type="Reject Document",
            module="Documents",
            details={"document_id": document_id, "reason": req.reject_reason}
        )
        return {"success": True, "message": "Document marked as Rejected."}

    if req.action == "Approve":
        # Check required primary fields for children setup
        if not req.project_id or not req.project_name:
            raise HTTPException(status_code=400, detail="Project ID and Project Name are required for approval.")

        # Update MasterDocument
        doc.verification_status = "Approved"
        doc.approved_by = current_user.user_id
        doc.approved_at = datetime.utcnow()

        # Step 6: Populate / Update Child Tables
        
        # 1. Department Lookup / Insertion
        dept = db.query(Department).filter(Department.department_name == req.department).first()
        if not dept:
            dept = Department(department_name=req.department)
            db.add(dept)
            db.commit()
            db.refresh(dept)

        # 2. Project Creation / Update
        project = db.query(Project).filter(Project.project_id == req.project_id).first()
        if not project:
            project = Project(project_id=req.project_id)
            db.add(project)

        project.project_name = req.project_name
        project.location = req.location
        project.district = req.district
        project.department_id = dept.department_id
        project.start_date = req.start_date
        project.end_date = req.end_date
        project.budget_amount = req.budget_amount
        project.status = req.status or "Pending"
        project.document_id = document_id
        db.commit()

        # 3. Contractor Creation / Update
        if req.contractor_id and req.contractor_name:
            contractor = db.query(Contractor).filter(Contractor.contractor_id == req.contractor_id).first()
            if not contractor:
                contractor = Contractor(contractor_id=req.contractor_id)
                db.add(contractor)

            contractor.contractor_name = req.contractor_name
            contractor.work_order_number = req.work_order_number
            contractor.project_id = req.project_id
            db.commit()

        # 4. Location Creation
        if req.location and req.district:
            # Check if location entry already exists for this project site
            loc = db.query(Location).filter(
                Location.project_id == req.project_id,
                Location.location_name == req.location
            ).first()
            if not loc:
                loc = Location(
                    location_name=req.location,
                    district=req.district,
                    state="Jharkhand",
                    project_id=req.project_id
                )
                db.add(loc)
                db.commit()

        db.commit()

        log_action(
            db,
            user_id=current_user.user_id,
            username=current_user.username,
            action_type="Approve Document",
            module="Documents",
            details={
                "document_id": document_id,
                "project_id": req.project_id,
                "contractor_id": req.contractor_id
            }
        )

        return {"success": True, "message": "Document approved and project master records created."}

    raise HTTPException(status_code=400, detail="Invalid action parameter. Must be Approve, Reject, or SaveDraft")


@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager"]))
):
    doc = db.query(MasterDocument).filter(MasterDocument.document_id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete local file physically
    if os.path.exists(doc.original_file_path):
        try:
            os.remove(doc.original_file_path)
        except Exception as e:
            # Continue deletion of DB record even if file deletion failed
            pass

    db.delete(doc)
    db.commit()

    log_action(
        db,
        user_id=current_user.user_id,
        username=current_user.username,
        action_type="Delete Document",
        module="Documents",
        details={"deleted_document_id": document_id, "file_name": doc.file_name}
    )
    return {"success": True, "message": "Document deleted successfully."}
