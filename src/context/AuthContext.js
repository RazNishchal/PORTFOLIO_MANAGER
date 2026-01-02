import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut, reload } from 'firebase/auth';
import { updateUserInfoInDB, getUserInfoFromDB } from '../services/portfolioService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            if (u) {
                try {
                    await reload(u);
                    setUser({ ...u });

                    // 1. Check if user already has a registration date in DB
                    const existingInfo = await getUserInfoFromDB(u.uid);

                    const syncData = {
                        email: u.email,
                        emailVerified: u.emailVerified,
                        lastActive: new Date().toISOString(),
                        authProvider: u.providerData[0]?.providerId || 'password'
                    };

                    // 2. 🚀 ONLY SET REGISTRATION DATE IF IT DOESN'T EXIST
                    if (!existingInfo || !existingInfo.createdAt) {
                        syncData.createdAt = new Date().toISOString();
                    }

                    await updateUserInfoInDB(u.uid, syncData);

                } catch (e) {
                    console.error("Auth sync error:", e);
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
            const updatedUser = { ...auth.currentUser };
            setUser(updatedUser);

            await updateUserInfoInDB(updatedUser.uid, {
                email: updatedUser.email,
                emailVerified: updatedUser.emailVerified,
                lastRefresh: new Date().toISOString()
            });

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