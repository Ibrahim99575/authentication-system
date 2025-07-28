import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BiometricAuthAPI from '../services/api';

const Header = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const api = new BiometricAuthAPI();
    
    const handleLogout = () => {
        api.logout();
        onLogout();
        navigate('/');
    };
    
    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };
    
    return (
        <header className="header">
            <div className="container">
                <div className="header-content">
                    <Link to="/" className="logo">
                        🔐 BiometricAuth
                    </Link>
                    
                    {user ? (
                        <nav className="nav-menu">
                            <Link to="/dashboard" className="nav-link">
                                Dashboard
                            </Link>
                            <Link to="/profile" className="nav-link">
                                Profile
                            </Link>
                            <Link to="/biometric" className="nav-link">
                                Biometric
                            </Link>
                            
                            <div className="user-info">
                                <div className="user-avatar">
                                    {getInitials(user.full_name)}
                                </div>
                                <span>{user.username}</span>
                                <button 
                                    className="btn btn-secondary" 
                                    onClick={handleLogout}
                                    style={{ padding: '6px 12px', fontSize: '14px' }}
                                >
                                    Logout
                                </button>
                            </div>
                        </nav>
                    ) : (
                        <nav className="nav-menu">
                            <Link to="/" className="nav-link">
                                Login
                            </Link>
                        </nav>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
