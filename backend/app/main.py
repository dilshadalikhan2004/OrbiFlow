from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy import text
import time

from app.database import engine, Base
from app.routes import auth, users, projects, tasks, organizations, activity, notifications, analytics, ai
from app.ws.router import router as ws_router
from app.core.exceptions import BaseAPIException
from app.core.logger import logger

from fastapi.middleware.cors import CORSMiddleware

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Enterprise Task & Workflow Management API",
    description="Hardened production-ready backend with Structured Logging and Custom Exceptions.",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MIDDLEWARE ---

@app.middleware("http")
async def audit_log_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    # Structured Request Logging
    logger.info(
        f"API Request", 
        extra={
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "latency": f"{process_time:.4f}s"
        }
    )
    return response

# --- EXCEPTION HANDLERS ---

@app.exception_handler(BaseAPIException)
async def enterprise_exception_handler(request: Request, exc: BaseAPIException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message
            }
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "The provided data failed validation checks",
                "details": [{"loc": e["loc"], "msg": str(e["msg"]), "type": e["type"]} for e in exc.errors()]
            }
        }
    )

# --- ROUTES ---

app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(organizations.router, prefix="/api/v1")
app.include_router(projects.router, prefix="/api/v1")
app.include_router(tasks.router, prefix="/api/v1")
app.include_router(activity.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(ws_router)  # WebSocket router (no /api/v1 prefix)
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    import asyncio
    from app.ws.manager import manager
    manager._loop = asyncio.get_running_loop()

@app.get("/", tags=["System"])
def read_root():
    return {"status": "success", "message": "Enterprise API Hardened v2.0 Ready."}

@app.get("/health", tags=["System"])
def health_check():
    return {"status": "healthy", "timestamp": time.time()}

@app.get("/ready", tags=["System"])
async def readiness_check():
    """Checks if the service is ready to serve traffic (e.g., DB is up)."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        logger.error(f"Readiness check failed: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "not_ready", "database": "disconnected"}
        )
