"""
Simple biometric service using OpenCV for face detection
Note: This is a simplified version that doesn't include face recognition.
For full biometric functionality, install face_recognition library separately.
"""

import base64
import io
import numpy as np
import cv2
from PIL import Image
from typing import Optional, List, Tuple
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.biometric import BiometricTemplate
from app.models.user import User
from app.schemas.biometric import BiometricResult, FaceDetectionResult
from app.utils.security import encrypt_data, decrypt_data, hash_data
from app.utils.logger import get_logger
from app.config import settings

logger = get_logger(__name__)

class BiometricService:
    """Service for biometric operations using OpenCV"""
    
    def __init__(self, db: Session):
        self.db = db
        # Load OpenCV's pre-trained face detection model
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    
    def decode_video_data(self, video_data: str) -> bytes:
        """Decode base64 video data"""
        try:
            return base64.b64decode(video_data)
        except Exception as e:
            logger.error(f"Error decoding video data: {str(e)}")
            raise ValueError("Invalid video data format")
    
    def extract_frames(self, video_bytes: bytes) -> List[np.ndarray]:
        """Extract frames from video data"""
        try:
            # Create temporary file-like object
            temp_filename = f"temp_video_{datetime.now().timestamp()}.mp4"
            with open(temp_filename, 'wb') as f:
                f.write(video_bytes)
            
            cap = cv2.VideoCapture(temp_filename)
            frames = []
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Convert BGR to RGB
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frames.append(frame_rgb)
                
                # Limit number of frames to process
                if len(frames) >= 30:  # Process max 30 frames
                    break
            
            cap.release()
            
            # Clean up temporary file
            import os
            if os.path.exists(temp_filename):
                os.remove(temp_filename)
            
            return frames
            
        except Exception as e:
            logger.error(f"Error extracting frames: {str(e)}")
            return []
    
    def detect_faces(self, frame: np.ndarray) -> FaceDetectionResult:
        """Detect faces using OpenCV"""
        try:
            start_time = datetime.now()
            
            # Convert to grayscale for face detection
            gray = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)
            
            # Detect faces
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )
            
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            # Convert to face_recognition format (top, right, bottom, left)
            face_locations = []
            face_confidence = []
            
            for (x, y, w, h) in faces:
                # Convert from (x, y, w, h) to (top, right, bottom, left)
                top = y
                right = x + w
                bottom = y + h
                left = x
                face_locations.append([top, right, bottom, left])
                face_confidence.append(0.8)  # Placeholder confidence
            
            return FaceDetectionResult(
                faces_detected=len(faces),
                face_locations=face_locations,
                face_confidence=face_confidence,
                processing_time_ms=processing_time
            )
            
        except Exception as e:
            logger.error(f"Error detecting faces: {str(e)}")
            return FaceDetectionResult(faces_detected=0)
    
    def extract_face_encoding(self, frame: np.ndarray, face_location: List[int]) -> Optional[np.ndarray]:
        """Extract simple features from face region (placeholder for face recognition)"""
        try:
            top, right, bottom, left = face_location
            face_image = frame[top:bottom, left:right]
            
            # Simple feature extraction: resize face to fixed size and flatten
            face_resized = cv2.resize(face_image, (128, 128))
            face_gray = cv2.cvtColor(face_resized, cv2.COLOR_RGB2GRAY)
            
            # Use histogram of oriented gradients or simple pixel values
            features = face_gray.flatten().astype(np.float64)
            
            # Normalize features
            features = features / np.linalg.norm(features)
            
            return features
            
        except Exception as e:
            logger.error(f"Error extracting features: {str(e)}")
            return None
    
    def calculate_quality_score(self, frame: np.ndarray, face_location: List[int]) -> float:
        """Calculate quality score for a face"""
        try:
            top, right, bottom, left = face_location
            face_image = frame[top:bottom, left:right]
            
            # Simple quality metrics
            face_size = (bottom - top) * (right - left)
            image_size = frame.shape[0] * frame.shape[1]
            size_ratio = face_size / image_size
            
            # Blur detection using Laplacian variance
            gray = cv2.cvtColor(face_image, cv2.COLOR_RGB2GRAY)
            blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            # Combine metrics (simplified scoring)
            quality = min(1.0, (size_ratio * 10 + blur_score / 1000) / 2)
            return max(0.0, quality)
            
        except Exception as e:
            logger.error(f"Error calculating quality score: {str(e)}")
            return 0.0
    
    async def enroll_biometric(self, user_id: int, video_data: str, video_format: str) -> BiometricResult:
        """Enroll biometric template for user"""
        try:
            start_time = datetime.now()
            
            # Decode video data
            video_bytes = self.decode_video_data(video_data)
            
            # Extract frames
            frames = self.extract_frames(video_bytes)
            if not frames:
                return BiometricResult(
                    success=False,
                    message="No frames could be extracted from video",
                    face_detected=False
                )
            
            best_encoding = None
            best_quality = 0.0
            face_detected = False
            
            # Process frames to find best face encoding
            for frame in frames:
                face_result = self.detect_faces(frame)
                
                if face_result.faces_detected > 0:
                    face_detected = True
                    face_location = face_result.face_locations[0]
                    
                    # Extract encoding
                    encoding = self.extract_face_encoding(frame, face_location)
                    if encoding is not None:
                        quality = self.calculate_quality_score(frame, face_location)
                        
                        if quality > best_quality:
                            best_quality = quality
                            best_encoding = encoding
            
            if best_encoding is None:
                return BiometricResult(
                    success=False,
                    message="No valid face encoding could be extracted",
                    face_detected=face_detected,
                    quality_score=best_quality
                )
            
            # Encrypt and store template
            template_data = encrypt_data(best_encoding.tobytes())
            template_hash = hash_data(best_encoding.tobytes())
            
            # Create biometric template
            template = BiometricTemplate(
                user_id=user_id,
                template_data=template_data.encode(),
                template_hash=template_hash,
                quality_score=best_quality,
                confidence_score=0.9,  # Placeholder
                is_active=True,
                is_primary=True,
                source_image_hash=hash_data(video_bytes)
            )
            
            # Deactivate existing primary templates
            self.db.query(BiometricTemplate).filter(
                BiometricTemplate.user_id == user_id,
                BiometricTemplate.is_primary == True
            ).update({"is_primary": False})
            
            self.db.add(template)
            self.db.commit()
            
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            return BiometricResult(
                success=True,
                message="Biometric template enrolled successfully",
                face_detected=True,
                quality_score=best_quality,
                processing_time_ms=processing_time,
                template_id=template.id
            )
            
        except Exception as e:
            logger.error(f"Error enrolling biometric: {str(e)}")
            self.db.rollback()
            return BiometricResult(
                success=False,
                message=f"Enrollment failed: {str(e)}",
                face_detected=False
            )
    
    def calculate_similarity(self, features1: np.ndarray, features2: np.ndarray) -> float:
        """Calculate similarity between two feature vectors"""
        try:
            # Use cosine similarity
            dot_product = np.dot(features1, features2)
            norm1 = np.linalg.norm(features1)
            norm2 = np.linalg.norm(features2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            similarity = dot_product / (norm1 * norm2)
            return max(0.0, similarity)  # Ensure non-negative
            
        except Exception as e:
            logger.error(f"Error calculating similarity: {str(e)}")
            return 0.0
    
    async def verify_biometric(self, user_id: int, video_data: str, video_format: str, threshold: Optional[float] = None) -> BiometricResult:
        """Verify biometric data against stored templates"""
        try:
            start_time = datetime.now()
            
            if threshold is None:
                threshold = settings.BIOMETRIC_THRESHOLD
            
            # Get user's active templates
            templates = self.db.query(BiometricTemplate).filter(
                BiometricTemplate.user_id == user_id,
                BiometricTemplate.is_active == True
            ).all()
            
            if not templates:
                return BiometricResult(
                    success=False,
                    message="No biometric templates found for user",
                    threshold_used=threshold
                )
            
            # Decode video data
            video_bytes = self.decode_video_data(video_data)
            
            # Extract frames
            frames = self.extract_frames(video_bytes)
            if not frames:
                return BiometricResult(
                    success=False,
                    message="No frames could be extracted from video",
                    face_detected=False,
                    threshold_used=threshold
                )
            
            best_score = 0.0
            face_detected = False
            
            # Process frames to find best match
            for frame in frames:
                face_result = self.detect_faces(frame)
                
                if face_result.faces_detected > 0:
                    face_detected = True
                    face_location = face_result.face_locations[0]
                    
                    # Extract encoding
                    encoding = self.extract_face_encoding(frame, face_location)
                    if encoding is not None:
                        
                        # Compare with stored templates
                        for template in templates:
                            try:
                                # Decrypt stored template
                                stored_data = decrypt_data(template.template_data.decode())
                                stored_encoding = np.frombuffer(stored_data, dtype=np.float64)
                                
                                # Calculate similarity using cosine similarity
                                similarity = self.calculate_similarity(stored_encoding, encoding)
                                
                                if similarity > best_score:
                                    best_score = similarity
                                    
                                    # Update template usage
                                    template.verification_count += 1
                                    template.last_used = datetime.now()
                                    
                            except Exception as e:
                                logger.error(f"Error comparing with template {template.id}: {str(e)}")
                                continue
            
            self.db.commit()
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            success = best_score >= threshold
            
            return BiometricResult(
                success=success,
                message="Verification successful" if success else "Verification failed",
                similarity_score=best_score,
                threshold_used=threshold,
                face_detected=face_detected,
                processing_time_ms=processing_time
            )
            
        except Exception as e:
            logger.error(f"Error verifying biometric: {str(e)}")
            return BiometricResult(
                success=False,
                message=f"Verification failed: {str(e)}",
                face_detected=False,
                threshold_used=threshold
            )
    
    def get_user_templates(self, user_id: int) -> List[BiometricTemplate]:
        """Get all biometric templates for a user"""
        return self.db.query(BiometricTemplate).filter(
            BiometricTemplate.user_id == user_id
        ).all()
    
    def delete_template(self, template_id: int, user_id: int) -> bool:
        """Delete a biometric template"""
        try:
            template = self.db.query(BiometricTemplate).filter(
                BiometricTemplate.id == template_id,
                BiometricTemplate.user_id == user_id
            ).first()
            
            if template:
                self.db.delete(template)
                self.db.commit()
                return True
            return False
            
        except Exception as e:
            logger.error(f"Error deleting template: {str(e)}")
            self.db.rollback()
            return False
