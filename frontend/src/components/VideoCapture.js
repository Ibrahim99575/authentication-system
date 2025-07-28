import React, { useRef, useState, useCallback, useEffect } from 'react';

const VideoCapture = ({ onVideoCapture, isRecording, setIsRecording, duration = 5000 }) => {
    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const [cameraPermission, setCameraPermission] = useState(null);
    const [countdown, setCountdown] = useState(0);
    
    const startCamera = useCallback(async () => {
        // Don't start camera if already started
        if (streamRef.current) return;
        
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            });
            
            streamRef.current = mediaStream;
            setCameraPermission('granted');
            
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            setCameraPermission('denied');
        }
    }, []);
    
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        }
    }, []);
    
    const startRecording = useCallback(() => {
        if (!streamRef.current) return;
        
        setIsRecording(true);
        
        try {
            mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
                mimeType: 'video/webm;codecs=vp9'
            });
        } catch (e) {
            // Fallback for browsers that don't support vp9
            mediaRecorderRef.current = new MediaRecorder(streamRef.current);
        }
        
        // Store chunks in the mediaRecorder for access in onstop
        mediaRecorderRef.current._chunks = [];
        
        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
                mediaRecorderRef.current._chunks.push(event.data);
            }
        };
        
        mediaRecorderRef.current.onstop = () => {
            // Use the chunks stored in the mediaRecorder
            const chunks = mediaRecorderRef.current._chunks || [];
            const blob = new Blob(chunks, { 
                type: mediaRecorderRef.current.mimeType || 'video/webm' 
            });
            onVideoCapture(blob);
            setIsRecording(false);
        };
        
        mediaRecorderRef.current.start();
        
        // Start countdown
        let timeLeft = duration / 1000;
        setCountdown(timeLeft);
        
        const countdownInterval = setInterval(() => {
            timeLeft -= 1;
            setCountdown(timeLeft);
            
            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                setCountdown(0);
            }
        }, 1000);
        
        // Auto-stop recording after specified duration
        setTimeout(() => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
                clearInterval(countdownInterval);
                setCountdown(0);
            }
        }, duration);
    }, [onVideoCapture, duration, setIsRecording]);
    
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setCountdown(0);
        }
    }, []);
    
    useEffect(() => {
        startCamera();
        
        // Cleanup function
        return () => {
            stopCamera();
            // Also stop any ongoing recording
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []); // Empty dependency array to run only once
    
    if (cameraPermission === 'denied') {
        return (
            <div className="video-capture">
                <div className="alert alert-error">
                    <p><strong>Camera Access Denied</strong></p>
                    <p>Please allow camera access to use biometric authentication.</p>
                    <button className="btn btn-primary" onClick={startCamera} style={{ marginTop: '10px' }}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }
    
    if (cameraPermission === null) {
        return (
            <div className="video-capture">
                <div className="alert alert-info">
                    <p>Requesting camera permission...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="video-capture">
            <div className="video-container">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="video-element"
                />
                {isRecording && (
                    <div className="recording-indicator">
                        REC {countdown > 0 && `• ${countdown}s`}
                    </div>
                )}
            </div>
            
            <div className="video-controls">
                <button 
                    className="btn btn-primary"
                    onClick={startRecording} 
                    disabled={!streamRef.current || isRecording}
                >
                    {isRecording ? 'Recording...' : 'Start Recording'}
                </button>
                
                <button 
                    className="btn btn-secondary"
                    onClick={stopRecording} 
                    disabled={!isRecording}
                >
                    Stop Recording
                </button>
            </div>
            
            {isRecording && (
                <div className="alert alert-info" style={{ marginTop: '15px' }}>
                    <p>Keep your face centered and well-lit. Recording will stop automatically in {countdown} seconds.</p>
                </div>
            )}
        </div>
    );
};

export default VideoCapture;
