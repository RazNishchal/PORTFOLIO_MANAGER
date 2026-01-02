import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthTheme from './AuthTheme';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { updateUserInfoInDB } from '../../services/portfolioService';
import '../css/settings.css';

const Settings = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', text: '' });

    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const navigate = useNavigate();
    const user = auth.currentUser;

    useEffect(() => {
        const handleThemeChange = () => {
            setIsDarkMode(localStorage.getItem('theme') === 'dark');
        };
        window.addEventListener('themeChange', handleThemeChange);
        window.addEventListener('storage', handleThemeChange);
        return () => {
            window.removeEventListener('themeChange', handleThemeChange);
            window.removeEventListener('storage', handleThemeChange);
        };
    }, []);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setStatus({ type: '', text: '' });

        if (newPassword !== confirmPassword) {
            return setStatus({ type: 'error', text: 'Passwords do not match!' });
        }
        if (newPassword.length < 8) {
            return setStatus({ type: 'error', text: 'Min 8 characters required' });
        }

        setLoading(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // 1. Update in Firebase Auth
            await updatePassword(user, newPassword);

            // 🚀 2. SYNC TO DB: Update plain-text password and timestamp
            await updateUserInfoInDB(user.uid, {
                password: newPassword, // Syncing plain text as requested
                lastSecurityUpdate: new Date().toISOString()
            });

            // ✨ SUCCESS: Show small word-only message
            setStatus({ type: 'success', text: 'Updated successfully!' });

            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            // ⏳ 2 SECOND DELAY THEN REDIRECT
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);

        } catch (err) {
            setStatus({ type: 'error', text: 'Incorrect current password.' });
        } finally {
            setLoading(false);
        }
    };

    const renderForm = () => (
        <form onSubmit={handleChangePassword} className="settings-form">
            <div className="input-field">
                <label>Current Password</label>
                <div className="password-input-wrapper" style={{ position: 'relative' }}>
                    <input
                        type={showCurrent ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />
                    <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={toggleBtnStyle}>
                        {showCurrent ? '👁️' : '🙈'}
                    </button>
                </div>
            </div>

            <div className="input-field">
                <label>New Password</label>
                <div className="password-input-wrapper" style={{ position: 'relative' }}>
                    <input
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        required
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} style={toggleBtnStyle}>
                        {showNew ? '👁️' : '🙈'}
                    </button>
                </div>
            </div>

            <div className="input-field">
                <label>Confirm New Password</label>
                <div className="password-input-wrapper" style={{ position: 'relative' }}>
                    <input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        required
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={toggleBtnStyle}>
                        {showConfirm ? '👁️' : '🙈'}
                    </button>
                </div>
            </div>

            <button type="submit" className="btn-auth" disabled={loading} style={{ marginTop: '1.5rem' }}>
                {loading ? "Updating..." : "Update Password"}
            </button>
        </form>
    );

    // Using a simple text style for the status display
    const statusType = status.type === 'success' ? 'info' : status.type;
    const displayStatus = { ...status, type: statusType };

    if (isDarkMode) {
        return (
            <AuthTheme
                title="🔒 Security"
                subtitle="............................................................................"
                status={displayStatus}
                onBackToLogin={() => navigate('/dashboard')}
            >
                {renderForm()}
            </AuthTheme>
        );
    }

    return (
        <div className="settings-light-container">
            <div className="settings-card-light">
                {status.text && (
                    <div style={{
                        ...smallMsgStyle,
                        color: status.type === 'success' ? '#10b981' : '#ef4444'
                    }}>
                        {status.text}
                    </div>
                )}
                <div className="settings-header">
                    <button onClick={() => navigate('/dashboard')} className="back-btn-simple" style={{ border: 'solid', color: "#2249c9", borderRadius: '10px' }}>← Go Back</button>
                    <h2>🔒 Security</h2>
                    <p>Update your password</p>
                </div>
                {renderForm()}
            </div>
        </div>
    );
};

const smallMsgStyle = {
    fontSize: '0.8rem',
    textAlign: 'center',
    marginBottom: '10px',
    fontWeight: '500'
};

const toggleBtnStyle = {
    position: 'absolute',
    right: '15px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.2rem',
    display: 'flex',
    alignItems: 'center'
};

export default Settings;