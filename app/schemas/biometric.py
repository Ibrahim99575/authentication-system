"""
Biometric operation schemas
"""

from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime

class BiometricEnrollment(BaseModel):
    """Schema for biometric enrollment request"""
    video_data: str = Field(..., description="Base64 encoded video data")
    video_format: str = Field("mp4", description="Video format")
    replace_existing: bool = Field(False, description="Replace existing templates")

class BiometricVerification(BaseModel):
    """Schema for biometric verification request"""
    video_data: str = Field(..., description="Base64 encoded video data")
    video_format: str = Field("mp4", description="Video format")
    threshold: Optional[float] = Field(None, description="Custom threshold for verification")

class BiometricTemplate(BaseModel):
    """Schema for biometric template response"""
    id: int
    template_version: str
    quality_score: Optional[float]
    confidence_score: Optional[float]
    is_active: bool
    is_primary: bool
    created_at: Optional[datetime]
    verification_count: int
    last_used: Optional[datetime]

    class Config:
        from_attributes = True

class BiometricResult(BaseModel):
    """Schema for biometric operation result"""
    success: bool
    message: str
    similarity_score: Optional[float] = None
    threshold_used: Optional[float] = None
    face_detected: bool = False
    quality_score: Optional[float] = None
    processing_time_ms: Optional[int] = None
    template_id: Optional[int] = None

class BiometricStatus(BaseModel):
    """Schema for biometric enrollment status"""
    is_enrolled: bool
    total_templates: int
    active_templates: int
    primary_template_id: Optional[int]
    last_enrollment: Optional[datetime]
    enrollment_quality_avg: Optional[float]

class FaceDetectionResult(BaseModel):
    """Schema for face detection result"""
    faces_detected: int
    face_locations: List[List[int]] = []
    face_confidence: List[float] = []
    image_quality: Optional[float] = None
    processing_time_ms: Optional[int] = None
