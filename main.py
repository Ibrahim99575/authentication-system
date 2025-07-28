"""
Biometric Authentication System - FastAPI Application
Main entry point for the biometric authentication API server
"""

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from app.database import engine, Base
from app.routers import auth, users, biometric
from app.utils.logger import get_logger

# Initialize logger
logger = get_logger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI application
app = FastAPI(
    title="Biometric Authentication System",
    description="Advanced biometric authentication system with face recognition and JWT security",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["User Management"])
app.include_router(biometric.router, prefix="/biometric", tags=["Biometric Authentication"])

@app.get("/", response_model=dict)
async def root():
    """Root endpoint - API health check"""
    return {
        "message": "Biometric Authentication System API",
        "version": "1.0.0",
        "status": "operational",
        "features": [
            "JWT Authentication",
            "Biometric Face Recognition",
            "User Profile Management",
            "Secure Password Hashing",
            "Encrypted Biometric Templates"
        ]
    }

@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """Health check endpoint"""
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "status": "healthy",
            "service": "biometric-auth-api",
            "version": "1.0.0"
        }
    )

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"detail": "Endpoint not found"}
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"Internal server error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

if __name__ == "__main__":
    logger.info("Starting Biometric Authentication System...")
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )
