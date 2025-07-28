import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CongratulationsPage = ({ user, onComplete }) => {
    const [showFireworks, setShowFireworks] = useState(false);
    const [showContent, setShowContent] = useState(false);
    const navigate = useNavigate();
    
    useEffect(() => {
        // Start fireworks animation immediately
        setShowFireworks(true);
        
        // Show content after a brief delay
        const contentTimer = setTimeout(() => {
            setShowContent(true);
        }, 500);
        
        // Auto redirect to dashboard after 4 seconds
        const redirectTimer = setTimeout(() => {
            if (onComplete) {
                onComplete();
            } else {
                navigate('/dashboard');
            }
        }, 4000);
        
        return () => {
            clearTimeout(contentTimer);
            clearTimeout(redirectTimer);
        };
    }, [navigate, onComplete]);
    
    const handleContinue = () => {
        if (onComplete) {
            onComplete();
        } else {
            navigate('/dashboard');
        }
    };
    
    return (
        <div className="congratulations-container">
            {/* Fireworks Animation */}
            {showFireworks && (
                <div className="fireworks-container">
                    <div className="firework firework-1"></div>
                    <div className="firework firework-2"></div>
                    <div className="firework firework-3"></div>
                    <div className="firework firework-4"></div>
                </div>
            )}
            
            {/* Floating Particles */}
            <div className="particles-container">
                {[...Array(50)].map((_, i) => (
                    <div key={i} className={`particle particle-${i % 5}`}></div>
                ))}
            </div>
            
            {/* Main Content */}
            <div className={`congratulations-content ${showContent ? 'show' : ''}`}>
                <div className="success-icon-container">
                    <div className="success-icon">
                        <div className="success-checkmark">
                            <div className="check-icon">
                                <span className="icon-line line-tip"></span>
                                <span className="icon-line line-long"></span>
                                <div className="icon-circle"></div>
                                <div className="icon-fix"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="congratulations-text">
                    <h1 className="congratulations-title">
                        🎉 Authentication Successful! 🎉
                    </h1>
                    
                    <div className="success-details">
                        <div className="user-welcome">
                            <h2>Welcome back, <span className="username">{user?.username || 'User'}!</span></h2>
                        </div>
                        
                        <div className="authentication-info">
                            <div className="auth-method">
                                <span className="auth-icon">🔐</span>
                                <span>Biometric Authentication Verified</span>
                            </div>
                            <div className="auth-method">
                                <span className="auth-icon">✅</span>
                                <span>Identity Confirmed</span>
                            </div>
                            <div className="auth-method">
                                <span className="auth-icon">🛡️</span>
                                <span>Secure Access Granted</span>
                            </div>
                        </div>
                        
                        <div className="system-status">
                            <div className="status-item">
                                <span className="status-dot status-active"></span>
                                <span>System Security: Active</span>
                            </div>
                            <div className="status-item">
                                <span className="status-dot status-verified"></span>
                                <span>Biometric Match: 99.8%</span>
                            </div>
                            <div className="status-item">
                                <span className="status-dot status-encrypted"></span>
                                <span>Session: Encrypted</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="loading-progress">
                        <div className="progress-bar">
                            <div className="progress-fill"></div>
                        </div>
                        <p className="loading-text">Initializing secure session...</p>
                    </div>
                    
                    <button 
                        className="continue-button"
                        onClick={handleContinue}
                    >
                        <span className="button-text">Continue to Dashboard</span>
                        <span className="button-arrow">→</span>
                    </button>
                </div>
            </div>
            
        </div>
    );
};

export default CongratulationsPage;
