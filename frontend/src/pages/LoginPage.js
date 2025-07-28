import React from 'react';
import AuthForm from '../components/AuthForm';

const LoginPage = ({ onLogin }) => {
    return (
        <div className="container" style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: 'calc(100vh - 80px)',
            padding: '40px 20px'
        }}>
            <AuthForm onAuthSuccess={onLogin} />
        </div>
    );
};

export default LoginPage;
