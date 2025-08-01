"""
Biometric template model for storing encrypted biometric data
"""

from sqlalchemy import Column, Integer, String, DateTime, LargeBinary, ForeignKey, Float, Boolean, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.database import Base

class BiometricType(enum.Enum):
    """Enum for biometric types"""
    FACE = "face"
    FINGERPRINT = "fingerprint"

class BiometricTemplate(Base):
    """Biometric template model for face recognition and fingerprint data"""
    
    __tablename__ = "biometric_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Biometric type
    biometric_type = Column(Enum(BiometricType), nullable=False, default=BiometricType.FACE)
    
    # Template data (encrypted)
    template_data = Column(LargeBinary, nullable=False)  # Encrypted face encoding or fingerprint minutiae
    template_hash = Column(String(64), nullable=False)   # Hash for quick comparison
    
    # Template metadata
    template_version = Column(String(10), default="1.0")
    quality_score = Column(Float, nullable=True)         # Template quality score
    confidence_score = Column(Float, nullable=True)      # Extraction confidence
    
    # Template status
    is_active = Column(Boolean, default=True)
    is_primary = Column(Boolean, default=False)          # Primary template for user
    
    # Creation metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Source information
    source_image_hash = Column(String(64), nullable=True)
    enrollment_device = Column(String(100), nullable=True)
    enrollment_ip = Column(String(45), nullable=True)
    
    # Usage statistics
    verification_count = Column(Integer, default=0)
    last_used = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="biometric_templates")
    
    def __repr__(self):
        return f"<BiometricTemplate(id={self.id}, user_id={self.user_id}, is_primary={self.is_primary})>"
    
    def to_dict(self):
        """Convert biometric template object to dictionary (excluding sensitive data)"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "biometric_type": self.biometric_type.value if self.biometric_type else None,
            "template_version": self.template_version,
            "quality_score": self.quality_score,
            "confidence_score": self.confidence_score,
            "is_active": self.is_active,
            "is_primary": self.is_primary,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "verification_count": self.verification_count,
            "last_used": self.last_used.isoformat() if self.last_used else None
        }
