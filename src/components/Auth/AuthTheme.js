import React, { useEffect, useState } from 'react';
import '../css/AuthTheme.css';

const AuthTheme = ({ children, title, subtitle, status, onBackToLogin }) => {
    const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');

    useEffect(() => {
        const handleThemeChange = () => {
            const currentTheme = localStorage.getItem('theme') === 'dark';
            setIsDark(currentTheme);
        };
        window.addEventListener('themeChange', handleThemeChange);
        window.addEventListener('storage', handleThemeChange);
        return () => {
            window.removeEventListener('themeChange', handleThemeChange);
            window.removeEventListener('storage', handleThemeChange);
        };
    }, []);

    const isSuccessView = status?.type === 'success' && status?.text.includes('link sent');

    return (
        <div className={`auth-page-wrapper ${isDark ? 'auth-dark-mode' : 'auth-light-mode'}`}>
            <div className="auth-card">
                {!isSuccessView ? (
                    <>
                        <div className="auth-header">
                            <h1>{title}</h1>
                            {subtitle && <p>{subtitle}</p>}
                        </div>
                        <div className="auth-body">
                            {children}
                        </div>
                    </>
                ) : (
                    <div className="auth-success-view">
                        <div className="success-icon-wrapper">
                            <div className="success-checkmark"></div>
                        </div>
                        <h2>Check Your Email</h2>
                        {/* No textTransform: lowercase here */}
                        <p>
                            {status?.text || "A link has been sent to your email."}
                        </p>
                        <button className="btn-auth-secondary" onClick={onBackToLogin}>
                            Back to Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthTheme;