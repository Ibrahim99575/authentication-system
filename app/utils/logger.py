"""
Logging utilities
"""

import logging
import sys
from pathlib import Path
from loguru import logger
from app.config import settings

# Remove default handler
logger.remove()

# Add console handler
logger.add(
    sys.stdout,
    level=settings.LOG_LEVEL,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
)

# Add file handler
log_file = Path(settings.LOG_FILE)
logger.add(
    log_file,
    level=settings.LOG_LEVEL,
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    rotation="1 day",
    retention="30 days",
    compression="zip"
)

def get_logger(name: str):
    """Get a logger instance"""
    return logger.bind(name=name)

def setup_logger(name: str):
    """Setup and return a logger instance"""
    return get_logger(name)
