"""
Authentication log model for tracking authentication attempts
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class AuthLog(Base):
    """Authentication log model for tracking login attempts"""
    
    __tablename__ = "auth_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Can be null for failed attempts
    
    # Authentication details
    username_attempted = Column(String(50), nullable=True)
    auth_type = Column(String(20), nullable=False)  # 'biometric', 'password', 'combined'
    auth_result = Column(String(20), nullable=False)  # 'success', 'failure', 'error'
    
    # Biometric-specific data
    biometric_score = Column(Float, nullable=True)    # Similarity score
    biometric_threshold = Column(Float, nullable=True)
    face_detected = Column(Boolean, nullable=True)
    
    # Request metadata
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    device_fingerprint = Column(String(64), nullable=True)
    
    # Error information
    error_code = Column(String(50), nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Timing information
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    processing_time_ms = Column(Integer, nullable=True)
    
    # Security flags
    is_suspicious = Column(Boolean, default=False)
    risk_score = Column(Float, nullable=True)
    
    # Session information
    session_id = Column(String(64), nullable=True)
    token_issued = Column(Boolean, default=False)
    
    # Relationships
    user = relationship("User", back_populates="auth_logs")
    
    def __repr__(self):
        return f"<AuthLog(id={self.id}, user_id={self.user_id}, result='{self.auth_result}')>"
    
    def to_dict(self):
        """Convert auth log object to dictionary"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "username_attempted": self.username_attempted,
            "auth_type": self.auth_type,
            "auth_result": self.auth_result,
            "biometric_score": self.biometric_score,
            "face_detected": self.face_detected,
            "ip_address": self.ip_address,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "processing_time_ms": self.processing_time_ms,
            "is_suspicious": self.is_suspicious,
            "risk_score": self.risk_score,
            "token_issued": self.token_issued
        }
