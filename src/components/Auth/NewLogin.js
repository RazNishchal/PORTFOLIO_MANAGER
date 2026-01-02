// src/components/Auth/NewLogin.jsx
import React, { useState, useEffect } from 'react';
import AuthTheme from './AuthTheme';
import { updatePassword, signInWithEmailAndPassword, reload } from 'firebase/auth';
import { auth } from '../../firebase';
import { updateUserInfoInDB } from '../../services/portfolioService';

const NewLogin = ({ onComplete, onBackToLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        const user = auth.currentUser;
        if (user) {
            setEmail(user.email);
        }
    }, []);

    const flashError = (text) => {
        setStatus({ type: 'error', text });
        setTimeout(() => setStatus({ type: '', text: '' }), 1500);
    };

    const handleSetupAccount = async (e) => {
        e.preventDefault();

        if (password.length < 8) return flashError('Minimum 8 characters required');
        if (password !== confirmPassword) return flashError('Password mismatch');

        setLoading(true);
        try {
            const TEMP_KEY = "Verify_Account_2026_Secure!";
            let user = auth.currentUser;

            // 1. Re-authenticate if session lost
            if (!user) {
                try {
                    const res = await signInWithEmailAndPassword(auth, email, TEMP_KEY);
                    user = res.user;
                } catch (err) {
                    setLoading(false);
                    return flashError('User not registered or session expired');
                }
            }

            // 2. CHECK VERIFICATION: Force reload to get the latest status from Firebase
            await reload(user);

            if (!user.emailVerified) {
                setLoading(false);
                return flashError('Email not verified. Please check your Gmail first.');
            }

            // 3. SECURE ACCOUNT: Replace temp key with user's permanent password
            await updatePassword(user, password);

            // 4. DATABASE SYNC: Save user details and mark setup as complete
            await updateUserInfoInDB(user.uid, {
                email: user.email,
                isVerified: true,
                setupComplete: true,
                lastLogin: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            // 5. REDIRECT: Show success then open dashboard
            setStatus({ type: 'success', text: 'Verification successful! Opening Dashboard...' });

            setTimeout(() => {
                onComplete(); // This function should handle the UI switch to Dashboard
            }, 1500);

        } catch (err) {
            console.error("Setup Error:", err);
            setLoading(false);
            if (err.code === 'auth/requires-recent-login') {
                flashError('Security timeout. Please login again.');
            } else {
                flashError(err.message || 'Setup failed');
            }
        }
    };

    return (
        <AuthTheme
            title="Complete Setup"
            subtitle="Set your password to access your portfolio"
            status={status}
            onBackToLogin={onBackToLogin}
        >
            <form onSubmit={handleSetupAccount} className="auth-form-body">
                <div className="input-field">
                    <label>Email Address</label>
                    <input
                        type="email"
                        placeholder="your-email@gmail.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        style={{ opacity: email ? 0.7 : 1 }}
                    />
                </div>

                <div className="input-field" style={{ marginTop: '1.2rem' }}>
                    <label>New Permanent Password</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showPass ? "text" : "password"}
                            placeholder="Min. 8 characters"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                        <button type="button" onClick={() => setShowPass(!showPass)} style={toggleBtnStyle}>
                            {showPass ? '👁️' : '🙈'}
                        </button>
                    </div>
                </div>

                <div className="input-field" style={{ marginTop: '1.2rem' }}>
                    <label>Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showConfirm ? "text" : "password"}
                            placeholder="Repeat password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={toggleBtnStyle}>
                            {showConfirm ? '👁️' : '🙈'}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    className="btn-auth"
                    disabled={loading}
                    style={{ width: '100%', marginTop: '2rem' }}
                >
                    {loading ? "Processing..." : "Verify & Open Dashboard"}
                </button>
            </form>

            <div className="auth-footer" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                    Already verified your email?{' '}
                    <span
                        onClick={onBackToLogin}
                        style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: '600', marginLeft: '4px' }}
                    >
                        Login here
                    </span>
                </p>
            </div>
        </AuthTheme>
    );
};

const toggleBtnStyle = {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.2rem',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    zIndex: 2
};

export default NewLogin;