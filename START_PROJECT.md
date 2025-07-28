# 🚀 Biometric Authentication System - Startup Guide

## Quick Start Commands

### 1. Start Backend Server
```powershell
# Navigate to backend directory
cd D:\Python

# Activate virtual environment (if using one)
.\.venv\Scripts\Activate.ps1

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the FastAPI server
python -m uvicorn main:app --reload --port 8000
```

**Backend will be running at:** `http://localhost:8000`

### 2. Start Frontend Server
```powershell
# Open new terminal window and navigate to frontend
cd D:\Python\frontend

# Install dependencies (first time only)
npm install

# Start React development server
npm start
```

**Frontend will be running at:** `http://localhost:3000`

---

## 📋 Complete Startup Checklist

### First Time Setup (One-time only)
- [ ] **Python Environment**: Ensure Python 3.8+ is installed
- [ ] **Node.js**: Ensure Node.js 16+ and npm are installed
- [ ] **Backend Dependencies**: Run `pip install -r requirements.txt`
- [ ] **Frontend Dependencies**: Run `npm install` in frontend folder
- [ ] **Database**: SQLite database file will be created automatically

### Every Time You Start Development
- [ ] **Start Backend**: `python -m uvicorn main:app --reload --port 8000`
- [ ] **Start Frontend**: `npm start` (in frontend directory)
- [ ] **Verify Connection**: Both servers running and communicating

---

## 🔍 Troubleshooting

### Backend Issues
```powershell
# If port 8000 is busy
python -m uvicorn main:app --reload --port 8001

# If dependencies missing
pip install -r requirements.txt

# If database errors
# Delete biometric_auth.db and restart (will recreate fresh database)
```

### Frontend Issues
```powershell
# If port 3000 is busy
# React will ask to use another port - press Y

# If dependencies missing
npm install

# If build errors
npm run build
```

### Database Issues
```powershell
# Check if database file exists
ls biometric_auth.db

# If corrupted, delete and restart (will recreate)
rm biometric_auth.db
python -m uvicorn main:app --reload --port 8000
```

---

## 🌐 Access URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Backend API** | http://localhost:8000 | FastAPI server |
| **API Documentation** | http://localhost:8000/docs | Swagger UI |
| **Frontend App** | http://localhost:3000 | React application |
| **Database** | `./biometric_auth.db` | SQLite file |

---

## 🔧 Development Workflow

1. **Start Backend First**: Always start the backend server before frontend
2. **Check API Docs**: Visit `/docs` to test API endpoints
3. **Start Frontend**: Launch React app after backend is running
4. **Test Registration**: Create a new user account
5. **Test Biometric Enrollment**: Record face template
6. **Test Login**: Try both password and biometric login

---

## 📁 Project Structure

```
D:\Python\
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── biometric_auth.db      # SQLite database (auto-created)
├── app/                   # Backend application code
│   ├── routers/          # API endpoints
│   ├── services/         # Business logic
│   ├── models/           # Database models
│   └── utils/            # Utilities and security
└── frontend/             # React application
    ├── package.json      # Node.js dependencies
    ├── src/              # React source code
    └── public/           # Static files
```

---

## 🛡️ Security Features Active

- ✅ **Password Hashing**: bcrypt for secure password storage
- ✅ **JWT Authentication**: Access and refresh tokens
- ✅ **Biometric Encryption**: AES encryption for face templates
- ✅ **Input Validation**: Request/response validation
- ✅ **CORS Protection**: Cross-origin request security

---

## 📝 Quick Commands Reference

```powershell
# Backend Commands
cd D:\Python
python -m uvicorn main:app --reload --port 8000

# Frontend Commands  
cd D:\Python\frontend
npm start

# Database Check
cd D:\Python
ls biometric_auth.db

# View Logs
cd D:\Python
Get-Content app.log -Tail 20
```

---

## ⚡ Quick Test Steps

1. **Start both servers** (backend on 8000, frontend on 3000)
2. **Open browser** to `http://localhost:3000`
3. **Register new account** with username, email, password
4. **Enroll biometric** by recording face video
5. **Test login** with username/password + face verification
6. **Check profile** and update user information

---

## 🎯 Production Deployment

For production deployment, see `PRODUCTION_DEPLOYMENT.md` for:
- PostgreSQL database setup
- Docker containerization
- SSL/TLS configuration
- Environment variables
- Cloud deployment options

---

**Happy Coding! 🚀**
