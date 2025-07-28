import React, { useState, useEffect } from 'react';
import BiometricAuthAPI from '../services/api';

const ProfilePage = ({ user, onUserUpdate }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Profile form data
    const [profileData, setProfileData] = useState({
        username: '',
        email: '',
        full_name: '',
        phone: ''
    });
    
    // Password form data
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    const api = new BiometricAuthAPI();
    
    useEffect(() => {
        if (user) {
            setProfileData({
                username: user.username || '',
                email: user.email || '',
                full_name: user.full_name || '',
                phone: user.phone || ''
            });
        }
    }, [user]);
    
    const handleProfileInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handlePasswordInputChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');
        
        try {
            const result = await api.updateUserProfile(profileData);
            
            if (result.success) {
                setSuccess(result.message || 'Profile updated successfully!');
                if (result.user) {
                    onUserUpdate(result.user);
                }
            } else {
                setError(result.message || 'Failed to update profile');
            }
        } catch (error) {
            setError(error.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }
        
        if (passwordData.newPassword.length < 8) {
            setError('New password must be at least 8 characters long');
            return;
        }
        
        setIsLoading(true);
        setError('');
        setSuccess('');
        
        try {
            const result = await api.changePassword(
                passwordData.currentPassword,
                passwordData.newPassword
            );
            
            if (result.success) {
                setSuccess('Password changed successfully!');
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                setError(result.message || 'Failed to change password');
            }
        } catch (error) {
            setError(error.message || 'Failed to change password');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDeleteAccount = async () => {
        if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return;
        }
        
        if (!window.confirm('This will permanently delete all your data. Are you absolutely sure?')) {
            return;
        }
        
        setIsLoading(true);
        setError('');
        
        try {
            const result = await api.deleteAccount();
            
            if (result.success) {
                alert('Account deleted successfully. You will be logged out.');
                api.logout();
                window.location.href = '/';
            } else {
                setError(result.message || 'Failed to delete account');
            }
        } catch (error) {
            setError(error.message || 'Failed to delete account');
        } finally {
            setIsLoading(false);
        }
    };
    
    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };
    
    return (
        <div className="container" style={{ padding: '40px 20px' }}>
            <div className="card card-wide">
                <div className="profile-header">
                    <div className="profile-avatar">
                        {getInitials(user?.full_name)}
                    </div>
                    <div className="profile-info">
                        <h2>{user?.full_name || user?.username}</h2>
                        <p>{user?.email}</p>
                    </div>
                </div>
                
                {/* Tab Navigation */}
                <div style={{ 
                    display: 'flex', 
                    borderBottom: '2px solid #e9ecef', 
                    marginBottom: '30px',
                    gap: '20px'
                }}>
                    <button
                        className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('profile')}
                        style={{ 
                            borderRadius: '0', 
                            borderBottom: activeTab === 'profile' ? '2px solid #667eea' : 'none',
                            padding: '10px 20px'
                        }}
                    >
                        Profile Information
                    </button>
                    <button
                        className={`btn ${activeTab === 'password' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('password')}
                        style={{ 
                            borderRadius: '0', 
                            borderBottom: activeTab === 'password' ? '2px solid #667eea' : 'none',
                            padding: '10px 20px'
                        }}
                    >
                        Change Password
                    </button>
                    <button
                        className={`btn ${activeTab === 'danger' ? 'btn-danger' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('danger')}
                        style={{ 
                            borderRadius: '0', 
                            borderBottom: activeTab === 'danger' ? '2px solid #dc3545' : 'none',
                            padding: '10px 20px'
                        }}
                    >
                        Danger Zone
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
                        {error}
                    </div>
                )}
                
                {/* Profile Information Tab */}
                {activeTab === 'profile' && (
                    <form onSubmit={handleProfileUpdate}>
                        <div className="info-grid">
                            <div className="form-group">
                                <label className="form-label">Username</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={profileData.username}
                                    onChange={handleProfileInputChange}
                                    className="form-input"
                                    disabled={isLoading}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={profileData.email}
                                    onChange={handleProfileInputChange}
                                    className="form-input"
                                    disabled={isLoading}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={profileData.full_name}
                                    onChange={handleProfileInputChange}
                                    className="form-input"
                                    disabled={isLoading}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={profileData.phone}
                                    onChange={handleProfileInputChange}
                                    className="form-input"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        
                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="loading">
                                    <div className="spinner"></div>
                                    Updating...
                                </div>
                            ) : (
                                'Update Profile'
                            )}
                        </button>
                    </form>
                )}
                
                {/* Change Password Tab */}
                {activeTab === 'password' && (
                    <form onSubmit={handlePasswordChange}>
                        <div className="form-group">
                            <label className="form-label">Current Password</label>
                            <input
                                type="password"
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordInputChange}
                                className="form-input"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label className="form-label">New Password</label>
                            <input
                                type="password"
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordInputChange}
                                className="form-input"
                                required
                                disabled={isLoading}
                                minLength={8}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label className="form-label">Confirm New Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordInputChange}
                                className="form-input"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        
                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="loading">
                                    <div className="spinner"></div>
                                    Changing...
                                </div>
                            ) : (
                                'Change Password'
                            )}
                        </button>
                    </form>
                )}
                
                {/* Danger Zone Tab */}
                {activeTab === 'danger' && (
                    <div>
                        <h3 style={{ color: '#dc3545', marginBottom: '20px' }}>
                            ⚠️ Danger Zone
                        </h3>
                        
                        <div className="alert alert-error">
                            <h4 style={{ marginBottom: '10px' }}>Delete Account</h4>
                            <p style={{ marginBottom: '15px' }}>
                                This action will permanently delete your account and all associated data. 
                                This cannot be undone.
                            </p>
                            <button 
                                className="btn btn-danger"
                                onClick={handleDeleteAccount}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="loading">
                                        <div className="spinner"></div>
                                        Deleting...
                                    </div>
                                ) : (
                                    'Delete Account'
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
