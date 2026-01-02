// src/components/Auth/Register.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthTheme from './AuthTheme';
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { auth, APP_URL } from '../../firebase';

const Register = ({ toggleToLogin, onRegistrationSuccess }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', text: '' });
    const navigate = useNavigate(); // Hook to change the URL

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', text: '' });

        try {
            let user;
            const TEMP_KEY = "Verify_Account_2026_Secure!";

            // 1. Get User Object
            try {
                const res = await createUserWithEmailAndPassword(auth, email, TEMP_KEY);
                user = res.user;
            } catch (err) {
                if (err.code === 'auth/email-already-in-use') {
                    const res = await signInWithEmailAndPassword(auth, email, TEMP_KEY);
                    user = res.user;
                } else throw err;
            }

            if (user) {
                // 2. Logic: If email is ALREADY verified
                if (user.emailVerified) {
                    setStatus({
                        type: 'success',
                        text: 'Email already verified! Redirecting to Login...'
                    });

                    setTimeout(async () => {
                        await signOut(auth);
                        // Updates URL to /login and switches view
                        navigate('/login');
                        if (toggleToLogin) toggleToLogin();
                    }, 1500);

                    return;
                }

                // 3. Logic: Send Verification Link
                await sendEmailVerification(user, {
                    url: `${APP_URL}/new-login`,
                    handleCodeInApp: true
                });

                setStatus({
                    type: 'success',
                    text: 'Verification link sent to your Gmail!'
                });

                // Updates URL to /new-login after 1.5 seconds
                setTimeout(() => {
                    setStatus({ type: '', text: '' });
                    navigate('/new-login');
                    if (onRegistrationSuccess) onRegistrationSuccess();
                }, 1500);
            }
        } catch (err) {
            setStatus({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthTheme title="Join Portfolio" status={status} onBackToLogin={() => navigate('/login')}>
            <form onSubmit={handleRegister} className="auth-form-body">
                <div className="input-field">
                    <label>Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        placeholder="example@gmail.com"
                        disabled={loading || status.type === 'success'}
                    />
                </div>

                {status.type === 'success' && (
                    <div style={successOverlayStyle}>
                        {status.text.includes('already') ? 'Verified! Loading Login...' : 'Link Sent! Check Gmail...'}
                    </div>
                )}

                <button
                    type="submit"
                    className="btn-auth"
                    disabled={loading || status.type === 'success'}
                    style={{ width: '100%', marginTop: '1.5rem' }}
                >
                    {loading ? 'Processing...' : status.type === 'success' ? 'Redirecting...' : 'Send Verification Link'}
                </button>
            </form>

            <div className="auth-footer" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    Already have an account?{' '}
                    <span
                        onClick={() => navigate('/login')}
                        style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: '600', marginLeft: '4px' }}
                    >
                        Login here
                    </span>
                </p>
            </div>
        </AuthTheme>
    );
};

const successOverlayStyle = {
    marginTop: '15px',
    padding: '10px',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid #10b981',
    borderRadius: '8px',
    color: '#10b981',
    textAlign: 'center',
    fontSize: '0.9rem',
    fontWeight: '500'
};

export default Register;