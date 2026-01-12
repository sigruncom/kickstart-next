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
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeProfile = null;

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            console.log("AuthContext: Auth state changed:", user?.email);
            setUser(user);

            // Clean up previous profile listener
            if (unsubscribeProfile) {
                unsubscribeProfile();
                unsubscribeProfile = null;
            }

            if (user) {
                // Real-time listener for profile
                unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
                    const isSuperAdminEmail = user.email === 'sigrun+admin@sigrun.com' || user.email === 'sigrun@sigrun.com';

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        console.log("AuthContext: Profile loaded:", data.role);

                        // Auto-promote specific emails to admin (Bootstrapping)
                        if (isSuperAdminEmail && data.role !== 'admin') {
                            console.log("AuthContext: Auto-promoting Super Admin...");
                            setDoc(doc(db, 'users', user.uid), { role: 'admin' }, { merge: true });
                            data.role = 'admin';
                        }

                        setUserProfile(data);
                    } else {
                        console.log("AuthContext: creating default profile...");
                        const newProfile = {
                            email: user.email,
                            name: user.displayName || '',
                            role: isSuperAdminEmail ? 'admin' : 'active_student',
                            cohort: 'Jan 2026',
                            createdAt: new Date().toISOString()
                        };
                        // Fire and forget creation
                        setDoc(doc(db, 'users', user.uid), newProfile).catch(console.error);
                        setUserProfile(newProfile);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("AuthContext: Profile error", error);
                    // Fallback to student only on error
                    setUserProfile({ email: user.email, role: 'active_student' });
                    setLoading(false);
                });
            } else {
                setUserProfile(null);
                setLoading(false);
            }
        });

        return () => {
            if (unsubscribeProfile) unsubscribeProfile();
            unsubscribeAuth();
        };
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
