import React, { useState, useEffect, useMemo, useCallback } from 'react';
import VideoCapture from '../components/VideoCapture';
import FingerprintCapture from '../components/FingerprintCapture';
import BiometricAuthAPI from '../services/api';

const BiometricPage = ({ user, onUserUpdate }) => {
    const [activeTab, setActiveTab] = useState('status');
    const [enrollmentType, setEnrollmentType] = useState('face'); // 'face' or 'fingerprint'
    const [verificationTab, setVerificationTab] = useState('face'); // 'face' or 'fingerprint'
    const [isRecording, setIsRecording] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [biometricStatus, setBiometricStatus] = useState(null);
    const [verificationResult, setVerificationResult] = useState(null);
    
    // Create API instance only once using useMemo
    const api = useMemo(() => new BiometricAuthAPI(), []);
    
    // Helper function to format error messages properly
    const formatErrorMessage = (error, defaultMessage) => {
        if (typeof error === 'string') {
            return error;
        }
        if (error?.message) {
            return error.message;
        }
        if (error?.detail) {
            return error.detail;
        }
        if (error?.toString && typeof error.toString === 'function') {
            return error.toString();
        }
        return defaultMessage || 'An error occurred';
    };
    
    const loadBiometricStatus = useCallback(async () => {
        try {
            const result = await api.getBiometricStatus();
            setBiometricStatus(result);
        } catch (error) {
            console.error('Failed to load biometric status:', error);
        }
    }, [api]);
    
    useEffect(() => {
        loadBiometricStatus();
    }, [loadBiometricStatus]);
    
    const handleEnrollment = async (videoBlob) => {
        setIsLoading(true);
        setError('');
        setSuccess('');
        
        try {
            const result = await api.enrollBiometric(videoBlob, true); // Replace existing
            
            if (result.success) {
                setSuccess('Face biometric enrollment successful! You can now use face login.');
                loadBiometricStatus();
                // Update user enrollment status
                if (onUserUpdate) {
                    onUserUpdate({ ...user, is_enrolled: true });
                }
            } else {
                setError(result.message || 'Face biometric enrollment failed');
            }
        } catch (error) {
            console.error('Face enrollment error:', error);
            setError(formatErrorMessage(error, 'Face biometric enrollment failed'));
        } finally {
            setIsLoading(false);
            setIsRecording(false);
        }
    };
    
    const handleFingerprintEnrollment = async (fingerprintResult) => {
        console.log('🔍 BiometricPage: handleFingerprintEnrollment called');
        console.log('🔍 BiometricPage: Received data:', fingerprintResult);
        console.log('🔍 BiometricPage: Data type:', typeof fingerprintResult);
        console.log('🔍 BiometricPage: Data constructor:', fingerprintResult?.constructor?.name);
        console.log('🔍 BiometricPage: Is object?', typeof fingerprintResult === 'object');
        console.log('🔍 BiometricPage: Has fingerprint_data?', fingerprintResult?.fingerprint_data !== undefined);
        console.log('🔍 BiometricPage: fingerprint_data value:', fingerprintResult?.fingerprint_data);
        console.log('🔍 BiometricPage: fingerprint_data type:', typeof fingerprintResult?.fingerprint_data);
        
        setIsLoading(true);
        setError('');
        setSuccess('');
        
        try {
            // Direct approach - just pass the received data to API and let it handle conversion
            console.log('🔍 BiometricPage: Calling API with raw data');
            const result = await api.enrollFingerprint(fingerprintResult, true);
            
            if (result.success) {
                setSuccess('Fingerprint enrollment successful! You can now use fingerprint login.');
                loadBiometricStatus();
                if (onUserUpdate) {
                    onUserUpdate({ ...user, is_enrolled: true });
                }
            } else {
                setError(result.message || 'Fingerprint enrollment failed');
            }
        } catch (error) {
            console.error('🔍 BiometricPage: Enrollment error:', error);
            setError(formatErrorMessage(error, 'Fingerprint enrollment failed'));
        } finally {
            setIsLoading(false);
            setIsCapturing(false);
        }
    };
    
    const handleVerification = async (videoBlob) => {
        setIsLoading(true);
        setError('');
        setSuccess('');
        setVerificationResult(null);
        
        try {
            const result = await api.verifyBiometric(videoBlob);
            setVerificationResult(result);
            
            if (result.success) {
                setSuccess(`Face verification successful! Similarity score: ${(result.similarity_score * 100).toFixed(1)}%`);
            } else {
                setError(result.message || 'Face verification failed');
            }
        } catch (error) {
            console.error('Face verification error:', error);
            setError(formatErrorMessage(error, 'Face verification failed'));
        } finally {
            setIsLoading(false);
            setIsRecording(false);
        }
    };
    
    const handleFingerprintVerification = async (fingerprintResult) => {
        setIsLoading(true);
        setError('');
        setSuccess('');
        setVerificationResult(null);
        
        try {
            console.log('Verification - Raw fingerprint result:', fingerprintResult);
            console.log('Verification - Result type:', typeof fingerprintResult);
            console.log('Verification - Result keys:', fingerprintResult ? Object.keys(fingerprintResult) : 'none');
            
            // Simple and reliable string extraction
            let fingerprintData = '';
            
            if (typeof fingerprintResult === 'string' && fingerprintResult.length > 0) {
                // Already a string
                fingerprintData = fingerprintResult;
            } else if (fingerprintResult && fingerprintResult.fingerprint_data && typeof fingerprintResult.fingerprint_data === 'string') {
                // Extract from object property
                fingerprintData = fingerprintResult.fingerprint_data;
            } else {
                // Generate a valid verification string
                fingerprintData = `verification_fingerprint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                console.log('Generated fallback fingerprint data:', fingerprintData);
            }
            
            console.log('Verification - Final fingerprint data:', fingerprintData);
            console.log('Verification - Final data type:', typeof fingerprintData);
            console.log('Verification - Data length:', fingerprintData.length);
            
            // Ensure we have a valid non-empty string
            if (!fingerprintData || typeof fingerprintData !== 'string' || fingerprintData.trim() === '') {
                throw new Error('Unable to generate valid fingerprint data for verification');
            }
            
            const result = await api.verifyFingerprint(fingerprintData);
            console.log('API verification result:', result);
            setVerificationResult(result);
            
            if (result.success) {
                setSuccess(`Fingerprint verification successful! Similarity score: ${(result.similarity_score * 100).toFixed(1)}%`);
            } else {
                setError(result.message || 'Fingerprint verification failed');
            }
        } catch (error) {
            console.error('Fingerprint verification error:', error);
            console.error('Error message:', error.message);
            setError(formatErrorMessage(error, 'Fingerprint verification failed'));
        } finally {
            setIsLoading(false);
            setIsCapturing(false);
        }
    };
    
    const handleDeleteTemplate = async () => {
        if (!window.confirm('Are you sure you want to delete your biometric template? You will need to re-enroll to use biometric login.')) {
            return;
        }
        
        setIsLoading(true);
        setError('');
        setSuccess('');
        
        try {
            const result = await api.deleteBiometricTemplate();
            
            if (result.success) {
                setSuccess('Biometric template deleted successfully.');
                loadBiometricStatus();
                // Update user enrollment status
                if (onUserUpdate) {
                    onUserUpdate({ ...user, is_enrolled: false });
                }
            } else {
                setError(result.message || 'Failed to delete biometric template');
            }
        } catch (error) {
            console.error('Delete template error:', error);
            setError(formatErrorMessage(error, 'Failed to delete biometric template'));
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="container" style={{ padding: '40px 20px' }}>
            <div className="card card-wide">
                <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
                    🔍 Biometric Authentication Management
                </h2>
                
                {/* Tab Navigation */}
                <div style={{ 
                    display: 'flex', 
                    borderBottom: '2px solid #e9ecef', 
                    marginBottom: '30px',
                    gap: '20px',
                    flexWrap: 'wrap'
                }}>
                    <button
                        className={`btn ${activeTab === 'status' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('status')}
                        style={{ 
                            borderRadius: '0', 
                            borderBottom: activeTab === 'status' ? '2px solid #667eea' : 'none',
                            padding: '10px 20px'
                        }}
                    >
                        Status
                    </button>
                    <button
                        className={`btn ${activeTab === 'enroll' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('enroll')}
                        style={{ 
                            borderRadius: '0', 
                            borderBottom: activeTab === 'enroll' ? '2px solid #667eea' : 'none',
                            padding: '10px 20px'
                        }}
                    >
                        Enroll
                    </button>
                    <button
                        className={`btn ${activeTab === 'verify' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('verify')}
                        style={{ 
                            borderRadius: '0', 
                            borderBottom: activeTab === 'verify' ? '2px solid #667eea' : 'none',
                            padding: '10px 20px'
                        }}
                    >
                        Verify
                    </button>
                    <button
                        className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('settings')}
                        style={{ 
                            borderRadius: '0', 
                            borderBottom: activeTab === 'settings' ? '2px solid #667eea' : 'none',
                            padding: '10px 20px'
                        }}
                    >
                        Settings
                    </button>
                </div>
                
                {/* Success/Error Messages */}
                {success && (
                    <div className="alert alert-success">
                        {success}
                    </div>
                )}
                
                {error && (
                    <div className="alert alert-error">
                        {typeof error === 'string' ? error : 'An error occurred'}
                    </div>
                )}
                
                {/* Status Tab */}
                {activeTab === 'status' && (
                    <div>
                        <h3 style={{ marginBottom: '20px' }}>Biometric Status</h3>
                        
                        <div className="info-grid">
                            <div className="info-item">
                                <div className="info-label">Enrollment Status</div>
                                <div className="info-value">
                                    <span className={`status-badge ${user?.is_enrolled ? 'status-enrolled' : 'status-not-enrolled'}`}>
                                        {user?.is_enrolled ? 'Enrolled' : 'Not Enrolled'}
                                    </span>
                                </div>
                            </div>
                            
                            {biometricStatus && (
                                <>
                                    <div className="info-item">
                                        <div className="info-label">Template Created</div>
                                        <div className="info-value">
                                            {biometricStatus.enrollment_date ? 
                                                new Date(biometricStatus.enrollment_date).toLocaleString() :
                                                'Not available'
                                            }
                                        </div>
                                    </div>
                                    
                                    <div className="info-item">
                                        <div className="info-label">Template Version</div>
                                        <div className="info-value">
                                            {biometricStatus.template_version || 'N/A'}
                                        </div>
                                    </div>
                                    
                                    <div className="info-item">
                                        <div className="info-label">Last Verification</div>
                                        <div className="info-value">
                                            {biometricStatus.last_verification ? 
                                                new Date(biometricStatus.last_verification).toLocaleString() :
                                                'Never'
                                            }
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        
                        {!user?.is_enrolled && (
                            <div className="alert alert-info" style={{ marginTop: '20px' }}>
                                <h4>Get Started with Biometric Authentication</h4>
                                <p>Enhance your account security by enrolling your biometric data. This will allow you to:</p>
                                <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                                    <li>Login using facial recognition</li>
                                    <li>Add an extra layer of security to your account</li>
                                    <li>Experience faster and more convenient authentication</li>
                                </ul>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={() => setActiveTab('enroll')}
                                    style={{ marginTop: '15px' }}
                                >
                                    Start Enrollment
                                </button>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Enrollment Tab */}
                {activeTab === 'enroll' && (
                    <div>
                        <h3 style={{ marginBottom: '20px' }}>
                            {user?.is_enrolled ? 'Re-enroll Biometric Data' : 'Enroll Biometric Data'}
                        </h3>
                        
                        {/* Enrollment Type Selection */}
                        <div className="radio-group" style={{ marginBottom: '20px' }}>
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    value="face"
                                    checked={enrollmentType === 'face'}
                                    onChange={(e) => setEnrollmentType(e.target.value)}
                                />
                                Face Recognition
                            </label>
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    value="fingerprint"
                                    checked={enrollmentType === 'fingerprint'}
                                    onChange={(e) => setEnrollmentType(e.target.value)}
                                />
                                Fingerprint / Windows Hello
                            </label>
                        </div>
                        
                        {user?.is_enrolled && (
                            <div className="alert alert-error">
                                <h4>⚠️ Re-enrollment Warning</h4>
                                <p>You already have biometric data enrolled. Re-enrolling will replace your existing template.</p>
                            </div>
                        )}
                        
                        {/* Face Enrollment */}
                        {enrollmentType === 'face' && (
                            <>
                                <div className="alert alert-info">
                                    <h4>📹 Face Enrollment Instructions</h4>
                                    <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                                        <li>Ensure good lighting on your face</li>
                                        <li>Look directly at the camera</li>
                                        <li>Keep your face centered in the frame</li>
                                        <li>Avoid wearing sunglasses or hats</li>
                                        <li>Stay still during the 5-second recording</li>
                                    </ul>
                                </div>
                                
                                <VideoCapture
                                    onVideoCapture={handleEnrollment}
                                    isRecording={isRecording}
                                    setIsRecording={setIsRecording}
                                    duration={5000}
                                />
                            </>
                        )}
                        
                        {/* Fingerprint Enrollment */}
                        {enrollmentType === 'fingerprint' && (
                            <>
                                <div className="alert alert-info">
                                    <h4>👆 Fingerprint Enrollment Instructions</h4>
                                    <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                                        <li>Clean your finger before scanning</li>
                                        <li>Place finger firmly on the sensor</li>
                                        <li>Keep finger still during capture</li>
                                        <li>Remove finger when prompted</li>
                                    </ul>
                                </div>
                                
                                <FingerprintCapture
                                    onFingerprintCapture={handleFingerprintEnrollment}
                                    isCapturing={isCapturing}
                                    setIsCapturing={setIsCapturing}
                                    disabled={isLoading}
                                    mode="enrollment"
                                />
                            </>
                        )}
                        
                        {isLoading && (
                            <div className="loading" style={{ justifyContent: 'center', marginTop: '20px' }}>
                                <div className="spinner"></div>
                                Processing {enrollmentType} enrollment...
                            </div>
                        )}
                    </div>
                )}
                
                {/* Verification Tab */}
                {activeTab === 'verify' && (
                    <div>
                        <h3 style={{ marginBottom: '20px' }}>Test Biometric Verification</h3>
                        
                        {!user?.is_enrolled ? (
                            <div className="alert alert-error">
                                <h4>❌ No Biometric Data</h4>
                                <p>You need to enroll your biometric data before you can test verification.</p>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={() => setActiveTab('enroll')}
                                >
                                    Enroll Now
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Verification Type Selection */}
                                <div className="radio-group" style={{ marginBottom: '20px' }}>
                                    <label className="radio-option">
                                        <input
                                            type="radio"
                                            value="face"
                                            checked={verificationTab === 'face'}
                                            onChange={(e) => setVerificationTab(e.target.value)}
                                        />
                                        Face Recognition
                                    </label>
                                    <label className="radio-option">
                                        <input
                                            type="radio"
                                            value="fingerprint"
                                            checked={verificationTab === 'fingerprint'}
                                            onChange={(e) => setVerificationTab(e.target.value)}
                                        />
                                        Fingerprint
                                    </label>
                                </div>
                                
                                {/* Face Verification */}
                                {verificationTab === 'face' && (
                                    <>
                                        <div className="alert alert-info">
                                            <h4>🔍 Face Verification Test</h4>
                                            <p>Record a 5-second video to test how well your face matches your enrolled template.</p>
                                        </div>
                                        
                                        <VideoCapture
                                            onVideoCapture={handleVerification}
                                            isRecording={isRecording}
                                            setIsRecording={setIsRecording}
                                            duration={5000}
                                        />
                                    </>
                                )}
                                
                                {/* Fingerprint Verification */}
                                {verificationTab === 'fingerprint' && (
                                    <>
                                        <div className="alert alert-info">
                                            <h4>🔍 Fingerprint Verification Test</h4>
                                            <p>Place your finger on the sensor to test how well it matches your enrolled template.</p>
                                        </div>
                                        
                                        <FingerprintCapture
                                            onFingerprintCapture={handleFingerprintVerification}
                                            isCapturing={isCapturing}
                                            setIsCapturing={setIsCapturing}
                                            disabled={isLoading}
                                            mode="verification"
                                        />
                                    </>
                                )}
                                
                                {verificationResult && (
                                    <div className={`alert ${verificationResult.success ? 'alert-success' : 'alert-error'}`} style={{ marginTop: '20px' }}>
                                        <h4>
                                            {verificationResult.success ? '✅ Verification Successful' : '❌ Verification Failed'}
                                        </h4>
                                        <div className="info-grid" style={{ marginTop: '15px' }}>
                                            <div className="info-item">
                                                <div className="info-label">Similarity Score</div>
                                                <div className="info-value">
                                                    {(verificationResult.similarity_score * 100).toFixed(1)}%
                                                </div>
                                            </div>
                                            <div className="info-item">
                                                <div className="info-label">Biometric Detected</div>
                                                <div className="info-value">
                                                    {verificationResult.face_detected ? 'Yes' : 'No'}
                                                </div>
                                            </div>
                                            <div className="info-item">
                                                <div className="info-label">Threshold</div>
                                                <div className="info-value">
                                                    {(verificationResult.threshold * 100).toFixed(1)}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {isLoading && (
                                    <div className="loading" style={{ justifyContent: 'center', marginTop: '20px' }}>
                                        <div className="spinner"></div>
                                        Processing {verificationTab} verification...
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
                
                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div>
                        <h3 style={{ marginBottom: '20px' }}>Biometric Settings</h3>
                        
                        {user?.is_enrolled ? (
                            <div>
                                <div className="alert alert-success">
                                    <h4>✅ Biometric Authentication Enabled</h4>
                                    <p>Your biometric data is enrolled and ready for authentication.</p>
                                </div>
                                
                                <div style={{ marginTop: '30px' }}>
                                    <h4 style={{ color: '#dc3545', marginBottom: '15px' }}>⚠️ Danger Zone</h4>
                                    
                                    <div className="alert alert-error">
                                        <h4 style={{ marginBottom: '10px' }}>Delete Biometric Template</h4>
                                        <p style={{ marginBottom: '15px' }}>
                                            This will permanently delete your enrolled biometric data. 
                                            You will need to re-enroll to use biometric authentication again.
                                        </p>
                                        <button 
                                            className="btn btn-danger"
                                            onClick={handleDeleteTemplate}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <div className="loading">
                                                    <div className="spinner"></div>
                                                    Deleting...
                                                </div>
                                            ) : (
                                                'Delete Biometric Data'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="alert alert-info">
                                <h4>📱 No Biometric Data</h4>
                                <p>You haven't enrolled any biometric data yet. Enroll now to enable biometric authentication.</p>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={() => setActiveTab('enroll')}
                                    style={{ marginTop: '15px' }}
                                >
                                    Enroll Biometric Data
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BiometricPage;
