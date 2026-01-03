import React, { useState, useEffect } from 'react';
import AuthTheme from './AuthTheme';
import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut
} from 'firebase/auth';
import { auth, APP_URL } from '../../firebase';
import { updateUserInfoInDB } from '../../services/portfolioService';

const Login = ({ toggleToRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [resetMode, setResetMode] = useState(false);

    // Effect to clear status after 1.5 seconds
    useEffect(() => {
        if (status.text) {
            const timer = setTimeout(() => {
                setStatus({ type: '', text: '' });
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const handleLogin = async (e) => {
        e.preventDefault();

        // Manual validation: triggers your custom message instead of HTML popup
        if (!email) {
            return setStatus({ type: 'error', text: 'Email is required' });
        }
        if (!password) {
            return setStatus({ type: 'error', text: 'Password is required' });
        }

        setLoading(true);
        try {
            const userCred = await signInWithEmailAndPassword(auth, email, password);

            if (!userCred.user.emailVerified) {
                setStatus({ type: 'error', text: 'Please verify your email first!' });
                setResetMode(true);
                await signOut(auth);
            } else {
                await updateUserInfoInDB(userCred.user.uid, {
                    email: email,
                    lastLogin: new Date().toISOString()
                });
            }
        } catch (err) {
            setStatus({ type: 'error', text: 'Invalid email or password.' });
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) return setStatus({ type: 'error', text: 'Email is required' });
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email, { url: APP_URL });
            setStatus({ type: 'success', text: 'Reset link sent! Check your Gmail.' });
            setResetMode(true);
        } catch (err) {
            setStatus({ type: 'error', text: 'Account not found.' });
        } finally {
            setLoading(false);
        }
    };

    // Inline style for the status message
    const statusMessageStyle = {
        fontSize: '0.85rem',
        color: status.type === 'success' ? '#10b981' : '#ef4444',
        textAlign: 'center',
        marginBottom: '1rem',
        minHeight: '1.2rem',
        fontWeight: '500'
    };

    return (
        <AuthTheme
            title="Login"
            onBackToLogin={() => {
                setStatus({ type: '', text: '' });
                setResetMode(false);
            }}
        >
            {/* Status Message Display */}
            <div style={statusMessageStyle}>
                {status.text ? status.text : ""}
            </div>

            {/* noValidate stops the browser from showing its own "Fill in this field" popup */}
            <form onSubmit={handleLogin} className="auth-form-body" noValidate>
                <div className="input-field">
                    <label>Email Address</label>
                    <input
                        type="email"
                        placeholder="mail@mail.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                </div>

                <div className="input-field" style={{ marginTop: '1.2rem' }}>
                    <label>Password</label>
                    <div className="password-input-wrapper" style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={toggleBtnStyle}
                        >
                            {showPassword ? '👁️' : '🙈'}
                        </button>
                    </div>
                </div>

                <div className="forgot-link-container" style={flexBetweenStyle}>
                    <span
                        onClick={!resetMode ? handleForgotPassword : null}
                        className="link-btn-small"
                        style={{
                            ...linkStyle,
                            color: resetMode ? '#64748b' : '#38bdf8',
                            cursor: resetMode ? 'default' : 'pointer',
                            opacity: resetMode ? 0.5 : 1,
                            pointerEvents: resetMode ? 'none' : 'auto'
                        }}
                    >
                        Forgot Password?
                    </span>

                    {resetMode && (
                        <span
                            onClick={handleForgotPassword}
                            className="link-btn-small"
                            style={{ ...linkStyle, color: '#10b981', fontWeight: 'bold' }}
                        >
                            Resend Link?
                        </span>
                    )}
                </div>

                <button type="submit" className="btn-auth" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
                    {loading ? "Authenticating..." : "Sign In"}
                </button>
            </form>

            <div className="auth-footer" style={{ marginTop: '2rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Don't have an account?
                    <button
                        onClick={toggleToRegister}
                        className="link-btn"
                        style={registerBtnStyle}
                    >
                        Register
                    </button>
                </p>
            </div>
        </AuthTheme>
    );
};

const linkStyle = { cursor: 'pointer', fontSize: '0.85rem' };
const flexBetweenStyle = { display: 'flex', justifyContent: 'space-between', margin: '1rem 0', minHeight: '1.2rem' };
const registerBtnStyle = { background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontWeight: '600', marginLeft: '5px' };
const toggleBtnStyle = { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b' };

export default Login;