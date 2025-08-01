import React, { useState, useMemo } from 'react';
import VideoCapture from './VideoCapture';
import FingerprintCapture from './FingerprintCapture';
import BiometricAuthAPI from '../services/api';

const AuthForm = ({ onAuthSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [loginType, setLoginType] = useState('password'); // 'password', 'biometric', or 'fingerprint'
    const [isRecording, setIsRecording] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Form data
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        phone: ''
    });
    
    // Create API instance only once using useMemo
    const api = useMemo(() => new BiometricAuthAPI(), []);
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const validateForm = () => {
        if (!formData.username || !formData.password) {
            setError('Username and password are required');
            return false;
        }
        
        if (!isLogin) {
            if (!formData.email || !formData.fullName) {
                setError('All fields are required for registration');
                return false;
            }
            
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                return false;
            }
            
            if (formData.password.length < 8) {
                setError('Password must be at least 8 characters long');
                return false;
            }
        }
        
        return true;
    };
    
    const handlePasswordAuth = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setIsLoading(true);
        setError('');
        setSuccess('');
        
        try {
            let result;
            
            if (isLogin) {
                result = await api.login(formData.username, formData.password);
            } else {
                result = await api.register({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    full_name: formData.fullName,
                    phone: formData.phone || null
                });
            }
            
            if (result.success) {
                if (isLogin) {
                    setSuccess('Login successful! Redirecting...');
                    setTimeout(() => {
                        onAuthSuccess(result.user, result.token.access_token);
                    }, 1000);
                } else {
                    setSuccess('Registration successful! Please login.');
                    setTimeout(() => {
                        setIsLogin(true);
                        setFormData(prev => ({ ...prev, email: '', confirmPassword: '', fullName: '', phone: '' }));
                    }, 2000);
                }
            } else {
                setError(result.message || `${isLogin ? 'Login' : 'Registration'} failed`);
            }
        } catch (error) {
            setError(error.message || `${isLogin ? 'Login' : 'Registration'} failed`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleBiometricAuth = async (videoBlob) => {
        if (!validateForm()) {
            setIsRecording(false);
            return;
        }
        
        setIsLoading(true);
        setError('');
        
        try {
            const result = await api.loginBiometric(formData.username, formData.password, videoBlob);
            
            if (result.success) {
                setSuccess('Biometric login successful! Redirecting...');
                setTimeout(() => {
                    onAuthSuccess(result.user, result.token.access_token);
                }, 1000);
            } else {
                setError(result.message || 'Biometric login failed');
            }
        } catch (error) {
            console.error('Biometric login error:', error);
            const errorMessage = error?.message || error?.detail || (typeof error === 'string' ? error : 'Biometric login failed');
            setError(errorMessage);
        } finally {
            setIsLoading(false);
            setIsRecording(false);
        }
    };
    
    const handleFingerprintAuth = async (fingerprintData) => {
        if (!validateForm()) {
            setIsCapturing(false);
            return;
        }
        
        setIsLoading(true);
        setError('');
        
        try {
            const result = await api.loginFingerprint(formData.username, formData.password, fingerprintData);
            
            if (result.success) {
                setSuccess('Windows Hello authentication successful! Redirecting...');
                setTimeout(() => {
                    onAuthSuccess(result.user, result.token.access_token);
                }, 1000);
            } else {
                setError(result.message || 'Windows Hello authentication failed');
            }
        } catch (error) {
            console.error('Fingerprint login error:', error);
            const errorMessage = error?.message || error?.detail || (typeof error === 'string' ? error : 'Windows Hello authentication failed');
            setError(errorMessage);
        } finally {
            setIsLoading(false);
            setIsCapturing(false);
        }
    };
    
    const resetForm = () => {
        setFormData({
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            fullName: '',
            phone: ''
        });
        setError('');
        setSuccess('');
        setLoginType('password');
    };
    
    const switchMode = () => {
        setIsLogin(!isLogin);
        resetForm();
    };
    
    return (
        <div className={`card ${isLogin && (loginType === 'biometric' || loginType === 'fingerprint') ? 'card-wide' : ''}`}>
            <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
                {isLogin ? 'Login to Your Account' : 'Create New Account'}
            </h2>
            
            {/* Auth Mode Toggle */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <button 
                    className="btn btn-secondary" 
                    onClick={switchMode}
                    style={{ fontSize: '14px' }}
                >
                    {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
                </button>
            </div>
            
            {/* Login Type Selection (only for login) */}
            {isLogin && (
                <div className="radio-group">
                    <label className="radio-option">
                        <input
                            type="radio"
                            value="password"
                            checked={loginType === 'password'}
                            onChange={(e) => setLoginType(e.target.value)}
                        />
                        Password Login
                    </label>
                    <label className="radio-option">
                        <input
                            type="radio"
                            value="biometric"
                            checked={loginType === 'biometric'}
                            onChange={(e) => setLoginType(e.target.value)}
                        />
                        Face Biometric
                    </label>
                    <label className="radio-option">
                        <input
                            type="radio"
                            value="fingerprint"
                            checked={loginType === 'fingerprint'}
                            onChange={(e) => setLoginType(e.target.value)}
                        />
                        Windows Hello Login
                    </label>
                </div>
            )}
            
            {/* Success Message */}
            {success && (
                <div className="alert alert-success">
                    {success}
                </div>
            )}
            
            {/* Error Message */}
            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}
            
            {/* Form - Hide for biometric and fingerprint login */}
            {!(isLogin && (loginType === 'biometric' || loginType === 'fingerprint')) && (
                <form onSubmit={handlePasswordAuth}>
                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            className="form-input"
                            required
                            disabled={isLoading}
                        />
                    </div>
                
                {!isLogin && (
                    <>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="form-input"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                className="form-input"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label className="form-label">Phone (Optional)</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="form-input"
                                disabled={isLoading}
                            />
                        </div>
                    </>
                )}
                
                <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                        disabled={isLoading}
                    />
                </div>
                
                {!isLogin && (
                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className="form-input"
                            required
                            disabled={isLoading}
                        />
                    </div>
                )}
                
                {/* Password Login Button */}
                {(loginType === 'password' || !isLogin) && (
                    <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={isLoading}
                        style={{ width: '100%' }}
                    >
                        {isLoading ? (
                            <div className="loading">
                                <div className="spinner"></div>
                                {isLogin ? 'Logging in...' : 'Creating account...'}
                            </div>
                        ) : (
                            isLogin ? 'Login' : 'Register'
                        )}
                    </button>
                )}
            </form>
            )}
            
            {/* Biometric Login Section */}
            {isLogin && loginType === 'biometric' && (
                <div style={{ marginTop: '20px' }}>
                    <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>
                        Face Biometric Verification
                    </h3>
                    
                    {/* Horizontal Layout Container */}
                    <div className="biometric-horizontal" style={{ 
                        display: 'flex', 
                        gap: '25px', 
                        alignItems: 'flex-start',
                        minHeight: '300px'
                    }}>
                        {/* Left Side - Video Capture */}
                        <div style={{ 
                            flex: '1', 
                            minWidth: '300px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}>
                            <VideoCapture
                                onVideoCapture={handleBiometricAuth}
                                isRecording={isRecording}
                                setIsRecording={setIsRecording}
                                duration={5000}
                            />
                        </div>
                        
                        {/* Right Side - Input Section */}
                        <div style={{ 
                            flex: '1', 
                            minWidth: '280px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            padding: '20px 0'
                        }}>
                            <div className="alert alert-info" style={{ marginBottom: '20px' }}>
                                Please ensure your face is clearly visible and well-lit, then record a 5-second video for verification.
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Username</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    required
                                    disabled={isLoading}
                                    placeholder="Enter your username"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    required
                                    disabled={isLoading}
                                    placeholder="Enter your password"
                                />
                            </div>
                            
                            {isLoading && (
                                <div className="loading" style={{ justifyContent: 'center', marginTop: '20px' }}>
                                    <div className="spinner"></div>
                                    Processing biometric data...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Windows Hello Login Section */}
            {isLogin && loginType === 'fingerprint' && (
                <div style={{ marginTop: '20px' }}>
                    <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>
                        Windows Hello Authentication
                    </h3>
                    
                    {/* Horizontal Layout Container */}
                    <div className="biometric-horizontal" style={{ 
                        display: 'flex', 
                        gap: '25px', 
                        alignItems: 'flex-start',
                        minHeight: '300px'
                    }}>
                        {/* Left Side - Fingerprint Capture */}
                        <div style={{ 
                            flex: '1', 
                            minWidth: '300px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}>
                            <FingerprintCapture
                                onFingerprintCapture={handleFingerprintAuth}
                                isCapturing={isCapturing}
                                setIsCapturing={setIsCapturing}
                                disabled={isLoading}
                            />
                        </div>
                        
                        {/* Right Side - Input Section */}
                        <div style={{ 
                            flex: '1', 
                            minWidth: '280px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            padding: '20px 0'
                        }}>
                            <div className="alert alert-info" style={{ marginBottom: '20px' }}>
                                Enter your credentials and use Windows Hello for secure authentication.
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Username</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    required
                                    disabled={isLoading}
                                    placeholder="Enter your username"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    required
                                    disabled={isLoading}
                                    placeholder="Enter your password"
                                />
                            </div>
                            
                            {isLoading && (
                                <div className="loading" style={{ justifyContent: 'center', marginTop: '20px' }}>
                                    <div className="spinner"></div>
                                    Processing Windows Hello authentication...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthForm;
