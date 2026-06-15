import logging
import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from config import settings
from database import engine, Base, check_db_connection, SessionLocal
from middleware.rate_limiter import RateLimitMiddleware


# Import all models so Base knows about them
from models import user, document, project, contractor, location, department, progress, audit, change_log
from models.department import Department

# Import routers
from routers import auth, users, documents, projects, progress as progress_router, reports, audit as audit_router, dashboard

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Active: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn)

manager = ConnectionManager()


async def db_change_polling_worker():
    logger.info("Database change log polling worker started.")
    while True:
        try:
            await asyncio.sleep(1.0) # Check every 1 second
            db = SessionLocal()
            try:
                from sqlalchemy import text
                res = db.execute(text("SELECT change_id, table_name, action, row_id FROM database_change_log ORDER BY change_id ASC"))
                changes = res.fetchall()
                if changes:
                    change_ids = [c[0] for c in changes]
                    max_id = max(change_ids)
                    
                    payload = {
                        "type": "database_update",
                        "changes": [
                            {
                                "table": c[1],
                                "action": c[2],
                                "row_id": c[3]
                            } for c in changes
                        ]
                    }
                    
                    await manager.broadcast(payload)
                    
                    db.execute(text("DELETE FROM database_change_log WHERE change_id <= :max_id"), {"max_id": max_id})
                    db.commit()
            except Exception as e:
                db.rollback()
                logger.error(f"Error in DB change polling worker: {e}")
            finally:
                db.close()
        except asyncio.CancelledError:
            logger.info("Database polling worker received cancellation. Exiting.")
            break
        except Exception as e:
            logger.error(f"Top-level exception in polling worker: {e}")


def setup_database_triggers(engine):
    """
    Ensure appropriate triggers exist in SQL Server or SQLite to log database modifications.
    """
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            is_sqlite = engine.url.drivername.startswith("sqlite") or settings.DATABASE_URL.startswith("sqlite")
            
            if is_sqlite:
                logger.info("Configuring SQLite database triggers...")
                conn.execute(text("""
                    CREATE TRIGGER IF NOT EXISTS trg_project_insert
                    AFTER INSERT ON project
                    BEGIN
                        INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                        VALUES ('project', 'INSERT', NEW.project_id, datetime('now'));
                    END;
                """))
                conn.execute(text("""
                    CREATE TRIGGER IF NOT EXISTS trg_project_update
                    AFTER UPDATE ON project
                    BEGIN
                        INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                        VALUES ('project', 'UPDATE', NEW.project_id, datetime('now'));
                    END;
                """))
                conn.execute(text("""
                    CREATE TRIGGER IF NOT EXISTS trg_project_delete
                    AFTER DELETE ON project
                    BEGIN
                        INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                        VALUES ('project', 'DELETE', OLD.project_id, datetime('now'));
                    END;
                """))

                conn.execute(text("""
                    CREATE TRIGGER IF NOT EXISTS trg_document_insert
                    AFTER INSERT ON master_document
                    BEGIN
                        INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                        VALUES ('master_document', 'INSERT', CAST(NEW.document_id AS TEXT), datetime('now'));
                    END;
                """))
                conn.execute(text("""
                    CREATE TRIGGER IF NOT EXISTS trg_document_update
                    AFTER UPDATE ON master_document
                    BEGIN
                        INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                        VALUES ('master_document', 'UPDATE', CAST(NEW.document_id AS TEXT), datetime('now'));
                    END;
                """))
                conn.execute(text("""
                    CREATE TRIGGER IF NOT EXISTS trg_document_delete
                    AFTER DELETE ON master_document
                    BEGIN
                        INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                        VALUES ('master_document', 'DELETE', CAST(OLD.document_id AS TEXT), datetime('now'));
                    END;
                """))

                conn.execute(text("""
                    CREATE TRIGGER IF NOT EXISTS trg_milestone_insert
                    AFTER INSERT ON milestone
                    BEGIN
                        INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                        VALUES ('milestone', 'INSERT', CAST(NEW.milestone_id AS TEXT), datetime('now'));
                    END;
                """))
                conn.execute(text("""
                    CREATE TRIGGER IF NOT EXISTS trg_milestone_update
                    AFTER UPDATE ON milestone
                    BEGIN
                        INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                        VALUES ('milestone', 'UPDATE', CAST(NEW.milestone_id AS TEXT), datetime('now'));
                    END;
                """))
                conn.execute(text("""
                    CREATE TRIGGER IF NOT EXISTS trg_milestone_delete
                    AFTER DELETE ON milestone
                    BEGIN
                        INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                        VALUES ('milestone', 'DELETE', CAST(OLD.milestone_id AS TEXT), datetime('now'));
                    END;
                """))

                conn.execute(text("""
                    CREATE TRIGGER IF NOT EXISTS trg_progress_insert
                    AFTER INSERT ON progress_history
                    BEGIN
                        INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                        VALUES ('progress_history', 'INSERT', CAST(NEW.history_id AS TEXT), datetime('now'));
                    END;
                """))
                conn.execute(text("""
                    CREATE TRIGGER IF NOT EXISTS trg_progress_update
                    AFTER UPDATE ON progress_history
                    BEGIN
                        INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                        VALUES ('progress_history', 'UPDATE', CAST(NEW.history_id AS TEXT), datetime('now'));
                    END;
                """))
                conn.execute(text("""
                    CREATE TRIGGER IF NOT EXISTS trg_progress_delete
                    AFTER DELETE ON progress_history
                    BEGIN
                        INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                        VALUES ('progress_history', 'DELETE', CAST(OLD.history_id AS TEXT), datetime('now'));
                    END;
                """))

                conn.execute(text("""
                    CREATE TRIGGER IF NOT EXISTS trg_department_insert
                    AFTER INSERT ON department
                    BEGIN
                        INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                        VALUES ('department', 'INSERT', CAST(NEW.department_id AS TEXT), datetime('now'));
                    END;
                """))
                conn.execute(text("""
                    CREATE TRIGGER IF NOT EXISTS trg_department_update
                    AFTER UPDATE ON department
                    BEGIN
                        INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                        VALUES ('department', 'UPDATE', CAST(NEW.department_id AS TEXT), datetime('now'));
                    END;
                """))
                conn.execute(text("""
                    CREATE TRIGGER IF NOT EXISTS trg_department_delete
                    AFTER DELETE ON department
                    BEGIN
                        INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                        VALUES ('department', 'DELETE', CAST(OLD.department_id AS TEXT), datetime('now'));
                    END;
                """))

                # User triggers
                conn.execute(text("""
                    CREATE TRIGGER IF NOT EXISTS trg_user_insert
                    AFTER INSERT ON user_account
                    BEGIN
                        INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                        VALUES ('user_account', 'INSERT', CAST(NEW.user_id AS TEXT), datetime('now'));
                    END;
                """))
                conn.execute(text("""
                    CREATE TRIGGER IF NOT EXISTS trg_user_update
                    AFTER UPDATE ON user_account
                    BEGIN
                        INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                        VALUES ('user_account', 'UPDATE', CAST(NEW.user_id AS TEXT), datetime('now'));
                    END;
                """))
                conn.execute(text("""
                    CREATE TRIGGER IF NOT EXISTS trg_user_delete
                    AFTER DELETE ON user_account
                    BEGIN
                        INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                        VALUES ('user_account', 'DELETE', CAST(OLD.user_id AS TEXT), datetime('now'));
                    END;
                """))

                # Contractor triggers
                conn.execute(text("""
                    CREATE TRIGGER IF NOT EXISTS trg_contractor_insert
                    AFTER INSERT ON contractor
                    BEGIN
                        INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                        VALUES ('contractor', 'INSERT', NEW.contractor_id, datetime('now'));
                    END;
                """))
                conn.execute(text("""
                    CREATE TRIGGER IF NOT EXISTS trg_contractor_update
                    AFTER UPDATE ON contractor
                    BEGIN
                        INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                        VALUES ('contractor', 'UPDATE', NEW.contractor_id, datetime('now'));
                    END;
                """))
                conn.execute(text("""
                    CREATE TRIGGER IF NOT EXISTS trg_contractor_delete
                    AFTER DELETE ON contractor
                    BEGIN
                        INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                        VALUES ('contractor', 'DELETE', OLD.contractor_id, datetime('now'));
                    END;
                """))

                # Location triggers
                conn.execute(text("""
                    CREATE TRIGGER IF NOT EXISTS trg_location_insert
                    AFTER INSERT ON location
                    BEGIN
                        INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                        VALUES ('location', 'INSERT', CAST(NEW.location_id AS TEXT), datetime('now'));
                    END;
                """))
                conn.execute(text("""
                    CREATE TRIGGER IF NOT EXISTS trg_location_update
                    AFTER UPDATE ON location
                    BEGIN
                        INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                        VALUES ('location', 'UPDATE', CAST(NEW.location_id AS TEXT), datetime('now'));
                    END;
                """))
                conn.execute(text("""
                    CREATE TRIGGER IF NOT EXISTS trg_location_delete
                    AFTER DELETE ON location
                    BEGIN
                        INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                        VALUES ('location', 'DELETE', CAST(OLD.location_id AS TEXT), datetime('now'));
                    END;
                """))

            else:
                logger.info("Configuring MS SQL Server database triggers...")
                conn.execute(text("""
                    IF OBJECT_ID('trg_project_changes', 'TR') IS NOT NULL
                        DROP TRIGGER trg_project_changes;
                """))
                conn.execute(text("""
                    CREATE TRIGGER trg_project_changes
                    ON project
                    AFTER INSERT, UPDATE, DELETE
                    AS
                    BEGIN
                        SET NOCOUNT ON;
                        IF EXISTS(SELECT * FROM inserted)
                        BEGIN
                            IF EXISTS(SELECT * FROM deleted)
                            BEGIN
                                INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                                SELECT 'project', 'UPDATE', project_id, GETDATE() FROM inserted;
                            END
                            ELSE
                            BEGIN
                                INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                                SELECT 'project', 'INSERT', project_id, GETDATE() FROM inserted;
                            END
                        END
                        ELSE
                        BEGIN
                            INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                            SELECT 'project', 'DELETE', project_id, GETDATE() FROM deleted;
                        END
                    END
                """))

                conn.execute(text("""
                    IF OBJECT_ID('trg_document_changes', 'TR') IS NOT NULL
                        DROP TRIGGER trg_document_changes;
                """))
                conn.execute(text("""
                    CREATE TRIGGER trg_document_changes
                    ON master_document
                    AFTER INSERT, UPDATE, DELETE
                    AS
                    BEGIN
                        SET NOCOUNT ON;
                        IF EXISTS(SELECT * FROM inserted)
                        BEGIN
                            IF EXISTS(SELECT * FROM deleted)
                            BEGIN
                                INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                                SELECT 'master_document', 'UPDATE', CAST(document_id AS NVARCHAR(100)), GETDATE() FROM inserted;
                            END
                            ELSE
                            BEGIN
                                INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                                SELECT 'master_document', 'INSERT', CAST(document_id AS NVARCHAR(100)), GETDATE() FROM inserted;
                            END
                        END
                        ELSE
                        BEGIN
                            INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                            SELECT 'master_document', 'DELETE', CAST(document_id AS NVARCHAR(100)), GETDATE() FROM deleted;
                        END
                    END
                """))

                conn.execute(text("""
                    IF OBJECT_ID('trg_milestone_changes', 'TR') IS NOT NULL
                        DROP TRIGGER trg_milestone_changes;
                """))
                conn.execute(text("""
                    CREATE TRIGGER trg_milestone_changes
                    ON milestone
                    AFTER INSERT, UPDATE, DELETE
                    AS
                    BEGIN
                        SET NOCOUNT ON;
                        IF EXISTS(SELECT * FROM inserted)
                        BEGIN
                            IF EXISTS(SELECT * FROM deleted)
                            BEGIN
                                INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                                SELECT 'milestone', 'UPDATE', CAST(milestone_id AS NVARCHAR(100)), GETDATE() FROM inserted;
                            END
                            ELSE
                            BEGIN
                                INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                                SELECT 'milestone', 'INSERT', CAST(milestone_id AS NVARCHAR(100)), GETDATE() FROM inserted;
                            END
                        END
                        ELSE
                        BEGIN
                            INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                            SELECT 'milestone', 'DELETE', CAST(milestone_id AS NVARCHAR(100)), GETDATE() FROM deleted;
                        END
                    END
                """))

                conn.execute(text("""
                    IF OBJECT_ID('trg_progress_changes', 'TR') IS NOT NULL
                        DROP TRIGGER trg_progress_changes;
                """))
                conn.execute(text("""
                    CREATE TRIGGER trg_progress_changes
                    ON progress_history
                    AFTER INSERT, UPDATE, DELETE
                    AS
                    BEGIN
                        SET NOCOUNT ON;
                        IF EXISTS(SELECT * FROM inserted)
                        BEGIN
                            IF EXISTS(SELECT * FROM deleted)
                            BEGIN
                                INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                                SELECT 'progress_history', 'UPDATE', CAST(history_id AS NVARCHAR(100)), GETDATE() FROM inserted;
                            END
                            ELSE
                            BEGIN
                                INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                                SELECT 'progress_history', 'INSERT', CAST(history_id AS NVARCHAR(100)), GETDATE() FROM inserted;
                            END
                        END
                        ELSE
                        BEGIN
                            INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                            SELECT 'progress_history', 'DELETE', CAST(history_id AS NVARCHAR(100)), GETDATE() FROM deleted;
                        END
                    END
                """))

                conn.execute(text("""
                    IF OBJECT_ID('trg_department_changes', 'TR') IS NOT NULL
                        DROP TRIGGER trg_department_changes;
                """))
                conn.execute(text("""
                    CREATE TRIGGER trg_department_changes
                    ON department
                    AFTER INSERT, UPDATE, DELETE
                    AS
                    BEGIN
                        SET NOCOUNT ON;
                        IF EXISTS(SELECT * FROM inserted)
                        BEGIN
                            IF EXISTS(SELECT * FROM deleted)
                            BEGIN
                                INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                                SELECT 'department', 'UPDATE', CAST(department_id AS NVARCHAR(100)), GETDATE() FROM inserted;
                            END
                            ELSE
                            BEGIN
                                INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                                SELECT 'department', 'INSERT', CAST(department_id AS NVARCHAR(100)), GETDATE() FROM inserted;
                            END
                        END
                        ELSE
                        BEGIN
                            INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                            SELECT 'department', 'DELETE', CAST(department_id AS NVARCHAR(100)), GETDATE() FROM deleted;
                        END
                    END
                """))

                # User triggers
                conn.execute(text("""
                    IF OBJECT_ID('trg_user_changes', 'TR') IS NOT NULL
                        DROP TRIGGER trg_user_changes;
                """))
                conn.execute(text("""
                    CREATE TRIGGER trg_user_changes
                    ON user_account
                    AFTER INSERT, UPDATE, DELETE
                    AS
                    BEGIN
                        SET NOCOUNT ON;
                        IF EXISTS(SELECT * FROM inserted)
                        BEGIN
                            IF EXISTS(SELECT * FROM deleted)
                            BEGIN
                                INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                                SELECT 'user_account', 'UPDATE', CAST(user_id AS NVARCHAR(100)), GETDATE() FROM inserted;
                            END
                            ELSE
                            BEGIN
                                INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                                SELECT 'user_account', 'INSERT', CAST(user_id AS NVARCHAR(100)), GETDATE() FROM inserted;
                            END
                        END
                        ELSE
                        BEGIN
                            INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                            SELECT 'user_account', 'DELETE', CAST(user_id AS NVARCHAR(100)), GETDATE() FROM deleted;
                        END
                    END
                """))

                # Contractor triggers
                conn.execute(text("""
                    IF OBJECT_ID('trg_contractor_changes', 'TR') IS NOT NULL
                        DROP TRIGGER trg_contractor_changes;
                """))
                conn.execute(text("""
                    CREATE TRIGGER trg_contractor_changes
                    ON contractor
                    AFTER INSERT, UPDATE, DELETE
                    AS
                    BEGIN
                        SET NOCOUNT ON;
                        IF EXISTS(SELECT * FROM inserted)
                        BEGIN
                            IF EXISTS(SELECT * FROM deleted)
                            BEGIN
                                INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                                SELECT 'contractor', 'UPDATE', contractor_id, GETDATE() FROM inserted;
                            END
                            ELSE
                            BEGIN
                                INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                                SELECT 'contractor', 'INSERT', contractor_id, GETDATE() FROM inserted;
                            END
                        END
                        ELSE
                        BEGIN
                            INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                            SELECT 'contractor', 'DELETE', contractor_id, GETDATE() FROM deleted;
                        END
                    END
                """))

                # Location triggers
                conn.execute(text("""
                    IF OBJECT_ID('trg_location_changes', 'TR') IS NOT NULL
                        DROP TRIGGER trg_location_changes;
                """))
                conn.execute(text("""
                    CREATE TRIGGER trg_location_changes
                    ON location
                    AFTER INSERT, UPDATE, DELETE
                    AS
                    BEGIN
                        SET NOCOUNT ON;
                        IF EXISTS(SELECT * FROM inserted)
                        BEGIN
                            IF EXISTS(SELECT * FROM deleted)
                            BEGIN
                                INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                                SELECT 'location', 'UPDATE', CAST(location_id AS NVARCHAR(100)), GETDATE() FROM inserted;
                            END
                            ELSE
                            BEGIN
                                INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                                SELECT 'location', 'INSERT', CAST(location_id AS NVARCHAR(100)), GETDATE() FROM inserted;
                            END
                        END
                        ELSE
                        BEGIN
                            INSERT INTO database_change_log (table_name, action, row_id, timestamp)
                            SELECT 'location', 'DELETE', CAST(location_id AS NVARCHAR(100)), GETDATE() FROM deleted;
                        END
                    END
                """))
            conn.commit()
            logger.info("Database triggers initialized successfully.")
    except Exception as e:
        logger.error(f"Error seeding database triggers: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing system startup checks...")
    Base.metadata.create_all(bind=engine)
    check_db_connection()

    # Ensure description column exists in milestone table (useful for existing databases)
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            if settings.DATABASE_URL.startswith("sqlite"):
                res = conn.execute(text("PRAGMA table_info(milestone)"))
                cols = [r[1] for r in res.fetchall()]
                if "description" not in cols:
                    logger.info("Adding description column to milestone table (SQLite)...")
                    conn.execute(text("ALTER TABLE milestone ADD COLUMN description TEXT"))
            else:
                res = conn.execute(text(
                    "SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('milestone') AND name = 'description'"
                ))
                if not res.fetchone():
                    logger.info("Adding description column to milestone table (SQL Server)...")
                    conn.execute(text("ALTER TABLE milestone ADD description NVARCHAR(255) NULL"))
            conn.commit()
    except Exception as e:
        logger.error(f"Failed to auto-upgrade database schema for milestone: {e}")

    # Seed database triggers
    setup_database_triggers(engine)
    
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

    # Spin up database change polling task
    polling_task = asyncio.create_task(db_change_polling_worker())
        
    logger.info("Startup sequence completed successfully.")
    yield
    # Shutdown
    logger.info("Application shutting down. Cancelling background tasks...")
    polling_task.cancel()
    await asyncio.gather(polling_task, return_exceptions=True)
    logger.info("Application shutdown completed.")

# Initializing FastAPI application
app = FastAPI(
    title="Jharkhand Bijli Vitran Nigam Limited — Project Management System",
    description="AI-Powered Document Intelligence and Project Management",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
origins = settings.CORS_ORIGINS.split(",")
for port in ["5173", "5174", "3000"]:
    dev_origin = f"http://localhost:{port}"
    if dev_origin not in origins:
        origins.append(dev_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiter middleware
app.add_middleware(RateLimitMiddleware)

# Mount upload directory as static files to allow side-by-side document views
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(auth.router,             prefix="/api/v1")
app.include_router(users.router,            prefix="/api/v1")
app.include_router(documents.router,        prefix="/api/v1")
app.include_router(projects.router,         prefix="/api/v1")
app.include_router(progress_router.router,  prefix="/api/v1")
app.include_router(reports.router,          prefix="/api/v1")
app.include_router(audit_router.router,     prefix="/api/v1")
app.include_router(dashboard.router,        prefix="/api/v1")


@app.websocket("/api/v1/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Maintain WebSocket connection alive and listen for client disconnects
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket connection exception: {e}")
        manager.disconnect(websocket)


@app.get("/", response_class=HTMLResponse)
def root():
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>JBO API Gateway | Jharkhand Bijli Vitran Nigam Ltd</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://unpkg.com/lucide@latest"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <script>
            tailwind.config = {
                theme: {
                    extend: {
                        fontFamily: {
                            sans: ['Inter', 'sans-serif'],
                            outfit: ['Outfit', 'sans-serif'],
                        },
                        colors: {
                            brand: {
                                50: '#f0fdf4',
                                500: '#10b981',
                                600: '#059669',
                                700: '#047857',
                            }
                        }
                    }
                }
            }
        </script>
        <style>
            body {
                background: radial-gradient(circle at top right, rgba(16, 185, 129, 0.08), transparent 60%),
                            radial-gradient(circle at bottom left, rgba(34, 197, 94, 0.05), transparent 50%),
                            #f8fafc;
                font-family: 'Inter', sans-serif;
            }
            .glass-card {
                background: rgba(255, 255, 255, 0.8);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(226, 232, 240, 0.8);
            }
            .glow-effect:hover {
                box-shadow: 0 0 25px rgba(16, 185, 129, 0.15);
                border-color: rgba(16, 185, 129, 0.3);
            }
            @keyframes pulse-slow {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.4; transform: scale(0.95); }
            }
            .animate-pulse-slow {
                animation: pulse-slow 3s infinite ease-in-out;
            }
        </style>
    </head>
    <body class="min-h-screen text-slate-800 flex flex-col justify-between overflow-x-hidden">

        <!-- Top Navigation -->
        <header class="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-10">
            <div class="flex items-center space-x-3">
                <div class="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white font-bold text-lg shadow-lg shadow-emerald-500/20 font-outfit">
                    JBO
                </div>
                <div>
                    <h1 class="text-sm font-semibold tracking-wider font-outfit uppercase text-slate-800">JBVNL</h1>
                    <p class="text-[10px] text-emerald-600 font-medium tracking-widest uppercase">API Gateway</p>
                </div>
            </div>
            <div class="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                <span class="relative flex h-2 w-2 mr-1">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span class="text-xs font-semibold tracking-wider text-emerald-600 uppercase font-outfit">Gateway Operational</span>
            </div>
        </header>

        <!-- Main Hero Section -->
        <main class="flex-grow flex flex-col items-center justify-center px-6 py-12 z-10">
            <div class="w-full max-w-4xl text-center space-y-8">
                
                <!-- Headline -->
                <div class="space-y-4">
                    <span class="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full font-outfit">
                        Version 1.0.0 Stable
                    </span>
                    <h2 class="text-4xl md:text-5xl font-extrabold tracking-tight font-outfit text-slate-900">
                        Jharkhand Bijli Vitran Nigam Limited API Engine
                    </h2>
                    <p class="text-slate-500 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
                        Secure role-based middleware, OCR document intelligence parsing, and project progress monitoring services.
                    </p>
                </div>

                <!-- Main Glass Control Box -->
                <div class="glass-card rounded-2xl p-8 max-w-2xl mx-auto text-left shadow-xl shadow-slate-100 space-y-6">
                    <div class="flex items-start justify-between border-b border-slate-100 pb-4">
                        <div>
                            <h3 class="text-md font-semibold text-slate-800 font-outfit">System Endpoint Status</h3>
                            <p class="text-xs text-slate-500 mt-0.5">FastAPI ASGI framework executing in active context</p>
                        </div>
                        <i data-lucide="cpu" class="h-5 w-5 text-emerald-500"></i>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <span class="text-[10px] text-slate-400 uppercase tracking-widest block font-outfit">Host Environment</span>
                            <span class="text-xs font-mono text-slate-700 mt-1 block">Localhost Context</span>
                        </div>
                        <div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <span class="text-[10px] text-slate-400 uppercase tracking-widest block font-outfit">Response Type</span>
                            <span class="text-xs font-mono text-slate-700 mt-1 block">HTML5 / ASGI JSON</span>
                        </div>
                    </div>

                    <!-- CTA Action Buttons -->
                    <div class="flex flex-col sm:flex-row gap-3 pt-2">
                        <a href="/docs" class="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/10 transition duration-300 hover:-translate-y-0.5 glow-effect font-outfit text-sm">
                            <i data-lucide="file-text" class="h-4 w-4"></i>
                            <span>Interactive Swagger Docs</span>
                        </a>
                        <a href="/redoc" class="flex-grow-0 flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-6 rounded-xl border border-slate-200 transition duration-300 hover:-translate-y-0.5 text-sm">
                            <i data-lucide="book-open" class="h-4 w-4"></i>
                            <span>ReDoc Spec</span>
                        </a>
                    </div>
                </div>

                <!-- Features Cards Grid -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-6 text-left">
                    
                    <div class="glass-card rounded-xl p-5 hover:bg-white transition duration-300 shadow-sm">
                        <div class="h-9 w-9 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 mb-4 border border-emerald-100">
                            <i data-lucide="eye" class="h-5 w-5"></i>
                        </div>
                        <h4 class="text-sm font-semibold text-slate-800 font-outfit">OCR Document Parsing</h4>
                        <p class="text-xs text-slate-500 mt-2 leading-relaxed">
                            Dual-engine Tesseract & EasyOCR pipeline for processing contractor sheets and work orders.
                        </p>
                    </div>

                    <div class="glass-card rounded-xl p-5 hover:bg-white transition duration-300 shadow-sm">
                        <div class="h-9 w-9 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 mb-4 border border-emerald-100">
                            <i data-lucide="shield-check" class="h-5 w-5"></i>
                        </div>
                        <h4 class="text-sm font-semibold text-slate-800 font-outfit">Secure Session Limiter</h4>
                        <p class="text-xs text-slate-500 mt-2 leading-relaxed">
                            Brute-force protection middleware with sliding window rate limiting on login checkpoints.
                        </p>
                    </div>

                    <div class="glass-card rounded-xl p-5 hover:bg-white transition duration-300 shadow-sm">
                        <div class="h-9 w-9 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 mb-4 border border-emerald-100">
                            <i data-lucide="trending-up" class="h-5 w-5"></i>
                        </div>
                        <h4 class="text-sm font-semibold text-slate-800 font-outfit">Milestone Monitor</h4>
                        <p class="text-xs text-slate-500 mt-2 leading-relaxed">
                            Granular actual vs planned progress logger and tracking for electrical division deployments.
                        </p>
                    </div>

                </div>

            </div>
        </main>

        <!-- Footer -->
        <footer class="w-full border-t border-slate-200 py-6 mt-12 z-10 bg-white">
            <div class="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-medium">
                <div>
                    &copy; 2026 Jharkhand Bijli Vitran Nigam Limited. All rights reserved.
                </div>
                <div class="flex space-x-6">
                    <a href="/docs" class="hover:text-emerald-600 transition">API Reference</a>
                    <a href="http://localhost:5173" class="hover:text-emerald-600 transition">Frontend Portal</a>
                </div>
            </div>
        </footer>

        <script>
            lucide.createIcons();
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content, status_code=200)

@app.get("/health")
def health():
    return {"status": "ok"}

