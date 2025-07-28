"""
User service for user management operations
"""

from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.biometric import BiometricTemplate
from app.models.auth_log import AuthLog
from app.schemas.user import UserUpdate, UserStats
from app.utils.security import get_password_hash, verify_password
from app.utils.logger import get_logger

logger = get_logger(__name__)

class UserService:
    """Service for user management operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        try:
            return self.db.query(User).filter(User.id == user_id).first()
        except Exception as e:
            logger.error(f"Error getting user by ID: {str(e)}")
            return None
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username"""
        try:
            return self.db.query(User).filter(User.username == username).first()
        except Exception as e:
            logger.error(f"Error getting user by username: {str(e)}")
            return None
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        try:
            return self.db.query(User).filter(User.email == email).first()
        except Exception as e:
            logger.error(f"Error getting user by email: {str(e)}")
            return None
    
    def update_user_profile(self, user_id: int, update_data: UserUpdate) -> Optional[User]:
        """Update user profile"""
        try:
            user = self.get_user_by_id(user_id)
            if not user:
                return None
            
            # Update fields
            if update_data.full_name is not None:
                user.full_name = update_data.full_name
            if update_data.phone is not None:
                user.phone = update_data.phone
            if update_data.avatar_url is not None:
                user.avatar_url = update_data.avatar_url
            
            user.updated_at = datetime.now()
            
            self.db.commit()
            self.db.refresh(user)
            
            logger.info(f"User profile updated: {user.username}")
            return user
            
        except Exception as e:
            logger.error(f"Error updating user profile: {str(e)}")
            self.db.rollback()
            return None
    
    def change_password(self, user_id: int, current_password: str, new_password: str) -> bool:
        """Change user password"""
        try:
            user = self.get_user_by_id(user_id)
            if not user:
                return False
            
            # Verify current password
            if not verify_password(current_password, user.hashed_password):
                logger.warning(f"Invalid current password for user: {user.username}")
                return False
            
            # Update password
            user.hashed_password = get_password_hash(new_password)
            user.updated_at = datetime.now()
            
            self.db.commit()
            
            logger.info(f"Password changed for user: {user.username}")
            return True
            
        except Exception as e:
            logger.error(f"Error changing password: {str(e)}")
            self.db.rollback()
            return False
    
    def deactivate_user(self, user_id: int) -> bool:
        """Deactivate user account"""
        try:
            user = self.get_user_by_id(user_id)
            if not user:
                return False
            
            user.is_active = False
            user.updated_at = datetime.now()
            
            self.db.commit()
            
            logger.info(f"User deactivated: {user.username}")
            return True
            
        except Exception as e:
            logger.error(f"Error deactivating user: {str(e)}")
            self.db.rollback()
            return False
    
    def delete_user(self, user_id: int) -> bool:
        """Delete user account and all associated data"""
        try:
            user = self.get_user_by_id(user_id)
            if not user:
                return False
            
            # Delete associated data (cascading should handle this)
            self.db.delete(user)
            self.db.commit()
            
            logger.info(f"User deleted: {user.username}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting user: {str(e)}")
            self.db.rollback()
            return False
    
    def get_user_stats(self, user_id: int) -> Optional[UserStats]:
        """Get user statistics"""
        try:
            user = self.get_user_by_id(user_id)
            if not user:
                return None
            
            # Get authentication logs
            auth_logs = self.db.query(AuthLog).filter(AuthLog.user_id == user_id).all()
            
            total_logins = len(auth_logs)
            successful_logins = len([log for log in auth_logs if log.auth_result == "success"])
            failed_logins = total_logins - successful_logins
            
            # Get biometric templates count
            biometric_count = self.db.query(BiometricTemplate).filter(
                BiometricTemplate.user_id == user_id
            ).count()
            
            # Calculate account age
            account_age = (datetime.now() - user.created_at).days if user.created_at else 0
            
            return UserStats(
                total_logins=total_logins,
                successful_logins=successful_logins,
                failed_logins=failed_logins,
                last_login=user.last_login,
                account_age_days=account_age,
                biometric_enrollments=biometric_count
            )
            
        except Exception as e:
            logger.error(f"Error getting user stats: {str(e)}")
            return None
    
    def search_users(self, query: str, limit: int = 50) -> List[User]:
        """Search users by username or email"""
        try:
            users = self.db.query(User).filter(
                (User.username.ilike(f"%{query}%")) |
                (User.email.ilike(f"%{query}%")) |
                (User.full_name.ilike(f"%{query}%"))
            ).limit(limit).all()
            
            return users
            
        except Exception as e:
            logger.error(f"Error searching users: {str(e)}")
            return []
    
    def get_all_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all users with pagination"""
        try:
            return self.db.query(User).offset(skip).limit(limit).all()
        except Exception as e:
            logger.error(f"Error getting all users: {str(e)}")
            return []
    
    def verify_user_email(self, user_id: int) -> bool:
        """Mark user email as verified"""
        try:
            user = self.get_user_by_id(user_id)
            if not user:
                return False
            
            user.is_verified = True
            user.updated_at = datetime.now()
            
            self.db.commit()
            
            logger.info(f"Email verified for user: {user.username}")
            return True
            
        except Exception as e:
            logger.error(f"Error verifying email: {str(e)}")
            self.db.rollback()
            return False
    
    def get_user_count(self) -> int:
        """Get total number of users"""
        try:
            return self.db.query(User).count()
        except Exception as e:
            logger.error(f"Error getting user count: {str(e)}")
            return 0
