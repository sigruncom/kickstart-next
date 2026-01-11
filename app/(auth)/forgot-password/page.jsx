'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';
import { Mail, ArrowRight, Check, AlertCircle, Sparkles, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ForgotPasswordPage() {
    const { resetPassword } = useAuth();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [email, setEmail] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            await resetPassword(email);
            setStatus({ type: 'success', message: 'If an account exists, a reset link has been sent to your email.' });
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: err.message.replace('Firebase:', '').replace('auth/', '').replace(/-/g, ' ') });
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
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Reset Password</h1>
                    <p className="text-gray-500">Recover access to your account</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
                    {/* Back Link */}
                    <div className="mb-6">
                        <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors">
                            <ChevronLeft className="w-4 h-4" /> Back to Login
                        </Link>
                    </div>

                    {/* Status Message */}
                    <AnimatePresence>
                        {status.message && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${status.type === 'success'
                                        ? 'bg-green-50 text-green-700 border border-green-100'
                                        : 'bg-red-50 text-red-700 border border-red-100'
                                    }`}
                            >
                                {status.type === 'success' ? (
                                    <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                )}
                                <p className="text-sm font-medium capitalize">{status.message}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1.5">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    required
                                    className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                We'll send you a secure link to reset your password.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || status.type === 'success'}
                            className="w-full bg-gray-900 hover:bg-black text-white py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-gray-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                            {!loading && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
