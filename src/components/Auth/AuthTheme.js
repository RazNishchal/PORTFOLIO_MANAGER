import React, { useEffect, useState } from 'react';
import '../css/AuthTheme.css';

const AuthTheme = ({ children, title, subtitle, status, onBackToLogin }) => {
    // Initial state setup to avoid flicker on first load
    const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');

    useEffect(() => {
        const handleThemeChange = () => {
            const currentTheme = localStorage.getItem('theme') === 'dark';
            setIsDark(currentTheme);
        };

        // 1. Listen for Custom Event (for instant toggle within the app)
        window.addEventListener('themeChange', handleThemeChange);

        // 2. Listen for Storage Event (for cross-tab synchronization)
        window.addEventListener('storage', handleThemeChange);

        return () => {
            window.removeEventListener('themeChange', handleThemeChange);
            window.removeEventListener('storage', handleThemeChange);
        };
    }, []);

    // Safety check: ensure status exists before checking type
    const isSuccessState = status?.type === 'success';

    return (
        <div className={`auth-page-wrapper ${isDark ? 'auth-dark-mode' : 'auth-light-mode'}`}>
            <div className="auth-card">
                {!isSuccessState ? (
                    <>
                        <div className="auth-header">
                            <h1>{title}</h1>
                            <p>{subtitle}</p>
                        </div>
                        {/* Render status message if it exists */}
                        {status?.text && (
                            <div className={`status-msg ${status.type}`}>
                                {status.text}
                            </div>
                        )}
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
                        <p>{status?.text || "A link has been sent to your email."}</p>
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