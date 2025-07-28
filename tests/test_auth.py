"""
Test authentication endpoints
"""

import pytest
from fastapi.testclient import TestClient

def test_register_user(client: TestClient):
    """Test user registration"""
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpassword123",
        "full_name": "Test User"
    }
    
    response = client.post("/auth/register", json=user_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True
    assert data["user"]["username"] == user_data["username"]
    assert data["user"]["email"] == user_data["email"]

def test_login_user(client: TestClient):
    """Test user login"""
    # First register a user
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpassword123",
        "full_name": "Test User"
    }
    
    client.post("/auth/register", json=user_data)
    
    # Then login
    login_data = {
        "username": "testuser",
        "password": "testpassword123"
    }
    
    response = client.post("/auth/login", data=login_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True
    assert "token" in data
    assert data["token"]["access_token"] is not None

def test_invalid_login(client: TestClient):
    """Test login with invalid credentials"""
    login_data = {
        "username": "nonexistent",
        "password": "wrongpassword"
    }
    
    response = client.post("/auth/login", data=login_data)
    assert response.status_code == 401

def test_duplicate_registration(client: TestClient):
    """Test registration with duplicate username"""
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpassword123",
        "full_name": "Test User"
    }
    
    # Register first time
    response1 = client.post("/auth/register", json=user_data)
    assert response1.status_code == 200
    
    # Try to register again
    response2 = client.post("/auth/register", json=user_data)
    assert response2.status_code == 400
