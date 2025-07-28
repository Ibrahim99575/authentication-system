"""
Example client code for the Biometric Authentication System

This demonstrates how to integrate the biometric authentication API
with a frontend application.
"""

import requests
import base64
import json
import time

# Configuration
API_BASE_URL = "http://localhost:8000"

class BiometricAuthClient:
    """Client for the Biometric Authentication System"""
    
    def __init__(self, base_url: str = API_BASE_URL):
        self.base_url = base_url
        self.access_token = None
        self.refresh_token = None
        self.session = requests.Session()
    
    def _get_headers(self, include_auth: bool = True) -> dict:
        """Get headers for API requests"""
        headers = {"Content-Type": "application/json"}
        if include_auth and self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        return headers
    
    def _handle_response(self, response: requests.Response) -> dict:
        """Handle API response"""
        try:
            data = response.json()
            if response.status_code >= 400:
                print(f"API Error {response.status_code}: {data.get('detail', 'Unknown error')}")
                return None
            return data
        except ValueError:
            print(f"Invalid JSON response: {response.text}")
            return None
    
    def register_user(self, username: str, email: str, password: str, 
                     full_name: str = None, phone: str = None) -> dict:
        """Register a new user"""
        data = {
            "username": username,
            "email": email,
            "password": password
        }
        if full_name:
            data["full_name"] = full_name
        if phone:
            data["phone"] = phone
        
        response = self.session.post(
            f"{self.base_url}/auth/register",
            json=data,
            headers=self._get_headers(include_auth=False)
        )
        return self._handle_response(response)
    
    def register_with_biometric(self, username: str, email: str, password: str,
                               video_file_path: str, full_name: str = None, phone: str = None) -> dict:
        """Register a new user with biometric data"""
        # Read and encode video file
        try:
            with open(video_file_path, 'rb') as f:
                video_data = base64.b64encode(f.read()).decode('utf-8')
        except FileNotFoundError:
            print(f"Video file not found: {video_file_path}")
            return None
        
        data = {
            "username": username,
            "email": email,
            "password": password,
            "video_data": video_data,
            "video_format": "mp4"
        }
        if full_name:
            data["full_name"] = full_name
        if phone:
            data["phone"] = phone
        
        response = self.session.post(
            f"{self.base_url}/auth/register-biometric",
            json=data,
            headers=self._get_headers(include_auth=False)
        )
        
        result = self._handle_response(response)
        if result and result.get("success") and "token" in result:
            self.access_token = result["token"]["access_token"]
            self.refresh_token = result["token"]["refresh_token"]
        
        return result
    
    def login(self, username: str, password: str) -> dict:
        """Login with username and password"""
        data = {"username": username, "password": password}
        
        response = self.session.post(
            f"{self.base_url}/auth/login",
            data=data,  # Form data for OAuth2
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        result = self._handle_response(response)
        if result and result.get("success") and "token" in result:
            self.access_token = result["token"]["access_token"]
            self.refresh_token = result["token"]["refresh_token"]
        
        return result
    
    def login_biometric(self, username: str, password: str, video_file_path: str) -> dict:
        """Login with biometric verification"""
        # Read and encode video file
        try:
            with open(video_file_path, 'rb') as f:
                video_data = base64.b64encode(f.read()).decode('utf-8')
        except FileNotFoundError:
            print(f"Video file not found: {video_file_path}")
            return None
        
        data = {
            "username": username,
            "password": password,
            "video_data": video_data,
            "video_format": "mp4"
        }
        
        response = self.session.post(
            f"{self.base_url}/auth/login-biometric",
            json=data,
            headers=self._get_headers(include_auth=False)
        )
        
        result = self._handle_response(response)
        if result and result.get("success") and "token" in result:
            self.access_token = result["token"]["access_token"]
            self.refresh_token = result["token"]["refresh_token"]
        
        return result
    
    def get_profile(self) -> dict:
        """Get user profile"""
        response = self.session.get(
            f"{self.base_url}/users/profile",
            headers=self._get_headers()
        )
        return self._handle_response(response)
    
    def update_profile(self, full_name: str = None, phone: str = None, 
                      avatar_url: str = None) -> dict:
        """Update user profile"""
        data = {}
        if full_name is not None:
            data["full_name"] = full_name
        if phone is not None:
            data["phone"] = phone
        if avatar_url is not None:
            data["avatar_url"] = avatar_url
        
        response = self.session.put(
            f"{self.base_url}/users/profile",
            json=data,
            headers=self._get_headers()
        )
        return self._handle_response(response)
    
    def enroll_biometric(self, video_file_path: str, replace_existing: bool = False) -> dict:
        """Enroll biometric template"""
        try:
            with open(video_file_path, 'rb') as f:
                video_data = base64.b64encode(f.read()).decode('utf-8')
        except FileNotFoundError:
            print(f"Video file not found: {video_file_path}")
            return None
        
        data = {
            "video_data": video_data,
            "video_format": "mp4",
            "replace_existing": replace_existing
        }
        
        response = self.session.post(
            f"{self.base_url}/biometric/enroll",
            json=data,
            headers=self._get_headers()
        )
        return self._handle_response(response)
    
    def verify_biometric(self, video_file_path: str, threshold: float = None) -> dict:
        """Verify biometric data"""
        try:
            with open(video_file_path, 'rb') as f:
                video_data = base64.b64encode(f.read()).decode('utf-8')
        except FileNotFoundError:
            print(f"Video file not found: {video_file_path}")
            return None
        
        data = {
            "video_data": video_data,
            "video_format": "mp4"
        }
        if threshold is not None:
            data["threshold"] = threshold
        
        response = self.session.post(
            f"{self.base_url}/biometric/verify",
            json=data,
            headers=self._get_headers()
        )
        return self._handle_response(response)
    
    def get_biometric_status(self) -> dict:
        """Get biometric enrollment status"""
        response = self.session.get(
            f"{self.base_url}/biometric/status",
            headers=self._get_headers()
        )
        return self._handle_response(response)
    
    def get_user_stats(self) -> dict:
        """Get user statistics"""
        response = self.session.get(
            f"{self.base_url}/users/stats",
            headers=self._get_headers()
        )
        return self._handle_response(response)
    
    def refresh_access_token(self) -> dict:
        """Refresh access token"""
        if not self.refresh_token:
            print("No refresh token available")
            return None
        
        data = {"refresh_token": self.refresh_token}
        
        response = self.session.post(
            f"{self.base_url}/auth/refresh",
            json=data,
            headers=self._get_headers(include_auth=False)
        )
        
        result = self._handle_response(response)
        if result and "access_token" in result:
            self.access_token = result["access_token"]
            self.refresh_token = result["refresh_token"]
        
        return result

# Example usage
def main():
    """Example usage of the BiometricAuthClient"""
    client = BiometricAuthClient()
    
    print("=== Biometric Authentication System Client Example ===")
    
    # Example 1: Register a new user
    print("\\n1. Registering a new user...")
    register_result = client.register_user(
        username="demo_user",
        email="demo@example.com",
        password="demopassword123",
        full_name="Demo User"
    )
    if register_result:
        print(f"Registration successful: {register_result['message']}")
    
    # Example 2: Login with password
    print("\\n2. Logging in with password...")
    login_result = client.login("demo_user", "demopassword123")
    if login_result and login_result.get("success"):
        print(f"Login successful: {login_result['message']}")
        print(f"Access token received: {client.access_token[:50]}...")
    
    # Example 3: Get user profile
    print("\\n3. Getting user profile...")
    profile = client.get_profile()
    if profile:
        print(f"User profile: {profile['username']} ({profile['email']})")
    
    # Example 4: Get user statistics
    print("\\n4. Getting user statistics...")
    stats = client.get_user_stats()
    if stats:
        print(f"Total logins: {stats['total_logins']}")
        print(f"Account age: {stats['account_age_days']} days")
    
    # Example 5: Get biometric status
    print("\\n5. Getting biometric status...")
    bio_status = client.get_biometric_status()
    if bio_status:
        print(f"Biometric enrolled: {bio_status['is_enrolled']}")
        print(f"Active templates: {bio_status['active_templates']}")
    
    # Note: Biometric operations require actual video files
    # Example paths (you would need to provide actual video files):
    # 
    # # Enroll biometric template
    # enroll_result = client.enroll_biometric("path/to/enrollment_video.mp4")
    # 
    # # Verify biometric data
    # verify_result = client.verify_biometric("path/to/verification_video.mp4")
    # 
    # # Login with biometric
    # bio_login_result = client.login_biometric(
    #     "demo_user", "demopassword123", "path/to/login_video.mp4"
    # )

if __name__ == "__main__":
    main()
