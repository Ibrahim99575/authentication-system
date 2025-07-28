"""
Application configuration and settings
"""

import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings"""
    
    # Application settings
    APP_NAME: str = "Biometric Authentication System"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    
    # Security settings
    SECRET_KEY: str = "your-super-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database settings
    DATABASE_URL: str = "sqlite:///./biometric_auth.db"
    
    # Biometric settings
    BIOMETRIC_THRESHOLD: float = 0.6
    MAX_VIDEO_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_VIDEO_FORMATS: List[str] = ["mp4", "avi", "mov", "webm"]
    FACE_DETECTION_MODEL: str = "hog"  # or "cnn" for better accuracy
    
    # CORS settings
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080"
    ]
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1"]
    
    # Rate limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 3600  # 1 hour
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "app.log"
    
    # File storage
    UPLOAD_DIR: str = "uploads"
    TEMP_DIR: str = "temp"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Global settings instance
settings = Settings()
