"""
Database initialization script
"""

import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base
from app.models import User, BiometricTemplate, AuthLog
from app.config import settings

def init_database():
    """Initialize the database"""
    print("Initializing database...")
    
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✓ Database tables created successfully")
        
        # Create upload and temp directories
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        os.makedirs(settings.TEMP_DIR, exist_ok=True)
        print("✓ Upload and temp directories created")
        
        print("Database initialization completed successfully!")
        
    except Exception as e:
        print(f"✗ Error initializing database: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    init_database()
