"""
Test user creation script
"""

import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.services.auth_service import AuthService
from app.schemas.auth import UserCreate

def create_test_user():
    """Create a test user for development"""
    db = SessionLocal()
    
    try:
        auth_service = AuthService(db)
        
        # Create test user data
        test_user = UserCreate(
            username="testuser",
            email="test@example.com",
            password="testpassword123",
            full_name="Test User"
        )
        
        # Check if user already exists
        from app.services.user_service import UserService
        user_service = UserService(db)
        
        if user_service.get_user_by_username(test_user.username):
            print("Test user already exists!")
            return
        
        # Create user
        user = auth_service.create_user(test_user)
        print(f"✓ Test user created successfully!")
        print(f"  Username: {user.username}")
        print(f"  Email: {user.email}")
        print(f"  ID: {user.id}")
        
    except Exception as e:
        print(f"✗ Error creating test user: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()
