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

    // Theme State
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const navigate = useNavigate();
    const user = auth.currentUser;

    // ✨ INSTANT THEME UPDATE (No 1-sec delay)
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

    // Auto-clear status messages
    useEffect(() => {
        if (status.text) {
            const timer = setTimeout(() => setStatus({ type: '', text: '' }), 4000);
            return () => clearTimeout(timer);
        }
    }, [status]);

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
            await updatePassword(user, newPassword);

            await updateUserInfoInDB(user.uid, {
                currentPassword: newPassword,
                previousPassword: currentPassword,
                lastSecurityUpdate: new Date().toISOString()
            });

            // Clean up inputs
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            setStatus({ type: 'success', text: 'Password Updated Successfully!' });
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

    // --- CONDITIONAL RENDERING ---

    // Using a locally modified version of status so AuthTheme doesn't trigger "Success View"
    const displayStatus = { ...status, type: status.type === 'success' ? 'info' : status.type };

    if (isDarkMode) {
        return (
            <AuthTheme
                title="🔒 Security"
                subtitle="Update your password to keep your account secure."
                status={displayStatus} // Pass as 'info' to keep the form visible in AuthTheme
            >
                {renderForm()}
            </AuthTheme>
        );
    }

    return (
        <div className="settings-light-container">
            <div className="settings-card-light">
                {status.text && (
                    <div className={`status-msg ${status.type}`}>
                        {status.text}
                    </div>
                )}
                <div className="settings-header">
                    <h2>🔒 Security</h2>
                    <p>Update your password to keep your account secure.</p>
                </div>
                {renderForm()}
            </div>
        </div>
    );
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