import React, { useState, useEffect } from 'react';
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
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', text: '' });

    const navigate = useNavigate();

    // Effect to clear status after exactly 1.5 seconds
    useEffect(() => {
        if (status.text) {
            const timer = setTimeout(() => {
                setStatus({ type: '', text: '' });
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const handleRegister = async (e) => {
        e.preventDefault();

        // Manual validation: replaced HTML popups with custom status
        if (!email) {
            return setStatus({ type: 'error', text: 'Email is required' });
        }
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
                    setStatus({ type: 'info', text: 'account already verified. redirecting...' });
                    setTimeout(() => navigate('/dashboard'), 1500);
                    return;
                }

                const actionCodeSettings = { url: APP_URL, handleCodeInApp: false };
                await sendEmailVerification(user, actionCodeSettings);

                setStatus({
                    type: 'success',
                    text: 'Registration link sent! Verify mail to login.'
                });

                setTimeout(() => {
                    if (onRegistrationSuccess) onRegistrationSuccess();
                    navigate('/login');
                }, 1500);
            }
        } catch (err) {
            // Convert Firebase errors to lowercase or custom messages as needed
            setStatus({ type: 'error', text: err.message.toLowerCase() });
        } finally {
            setLoading(false);
        }
    };

    // Style configuration
    const statusMessageStyle = {
        fontSize: '0.85rem',
        color: status.type === 'error' ? '#ef4444' : '#10b981',
        textAlign: 'center',
        marginBottom: '1rem',
        minHeight: '1.2rem',
        fontWeight: '500'
    };

    return (
        <AuthTheme
            title="Register"
            /* Pass status only for logic checks like success view, 
               AuthTheme no longer renders the text itself */
            status={status}
            onBackToLogin={() => navigate('/login')}
        >
            {/* Unified Status Display */}
            <div style={statusMessageStyle}>
                {status.text ? status.text : ""}
            </div>

            {/* noValidate stops the browser from showing its own "Fill in this field" popup */}
            <form onSubmit={handleRegister} className="auth-form-body" noValidate>
                <div className="input-field">
                    <label>Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="mail@mail.com"
                        disabled={loading}
                    />
                </div>

                <div className="input-field" style={{ marginTop: '1rem' }}>
                    <label>Password</label>
                    <div className="password-input-wrapper" style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={toggleBtnStyle}
                            tabIndex="-1"
                        >
                            {showPassword ? '👁️' : '🙈'}
                        </button>
                    </div>
                </div>

                <div className="input-field" style={{ marginTop: '1rem' }}>
                    <label>Confirm Password</label>
                    <div className="password-input-wrapper" style={{ position: 'relative' }}>
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={toggleBtnStyle}
                            tabIndex="-1"
                        >
                            {showConfirmPassword ? '👁️' : '🙈'}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    className="btn-auth"
                    disabled={loading || status.type === 'success'}
                    style={{ width: '100%', marginTop: '1.5rem' }}
                >
                    {loading ? 'processing...' : 'Register & Verify'}
                </button>
            </form>

            <div className="auth-footer" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    Already have an account?{' '}
                    <span
                        onClick={() => navigate('/login')}
                        style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: '600' }}
                    >
                        Login Here
                    </span>
                </p>
            </div>
        </AuthTheme>
    );
};

const toggleBtnStyle = {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.2rem',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    zIndex: 5
};

export default Register;