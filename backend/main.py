import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

try:
    from config import settings
    from database import engine, Base, SessionLocal
    from models.department import Department
    from middleware.rate_limiter import LoginRateLimitMiddleware
    
    # Import routers
    from routers import auth, users, documents, projects, progress, reports, audit, dashboard
except ImportError:
    from backend.config import settings
    from backend.database import engine, Base, SessionLocal
    from backend.models.department import Department
    from backend.middleware.rate_limiter import LoginRateLimitMiddleware
    
    # Import routers
    from backend.routers import auth, users, documents, projects, progress, reports, audit, dashboard

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Jharkhand Bijli Office Project Management & Document Intelligence API",
    description="Digitizing document intelligence, OCR parsing, project milestones, and role-based tracking.",
    version="1.0.0"
)

# CORS Policy configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiter for login endpoint
app.add_middleware(LoginRateLimitMiddleware)

# Mount upload directory as static files to allow side-by-side document views
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers under base URL prefix /api/v1
api_prefix = "/api/v1"
app.include_router(auth.router, prefix=api_prefix)
app.include_router(users.router, prefix=api_prefix)
app.include_router(documents.router, prefix=api_prefix)
app.include_router(projects.router, prefix=api_prefix)
app.include_router(progress.router, prefix=api_prefix)
app.include_router(reports.router, prefix=api_prefix)
app.include_router(audit.router, prefix=api_prefix)
app.include_router(dashboard.router, prefix=api_prefix)


@app.on_event("startup")
def on_startup():
    """
    Setup tables and pre-populate standard departments on initial start.
    """
    logger.info("Initializing system startup checks...")
    
    # In case user runs app without Alembic (fallback direct schema creation)
    if engine is not None:
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("Database schemas verified/created.")
        except Exception as e:
            logger.error(f"Base metadata create_all skipped or failed: {e}")

        # Seed standard departments
        db = SessionLocal()
        try:
            standard_departments = [
                "Engineering", 
                "Finance", 
                "Operations", 
                "HR", 
                "IT", 
                "Administration"
            ]
            for dept_name in standard_departments:
                exists = db.query(Department).filter(Department.department_name == dept_name).first()
                if not exists:
                    logger.info(f"Seeding standard department: {dept_name}")
                    db_dept = Department(
                        department_name=dept_name,
                        department_head="Pending Assignment",
                        contact_email=f"{dept_name.lower()}@jbvnl.co.in"
                    )
                    db.add(db_dept)
            db.commit()
        except Exception as e:
            logger.error(f"Error seeding departments: {e}")
            db.rollback()
        finally:
            db.close()
            
    logger.info("Startup sequence completed successfully.")


@app.get("/")
def read_root():
    return {
        "status": "Online",
        "service": "Jharkhand Bijli Office Document Intelligence & Project Management System API",
        "api_docs": "/docs"
    }
