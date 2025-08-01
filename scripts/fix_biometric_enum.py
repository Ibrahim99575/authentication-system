"""
Fix existing biometric templates to use uppercase enum values
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import get_db
from sqlalchemy import text

def fix_biometric_enum():
    db = next(get_db())
    try:
        # Update existing lowercase values to uppercase
        result = db.execute(
            text("UPDATE biometric_templates SET biometric_type = 'FACE' WHERE biometric_type = 'face'")
        )
        db.commit()
        print(f'Updated {result.rowcount} face templates')
        
        result = db.execute(
            text("UPDATE biometric_templates SET biometric_type = 'FINGERPRINT' WHERE biometric_type = 'fingerprint'")
        )
        db.commit()
        print(f'Updated {result.rowcount} fingerprint templates')
        
        print('✅ Database update completed!')
        
    except Exception as e:
        db.rollback()
        print(f'❌ Error: {e}')
    finally:
        db.close()

if __name__ == "__main__":
    fix_biometric_enum()
