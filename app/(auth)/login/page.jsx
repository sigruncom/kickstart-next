'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { Mail, Lock, ArrowRight, Sparkles, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
    const { login, signup } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ email: '', password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(form.email, form.password);
            router.push('/dashboard');
        } catch (err) {
            console.error(err);
            setError('Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = async (role) => {
        setLoading(true);
        setError('');
        const email = role === 'admin' ? 'admin@demo.com' : 'student@demo.com';
        const password = 'demoPassword123!';
        const name = role === 'admin' ? 'Demo Admin' : 'Demo Student';

        try {
            await login(email, password);
            router.push('/dashboard');
        } catch (err) {
            console.error("Login attempt failed:", err.code, err.message);
            // If user not found, create it (Auto-registration for Demo)
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === "auth/invalid-login-credentials") {
                try {
                    await signup(email, password, name);
                    router.push('/dashboard');
                } catch (createErr) {
                    console.error("Creation attempt failed:", createErr.code, createErr.message);
                    if (createErr.code === 'auth/email-already-in-use') {
                        // This implies login failed (wrong pass) but user exists.
                        // We can't fix "wrong password" automatically without admin rights.
                        setError(`Demo account exists but password doesn't match. Please delete user in Firebase Console.`);
                    } else if (createErr.code === 'auth/operation-not-allowed') {
                        setError('Email/Password provider is NOT enabled in Firebase Console.');
                    } else {
                        setError(`Create failed: ${createErr.code} - ${createErr.message}`);
                    }
                }
            } else {
                console.error(err);
                if (err.code === 'auth/operation-not-allowed') {
                    setError('Email/Password provider is NOT enabled in Firebase Console.');
                } else {
                    setError(`Login failed: ${err.code} - ${err.message}`);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Kickstart AI Coach</h1>
                    <p className="text-gray-500">SOMBA Kickstart AI Coach Program</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Demo Buttons */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <button
                                type="button"
                                onClick={() => handleDemoLogin('student')}
                                disabled={loading}
                                className="py-2 px-4 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-semibold rounded-xl transition-colors border border-purple-200"
                            >
                                Demo Student
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDemoLogin('admin')}
                                disabled={loading}
                                className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors border border-gray-200"
                            >
                                Demo Admin
                            </button>
                        </div>

                        <div className="relative flex items-center gap-4 my-2">
                            <div className="flex-1 h-px bg-gray-100"></div>
                            <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Or login with email</span>
                            <div className="flex-1 h-px bg-gray-100"></div>
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    placeholder="your@email.com"
                                    required
                                    className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                    className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                                />
                            </div>
                            <div className="flex justify-end mt-1">
                                <Link
                                    href="/forgot-password"
                                    className="text-xs text-purple-600 hover:text-purple-700 font-medium transition-colors"
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gray-900 hover:bg-black text-white py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-gray-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? 'Please wait...' : 'Sign In'}
                            {!loading && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </form>

                    {/* No Signup Link - Registration Closed */}
                    <p className="text-center text-xs text-gray-400 mt-6">
                        Registration is currently closed.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
