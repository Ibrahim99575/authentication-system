"""
Authentication schemas for API requests and responses
"""

from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

class UserCreate(BaseModel):
    """Schema for user registration"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)

class UserLogin(BaseModel):
    """Schema for basic user login"""
    username: str
    password: str

class BiometricLoginRequest(BaseModel):
    """Schema for biometric login request"""
    username: str
    password: str
    video_data: str = Field(..., description="Base64 encoded video data")
    video_format: str = Field("mp4", description="Video format")

class BiometricRegistrationRequest(BaseModel):
    """Schema for biometric registration request"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    video_data: str = Field(..., description="Base64 encoded video data")
    video_format: str = Field("mp4", description="Video format")

class UserResponse(BaseModel):
    """Schema for user response"""
    id: int
    username: str
    email: str
    full_name: Optional[str]
    is_active: bool
    is_verified: bool
    is_enrolled: bool
    created_at: Optional[datetime]
    last_login: Optional[datetime]
    phone: Optional[str]
    avatar_url: Optional[str]

    class Config:
        from_attributes = True

class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

class TokenData(BaseModel):
    """Schema for token data"""
    username: Optional[str] = None
    user_id: Optional[int] = None
    scopes: List[str] = []

class RefreshTokenRequest(BaseModel):
    """Schema for refresh token request"""
    refresh_token: str

class PasswordResetRequest(BaseModel):
    """Schema for password reset request"""
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    """Schema for password reset confirmation"""
    token: str
    new_password: str = Field(..., min_length=8)

class AuthResponse(BaseModel):
    """Schema for authentication response"""
    success: bool
    message: str
    user: Optional[UserResponse] = None
    token: Optional[Token] = None
    biometric_score: Optional[float] = None
    processing_time_ms: Optional[int] = None
