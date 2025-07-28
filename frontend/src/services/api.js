/**
 * Biometric Authentication API Client
 * Handles all communication with the backend API
 */

class BiometricAuthAPI {
    constructor(baseURL = 'http://localhost:8000') {
        this.baseURL = baseURL;
        this.accessToken = localStorage.getItem('access_token');
        this.refreshToken = localStorage.getItem('refresh_token');
    }
    
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        if (this.accessToken && !options.skipAuth) {
            config.headers['Authorization'] = `Bearer ${this.accessToken}`;
        }
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.detail || data.message || 'API request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    // Authentication Methods
    async register(userData) {
        const result = await this.makeRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
            skipAuth: true
        });
        return result;
    }
    
    async login(username, password) {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        
        const result = await this.makeRequest('/auth/login', {
            method: 'POST',
            body: formData,
            headers: {}, // Remove Content-Type to let browser set it for FormData
            skipAuth: true
        });
        
        if (result.success && result.token) {
            this.accessToken = result.token.access_token;
            this.refreshToken = result.token.refresh_token;
            localStorage.setItem('access_token', this.accessToken);
            localStorage.setItem('refresh_token', this.refreshToken);
        }
        
        return result;
    }
    
    async loginBiometric(username, password, videoBlob) {
        const videoBase64 = await this.blobToBase64(videoBlob);
        
        const result = await this.makeRequest('/auth/login-biometric', {
            method: 'POST',
            body: JSON.stringify({
                username,
                password,
                video_data: videoBase64,
                video_format: 'webm'
            }),
            skipAuth: true
        });
        
        if (result.success && result.token) {
            this.accessToken = result.token.access_token;
            this.refreshToken = result.token.refresh_token;
            localStorage.setItem('access_token', this.accessToken);
            localStorage.setItem('refresh_token', this.refreshToken);
        }
        
        return result;
    }
    
    async refreshAccessToken() {
        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }
        
        const result = await this.makeRequest('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({
                refresh_token: this.refreshToken
            }),
            skipAuth: true
        });
        
        if (result.success && result.token) {
            this.accessToken = result.token.access_token;
            localStorage.setItem('access_token', this.accessToken);
        }
        
        return result;
    }
    
    logout() {
        this.accessToken = null;
        this.refreshToken = null;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }
    
    // User Management Methods
    async getUserProfile() {
        return await this.makeRequest('/users/profile');
    }
    
    async updateUserProfile(profileData) {
        try {
            const updatedUser = await this.makeRequest('/users/profile', {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });
            
            return {
                success: true,
                user: updatedUser,
                message: 'Profile updated successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to update profile'
            };
        }
    }
    
    async changePassword(currentPassword, newPassword) {
        try {
            const result = await this.makeRequest('/users/change-password', {
                method: 'POST',
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });
            
            return {
                success: true,
                message: result.message || 'Password changed successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to change password'
            };
        }
    }
    
    async deleteAccount() {
        try {
            const result = await this.makeRequest('/users/profile', {
                method: 'DELETE'
            });
            
            return {
                success: true,
                message: result.message || 'Account deleted successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to delete account'
            };
        }
    }
    
    // Biometric Methods
    async enrollBiometric(videoBlob, replaceExisting = false) {
        const videoBase64 = await this.blobToBase64(videoBlob);
        
        return await this.makeRequest('/biometric/enroll', {
            method: 'POST',
            body: JSON.stringify({
                video_data: videoBase64,
                video_format: 'webm',
                replace_existing: replaceExisting
            })
        });
    }
    
    async verifyBiometric(videoBlob, threshold = null) {
        const videoBase64 = await this.blobToBase64(videoBlob);
        
        const payload = {
            video_data: videoBase64,
            video_format: 'webm'
        };
        
        if (threshold !== null) {
            payload.threshold = threshold;
        }
        
        return await this.makeRequest('/biometric/verify', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }
    
    async getBiometricStatus() {
        return await this.makeRequest('/biometric/status');
    }
    
    async deleteBiometricTemplate() {
        return await this.makeRequest('/biometric/template', {
            method: 'DELETE'
        });
    }
    
    // Utility Methods
    async blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1]; // Remove data:video/webm;base64, prefix
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
    
    isAuthenticated() {
        return !!this.accessToken;
    }
    
    setToken(token) {
        if (token) {
            this.accessToken = token;
            localStorage.setItem('access_token', token);
        } else {
            this.accessToken = null;
            localStorage.removeItem('access_token');
        }
    }
    
    getToken() {
        return this.accessToken;
    }
}

export default BiometricAuthAPI;
