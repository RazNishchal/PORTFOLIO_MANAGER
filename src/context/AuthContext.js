// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut, reload } from 'firebase/auth';

const AuthContext = createContext();

// Use named exports to fix the "export not found" errors
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            if (u) {
                try {
                    await reload(u);
                    setUser({ ...u });
                } catch (e) {
                    setUser(u);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const logout = () => signOut(auth);

    const refreshUser = async () => {
        if (auth.currentUser) {
            await reload(auth.currentUser);
            setUser({ ...auth.currentUser });
            return auth.currentUser;
        }
    };

    return (
        <AuthContext.Provider value={{ user, logout, loading, refreshUser }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);