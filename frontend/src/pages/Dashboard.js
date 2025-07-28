import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard = ({ user }) => {
    const features = [
        {
            icon: '👤',
            title: 'Profile Management',
            description: 'View and update your personal information, change passwords, and manage account settings.',
            link: '/profile',
            action: 'Manage Profile'
        },
        {
            icon: '🔍',
            title: 'Biometric Security',
            description: 'Enroll your biometric data, verify your identity, and manage biometric authentication settings.',
            link: '/biometric',
            action: 'Biometric Settings'
        },
        {
            icon: '🔐',
            title: 'Security Settings',
            description: 'Configure two-factor authentication, review login history, and manage security preferences.',
            link: '/profile',
            action: 'Security Settings'
        }
    ];
    
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };
    
    return (
        <div className="dashboard">
            <div className="container">
                <div className="dashboard-header">
                    <h1 className="dashboard-title">
                        {getGreeting()}, {user?.full_name || user?.username}!
                    </h1>
                    <p className="dashboard-subtitle">
                        Welcome to your secure biometric authentication dashboard
                    </p>
                </div>
                
                <div className="dashboard-grid">
                    {features.map((feature, index) => (
                        <div key={index} className="feature-card">
                            <div className="feature-icon">
                                {feature.icon}
                            </div>
                            <h3 className="feature-title">
                                {feature.title}
                            </h3>
                            <p className="feature-description">
                                {feature.description}
                            </p>
                            <Link 
                                to={feature.link} 
                                className="btn btn-primary"
                            >
                                {feature.action}
                            </Link>
                        </div>
                    ))}
                </div>
                
                <div className="card card-wide">
                    <h3 style={{ marginBottom: '20px', color: '#333' }}>
                        Account Status
                    </h3>
                    <div className="info-grid">
                        <div className="info-item">
                            <div className="info-label">Account Status</div>
                            <div className="info-value">
                                <span className={`status-badge ${user?.is_active ? 'status-active' : 'status-inactive'}`}>
                                    {user?.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Email Verification</div>
                            <div className="info-value">
                                <span className={`status-badge ${user?.is_verified ? 'status-active' : 'status-inactive'}`}>
                                    {user?.is_verified ? 'Verified' : 'Not Verified'}
                                </span>
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Biometric Enrollment</div>
                            <div className="info-value">
                                <span className={`status-badge ${user?.is_enrolled ? 'status-enrolled' : 'status-not-enrolled'}`}>
                                    {user?.is_enrolled ? 'Enrolled' : 'Not Enrolled'}
                                </span>
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Last Login</div>
                            <div className="info-value">
                                {user?.last_login ? new Date(user.last_login).toLocaleString() : 'First time login'}
                            </div>
                        </div>
                    </div>
                </div>
                
                {!user?.is_enrolled && (
                    <div className="card">
                        <div className="alert alert-info">
                            <h4 style={{ marginBottom: '10px' }}>🔍 Enable Biometric Authentication</h4>
                            <p style={{ marginBottom: '15px' }}>
                                Enhance your account security by enrolling your biometric data. 
                                This will allow you to login using facial recognition.
                            </p>
                            <Link to="/biometric" className="btn btn-primary">
                                Enroll Now
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
