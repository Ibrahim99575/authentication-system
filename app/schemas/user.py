"""
User profile schemas
"""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

class UserProfile(BaseModel):
    """Schema for user profile"""
    id: int
    username: str
    email: str
    full_name: Optional[str]
    phone: Optional[str]
    avatar_url: Optional[str]
    is_verified: bool
    is_enrolled: bool
    created_at: Optional[datetime]
    last_login: Optional[datetime]

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    """Schema for updating user profile"""
    full_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    avatar_url: Optional[str] = Field(None, max_length=255)

class ChangePassword(BaseModel):
    """Schema for changing password"""
    current_password: str
    new_password: str = Field(..., min_length=8)

class UserStats(BaseModel):
    """Schema for user statistics"""
    total_logins: int
    successful_logins: int
    failed_logins: int
    last_login: Optional[datetime]
    account_age_days: int
    biometric_enrollments: int
