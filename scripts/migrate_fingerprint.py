"""
Database migration script to add fingerprint support
Run this script to update the database schema for fingerprint authentication
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import create_engine, text
from app.config import Settings
from app.utils.logger import get_logger

logger = get_logger(__name__)
settings = Settings()

def migrate_database():
    """Add biometric_type column to biometric_templates table"""
    try:
        engine = create_engine(settings.DATABASE_URL)
        
        with engine.connect() as conn:
            # Start transaction
            trans = conn.begin()
            
            try:
                # Check if biometric_type column already exists
                result = conn.execute(text("PRAGMA table_info(biometric_templates)"))
                columns = [row[1] for row in result.fetchall()]
                
                if 'biometric_type' not in columns:
                    logger.info("Adding biometric_type column to biometric_templates table...")
                    
                    # Add biometric_type column with default value 'face'
                    conn.execute(text("""
                        ALTER TABLE biometric_templates 
                        ADD COLUMN biometric_type VARCHAR(20) DEFAULT 'face' NOT NULL
                    """))
                    
                    # Update existing records to have 'face' as biometric_type
                    conn.execute(text("""
                        UPDATE biometric_templates 
                        SET biometric_type = 'face' 
                        WHERE biometric_type IS NULL OR biometric_type = ''
                    """))
                    
                    logger.info("Successfully added biometric_type column")
                else:
                    logger.info("biometric_type column already exists, skipping...")
                
                # Commit transaction
                trans.commit()
                logger.info("Database migration completed successfully")
                
            except Exception as e:
                # Rollback on error
                trans.rollback()
                raise e
                
    except Exception as e:
        logger.error(f"Database migration failed: {str(e)}")
        raise e

if __name__ == "__main__":
    print("Starting database migration for fingerprint support...")
    try:
        migrate_database()
        print("✅ Migration completed successfully!")
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        sys.exit(1)
