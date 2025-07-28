#!/usr/bin/env python3
"""
Simple test client to verify the biometric authentication system is working
"""

import requests
import json
import base64
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"

def test_server_health():
    """Test if the server is responding"""
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"✅ Server Health: {response.status_code} - {response.text[:100]}")
        return True
    except Exception as e:
        print(f"❌ Server Health Check Failed: {e}")
        return False

def test_user_registration():
    """Test user registration"""
    try:
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "TestPass123!",
            "full_name": "Test User",
            "phone": "1234567890"
        }
        
        response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
        print(f"✅ User Registration: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Success: {data.get('success')}")
            print(f"   Message: {data.get('message')}")
            return True
        else:
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ User Registration Failed: {e}")
        return False

def test_user_login():
    """Test user login"""
    try:
        login_data = {
            "username": "testuser",
            "password": "TestPass123!"
        }
        
        response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
        print(f"✅ User Login: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Success: {data.get('success')}")
            print(f"   Message: {data.get('message')}")
            
            if data.get('token'):
                print(f"   Token received: ✅")
                return data['token']['access_token']
            return True
        else:
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ User Login Failed: {e}")
        return False

def test_protected_endpoint(token):
    """Test accessing a protected endpoint"""
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(f"{BASE_URL}/users/profile", headers=headers)
        print(f"✅ Protected Endpoint: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   User: {data.get('username')} ({data.get('email')})")
            return True
        else:
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Protected Endpoint Failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Testing Biometric Authentication System")
    print("=" * 50)
    
    # Test 1: Server Health
    if not test_server_health():
        print("❌ Server is not responding. Make sure it's running on http://127.0.0.1:8000")
        return
    
    print()
    
    # Test 2: User Registration
    if not test_user_registration():
        print("❌ User registration failed")
        return
    
    print()
    
    # Test 3: User Login
    token = test_user_login()
    if not token:
        print("❌ User login failed")
        return
    
    print()
    
    # Test 4: Protected Endpoint
    if not test_protected_endpoint(token):
        print("❌ Protected endpoint access failed")
        return
    
    print()
    print("🎉 All tests passed! The biometric authentication system is working correctly.")
    print(f"📝 API Documentation: {BASE_URL}/docs")
    print(f"🔧 Server Status: Running and healthy")

if __name__ == "__main__":
    main()
