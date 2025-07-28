# Frontend Integration Guide

## Overview

This guide shows how to integrate the Biometric Authentication System backend with various frontend frameworks.

## JavaScript/TypeScript Integration

### 1. Basic Setup

```javascript
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
                throw new Error(data.detail || 'API request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
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
                video_format: 'mp4'
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
    
    async getUserProfile() {
        return await this.makeRequest('/users/profile');
    }
    
    async enrollBiometric(videoBlob, replaceExisting = false) {
        const videoBase64 = await this.blobToBase64(videoBlob);
        
        return await this.makeRequest('/biometric/enroll', {
            method: 'POST',
            body: JSON.stringify({
                video_data: videoBase64,
                video_format: 'mp4',
                replace_existing: replaceExisting
            })
        });
    }
    
    async verifyBiometric(videoBlob, threshold = null) {
        const videoBase64 = await this.blobToBase64(videoBlob);
        
        const payload = {
            video_data: videoBase64,
            video_format: 'mp4'
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
    
    async blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1]; // Remove data:video/mp4;base64, prefix
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
    
    logout() {
        this.accessToken = null;
        this.refreshToken = null;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }
}
```

### 2. Video Capture Component (React)

```jsx
import React, { useRef, useState, useCallback } from 'react';

const VideoCapture = ({ onVideoCapture, isRecording, duration = 5000 }) => {
    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [recordedChunks, setRecordedChunks] = useState([]);
    
    const startCamera = useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
                audio: false
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
        }
    }, []);
    
    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);
    
    const startRecording = useCallback(() => {
        if (!stream) return;
        
        setRecordedChunks([]);
        mediaRecorderRef.current = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9'
        });
        
        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
                setRecordedChunks(prev => [...prev, event.data]);
            }
        };
        
        mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            onVideoCapture(blob);
        };
        
        mediaRecorderRef.current.start();
        
        // Auto-stop recording after specified duration
        setTimeout(() => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        }, duration);
    }, [stream, recordedChunks, onVideoCapture, duration]);
    
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    }, []);
    
    React.useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, [startCamera, stopCamera]);
    
    return (
        <div className="video-capture">
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{ width: '100%', maxWidth: '640px', height: 'auto' }}
            />
            <div className="controls">
                <button 
                    onClick={startRecording} 
                    disabled={!stream || isRecording}
                >
                    Start Recording
                </button>
                <button 
                    onClick={stopRecording} 
                    disabled={!isRecording}
                >
                    Stop Recording
                </button>
            </div>
        </div>
    );
};

export default VideoCapture;
```

### 3. Login Component (React)

```jsx
import React, { useState } from 'react';
import { BiometricAuthAPI } from './api';
import VideoCapture from './VideoCapture';

const LoginForm = ({ onLoginSuccess }) => {
    const [api] = useState(() => new BiometricAuthAPI());
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginType, setLoginType] = useState('password'); // 'password' or 'biometric'
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        try {
            const result = await api.login(username, password);
            if (result.success) {
                onLoginSuccess(result);
            } else {
                setError(result.message || 'Login failed');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleBiometricLogin = async (videoBlob) => {
        setIsLoading(true);
        setError('');
        
        try {
            const result = await api.loginBiometric(username, password, videoBlob);
            if (result.success) {
                onLoginSuccess(result);
            } else {
                setError(result.message || 'Biometric login failed');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
            setIsRecording(false);
        }
    };
    
    const handleVideoCapture = (videoBlob) => {
        handleBiometricLogin(videoBlob);
    };
    
    return (
        <div className="login-form">
            <h2>Login</h2>
            
            <div className="login-type-selector">
                <label>
                    <input
                        type="radio"
                        value="password"
                        checked={loginType === 'password'}
                        onChange={(e) => setLoginType(e.target.value)}
                    />
                    Password Login
                </label>
                <label>
                    <input
                        type="radio"
                        value="biometric"
                        checked={loginType === 'biometric'}
                        onChange={(e) => setLoginType(e.target.value)}
                    />
                    Biometric Login
                </label>
            </div>
            
            <form onSubmit={handlePasswordLogin}>
                <div className="form-group">
                    <label>Username or Email:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                
                <div className="form-group">
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                
                {loginType === 'password' && (
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                )}
            </form>
            
            {loginType === 'biometric' && (
                <div className="biometric-login">
                    <h3>Biometric Verification</h3>
                    <p>Please record a 5-second video of your face for verification.</p>
                    <VideoCapture
                        onVideoCapture={handleVideoCapture}
                        isRecording={isRecording}
                        duration={5000}
                    />
                </div>
            )}
            
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}
        </div>
    );
};

export default LoginForm;
```

## Vue.js Integration

```vue
<template>
  <div class="biometric-auth">
    <h2>Biometric Authentication</h2>
    
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label>Username:</label>
        <input v-model="username" type="text" required />
      </div>
      
      <div class="form-group">
        <label>Password:</label>
        <input v-model="password" type="password" required />
      </div>
      
      <div class="form-group">
        <label>
          <input v-model="useBiometric" type="checkbox" />
          Use biometric verification
        </label>
      </div>
      
      <div v-if="useBiometric" class="video-section">
        <video ref="videoElement" autoplay muted playsinline></video>
        <button type="button" @click="toggleRecording">
          {{ isRecording ? 'Stop Recording' : 'Start Recording' }}
        </button>
      </div>
      
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Processing...' : 'Login' }}
      </button>
    </form>
    
    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script>
export default {
  name: 'BiometricAuth',
  data() {
    return {
      username: '',
      password: '',
      useBiometric: false,
      isRecording: false,
      isLoading: false,
      error: '',
      stream: null,
      mediaRecorder: null,
      recordedChunks: []
    };
  },
  methods: {
    async startCamera() {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false
        });
        this.$refs.videoElement.srcObject = this.stream;
      } catch (error) {
        this.error = 'Error accessing camera: ' + error.message;
      }
    },
    
    stopCamera() {
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
    },
    
    toggleRecording() {
      if (this.isRecording) {
        this.stopRecording();
      } else {
        this.startRecording();
      }
    },
    
    startRecording() {
      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(this.stream);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.start();
      this.isRecording = true;
      
      // Auto-stop after 5 seconds
      setTimeout(() => {
        if (this.isRecording) {
          this.stopRecording();
        }
      }, 5000);
    },
    
    stopRecording() {
      if (this.mediaRecorder) {
        this.mediaRecorder.stop();
        this.isRecording = false;
      }
    },
    
    async handleLogin() {
      this.isLoading = true;
      this.error = '';
      
      try {
        let result;
        
        if (this.useBiometric && this.recordedChunks.length > 0) {
          const videoBlob = new Blob(this.recordedChunks, { type: 'video/webm' });
          result = await this.loginBiometric(videoBlob);
        } else {
          result = await this.loginPassword();
        }
        
        if (result.success) {
          this.$emit('login-success', result);
        } else {
          this.error = result.message || 'Login failed';
        }
      } catch (error) {
        this.error = error.message;
      } finally {
        this.isLoading = false;
      }
    },
    
    async loginPassword() {
      const formData = new FormData();
      formData.append('username', this.username);
      formData.append('password', this.password);
      
      const response = await fetch('/auth/login', {
        method: 'POST',
        body: formData
      });
      
      return await response.json();
    },
    
    async loginBiometric(videoBlob) {
      const videoBase64 = await this.blobToBase64(videoBlob);
      
      const response = await fetch('/auth/login-biometric', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: this.username,
          password: this.password,
          video_data: videoBase64,
          video_format: 'webm'
        })
      });
      
      return await response.json();
    },
    
    blobToBase64(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  },
  
  watch: {
    useBiometric(newVal) {
      if (newVal) {
        this.$nextTick(() => {
          this.startCamera();
        });
      } else {
        this.stopCamera();
      }
    }
  },
  
  beforeUnmount() {
    this.stopCamera();
  }
};
</script>
```

## Security Considerations

1. **HTTPS Required**: Always use HTTPS in production to protect sensitive data
2. **Token Storage**: Store tokens securely (consider httpOnly cookies for better security)
3. **Video Data**: Ensure video data is properly encoded and transmitted securely
4. **Error Handling**: Implement proper error handling and user feedback
5. **Rate Limiting**: Implement client-side rate limiting for API calls
6. **Input Validation**: Validate all inputs before sending to the API

## Best Practices

1. **User Experience**: Provide clear instructions for biometric capture
2. **Fallback Options**: Always provide password-only login as backup
3. **Progressive Enhancement**: Detect biometric capabilities before enabling features
4. **Loading States**: Show appropriate loading indicators during processing
5. **Error Recovery**: Provide clear error messages and recovery options
