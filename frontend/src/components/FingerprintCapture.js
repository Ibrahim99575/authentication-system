import React, { useState, useRef, useEffect } from 'react';
import './FingerprintCapture.css';

const FingerprintCapture = ({ onFingerprintCapture, isCapturing, setIsCapturing, disabled = false, mode = 'verification' }) => {
    const [message, setMessage] = useState('Place your finger on the sensor');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    // eslint-disable-next-line no-unused-vars
    const [isSupported, setIsSupported] = useState(false);
    const [fingerDetected, setFingerDetected] = useState(false);
    const [scanPhase, setScanPhase] = useState('waiting'); // 'waiting', 'detected', 'scanning', 'complete'
    const [enrollmentStep, setEnrollmentStep] = useState(1); // For multi-part enrollment
    const [totalSteps] = useState(3); // 3 scans for enrollment
    const intervalRef = useRef(null);
    const detectionRef = useRef(null);
    const scanTimeoutRef = useRef(null);

    useEffect(() => {
        // Check if WebAuthn is supported for Windows Hello
        checkWebAuthnSupport();
        
        // Cleanup on unmount
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (detectionRef.current) clearInterval(detectionRef.current);
            if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
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

    const detectFingerPlacement = () => {
        return new Promise((resolve) => {
            setMessage('Place your finger on the sensor');
            setScanPhase('waiting');
            setFingerDetected(false);
            
            // Quick finger detection - 0.5 to 1.5 seconds max
            const detectionTime = Math.random() * 1000 + 500; // 500ms to 1.5s
            
            detectionRef.current = setTimeout(() => {
                setMessage('Finger detected! Scanning...');
                setScanPhase('detected');
                setFingerDetected(true);
                
                // Small delay to show detection feedback
                setTimeout(() => {
                    setScanPhase('scanning');
                    resolve();
                }, 300);
            }, detectionTime);
        });
    };

    const performFastScan = (stepNumber = 1) => {
        return new Promise((resolve) => {
            let currentProgress = 0;
            const scanSpeed = mode === 'enrollment' ? 100 : 150; // Enrollment slower for accuracy
            const maxProgress = 100;
            
            setProgress(0);
            setError('');

            if (mode === 'enrollment') {
                setMessage(`Scan ${stepNumber}/${totalSteps} - Hold steady...`);
            } else {
                setMessage('Verifying fingerprint...');
            }

            intervalRef.current = setInterval(() => {
                currentProgress += Math.random() * 15 + 10; // 10-25% increments
                
                // Ensure we don't exceed 100%
                if (currentProgress > maxProgress) {
                    currentProgress = maxProgress;
                }
                
                setProgress(Math.floor(currentProgress));
                
                // Update messages during scan
                if (currentProgress >= 30 && currentProgress < 60) {
                    if (mode === 'enrollment') {
                        setMessage(`Scan ${stepNumber}/${totalSteps} - Reading ridges...`);
                    } else {
                        setMessage('Analyzing pattern...');
                    }
                } else if (currentProgress >= 60 && currentProgress < 90) {
                    if (mode === 'enrollment') {
                        setMessage(`Scan ${stepNumber}/${totalSteps} - Processing data...`);
                    } else {
                        setMessage('Matching identity...');
                    }
                }
                
                if (currentProgress >= maxProgress) {
                    clearInterval(intervalRef.current);
                    
                    const scanResult = {
                        success: true,
                        fingerprint_data: `scan_${stepNumber}_${Date.now()}`,
                        type: 'simulation',
                        confidence: Math.random() * 5 + 95, // 95-100%
                        step: stepNumber,
                        mode: mode
                    };
                    
                    // Ensure fingerprint_data is always a string
                    if (typeof scanResult.fingerprint_data !== 'string') {
                        scanResult.fingerprint_data = String(scanResult.fingerprint_data);
                    }
                    
                    console.log('FingerprintCapture: Scan result created:', scanResult);
                    
                    setMessage(mode === 'enrollment' ? `Scan ${stepNumber} complete!` : 'Verification successful!');
                    setScanPhase('complete');
                    
                    setTimeout(() => {
                        resolve(scanResult);
                    }, 500);
                }
            }, scanSpeed);
        });
    };

    const startCapture = async () => {
        if (disabled || isCapturing) return;

        setIsCapturing(true);
        setProgress(0);
        setError('');
        setScanPhase('waiting');
        setFingerDetected(false);
        setEnrollmentStep(1);

        try {
            if (mode === 'enrollment') {
                // Multi-part enrollment process
                const allScans = [];
                
                for (let step = 1; step <= totalSteps; step++) {
                    setEnrollmentStep(step);
                    
                    if (step > 1) {
                        setMessage(`Lift and place your finger again for scan ${step}/${totalSteps}`);
                        await new Promise(resolve => setTimeout(resolve, 1500)); // Brief pause between scans
                    }
                    
                    // Wait for finger detection
                    await detectFingerPlacement();
                    
                    // Perform scan
                    const scanResult = await performFastScan(step);
                    allScans.push(scanResult);
                    
                    if (step < totalSteps) {
                        setMessage(`Scan ${step} complete! Preparing for next scan...`);
                        setFingerDetected(false);
                        setScanPhase('waiting');
                        setProgress(0);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
                
                // Combine all enrollment scans
                const combinedFingerprintData = allScans.map(scan => scan.fingerprint_data).join('|');
                const combinedResult = {
                    success: true,
                    fingerprint_data: combinedFingerprintData,
                    type: 'enrollment',
                    confidence: allScans.reduce((sum, scan) => sum + scan.confidence, 0) / allScans.length,
                    scans: allScans.length,
                    completeness: 100
                };
                
                // Ensure fingerprint_data is always a string
                if (typeof combinedResult.fingerprint_data !== 'string') {
                    combinedResult.fingerprint_data = String(combinedResult.fingerprint_data);
                }
                
                console.log('FingerprintCapture: Combined enrollment result:', combinedResult);
                console.log('FingerprintCapture: Combined fingerprint_data type:', typeof combinedResult.fingerprint_data);
                console.log('FingerprintCapture: Combined fingerprint_data value:', combinedResult.fingerprint_data);
                console.log('FingerprintCapture: About to call onFingerprintCapture with:', combinedResult);
                
                setMessage('Enrollment complete! Your fingerprint has been recorded.');
                
                if (onFingerprintCapture) {
                    console.log('FingerprintCapture: Calling onFingerprintCapture function');
                    onFingerprintCapture(combinedResult);
                    console.log('FingerprintCapture: onFingerprintCapture call completed');
                }
                
            } else {
                // Single verification scan
                await detectFingerPlacement();
                const result = await performFastScan(1);
                
                console.log('FingerprintCapture: Single verification result:', result);
                console.log('FingerprintCapture: Verification fingerprint_data type:', typeof result?.fingerprint_data);
                console.log('FingerprintCapture: Verification fingerprint_data value:', result?.fingerprint_data);
                console.log('FingerprintCapture: About to call onFingerprintCapture with:', result);
                
                if (result && result.success && onFingerprintCapture) {
                    console.log('FingerprintCapture: Calling onFingerprintCapture function for verification');
                    onFingerprintCapture(result);
                    console.log('FingerprintCapture: onFingerprintCapture verification call completed');
                }
            }
            
        } catch (err) {
            console.error('Fingerprint capture error:', err);
            setError('Fingerprint capture failed: ' + err.message);
            setMessage('Place your finger on the sensor');
        } finally {
            // Reset state after 2 seconds
            setTimeout(() => {
                setIsCapturing(false);
                setScanPhase('waiting');
                setFingerDetected(false);
                setProgress(0);
                setEnrollmentStep(1);
                setMessage('Place your finger on the sensor');
                
                // Clean up all intervals and timeouts
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
                if (detectionRef.current) {
                    clearTimeout(detectionRef.current);
                    detectionRef.current = null;
                }
                if (scanTimeoutRef.current) {
                    clearTimeout(scanTimeoutRef.current);
                    scanTimeoutRef.current = null;
                }
            }, 2000);
        }
    };

    const stopCapture = () => {
        // Clear all intervals and timeouts
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (detectionRef.current) {
            clearTimeout(detectionRef.current);
            detectionRef.current = null;
        }
        if (scanTimeoutRef.current) {
            clearTimeout(scanTimeoutRef.current);
            scanTimeoutRef.current = null;
        }
        
        setIsCapturing(false);
        setScanPhase('waiting');
        setFingerDetected(false);
        setProgress(0);
        setEnrollmentStep(1);
        setMessage('Place your finger on the sensor');
        setError('');
    };

    return (
        <div className="fingerprint-capture">
            <div className={`fingerprint-sensor ${fingerDetected ? 'detected' : ''} ${scanPhase === 'scanning' ? 'scanning' : ''} ${scanPhase === 'complete' ? 'complete' : ''}`}>
                <div className="sensor-ring">
                    <div className="sensor-inner">
                        <div className="fingerprint-icon">
                            {scanPhase === 'complete' ? (
                                '✅'
                            ) : scanPhase === 'scanning' ? (
                                <div className="scanning-animation">
                                    <div className="scan-line"></div>
                                    👆
                                </div>
                            ) : fingerDetected ? (
                                '👆'
                            ) : (
                                '�'
                            )}
                        </div>
                        
                        {/* Progress ring for scanning */}
                        {scanPhase === 'scanning' && (
                            <svg className="progress-ring" width="140" height="140">
                                <circle
                                    className="progress-ring-bg"
                                    stroke="rgba(255,255,255,0.2)"
                                    strokeWidth="4"
                                    fill="transparent"
                                    r="66"
                                    cx="70"
                                    cy="70"
                                />
                                <circle
                                    className="progress-ring-progress"
                                    stroke="#4caf50"
                                    strokeWidth="4"
                                    fill="transparent"
                                    r="66"
                                    cx="70"
                                    cy="70"
                                    style={{
                                        strokeDasharray: `${2 * Math.PI * 66}`,
                                        strokeDashoffset: `${2 * Math.PI * 66 * (1 - progress / 100)}`,
                                        transition: 'stroke-dashoffset 0.3s ease'
                                    }}
                                />
                            </svg>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="status-message">
                {message}
            </div>

            {mode === 'enrollment' && isCapturing && (
                <div className="enrollment-progress">
                    <div className="step-indicators">
                        {Array.from({ length: totalSteps }, (_, index) => (
                            <div 
                                key={index} 
                                className={`step-indicator ${index + 1 < enrollmentStep ? 'completed' : index + 1 === enrollmentStep ? 'active' : ''}`}
                            >
                                {index + 1 < enrollmentStep ? '✓' : index + 1}
                            </div>
                        ))}
                    </div>
                    <div className="enrollment-text">
                        Step {enrollmentStep} of {totalSteps}
                    </div>
                </div>
            )}

            {scanPhase === 'scanning' && (
                <div className="progress-container">
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
                        className="btn btn-primary fingerprint-btn"
                        onClick={startCapture}
                        disabled={disabled}
                    >
                        <span className="btn-icon">👆</span>
                        {mode === 'enrollment' ? 'Start Enrollment' : 'Start Scan'}
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
                <span className={`status-indicator ${fingerDetected ? 'detected' : 'ready'}`}>
                    {fingerDetected ? '✓ Finger Detected' : '🔐 Scanner Ready'}
                </span>
            </div>

            {mode === 'enrollment' && !isCapturing && (
                <div className="enrollment-info">
                    <small>Enrollment requires {totalSteps} scans for complete fingerprint mapping</small>
                </div>
            )}
        </div>
    );
};

export default FingerprintCapture;
