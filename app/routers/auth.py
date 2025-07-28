"""
Authentication API endpoints
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.database import get_db
from app.schemas.auth import (
    UserCreate, UserLogin, UserResponse, Token, BiometricLoginRequest,
    BiometricRegistrationRequest, AuthResponse, RefreshTokenRequest
)
from app.services.auth_service import AuthService
from app.services.biometric_service import BiometricService
from app.services.user_service import UserService
from app.utils.security import create_access_token, verify_token
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

@router.post("/register", response_model=AuthResponse)
async def register_user(
    user_data: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Register a new user with username/email and password"""
    try:
        auth_service = AuthService(db)
        user_service = UserService(db)
        
        # Check if user already exists
        if user_service.get_user_by_username(user_data.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        if user_service.get_user_by_email(user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        user = auth_service.create_user(user_data)
        
        # Log registration
        auth_service.log_auth_attempt(
            user_id=user.id,
            username_attempted=user.username,
            auth_type="registration",
            auth_result="success",
            ip_address="127.0.0.1"  # TODO: Get real IP
        )
        
        return AuthResponse(
            success=True,
            message="User registered successfully",
            user=UserResponse.from_orm(user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )

@router.post("/register-biometric", response_model=AuthResponse)
async def register_user_with_biometric(
    registration_data: BiometricRegistrationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Register a new user with biometric data"""
    try:
        auth_service = AuthService(db)
        user_service = UserService(db)
        biometric_service = BiometricService(db)
        
        # Check if user already exists
        if user_service.get_user_by_username(registration_data.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        # Create user data
        user_data = UserCreate(
            username=registration_data.username,
            email=registration_data.email,
            password=registration_data.password,
            full_name=registration_data.full_name,
            phone=registration_data.phone
        )
        
        # Create user
        user = auth_service.create_user(user_data)
        
        # Process biometric enrollment
        enrollment_result = await biometric_service.enroll_biometric(
            user.id,
            registration_data.video_data,
            registration_data.video_format
        )
        
        if enrollment_result.success:
            user.is_enrolled = True
            db.commit()
        
        # Generate tokens
        token = auth_service.create_tokens(user)
        
        return AuthResponse(
            success=True,
            message="User registered with biometric data successfully",
            user=UserResponse.from_orm(user),
            token=token
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Biometric registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Biometric registration failed"
        )

@router.post("/login", response_model=AuthResponse)
async def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login with username and password"""
    try:
        auth_service = AuthService(db)
        start_time = datetime.now()
        
        # Authenticate user
        user = auth_service.authenticate_user(form_data.username, form_data.password)
        processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
        
        if not user:
            # Log failed attempt
            auth_service.log_auth_attempt(
                username_attempted=form_data.username,
                auth_type="password",
                auth_result="failure",
                processing_time_ms=processing_time,
                ip_address="127.0.0.1"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password"
            )
        
        # Generate tokens
        token = auth_service.create_tokens(user)
        
        # Update last login
        user.last_login = datetime.now()
        db.commit()
        
        # Log successful attempt
        auth_service.log_auth_attempt(
            user_id=user.id,
            username_attempted=user.username,
            auth_type="password",
            auth_result="success",
            processing_time_ms=processing_time,
            ip_address="127.0.0.1",
            token_issued=True
        )
        
        return AuthResponse(
            success=True,
            message="Login successful",
            user=UserResponse.from_orm(user),
            token=token,
            processing_time_ms=processing_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

@router.post("/login-biometric", response_model=AuthResponse)
async def login_with_biometric(
    login_data: BiometricLoginRequest,
    db: Session = Depends(get_db)
):
    """Login with biometric verification and password"""
    try:
        auth_service = AuthService(db)
        biometric_service = BiometricService(db)
        start_time = datetime.now()
        
        # First, verify password
        user = auth_service.authenticate_user(login_data.username, login_data.password)
        if not user:
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            auth_service.log_auth_attempt(
                username_attempted=login_data.username,
                auth_type="combined",
                auth_result="failure",
                processing_time_ms=processing_time,
                error_message="Invalid credentials"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Verify biometric data
        verification_result = await biometric_service.verify_biometric(
            user.id,
            login_data.video_data,
            login_data.video_format
        )
        
        processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
        
        if not verification_result.success:
            # Log failed biometric verification
            auth_service.log_auth_attempt(
                user_id=user.id,
                username_attempted=user.username,
                auth_type="combined",
                auth_result="failure",
                biometric_score=verification_result.similarity_score,
                face_detected=verification_result.face_detected,
                processing_time_ms=processing_time,
                error_message="Biometric verification failed"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Biometric verification failed"
            )
        
        # Generate tokens
        token = auth_service.create_tokens(user)
        
        # Update last login
        user.last_login = datetime.now()
        db.commit()
        
        # Log successful attempt
        auth_service.log_auth_attempt(
            user_id=user.id,
            username_attempted=user.username,
            auth_type="combined",
            auth_result="success",
            biometric_score=verification_result.similarity_score,
            face_detected=verification_result.face_detected,
            processing_time_ms=processing_time,
            token_issued=True
        )
        
        return AuthResponse(
            success=True,
            message="Biometric login successful",
            user=UserResponse.from_orm(user),
            token=token,
            biometric_score=verification_result.similarity_score,
            processing_time_ms=processing_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Biometric login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Biometric login failed"
        )

@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token"""
    try:
        auth_service = AuthService(db)
        token = auth_service.refresh_access_token(refresh_data.refresh_token)
        return token
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

@router.get("/verify", response_model=UserResponse)
async def verify_token_endpoint(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Verify current access token and return user info"""
    try:
        auth_service = AuthService(db)
        user = auth_service.get_current_user(token)
        return UserResponse.from_orm(user)
    except Exception as e:
        logger.error(f"Token verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

@router.post("/logout")
async def logout(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Logout user and invalidate token"""
    try:
        # TODO: Implement token blacklisting
        return {"message": "Logout successful"}
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )
