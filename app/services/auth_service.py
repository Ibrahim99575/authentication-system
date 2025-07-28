"""
Authentication service for user authentication and token management
"""

from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.auth_log import AuthLog
from app.schemas.auth import UserCreate, Token, UserResponse
from app.utils.security import (
    verify_password, get_password_hash, create_access_token, 
    create_refresh_token, verify_token
)
from app.utils.logger import get_logger
from app.config import settings

logger = get_logger(__name__)

class AuthService:
    """Service for authentication operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_user(self, user_data: UserCreate) -> User:
        """Create a new user"""
        try:
            hashed_password = get_password_hash(user_data.password)
            
            user = User(
                username=user_data.username,
                email=user_data.email,
                hashed_password=hashed_password,
                full_name=user_data.full_name,
                phone=user_data.phone,
                is_active=True,
                is_verified=False,
                is_enrolled=False
            )
            
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
            
            logger.info(f"User created successfully: {user.username}")
            return user
            
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            self.db.rollback()
            raise
    
    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """Authenticate user with username and password"""
        try:
            user = self.db.query(User).filter(
                (User.username == username) | (User.email == username)
            ).first()
            
            if not user:
                logger.warning(f"User not found: {username}")
                return None
            
            if not user.is_active:
                logger.warning(f"User account is deactivated: {username}")
                return None
            
            # Check account lockout
            if user.account_locked_until and user.account_locked_until > datetime.now():
                logger.warning(f"User account is locked: {username}")
                return None
            
            if not verify_password(password, user.hashed_password):
                # Increment failed login attempts
                user.failed_login_attempts += 1
                
                # Lock account after 5 failed attempts
                if user.failed_login_attempts >= 5:
                    user.account_locked_until = datetime.now() + timedelta(minutes=30)
                    logger.warning(f"Account locked due to failed attempts: {username}")
                
                self.db.commit()
                logger.warning(f"Invalid password for user: {username}")
                return None
            
            # Reset failed login attempts on successful authentication
            if user.failed_login_attempts > 0:
                user.failed_login_attempts = 0
                user.account_locked_until = None
                self.db.commit()
            
            logger.info(f"User authenticated successfully: {username}")
            return user
            
        except Exception as e:
            logger.error(f"Error authenticating user: {str(e)}")
            return None
    
    def create_tokens(self, user: User) -> Token:
        """Create access and refresh tokens for user"""
        try:
            # Create token data
            token_data = {
                "sub": user.username,
                "user_id": user.id,
                "email": user.email
            }
            
            # Create tokens
            access_token = create_access_token(token_data)
            refresh_token = create_refresh_token(token_data)
            
            return Token(
                access_token=access_token,
                refresh_token=refresh_token,
                token_type="bearer",
                expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                user=UserResponse.from_orm(user)
            )
            
        except Exception as e:
            logger.error(f"Error creating tokens: {str(e)}")
            raise
    
    def refresh_access_token(self, refresh_token: str) -> Token:
        """Refresh access token using refresh token"""
        try:
            # Verify refresh token
            payload = verify_token(refresh_token, "refresh")
            if not payload:
                raise ValueError("Invalid refresh token")
            
            username = payload.get("sub")
            user = self.db.query(User).filter(User.username == username).first()
            
            if not user or not user.is_active:
                raise ValueError("User not found or inactive")
            
            # Create new tokens
            return self.create_tokens(user)
            
        except Exception as e:
            logger.error(f"Error refreshing token: {str(e)}")
            raise
    
    def get_current_user(self, token: str) -> Optional[User]:
        """Get current user from access token"""
        try:
            payload = verify_token(token, "access")
            if not payload:
                return None
            
            username = payload.get("sub")
            user = self.db.query(User).filter(User.username == username).first()
            
            return user if user and user.is_active else None
            
        except Exception as e:
            logger.error(f"Error getting current user: {str(e)}")
            return None
    
    def log_auth_attempt(
        self,
        user_id: Optional[int] = None,
        username_attempted: Optional[str] = None,
        auth_type: str = "password",
        auth_result: str = "failure",
        biometric_score: Optional[float] = None,
        biometric_threshold: Optional[float] = None,
        face_detected: Optional[bool] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        error_message: Optional[str] = None,
        processing_time_ms: Optional[int] = None,
        token_issued: bool = False
    ):
        """Log authentication attempt"""
        try:
            auth_log = AuthLog(
                user_id=user_id,
                username_attempted=username_attempted,
                auth_type=auth_type,
                auth_result=auth_result,
                biometric_score=biometric_score,
                biometric_threshold=biometric_threshold,
                face_detected=face_detected,
                ip_address=ip_address,
                user_agent=user_agent,
                error_message=error_message,
                processing_time_ms=processing_time_ms,
                token_issued=token_issued,
                timestamp=datetime.now()
            )
            
            self.db.add(auth_log)
            self.db.commit()
            
        except Exception as e:
            logger.error(f"Error logging auth attempt: {str(e)}")
            self.db.rollback()
    
    def get_user_auth_logs(self, user_id: int, limit: int = 50) -> list:
        """Get authentication logs for a user"""
        try:
            logs = self.db.query(AuthLog).filter(
                AuthLog.user_id == user_id
            ).order_by(AuthLog.timestamp.desc()).limit(limit).all()
            
            return [log.to_dict() for log in logs]
            
        except Exception as e:
            logger.error(f"Error getting auth logs: {str(e)}")
            return []
    
    def reset_password_request(self, email: str) -> bool:
        """Request password reset"""
        try:
            user = self.db.query(User).filter(User.email == email).first()
            if not user:
                return False
            
            # Generate reset token
            from app.utils.security import generate_reset_token
            reset_token = generate_reset_token()
            
            user.password_reset_token = reset_token
            user.password_reset_expires = datetime.now() + timedelta(hours=1)
            
            self.db.commit()
            
            # TODO: Send email with reset token
            logger.info(f"Password reset requested for: {email}")
            return True
            
        except Exception as e:
            logger.error(f"Error requesting password reset: {str(e)}")
            self.db.rollback()
            return False
    
    def reset_password(self, token: str, new_password: str) -> bool:
        """Reset password with token"""
        try:
            user = self.db.query(User).filter(
                User.password_reset_token == token,
                User.password_reset_expires > datetime.now()
            ).first()
            
            if not user:
                return False
            
            # Update password
            user.hashed_password = get_password_hash(new_password)
            user.password_reset_token = None
            user.password_reset_expires = None
            user.failed_login_attempts = 0
            user.account_locked_until = None
            
            self.db.commit()
            
            logger.info(f"Password reset successfully for user: {user.username}")
            return True
            
        except Exception as e:
            logger.error(f"Error resetting password: {str(e)}")
            self.db.rollback()
            return False
