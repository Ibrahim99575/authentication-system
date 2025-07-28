<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Biometric Authentication System - Backend

This is a Python-based biometric authentication system backend that processes live video feeds and password verification for secure user authentication.

## Project Context
- **Primary Technology**: Python with FastAPI for REST APIs
- **Biometric Processing**: OpenCV and face_recognition libraries
- **Database**: SQLAlchemy with SQLite/PostgreSQL support
- **Security**: JWT tokens, bcrypt password hashing, encryption
- **Architecture**: Modular and portable design for easy integration

## Key Components
1. **Video Processing**: Real-time face detection and feature extraction
2. **Authentication Engine**: Dual-factor verification (video + password)
3. **Database Models**: User profiles, biometric templates, auth logs
4. **API Endpoints**: RESTful services for frontend integration
5. **Security Layer**: Token-based authentication and data encryption

## Development Guidelines
- Follow RESTful API design principles
- Implement proper error handling and validation
- Use async/await for non-blocking operations
- Maintain security best practices for biometric data
- Write modular, testable code
- Include comprehensive logging and monitoring
