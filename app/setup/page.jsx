'use client';
import { useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Shield, Check, AlertTriangle } from 'lucide-react';

export default function SetupPage() {
    const { user, userProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleClaimAdmin = async () => {
        if (!user) return;
        setLoading(true);
        setError('');

        try {
            // Attempt client-side promotion
            // This works if Firestore Rules are in "Test Mode" or allow users to edit their own role
            await updateDoc(doc(db, 'users', user.uid), {
                role: 'admin',
                updatedAt: new Date().toISOString()
            });

            alert("Success! You are now an Admin. Redirecting...");
            router.push('/dashboard/admin');
        } catch (err) {
            console.error("Setup failed:", err);
            setError(`Failed to update role: ${err.message}. Your Firestore Security Rules might be blocking this.`);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div className="p-10 text-center">Please login first.</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Shield className="w-8 h-8 text-indigo-600" />
                </div>

                <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
                    System Setup
                </h1>
                <p className="text-center text-gray-500 mb-8">
                    Claim ownership of this installation. This will promote your current account
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded ml-1 text-gray-700">
                        {user.email}
                    </span>
                    <br />to <strong>Administrator</strong>.
                </p>

                {userProfile?.role === 'admin' ? (
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3 mb-6">
                        <Check className="w-5 h-5 text-green-600" />
                        <span className="text-green-800 font-medium">You are already an Admin.</span>
                    </div>
                ) : (
                    <button
                        onClick={handleClaimAdmin}
                        disabled={loading}
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Processing...' : 'Claim Admin Access'}
                    </button>
                )}

                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="text-sm text-gray-400 hover:text-gray-600"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
