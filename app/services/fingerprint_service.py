"""
Fingerprint processing service for biometric authentication
"""

import base64
import hashlib
import numpy as np
from typing import Optional, List, Tuple
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.biometric import BiometricTemplate, BiometricType
from app.schemas.biometric import BiometricResult
from app.utils.security import encrypt_data, decrypt_data
from app.utils.logger import get_logger

logger = get_logger(__name__)

class FingerprintService:
    """Service for fingerprint processing using Web API or hardware sensors"""
    
    def __init__(self, db: Session):
        self.db = db
        self.default_threshold = 0.75  # Fingerprint matching threshold
    
    def decode_fingerprint_data(self, fingerprint_data: str) -> bytes:
        """Decode base64 fingerprint data"""
        try:
            return base64.b64decode(fingerprint_data)
        except Exception as e:
            logger.error(f"Error decoding fingerprint data: {str(e)}")
            raise ValueError("Invalid fingerprint data format")
    
    def extract_fingerprint_features(self, fingerprint_bytes: bytes) -> Optional[np.ndarray]:
        """
        Extract fingerprint features from raw data
        In a real implementation, this would use specialized libraries like:
        - OpenCV for basic image processing
        - NIST Biometric Image Software (NBIS)
        - Commercial fingerprint SDKs
        
        For this demo, we'll simulate feature extraction
        """
        try:
            # Simulate feature extraction by creating a hash-based representation
            # In reality, this would extract minutiae points, ridge patterns, etc.
            hash_obj = hashlib.sha256(fingerprint_bytes)
            feature_hash = hash_obj.digest()
            
            # Convert to numpy array for similarity calculations
            features = np.frombuffer(feature_hash, dtype=np.uint8).astype(np.float64)
            
            # Normalize features
            features = features / 255.0
            
            logger.info(f"Extracted fingerprint features with shape: {features.shape}")
            return features
            
        except Exception as e:
            logger.error(f"Error extracting fingerprint features: {str(e)}")
            return None
    
    def calculate_fingerprint_similarity(self, features1: np.ndarray, features2: np.ndarray) -> float:
        """Calculate similarity between two fingerprint feature sets"""
        try:
            # Use cosine similarity for feature comparison
            # In real fingerprint matching, you'd use specialized algorithms
            dot_product = np.dot(features1, features2)
            norm1 = np.linalg.norm(features1)
            norm2 = np.linalg.norm(features2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            similarity = dot_product / (norm1 * norm2)
            
            # Ensure similarity is between 0 and 1
            similarity = max(0.0, min(1.0, similarity))
            
            return similarity
            
        except Exception as e:
            logger.error(f"Error calculating fingerprint similarity: {str(e)}")
            return 0.0
    
    def calculate_quality_score(self, fingerprint_bytes: bytes) -> float:
        """Calculate quality score for fingerprint data"""
        try:
            # Simple quality assessment based on data size and entropy
            data_size = len(fingerprint_bytes)
            entropy = self._calculate_entropy(fingerprint_bytes)
            
            # Normalize quality score
            size_score = min(1.0, data_size / 10000)  # Assume good quality at 10KB+
            entropy_score = min(1.0, entropy / 8)     # Max entropy is 8 bits
            
            quality = (size_score + entropy_score) / 2
            return quality
            
        except Exception as e:
            logger.error(f"Error calculating quality score: {str(e)}")
            return 0.5
    
    def _calculate_entropy(self, data: bytes) -> float:
        """Calculate entropy of data"""
        try:
            # Count byte frequencies
            byte_counts = np.bincount(np.frombuffer(data, dtype=np.uint8), minlength=256)
            probabilities = byte_counts / len(data)
            
            # Calculate entropy
            entropy = 0.0
            for p in probabilities:
                if p > 0:
                    entropy -= p * np.log2(p)
            
            return entropy
            
        except Exception as e:
            logger.error(f"Error calculating entropy: {str(e)}")
            return 0.0
    
    async def enroll_fingerprint(self, user_id: int, fingerprint_data: str) -> BiometricResult:
        """Enroll fingerprint template for user"""
        try:
            start_time = datetime.now()
            
            # Decode fingerprint data
            fingerprint_bytes = self.decode_fingerprint_data(fingerprint_data)
            
            # Extract features
            features = self.extract_fingerprint_features(fingerprint_bytes)
            if features is None:
                return BiometricResult(
                    success=False,
                    message="Failed to extract fingerprint features",
                    face_detected=False
                )
            
            # Calculate quality score
            quality_score = self.calculate_quality_score(fingerprint_bytes)
            
            # Check if user already has fingerprint templates
            existing_templates = self.db.query(BiometricTemplate).filter(
                BiometricTemplate.user_id == user_id,
                BiometricTemplate.biometric_type == BiometricType.FINGERPRINT,
                BiometricTemplate.is_active == True
            ).all()
            
            # Deactivate existing templates if replacing
            for template in existing_templates:
                template.is_active = False
                template.is_primary = False
            
            # Encrypt features for storage
            features_bytes = features.tobytes()
            encrypted_features = encrypt_data(features_bytes)
            
            # Create template hash
            template_hash = hashlib.sha256(features_bytes).hexdigest()
            
            # Create new template
            new_template = BiometricTemplate(
                user_id=user_id,
                biometric_type=BiometricType.FINGERPRINT,
                template_data=encrypted_features.encode(),
                template_hash=template_hash,
                template_version="1.0",
                quality_score=quality_score,
                confidence_score=0.95,  # High confidence for successful enrollment
                is_active=True,
                is_primary=True,
                enrollment_device="WebAPI",
                enrollment_ip="127.0.0.1"
            )
            
            self.db.add(new_template)
            self.db.commit()
            self.db.refresh(new_template)
            
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            logger.info(f"Fingerprint enrollment successful for user {user_id}")
            
            return BiometricResult(
                success=True,
                message="Fingerprint enrollment successful",
                face_detected=True,  # Using face_detected as generic "biometric_detected"
                quality_score=quality_score,
                processing_time_ms=processing_time,
                template_id=new_template.id
            )
            
        except Exception as e:
            logger.error(f"Fingerprint enrollment error: {str(e)}")
            return BiometricResult(
                success=False,
                message=f"Fingerprint enrollment failed: {str(e)}",
                face_detected=False
            )
    
    async def verify_fingerprint(self, user_id: int, fingerprint_data: str, threshold: Optional[float] = None) -> BiometricResult:
        """Verify fingerprint data against stored templates"""
        try:
            start_time = datetime.now()
            
            if threshold is None:
                threshold = self.default_threshold
            
            # Get user's active fingerprint templates
            templates = self.db.query(BiometricTemplate).filter(
                BiometricTemplate.user_id == user_id,
                BiometricTemplate.biometric_type == BiometricType.FINGERPRINT,
                BiometricTemplate.is_active == True
            ).all()
            
            if not templates:
                return BiometricResult(
                    success=False,
                    message="No fingerprint templates found for user",
                    face_detected=False,
                    threshold_used=threshold
                )
            
            # Decode and extract features from input
            fingerprint_bytes = self.decode_fingerprint_data(fingerprint_data)
            input_features = self.extract_fingerprint_features(fingerprint_bytes)
            
            if input_features is None:
                return BiometricResult(
                    success=False,
                    message="Failed to extract fingerprint features",
                    face_detected=False,
                    threshold_used=threshold
                )
            
            best_score = 0.0
            best_template = None
            
            # Compare with stored templates
            for template in templates:
                try:
                    # Decrypt stored template
                    stored_data = decrypt_data(template.template_data.decode())
                    stored_features = np.frombuffer(stored_data, dtype=np.float64)
                    
                    # Calculate similarity
                    similarity = self.calculate_fingerprint_similarity(input_features, stored_features)
                    
                    if similarity > best_score:
                        best_score = similarity
                        best_template = template
                        
                except Exception as e:
                    logger.error(f"Error comparing with template {template.id}: {str(e)}")
                    continue
            
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            # Check if best score meets threshold
            verification_success = best_score >= threshold
            
            if verification_success and best_template:
                # Update template usage statistics
                best_template.verification_count += 1
                best_template.last_used = datetime.now()
                self.db.commit()
                
                logger.info(f"Fingerprint verification successful for user {user_id}, score: {best_score}")
            else:
                logger.info(f"Fingerprint verification failed for user {user_id}, score: {best_score}, threshold: {threshold}")
            
            return BiometricResult(
                success=verification_success,
                message="Fingerprint verification successful" if verification_success else "Fingerprint verification failed",
                similarity_score=best_score,
                threshold_used=threshold,
                face_detected=True,  # Using as generic "biometric_detected"
                processing_time_ms=processing_time,
                template_id=best_template.id if best_template else None
            )
            
        except Exception as e:
            logger.error(f"Fingerprint verification error: {str(e)}")
            return BiometricResult(
                success=False,
                message=f"Fingerprint verification failed: {str(e)}",
                face_detected=False,
                threshold_used=threshold
            )
    
    def get_user_fingerprint_templates(self, user_id: int) -> List[BiometricTemplate]:
        """Get all active fingerprint templates for user"""
        return self.db.query(BiometricTemplate).filter(
            BiometricTemplate.user_id == user_id,
            BiometricTemplate.biometric_type == BiometricType.FINGERPRINT,
            BiometricTemplate.is_active == True
        ).all()
    
    def delete_user_fingerprint_templates(self, user_id: int) -> bool:
        """Delete all fingerprint templates for user"""
        try:
            templates = self.db.query(BiometricTemplate).filter(
                BiometricTemplate.user_id == user_id,
                BiometricTemplate.biometric_type == BiometricType.FINGERPRINT
            ).all()
            
            for template in templates:
                self.db.delete(template)
            
            self.db.commit()
            logger.info(f"Deleted fingerprint templates for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting fingerprint templates: {str(e)}")
            self.db.rollback()
            return False
