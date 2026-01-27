"""
FastAPI Application Entry Point
AI-Driven Inclusive Assessment System
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db.database import init_db
from app.api import auth, exams, analytics

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    logger.info("Starting AI Inclusive Assessment System...")
    await init_db()
    logger.info("Database initialized.")
    
    # Pre-load AI models
    logger.info("Loading AI models (this may take a moment)...")
    try:
        from app.agents.semantic_grader import grading_agent
        logger.info("AI models loaded successfully!")
    except Exception as e:
        logger.error(f"Error loading AI models: {e}")
    
    yield
    
    logger.info("Shutting down...")

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Driven Inclusive Assessment System with Adaptive Testing and Accessibility Features",
    version="1.0.0",
    lifespan=lifespan
)

# Exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    logger.error(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(exams.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")

@app.get("/")
async def root():
    return {
        "message": "AI-Driven Inclusive Assessment System",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
