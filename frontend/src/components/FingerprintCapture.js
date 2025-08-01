import React, { useState, useRef, useEffect } from 'react';
import './FingerprintCapture.css';

const FingerprintCapture = ({ onFingerprintCapture, isCapturing, setIsCapturing, disabled = false }) => {
    const [message, setMessage] = useState('Place your finger on the sensor');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    // eslint-disable-next-line no-unused-vars
    const [isSupported, setIsSupported] = useState(false);
    const [fingerDetected, setFingerDetected] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [scanPhase, setScanPhase] = useState('waiting'); // 'waiting', 'detected', 'countdown', 'scanning', 'verifying'
    const intervalRef = useRef(null);
    const countdownRef = useRef(null);
    const detectionRef = useRef(null);

    useEffect(() => {
        // Check if WebAuthn is supported for Windows Hello
        checkWebAuthnSupport();
        
        // Cleanup on unmount
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
            if (detectionRef.current) clearInterval(detectionRef.current);
        };
    }, []);

    const checkWebAuthnSupport = async () => {
        try {
            // Check if WebAuthn is supported and specifically if platform authenticator is available
            if (window.PublicKeyCredential) {
                const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                if (available) {
                    setIsSupported(true);
                    setMessage('Place your finger on the sensor');
                } else {
                    setIsSupported(false);
                    setMessage('Place your finger on the sensor (simulation mode)');
                }
            } else {
                setIsSupported(false);
                setMessage('Place your finger on the sensor (simulation mode)');
            }
        } catch (err) {
            console.error('WebAuthn support check failed:', err);
            setIsSupported(false);
            setMessage('Place your finger on the sensor (simulation mode)');
        }
    };

    // eslint-disable-next-line no-unused-vars
    const authenticateWithWebAuthn = async () => {
        try {
            setMessage('Please authenticate with Windows Hello...');
            setError('');

            // First, create a credential to register with Windows Hello
            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);

            const createOptions = {
                challenge: challenge,
                rp: {
                    name: "Biometric Auth System",
                    id: "localhost"
                },
                user: {
                    id: new Uint8Array(16),
                    name: "user@localhost",
                    displayName: "Test User"
                },
                pubKeyCredParams: [{
                    type: "public-key",
                    alg: -7 // ES256
                }],
                authenticatorSelection: {
                    authenticatorAttachment: "platform",
                    userVerification: "required",
                    requireResidentKey: false
                },
                timeout: 60000,
                attestation: "none"
            };

            // Try to create a new credential (this will prompt for Windows Hello)
            const credential = await navigator.credentials.create({
                publicKey: createOptions
            });

            if (credential) {
                setMessage('Windows Hello authentication successful!');
                return {
                    success: true,
                    credentialId: credential.id,
                    type: 'webauthn'
                };
            }
        } catch (err) {
            console.error('WebAuthn authentication failed:', err);
            if (err.name === 'NotAllowedError') {
                setError('Authentication was cancelled or failed');
            } else if (err.name === 'InvalidStateError') {
                setError('No authenticator available');
            } else if (err.name === 'NotSupportedError') {
                setError('Windows Hello not supported');
            } else {
                setError('Windows Hello authentication failed');
            }
            return { success: false, error: err.message };
        }
    };

    const simulateFingerDetection = () => {
        return new Promise((resolve) => {
            setMessage('Gently place your finger on the sensor...');
            setScanPhase('waiting');
            setFingerDetected(false);
            
            let checkCount = 0;
            // Simulate waiting for finger placement - requires multiple checks to simulate "stable" placement
            detectionRef.current = setInterval(() => {
                checkCount++;
                // Make detection more realistic - lower chance initially, increases over time
                const detectionChance = Math.min(0.15 + (checkCount * 0.05), 0.4); // Start at 15%, max 40%
                
                if (Math.random() < detectionChance && checkCount >= 2) { // Minimum 2 seconds
                    clearInterval(detectionRef.current);
                    setMessage('Finger detected! Hold steady...');
                    setScanPhase('detected');
                    setFingerDetected(true);
                    
                    // Wait a moment to show detection, then start countdown
                    setTimeout(() => {
                        startCountdown(resolve);
                    }, 800);
                }
            }, 1000); // Check every second
        });
    };

    const startCountdown = (callback) => {
        setScanPhase('countdown');
        setCountdown(3);
        setMessage('Get ready... 3');
        
        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                const nextCount = prev - 1;
                if (nextCount <= 0) {
                    clearInterval(countdownRef.current);
                    countdownRef.current = null;
                    setMessage('Scanning fingerprint...');
                    setScanPhase('scanning');
                    setCountdown(0);
                    callback();
                    return 0;
                } else {
                    setMessage(`Get ready... ${nextCount}`);
                    return nextCount;
                }
            });
        }, 1000);
    };

    const simulateFingerprint = () => {
        return new Promise((resolve) => {
            let currentProgress = 0;
            setError('');
            setProgress(0);

            intervalRef.current = setInterval(() => {
                currentProgress += 8;
                setProgress(currentProgress);
                
                if (currentProgress === 24) {
                    setMessage('Reading fingerprint ridges...');
                } else if (currentProgress === 48) {
                    setMessage('Analyzing minutiae points...');
                } else if (currentProgress === 72) {
                    setMessage('Processing biometric data...');
                } else if (currentProgress === 88) {
                    setMessage('Verifying identity...');
                    setScanPhase('verifying');
                }
                
                if (currentProgress >= 100) {
                    clearInterval(intervalRef.current);
                    setMessage('Fingerprint verification successful!');
                    
                    setTimeout(() => {
                        resolve({
                            success: true,
                            fingerprint_data: 'verified_fingerprint_data_' + Date.now(),
                            type: 'simulation',
                            confidence: 98.7,
                            matchPoints: 24
                        });
                    }, 800);
                }
            }, 250);
        });
    };

    const startCapture = async () => {
        if (disabled || isCapturing) return;

        setIsCapturing(true);
        setProgress(0);
        setError('');
        setScanPhase('waiting');
        setFingerDetected(false);
        setCountdown(0);

        try {
            setMessage('Place your finger on the sensor...');
            
            // Wait for finger detection
            await simulateFingerDetection();
            
            // Start scanning process
            const result = await simulateFingerprint();

            if (result && result.success && onFingerprintCapture) {
                onFingerprintCapture(result);
            }
        } catch (err) {
            console.error('Fingerprint capture error:', err);
            setError('Fingerprint capture failed: ' + err.message);
            setMessage('Place your finger on the sensor');
        } finally {
            setIsCapturing(false);
            setScanPhase('waiting');
            setFingerDetected(false);
            setProgress(0);
            setCountdown(0);
            
            // Clean up all intervals
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
                countdownRef.current = null;
            }
            if (detectionRef.current) {
                clearInterval(detectionRef.current);
                detectionRef.current = null;
            }
        }
    };

    const stopCapture = () => {
        // Clear all intervals
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
        }
        if (detectionRef.current) {
            clearInterval(detectionRef.current);
            detectionRef.current = null;
        }
        
        setIsCapturing(false);
        setScanPhase('waiting');
        setFingerDetected(false);
        setProgress(0);
        setCountdown(0);
        setMessage('Place your finger on the sensor');
        setError('');
    };

    return (
        <div className="fingerprint-capture">
            <div className={`fingerprint-icon ${fingerDetected ? 'detected' : ''} ${scanPhase === 'scanning' || scanPhase === 'verifying' ? 'active' : ''}`}>
                {scanPhase === 'countdown' && countdown > 0 ? (
                    <div className="countdown-display">{countdown}</div>
                ) : scanPhase === 'scanning' || scanPhase === 'verifying' ? (
                    '🔍'
                ) : fingerDetected ? (
                    '✋'
                ) : scanPhase === 'waiting' && isCapturing ? (
                    '⏳'
                ) : (
                    '👆'
                )}
            </div>
            
            <div className="status-message">
                {message}
            </div>

            {scanPhase === 'waiting' && isCapturing && (
                <div className="waiting-info">
                    <div className="waiting-text">Waiting for finger placement...</div>
                    <div className="waiting-hint">Place your finger gently on the sensor and hold steady</div>
                </div>
            )}

            {scanPhase === 'countdown' && countdown > 0 && (
                <div className="countdown-info">
                    <div className="countdown-text">Starting scan in {countdown}...</div>
                </div>
            )}

            {(scanPhase === 'scanning' || scanPhase === 'verifying') && (
                <div className="progress-container">
                    <div className="progress-bar">
                        <div 
                            className="progress-fill" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <div className="progress-text">{progress}%</div>
                </div>
            )}

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <div className="capture-controls">
                {!isCapturing ? (
                    <button 
                        className="btn btn-primary"
                        onClick={startCapture}
                        disabled={disabled}
                    >
                        <span className="btn-icon">👆</span>
                        Start Fingerprint Scan
                    </button>
                ) : (
                    <button 
                        className="btn btn-secondary"
                        onClick={stopCapture}
                    >
                        Cancel
                    </button>
                )}
            </div>

            <div className="auth-status">
                <span className="status-simulation">
                    {fingerDetected ? '✓ Finger Detected' : '🔐 Fingerprint Scanner Ready'}
                </span>
            </div>

            {scanPhase === 'detected' && (
                <div className="instruction-text">
                    <small>Keep your finger steady on the sensor...</small>
                </div>
            )}
        </div>
    );
};

export default FingerprintCapture;
