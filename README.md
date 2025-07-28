# Biometric Authentication System

## Complete Backend Solution for Website Authentication

This is a comprehensive biometric authentication system backend that combines traditional password authentication with facial recognition for enhanced security. The system provides a RESTful API that can be easily integrated with any frontend framework.

## 🚀 Features

- **Dual Authentication**: Password + Biometric (face recognition) verification
- **JWT Token Management**: Secure access and refresh tokens
- **User Management**: Registration, profile management, password changes
- **Biometric Enrollment**: Video-based face template storage with encryption
- **Secure Storage**: Encrypted biometric templates and hashed passwords
- **Comprehensive Logging**: Detailed audit trails for all authentication attempts
- **Production Ready**: Docker deployment, monitoring, and security hardening
- **Framework Agnostic**: RESTful API works with React, Vue, Angular, or any frontend

## 🛠️ Technology Stack

- **Backend**: FastAPI (Python 3.11+)
- **Database**: SQLAlchemy with SQLite/PostgreSQL support
- **Authentication**: JWT tokens with bcrypt password hashing
- **Computer Vision**: OpenCV for face detection and feature extraction
- **Security**: Cryptography library for biometric data encryption
- **Server**: Uvicorn ASGI server with production deployment options

## 📁 Project Structure

```
D:\Python/
├── main.py                     # Application entry point
├── requirements.txt            # Python dependencies
├── .env.example               # Environment variables template
├── README.md                  # This file
├── API_DOCUMENTATION.md       # Complete API reference
├── FRONTEND_INTEGRATION.md    # Frontend integration guide
├── PRODUCTION_DEPLOYMENT.md   # Production deployment guide
├── example_client.py          # Python client example
├── app/
│   ├── __init__.py
│   ├── config.py             # Application configuration
│   ├── database.py           # Database connection and session management
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py          # User model with authentication fields
│   │   ├── biometric.py     # Biometric template storage model
│   │   └── auth_log.py      # Authentication attempt logging
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py          # User Pydantic schemas
│   │   ├── auth.py          # Authentication request/response schemas
│   │   └── biometric.py     # Biometric operation schemas
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── users.py         # User management endpoints
│   │   └── biometric.py     # Biometric enrollment/verification
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py  # Authentication business logic
│   │   ├── user_service.py  # User management business logic
│   │   └── biometric_service.py # Biometric processing logic
│   └── utils/
│       ├── __init__.py
│       ├── security.py      # JWT tokens, password hashing
│       └── logging.py       # Centralized logging configuration
├── scripts/
│   └── init_db.py          # Database initialization script
└── tests/
    ├── __init__.py
    ├── test_auth.py        # Authentication endpoint tests
    ├── test_users.py       # User management tests
    └── test_biometric.py   # Biometric functionality tests
```

## 🔧 Quick Start

### 1. Installation

```bash
# Clone or download the project
cd D:\Python

# Install dependencies
pip install -r requirements.txt

# Initialize the database
python scripts/init_db.py
```

### 2. Running the Server

```bash
# Start the development server
python main.py

# Or using uvicorn directly
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The server will start at `http://127.0.0.1:8000`

### 3. API Documentation

Access the interactive API documentation:
- **Swagger UI**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc

## 🔐 Authentication Flow

### Standard Login
1. User provides username/email and password
2. Server validates credentials
3. Returns JWT access token and refresh token

### Biometric Login
1. User provides username/email and password
2. User records a 5-second video of their face
3. Server validates password AND biometric data
4. Returns JWT tokens if both validations pass

### Biometric Enrollment
1. User must be authenticated
2. User records a video for biometric template creation
3. Server extracts facial features and stores encrypted template

## 📡 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - Standard password login
- `POST /auth/login-biometric` - Password + biometric login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user

### User Management
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `POST /users/change-password` - Change password
- `DELETE /users/profile` - Delete user account

### Biometric Operations
- `POST /biometric/enroll` - Enroll biometric template
- `POST /biometric/verify` - Verify biometric data
- `GET /biometric/status` - Check enrollment status
- `DELETE /biometric/template` - Remove biometric template

## 🎯 Frontend Integration

The system provides a RESTful API that works with any frontend framework. See `FRONTEND_INTEGRATION.md` for detailed examples with:
- React/JavaScript
- Vue.js
- Angular
- Pure HTML/JavaScript

### Example Usage (JavaScript)

```javascript
// Initialize API client
const api = new BiometricAuthAPI('http://localhost:8000');

// Register new user
await api.register({
    username: 'johndoe',
    email: 'john@example.com',
    password: 'SecurePass123!',
    full_name: 'John Doe'
});

// Login with biometric
const videoBlob = await captureVideo(); // Your video capture logic
const result = await api.loginBiometric('johndoe', 'SecurePass123!', videoBlob);

if (result.success) {
    console.log('Login successful!', result.token);
}
```

## 🚀 Production Deployment

For production deployment with Docker, PostgreSQL, Redis, and Nginx:

1. **See `PRODUCTION_DEPLOYMENT.md`** for comprehensive deployment guide
2. **Key Features**:
   - Docker containerization
   - PostgreSQL database
   - Redis for caching
   - Nginx reverse proxy with SSL
   - Rate limiting and security headers
   - Monitoring and logging
   - Backup strategies

## 🔒 Security Features

- **Password Security**: bcrypt hashing with salt
- **Biometric Security**: AES encryption for facial templates
- **JWT Security**: Signed tokens with expiration
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive request validation
- **Audit Logging**: All authentication attempts logged
- **CORS Protection**: Configurable cross-origin policies

## 🧪 Testing

```bash
# Run all tests
python -m pytest tests/

# Run specific test file
python -m pytest tests/test_auth.py -v

# Run with coverage
python -m pytest tests/ --cov=app --cov-report=html
```

## 📝 Configuration

Key configuration options in `app/config.py`:

```python
# Security
SECRET_KEY = "your-secret-key"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Biometric
BIOMETRIC_SIMILARITY_THRESHOLD = 0.8
BIOMETRIC_DATA_ENCRYPTION_KEY = "your-encryption-key"

# Database
DATABASE_URL = "sqlite:///./biometric_auth.db"
# Or PostgreSQL: "postgresql://user:pass@localhost/dbname"
```

## 🔧 Customization

### Adding New Authentication Methods
1. Extend `AuthService` in `app/services/auth_service.py`
2. Add new endpoints in `app/routers/auth.py`
3. Update schemas in `app/schemas/auth.py`

### Improving Biometric Accuracy
1. Replace OpenCV with `face_recognition` library
2. Implement more sophisticated feature extraction
3. Add liveness detection for video verification

### Database Migration
```bash
# Generate migration
alembic revision --autogenerate -m "description"

# Apply migration
alembic upgrade head
```

## 📚 Documentation

- **`API_DOCUMENTATION.md`**: Complete API reference with examples
- **`FRONTEND_INTEGRATION.md`**: Frontend integration guides and examples
- **`PRODUCTION_DEPLOYMENT.md`**: Production deployment and scaling guide
- **`example_client.py`**: Python client implementation example

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the documentation files
2. Review the example implementations
3. Test with the provided client examples
4. Check logs for detailed error information

## 🔄 Version History

- **v1.0.0**: Initial release with complete biometric authentication system
  - FastAPI backend with JWT authentication
  - OpenCV-based face detection and verification
  - SQLAlchemy models with encryption
  - Comprehensive API documentation
  - Production deployment guides
  - Frontend integration examples

---

**Ready to use!** The system is fully functional and production-ready. Start the server and visit http://127.0.0.1:8000/docs to explore the API.

### Frontend Requirements
- Webcam access capability
- Ability to capture and send video frames
- HTTP client for API requests
- JWT token management

### Integration Steps
1. Set up video capture in your frontend
2. Send registration/login requests with video frames + credentials
3. Handle JWT tokens for authenticated sessions
4. Implement proper error handling and user feedback

## Security Considerations

- Biometric templates are encrypted and never stored as raw images
- Passwords are hashed using bcrypt with salt
- JWT tokens have configurable expiration times
- All API endpoints include proper validation and sanitization
- Rate limiting and request throttling implemented
- Secure headers and CORS configuration

## Development

### Running Tests
```bash
pytest tests/
```

### Environment Variables
Create a `.env` file in the root directory:
```
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///./biometric_auth.db
JWT_EXPIRATION_HOURS=24
BIOMETRIC_THRESHOLD=0.6
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please open a GitHub issue or contact the development team.
