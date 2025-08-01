"""
Biometric operations API endpoints
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.biometric import (
    BiometricEnrollment, BiometricVerification, BiometricTemplate,
    BiometricResult, BiometricStatus
)
from app.services.biometric_service import BiometricService
from app.services.fingerprint_service import FingerprintService
from app.services.auth_service import AuthService
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()

# Import OAuth2 scheme from auth router (should be shared)
from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Dependency to get current user
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Get current authenticated user"""
    auth_service = AuthService(db)
    user = auth_service.get_current_user(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    return user

@router.post("/enroll", response_model=BiometricResult)
async def enroll_biometric(
    enrollment_data: BiometricEnrollment,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enroll biometric template for current user"""
    try:
        # If replace_existing is True, deactivate existing templates
        if enrollment_data.replace_existing:
            biometric_service = BiometricService(db)
            fingerprint_service = FingerprintService(db)
            
            # Deactivate existing templates of the same type
            if enrollment_data.biometric_type == "face":
                templates = biometric_service.get_user_templates(current_user.id)
                for template in templates:
                    template.is_active = False
            elif enrollment_data.biometric_type == "fingerprint":
                fingerprint_service.delete_user_fingerprint_templates(current_user.id)
            
            db.commit()
        
        if enrollment_data.biometric_type == "face":
            # Handle face enrollment
            if not enrollment_data.video_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Video data required for face enrollment"
                )
            
            biometric_service = BiometricService(db)
            result = await biometric_service.enroll_biometric(
                current_user.id,
                enrollment_data.video_data,
                enrollment_data.video_format
            )
        
        elif enrollment_data.biometric_type == "fingerprint":
            # Handle fingerprint enrollment
            if not enrollment_data.fingerprint_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Fingerprint data required for fingerprint enrollment"
                )
            
            fingerprint_service = FingerprintService(db)
            result = await fingerprint_service.enroll_fingerprint(
                current_user.id,
                enrollment_data.fingerprint_data
            )
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported biometric type. Supported: face, fingerprint"
            )
        
        if result.success:
            # Update user enrollment status
            current_user.is_enrolled = True
            db.commit()
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error enrolling biometric: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Biometric enrollment failed"
        )

@router.post("/verify", response_model=BiometricResult)
async def verify_biometric(
    verification_data: BiometricVerification,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify biometric data for current user"""
    try:
        if not current_user.is_enrolled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User has no biometric templates enrolled"
            )
        
        if verification_data.biometric_type == "face":
            # Handle face verification
            if not verification_data.video_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Video data required for face verification"
                )
            
            biometric_service = BiometricService(db)
            result = await biometric_service.verify_biometric(
                current_user.id,
                verification_data.video_data,
                verification_data.video_format,
                verification_data.threshold
            )
        
        elif verification_data.biometric_type == "fingerprint":
            # Handle fingerprint verification
            if not verification_data.fingerprint_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Fingerprint data required for fingerprint verification"
                )
            
            fingerprint_service = FingerprintService(db)
            result = await fingerprint_service.verify_fingerprint(
                current_user.id,
                verification_data.fingerprint_data,
                verification_data.threshold
            )
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported biometric type. Supported: face, fingerprint"
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying biometric: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Biometric verification failed"
        )

@router.get("/status", response_model=BiometricStatus)
async def get_biometric_status(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get biometric enrollment status for current user"""
    try:
        biometric_service = BiometricService(db)
        templates = biometric_service.get_user_templates(current_user.id)
        
        active_templates = [t for t in templates if t.is_active]
        primary_template = next((t for t in active_templates if t.is_primary), None)
        
        # Calculate average quality score
        quality_scores = [t.quality_score for t in active_templates if t.quality_score]
        avg_quality = sum(quality_scores) / len(quality_scores) if quality_scores else None
        
        # Get last enrollment date
        last_enrollment = max(
            (t.created_at for t in templates),
            default=None
        )
        
        return BiometricStatus(
            is_enrolled=current_user.is_enrolled,
            total_templates=len(templates),
            active_templates=len(active_templates),
            primary_template_id=primary_template.id if primary_template else None,
            last_enrollment=last_enrollment,
            enrollment_quality_avg=avg_quality
        )
        
    except Exception as e:
        logger.error(f"Error getting biometric status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get biometric status"
        )

@router.get("/templates", response_model=List[BiometricTemplate])
async def get_user_templates(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all biometric templates for current user"""
    try:
        biometric_service = BiometricService(db)
        templates = biometric_service.get_user_templates(current_user.id)
        
        return [BiometricTemplate.from_orm(template) for template in templates]
        
    except Exception as e:
        logger.error(f"Error getting user templates: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get biometric templates"
        )

@router.delete("/templates/{template_id}")
async def delete_biometric_template(
    template_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a specific biometric template"""
    try:
        biometric_service = BiometricService(db)
        
        success = biometric_service.delete_template(template_id, current_user.id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found or access denied"
            )
        
        # Check if user still has active templates
        remaining_templates = biometric_service.get_user_templates(current_user.id)
        active_templates = [t for t in remaining_templates if t.is_active]
        
        if not active_templates:
            current_user.is_enrolled = False
            db.commit()
        
        return {"message": "Template deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting template: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete template"
        )

@router.post("/templates/{template_id}/set-primary")
async def set_primary_template(
    template_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Set a template as primary"""
    try:
        biometric_service = BiometricService(db)
        templates = biometric_service.get_user_templates(current_user.id)
        
        # Find the target template
        target_template = None
        for template in templates:
            if template.id == template_id and template.user_id == current_user.id:
                target_template = template
                break
        
        if not target_template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        if not target_template.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot set inactive template as primary"
            )
        
        # Remove primary status from all templates
        for template in templates:
            template.is_primary = False
        
        # Set target template as primary
        target_template.is_primary = True
        
        db.commit()
        
        return {"message": "Primary template updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting primary template: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to set primary template"
        )
