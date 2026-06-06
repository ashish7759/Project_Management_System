import os
import logging
from contextlib import asynccontextmanager
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

@asynccontextmanager
async def lifespan(app: FastAPI):
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
    yield

app = FastAPI(
    title="Jharkhand Bijli Office Project Management & Document Intelligence API",
    description="Digitizing document intelligence, OCR parsing, project milestones, and role-based tracking.",
    version="1.0.0",
    lifespan=lifespan
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



from fastapi.responses import HTMLResponse


@app.get("/", response_class=HTMLResponse)
def read_root():
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
                        Jharkhand Bijli Office API Engine
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
