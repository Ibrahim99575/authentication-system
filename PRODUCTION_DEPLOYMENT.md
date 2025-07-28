# Biometric Authentication System - Production Deployment Guide

## Overview

This guide covers deploying the biometric authentication system to production environments with proper security, performance, and monitoring configurations.

## Environment Configuration

### 1. Environment Variables (.env)

Create a `.env` file for production settings:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/biometric_auth
# Or for SQLite: sqlite:///./production.db

# Security Settings
SECRET_KEY=your-super-secret-key-here-use-256-bit-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=false
LOG_LEVEL=INFO

# CORS Settings
ALLOWED_ORIGINS=["https://yourfrontend.com", "https://www.yourfrontend.com"]
ALLOWED_HOSTS=["yourapi.com", "www.yourapi.com"]

# Biometric Configuration
BIOMETRIC_SIMILARITY_THRESHOLD=0.8
BIOMETRIC_DATA_ENCRYPTION_KEY=your-biometric-encryption-key-32-chars

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
AUTH_RATE_LIMIT_PER_MINUTE=10

# File Upload Limits
MAX_VIDEO_SIZE_MB=10
MAX_VIDEO_DURATION_SECONDS=10

# Email Configuration (if using email verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# Monitoring
SENTRY_DSN=your-sentry-dsn-if-using
LOG_FILE_PATH=/var/log/biometric-auth/app.log
```

### 2. Updated Configuration (app/config.py)

```python
import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./biometric_auth.db")
    
    # Security
    secret_key: str = os.getenv("SECRET_KEY", "fallback-secret-key-change-in-production")
    algorithm: str = os.getenv("ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    refresh_token_expire_days: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
    # Server
    host: str = os.getenv("HOST", "127.0.0.1")
    port: int = int(os.getenv("PORT", "8000"))
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    
    # CORS
    allowed_origins: List[str] = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    allowed_hosts: List[str] = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    
    # Biometric
    biometric_similarity_threshold: float = float(os.getenv("BIOMETRIC_SIMILARITY_THRESHOLD", "0.8"))
    biometric_data_encryption_key: str = os.getenv("BIOMETRIC_DATA_ENCRYPTION_KEY", "default-32-char-encryption-key!!")
    
    # Rate Limiting
    rate_limit_per_minute: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
    auth_rate_limit_per_minute: int = int(os.getenv("AUTH_RATE_LIMIT_PER_MINUTE", "10"))
    
    # File Upload
    max_video_size_mb: int = int(os.getenv("MAX_VIDEO_SIZE_MB", "10"))
    max_video_duration_seconds: int = int(os.getenv("MAX_VIDEO_DURATION_SECONDS", "10"))
    
    # Logging
    log_file_path: str = os.getenv("LOG_FILE_PATH", "./logs/app.log")
    
    class Config:
        env_file = ".env"


settings = Settings()
```

## Docker Deployment

### 1. Dockerfile

```dockerfile
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgtk-3-0 \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["python", "main.py"]
```

### 2. docker-compose.yml

```yaml
version: '3.8'

services:
  biometric-auth:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://biometric_user:biometric_pass@db:5432/biometric_auth
      - SECRET_KEY=${SECRET_KEY}
      - DEBUG=false
      - HOST=0.0.0.0
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    depends_on:
      - db
      - redis
    restart: unless-stopped
    networks:
      - biometric-network

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=biometric_auth
      - POSTGRES_USER=biometric_user
      - POSTGRES_PASSWORD=biometric_pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - biometric-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - biometric-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - biometric-auth
    restart: unless-stopped
    networks:
      - biometric-network

volumes:
  postgres_data:
  redis_data:

networks:
  biometric-network:
    driver: bridge
```

### 3. nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    upstream biometric_backend {
        server biometric-auth:8000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=60r/m;

    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com www.your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

        # Auth endpoints with stricter rate limiting
        location ~ ^/(auth|biometric)/ {
            limit_req zone=auth burst=5 nodelay;
            proxy_pass http://biometric_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Increase timeouts for biometric processing
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Other API endpoints
        location / {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://biometric_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # File upload size limit
        client_max_body_size 20M;
    }
}
```

## Production Requirements

### requirements.txt

```txt
fastapi[all]==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
alembic==1.12.1
python-jose[cryptography]==3.3.0
python-multipart==0.0.6
bcrypt==4.1.1
pydantic==2.5.0
pydantic-settings==2.1.0
email-validator==2.1.0
opencv-python-headless==4.8.1.78
numpy==1.24.3
cryptography==41.0.8
loguru==0.7.2
python-dotenv==1.0.0
psycopg2-binary==2.9.9
redis==5.0.1
slowapi==0.1.9
aiofiles==23.2.1
Pillow==10.1.0
```

## Monitoring and Logging

### 1. Enhanced Logging Configuration

```python
# app/utils/logging.py
import os
import sys
from loguru import logger
from app.config import settings

def configure_logging():
    # Remove default handler
    logger.remove()
    
    # Console handler for development
    if settings.debug:
        logger.add(
            sys.stdout,
            level=settings.log_level,
            format="<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
            colorize=True
        )
    
    # File handler for production
    logger.add(
        settings.log_file_path,
        level=settings.log_level,
        format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} - {message}",
        rotation="100 MB",
        retention="30 days",
        compression="zip"
    )
    
    # Separate file for errors
    logger.add(
        settings.log_file_path.replace('.log', '_errors.log'),
        level="ERROR",
        format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} - {message}",
        rotation="50 MB",
        retention="90 days",
        compression="zip"
    )
    
    return logger
```

### 2. Health Check Endpoint

```python
# Add to main.py
from fastapi import FastAPI, status
from app.database import engine
from sqlalchemy import text

@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    try:
        # Check database connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "database": "connected"
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service unhealthy"
        )
```

## Security Hardening

### 1. Rate Limiting

```python
# Add to main.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Apply to auth routes
@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, ...):
    # Login logic
    pass
```

### 2. Input Validation

```python
# Enhanced schemas with validation
from pydantic import BaseModel, validator, Field
from typing import Optional

class BiometricLoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=128)
    video_data: str = Field(..., description="Base64 encoded video")
    video_format: str = Field(default="mp4", regex="^(mp4|webm|avi)$")
    
    @validator('video_data')
    def validate_video_size(cls, v):
        # Rough base64 size check (4/3 of original size)
        estimated_size = len(v) * 3 / 4 / (1024 * 1024)  # MB
        if estimated_size > 10:  # 10MB limit
            raise ValueError('Video file too large')
        return v
```

## Deployment Steps

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
sudo mkdir -p /opt/biometric-auth
sudo chown $USER:$USER /opt/biometric-auth
cd /opt/biometric-auth
```

### 2. SSL Certificate Setup

```bash
# Using Let's Encrypt
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Copy certificates to project
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/key.pem
sudo chown $USER:$USER ./ssl/*
```

### 3. Environment Setup

```bash
# Create production environment file
cp .env.example .env
# Edit .env with production values

# Generate secure keys
python -c "import secrets; print(secrets.token_urlsafe(32))" # SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))" # BIOMETRIC_ENCRYPTION_KEY
```

### 4. Deploy

```bash
# Build and start services
docker-compose up -d

# Check logs
docker-compose logs -f biometric-auth

# Initialize database
docker-compose exec biometric-auth python scripts/init_db.py
```

## Backup and Maintenance

### 1. Database Backup Script

```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/opt/backups/biometric-auth"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker-compose exec -T db pg_dump -U biometric_user biometric_auth > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

# Compress and clean old backups
gzip "$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
find $BACKUP_DIR -name "*.gz" -type f -mtime +30 -delete

echo "Backup completed: db_backup_$TIMESTAMP.sql.gz"
```

### 2. Log Rotation

```bash
# Add to /etc/logrotate.d/biometric-auth
/opt/biometric-auth/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    copytruncate
    notifempty
}
```

## Monitoring

### 1. Basic Monitoring Script

```python
# monitoring.py
import requests
import time
import logging
from datetime import datetime

def check_health():
    try:
        response = requests.get("https://your-domain.com/health", timeout=10)
        if response.status_code == 200:
            logging.info(f"Health check passed at {datetime.now()}")
            return True
        else:
            logging.error(f"Health check failed with status {response.status_code}")
            return False
    except Exception as e:
        logging.error(f"Health check error: {str(e)}")
        return False

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    while True:
        check_health()
        time.sleep(60)  # Check every minute
```

This production deployment guide provides a comprehensive setup for scaling your biometric authentication system securely and reliably.
