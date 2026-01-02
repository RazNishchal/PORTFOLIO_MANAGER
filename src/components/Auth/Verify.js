import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applyActionCode, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase';
import { updateUserInfoInDB } from '../../services/portfolioService';
import '../css/verify.css';

const Verify = () => {
    const [status, setStatus] = useState('verifying');
    const navigate = useNavigate();

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const oobCode = queryParams.get('oobCode');

        if (!oobCode) {
            setStatus('error');
            return;
        }

        // 1. Apply the code from the Gmail link
        applyActionCode(auth, oobCode)
            .then(async () => {
                // Firebase briefly signs the user in to apply the code
                // We listen for that user to update our Database
                const unsubscribe = onAuthStateChanged(auth, async (user) => {
                    if (user) {
                        try {
                            await updateUserInfoInDB(user.uid, {
                                isVerified: true,
                                verifiedAt: new Date().toISOString()
                            });
                        } catch (dbErr) {
                            console.warn('DB update skipped:', dbErr.message);
                        } finally {
                            // 2. CRITICAL: Always sign out to block dashboard access
                            await signOut(auth);
                            setStatus('success');
                            unsubscribe();
                        }
                    } else {
                        // If no user is detected, just set success and finish
                        setStatus('success');
                        unsubscribe();
                    }
                });
            })
            .catch((error) => {
                console.error('Verification error:', error);
                setStatus('error');
            });
    }, []);

    // 3. Logic for the Continue button
    const handleContinue = () => {
        // We direct to NewLogin as requested for the flow
        navigate('/new-login');
    };

    // 4. Logic for Error/Already Verified fallback
    const goToLogin = () => {
        navigate('/login');
    };

    return (
        <div className="auth-wrapper">
            <div className="form-slide-in" style={{ textAlign: 'center', justifyContent: 'center' }}>

                {status === 'verifying' && (
                    <div className="auth-header">
                        <div className="loading-dots">...</div>
                        <h1>Confirming...</h1>
                        <p>Processing your verification link.</p>
                    </div>
                )}

                {status === 'success' && (
                    <>
                        <div className="auth-header">
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
                            <h1>Verification Complete</h1>
                            <p>Your email has been confirmed. Click below to finalize your account.</p>
                        </div>

                        <div className="auth-form-body">
                            <button className="btn-auth" onClick={handleContinue}>
                                Continue to Setup
                            </button>
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="auth-header">
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                            <h1>Link Expired or Used</h1>
                            <p>This link is no longer valid. If you are already verified, please log in.</p>
                        </div>

                        <div className="auth-form-body">
                            <button className="btn-auth" onClick={goToLogin} style={{ background: '#64748b' }}>
                                Back to Login
                            </button>
                        </div>
                    </>
                )}

                <div className="auth-footer">
                    <p>© {new Date().getFullYear()} NEPSE Portfolio Manager</p>
                </div>
            </div>
        </div>
    );
};

export default Verify;