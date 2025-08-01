# API Documentation

## Overview

The Biometric Authentication System provides secure user authentication using a combination of traditional password verification and biometric data (face detection/verification).

## Base URL
```
http://localhost:8000
```

## Authentication Endpoints

### 1. User Registration
**POST** `/auth/register`

Register a new user with username, email, and password.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "full_name": "John Doe",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "is_active": true,
    "is_verified": false,
    "is_enrolled": false,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### 2. Biometric Registration
**POST** `/auth/register-biometric`

Register a new user with biometric data (video + password).

**Request Body:**
```json
{
  "username": "jane_doe",
  "email": "jane@example.com",
  "password": "securepassword123",
  "full_name": "Jane Doe",
  "phone": "+1234567890",
  "video_data": "base64_encoded_video_data",
  "video_format": "mp4"
}
```

### 3. Password Login
**POST** `/auth/login`

Standard login with username/email and password.

**Request Body (Form Data):**
```
username: john_doe
password: securepassword123
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {...},
  "token": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "token_type": "bearer",
    "expires_in": 1800
  },
  "processing_time_ms": 45
}
```

### 4. Biometric Login (Face Recognition)
**POST** `/auth/login-biometric`

Secure login using password + face biometric verification.

**Request Body:**
```json
{
  "username": "jane_doe",
  "password": "securepassword123",
  "biometric_type": "face",
  "video_data": "base64_encoded_video_data",
  "video_format": "mp4"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Biometric login successful",
  "user": {...},
  "token": {...},
  "biometric_score": 0.87,
  "processing_time_ms": 234
}
```

### 5. Fingerprint Login
**POST** `/auth/login-fingerprint`

Secure login using password + fingerprint verification.

**Request Body:**
```json
{
  "username": "jane_doe",
  "password": "securepassword123",
  "fingerprint_data": "base64_encoded_fingerprint_data"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Fingerprint login successful",
  "user": {...},
  "token": {...},
  "biometric_score": 0.91,
  "processing_time_ms": 156
}
```

### 6. Token Refresh
**POST** `/auth/refresh`

Refresh an expired access token using a refresh token.

**Request Body:**
```json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### 6. Token Verification
**GET** `/auth/verify`

Verify the current access token and get user information.

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

## User Management Endpoints

### 1. Get User Profile
**GET** `/users/profile`

Get the current user's profile information.

**Headers:**
```
Authorization: Bearer {access_token}
```

### 2. Update User Profile
**PUT** `/users/profile`

Update user profile information.

**Request Body:**
```json
{
  "full_name": "John Smith",
  "phone": "+1987654321",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

### 3. Change Password
**POST** `/users/change-password`

Change the user's password.

**Request Body:**
```json
{
  "current_password": "oldpassword123",
  "new_password": "newpassword456"
}
```

### 4. Get User Statistics
**GET** `/users/stats`

Get authentication statistics for the current user.

**Response:**
```json
{
  "total_logins": 15,
  "successful_logins": 14,
  "failed_logins": 1,
  "last_login": "2024-01-01T12:00:00Z",
  "account_age_days": 30,
  "biometric_enrollments": 2
}
```

## Biometric Operations

### 1. Enroll Face Biometric Template
**POST** `/biometric/enroll`

Enroll a new face biometric template for the authenticated user.

**Request Body:**
```json
{
  "biometric_type": "face",
  "video_data": "base64_encoded_video_data",
  "video_format": "mp4",
  "replace_existing": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Face biometric template enrolled successfully",
  "face_detected": true,
  "quality_score": 0.92,
  "processing_time_ms": 187,
  "template_id": 5
}
```

### 2. Enroll Fingerprint Template
**POST** `/biometric/enroll`

Enroll a new fingerprint template for the authenticated user.

**Request Body:**
```json
{
  "biometric_type": "fingerprint",
  "fingerprint_data": "base64_encoded_fingerprint_data",
  "replace_existing": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Fingerprint template enrolled successfully",
  "face_detected": true,
  "quality_score": 0.89,
  "processing_time_ms": 143,
  "template_id": 6
}
```

### 3. Verify Face Biometric Data
**POST** `/biometric/verify`

Verify face biometric data against stored templates.

**Request Body:**
```json
{
  "biometric_type": "face",
  "video_data": "base64_encoded_video_data",
  "video_format": "mp4",
  "threshold": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "message": "Face verification successful",
  "similarity_score": 0.87,
  "threshold_used": 0.7,
  "face_detected": true,
  "processing_time_ms": 234
}
```

### 4. Verify Fingerprint Data
**POST** `/biometric/verify`

Verify fingerprint data against stored templates.

**Request Body:**
```json
{
  "biometric_type": "fingerprint",
  "fingerprint_data": "base64_encoded_fingerprint_data",
  "threshold": 0.75
}
```

**Response:**
```json
{
  "success": true,
  "message": "Fingerprint verification successful",
  "similarity_score": 0.91,
  "threshold_used": 0.75,
  "face_detected": true,
  "processing_time_ms": 156
}
```

### 5. Get Biometric Status
**GET** `/biometric/status`

Get the current biometric enrollment status.

**Response:**
```json
{
  "is_enrolled": true,
  "total_templates": 2,
  "active_templates": 2,
  "primary_template_id": 5,
  "last_enrollment": "2024-01-01T10:00:00Z",
  "enrollment_quality_avg": 0.89
}
```

### 4. List User Templates
**GET** `/biometric/templates`

Get all biometric templates for the current user.

### 5. Delete Template
**DELETE** `/biometric/templates/{template_id}`

Delete a specific biometric template.

### 6. Set Primary Template
**POST** `/biometric/templates/{template_id}/set-primary`

Set a template as the primary template for verification.

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "detail": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid token or credentials)
- `404` - Not Found
- `422` - Unprocessable Entity (validation error)
- `500` - Internal Server Error

## Authentication Flow

1. **Registration**: Register user with `/auth/register` or `/auth/register-biometric`
2. **Login**: Authenticate with `/auth/login` or `/auth/login-biometric`
3. **Use Token**: Include the access token in the `Authorization` header for protected endpoints
4. **Refresh**: Use `/auth/refresh` when the access token expires

## Video Data Format

Biometric endpoints expect video data to be:
- Base64 encoded
- Common formats: MP4, AVI, MOV, WebM
- Maximum size: 10MB
- Duration: 2-10 seconds recommended
- Resolution: 480p or higher recommended
- Face should be clearly visible and well-lit

## Security Considerations

- All biometric templates are encrypted before storage
- Passwords are hashed using bcrypt with salt
- JWT tokens have configurable expiration times
- Rate limiting is implemented to prevent abuse
- HTTPS should be used in production environments
