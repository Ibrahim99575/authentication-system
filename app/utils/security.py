"""
Security utilities for authentication and encryption
"""

import os
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Union, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
import base64
import secrets

from app.config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Encryption key for biometric data
ENCRYPTION_KEY = base64.urlsafe_b64encode(hashlib.sha256(settings.SECRET_KEY.encode()).digest())
cipher_suite = Fernet(ENCRYPTION_KEY)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: Dict[str, Any]) -> str:
    """Create a JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(token: str, token_type: str = "access") -> Optional[Dict[str, Any]]:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        # Check token type
        if payload.get("type") != token_type:
            return None
            
        # Check expiration
        exp = payload.get("exp")
        if exp and datetime.utcfromtimestamp(exp) < datetime.utcnow():
            return None
            
        return payload
    except JWTError:
        return None

def encrypt_data(data: Union[str, bytes]) -> str:
    """Encrypt sensitive data"""
    if isinstance(data, str):
        data = data.encode()
    
    encrypted_data = cipher_suite.encrypt(data)
    return base64.urlsafe_b64encode(encrypted_data).decode()

def decrypt_data(encrypted_data: str) -> bytes:
    """Decrypt sensitive data"""
    encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
    return cipher_suite.decrypt(encrypted_bytes)

def generate_reset_token() -> str:
    """Generate a secure reset token"""
    return secrets.token_urlsafe(32)

def hash_data(data: Union[str, bytes]) -> str:
    """Create a SHA-256 hash of data"""
    if isinstance(data, str):
        data = data.encode()
    return hashlib.sha256(data).hexdigest()

def generate_device_fingerprint(user_agent: str, ip_address: str) -> str:
    """Generate a device fingerprint"""
    fingerprint_data = f"{user_agent}:{ip_address}:{settings.SECRET_KEY}"
    return hash_data(fingerprint_data)

def is_strong_password(password: str) -> bool:
    """Check if password meets strength requirements"""
    if len(password) < 8:
        return False
    
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
    
    return sum([has_upper, has_lower, has_digit, has_special]) >= 3
