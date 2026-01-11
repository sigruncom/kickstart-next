'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("AuthContext: Provider mounted, waiting for auth...");
        const timeoutId = setTimeout(() => {
            console.warn("AuthContext: Auth timeout reached, forcing loading false");
            setLoading(false);
        }, 5000);

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log("AuthContext: Auth state changed:", user?.email || "No user");
            setUser(user);

            try {
                if (user) {
                    // OPTIMIZATION: Instant load for Demo Admin
                    if (user.email?.toLowerCase() === 'admin@demo.com') {
                        console.log("AuthContext: Demo Admin detected");
                        setUserProfile({
                            email: 'admin@demo.com',
                            role: 'admin',
                            name: 'Demo Admin',
                            createdAt: new Date().toISOString()
                        });
                        return;
                    }

                    // Fetch user profile from Firestore with timeout race
                    try {
                        const profilePromise = getDoc(doc(db, 'users', user.uid));
                        const timeoutPromise = new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Profile fetch timeout')), 4000)
                        );

                        const userDoc = await Promise.race([profilePromise, timeoutPromise]);

                        if (userDoc.exists()) {
                            const data = userDoc.data();
                            if (user.email?.toLowerCase() === 'admin@demo.com') {
                                data.role = 'admin';
                            }
                            setUserProfile(data);
                        } else {
                            const newProfile = {
                                email: user.email,
                                role: user.email === 'admin@demo.com' ? 'admin' : 'active_student',
                                createdAt: new Date().toISOString()
                            };
                            try {
                                await setDoc(doc(db, 'users', user.uid), newProfile);
                            } catch (e) {
                                console.error("Error creating profile:", e);
                            }
                            setUserProfile(newProfile);
                        }
                    } catch (error) {
                        console.error("Error fetching user profile:", error);
                        setUserProfile({
                            email: user.email,
                            role: user.email === 'admin@demo.com' ? 'admin' : 'active_student'
                        });
                    }
                } else {
                    setUserProfile(null);
                }
            } finally {
                clearTimeout(timeoutId);
                setLoading(false);
            }
        });

        return () => {
            clearTimeout(timeoutId);
            unsubscribe();
        }
    }, []);

    const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

    const signup = async (email, password, name) => {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', result.user.uid), {
            name,
            email,
            role: 'active_student',
            cohort: 'Jan 2026',
            createdAt: new Date().toISOString()
        });
        await updateProfile(result.user, { displayName: name });
        return result;
    };

    const logout = () => signOut(auth);

    const resetPassword = (email) => sendPasswordResetEmail(auth, email);

    // Helpers for role-based access
    const role = userProfile?.role;
    const isAdmin = role === 'admin';
    const isActiveStudent = role === 'active_student';
    const isCompletedStudent = role === 'completed_student';

    return (
        <AuthContext.Provider value={{
            user,
            userProfile,
            loading,
            login,
            signup,
            logout,
            resetPassword,
            isAdmin,
            isActiveStudent,
            isCompletedStudent
        }}>
            {loading ? <div className="h-screen flex items-center justify-center">Loading...</div> : children}
        </AuthContext.Provider>
    );
};
