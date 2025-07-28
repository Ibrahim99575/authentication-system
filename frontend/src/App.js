import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import BiometricPage from './pages/BiometricPage';
import CongratulationsPage from './pages/CongratulationsPage';
import BiometricAuthAPI from './services/api';
import './index.css';

const App = () => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showCongratulations, setShowCongratulations] = useState(false);
    
    // Create API instance only once using useMemo
    const api = useMemo(() => new BiometricAuthAPI(), []);
    
    useEffect(() => {
        checkAuthStatus();
    }, [api]); // Add api as dependency since it's stable now
    
    const checkAuthStatus = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (token) {
                api.setToken(token);
                const userProfile = await api.getUserProfile();
                setUser(userProfile);
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('access_token');
            setIsAuthenticated(false);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleLogin = (userData, token) => {
        localStorage.setItem('access_token', token);
        api.setToken(token);
        setUser(userData);
        setIsAuthenticated(true);
        setShowCongratulations(true); // Show congratulations page first
    };
    
    const handleCongratulationsComplete = () => {
        setShowCongratulations(false); // Hide congratulations and proceed to dashboard
    };
    
    const handleLogout = () => {
        localStorage.removeItem('access_token');
        api.setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        setShowCongratulations(false); // Reset congratulations state
    };
    
    const handleUserUpdate = (updatedUser) => {
        setUser(updatedUser);
    };
    
    // Loading screen
    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <div className="spinner" style={{ width: '60px', height: '60px', marginBottom: '20px' }}></div>
                <h2 style={{ color: 'white', margin: 0 }}>🔐 Biometric Auth System</h2>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: '10px 0 0 0' }}>Loading...</p>
            </div>
        );
    }
    
    // Protected Route Component
    const ProtectedRoute = ({ children }) => {
        return isAuthenticated ? children : <Navigate to="/login" replace />;
    };
    
    // Public Route Component (redirect to dashboard if already authenticated)
    const PublicRoute = ({ children }) => {
        return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
    };
    
    return (
        <Router>
            <div className="App">
                {/* Show Congratulations Page First After Login */}
                {showCongratulations && isAuthenticated && (
                    <CongratulationsPage 
                        user={user} 
                        onComplete={handleCongratulationsComplete}
                    />
                )}
                
                {/* Regular App Content */}
                {!showCongratulations && (
                    <>
                        {isAuthenticated && (
                            <Header 
                                user={user} 
                                onLogout={handleLogout}
                            />
                        )}
                        
                        <Routes>
                            {/* Public Routes */}
                            <Route 
                                path="/login" 
                                element={
                                    <PublicRoute>
                                        <LoginPage onLogin={handleLogin} />
                                    </PublicRoute>
                                } 
                            />
                            
                            {/* Protected Routes */}
                            <Route 
                                path="/dashboard" 
                                element={
                                    <ProtectedRoute>
                                        <Dashboard user={user} />
                                    </ProtectedRoute>
                                } 
                            />
                            
                            <Route 
                                path="/profile" 
                                element={
                                    <ProtectedRoute>
                                        <ProfilePage 
                                            user={user} 
                                            onUserUpdate={handleUserUpdate}
                                            onLogout={handleLogout}
                                        />
                                    </ProtectedRoute>
                                } 
                            />
                            
                            <Route 
                                path="/biometric" 
                                element={
                                    <ProtectedRoute>
                                        <BiometricPage 
                                            user={user} 
                                            onUserUpdate={handleUserUpdate}
                                        />
                                    </ProtectedRoute>
                                } 
                            />
                            
                            {/* Default Routes */}
                            <Route 
                                path="/" 
                                element={
                                    isAuthenticated ? 
                                        <Navigate to="/dashboard" replace /> : 
                                        <Navigate to="/login" replace />
                                } 
                            />
                            
                            {/* 404 Route */}
                            <Route 
                                path="*" 
                                element={
                                    <div className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>
                                        <div className="card">
                                            <h1 style={{ fontSize: '6rem', margin: '0', color: '#667eea' }}>404</h1>
                                            <h2 style={{ margin: '20px 0', color: '#333' }}>Page Not Found</h2>
                                            <p style={{ margin: '20px 0', color: '#666' }}>
                                                The page you're looking for doesn't exist.
                                            </p>
                                            <button 
                                                className="btn btn-primary"
                                                onClick={() => window.history.back()}
                                            >
                                                Go Back
                                            </button>
                                        </div>
                                    </div>
                                } 
                            />
                        </Routes>
                    </>
                )}
            </div>
        </Router>
    );
};

export default App;
