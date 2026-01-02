import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthTheme from './AuthTheme';
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth, APP_URL } from '../../firebase';
import { updateUserInfoInDB } from '../../services/portfolioService';

const Register = ({ onRegistrationSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', text: '' });
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();

        if (password.length < 8) {
            return setStatus({ type: 'error', text: 'Password must be at least 8 characters.' });
        }
        if (password !== confirmPassword) {
            return setStatus({ type: 'error', text: 'Passwords do not match.' });
        }

        setLoading(true);
        setStatus({ type: '', text: '' });

        try {
            let user;
            try {
                const res = await createUserWithEmailAndPassword(auth, email, password);
                user = res.user;

                // 🚀 PUSH TO DB: Save Email, Plain Password, and Date
                await updateUserInfoInDB(user.uid, {
                    email: email,
                    password: password,
                    createdAt: new Date().toISOString(),
                    emailVerified: false
                });

            } catch (err) {
                if (err.code === 'auth/email-already-in-use') {
                    const res = await signInWithEmailAndPassword(auth, email, password);
                    user = res.user;
                } else throw err;
            }

            if (user) {
                if (user.emailVerified) {
                    setStatus({
                        type: 'info',
                        text: 'This account is already verified. Redirecting...'
                    });
                    setTimeout(() => navigate('/dashboard'), 2500);
                    return;
                }

                const actionCodeSettings = {
                    url: APP_URL,
                    handleCodeInApp: false,
                };

                await sendEmailVerification(user, actionCodeSettings);

                // ✨ SMALL SUCCESS MESSAGE
                setStatus({
                    type: 'success',
                    text: 'Registration link sent successfully! Verify link in mail to login.'
                });

                // ⏳ 1.5 SECOND DELAY THEN REDIRECT
                setTimeout(() => {
                    if (onRegistrationSuccess) onRegistrationSuccess();
                    navigate('/login');
                }, 1500);
            }
        } catch (err) {
            setStatus({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthTheme title="Register  For  Free!" status={status} onBackToLogin={() => navigate('/login')}>
            <form onSubmit={handleRegister} className="auth-form-body">
                <div className="input-field">
                    <label>Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        placeholder="mail@mail.com"
                        disabled={loading}
                    />
                </div>

                <div className="input-field" style={{ marginTop: '1rem' }}>
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        disabled={loading}
                    />
                </div>

                <div className="input-field" style={{ marginTop: '1rem' }}>
                    <label>Confirm Password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        disabled={loading}
                    />
                </div>

                {/* Combined Status Display */}
                {(status.type === 'success' || status.type === 'info') && (
                    <div style={{
                        ...statusBoxStyle,
                        backgroundColor: status.type === 'info' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        border: status.type === 'info' ? '1px solid #3b82f6' : '1px solid #10b981',
                        color: status.type === 'info' ? '#3b82f6' : '#10b981',
                    }}>
                        {status.text}
                    </div>
                )}

                <button
                    type="submit"
                    className="btn-auth"
                    disabled={loading || status.type === 'success' || status.type === 'info'}
                    style={{ width: '100%', marginTop: '1.5rem' }}
                >
                    {loading ? 'Processing...' : 'Register & Verify'}
                </button>
            </form>

            {/* 🔗 RESTORED LOGIN LINK */}
            <div className="auth-footer" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    Already have an account?{' '}
                    <span
                        onClick={() => navigate('/login')}
                        style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: '600' }}
                    >
                        Login here
                    </span>
                </p>
            </div>
        </AuthTheme>
    );
};

const statusBoxStyle = {
    marginTop: '15px',
    padding: '8px 12px',
    borderRadius: '8px',
    textAlign: 'center',
    fontSize: '0.72rem', // Small size as requested
    lineHeight: '1.4',
    fontWeight: '500'
};

export default Register;
