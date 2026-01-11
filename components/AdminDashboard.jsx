'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import {
    Users, BarChart3, Calendar, MessageSquare, Settings, LogOut,
    ChevronDown, Search, Filter, Check, Clock, TrendingUp,
    Play, Pause, RefreshCw, Sparkles, ChevronRight, X, Moon, Sun,
    User, Bell, HelpCircle, BookOpen, Lock, Upload
} from 'lucide-react';

const TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'schedule', label: 'Content Schedule', icon: Calendar },
    { id: 'insights', label: 'AI Insights', icon: Sparkles }
];

export default function AdminDashboard() {
    const { user, userProfile, logout } = useAuth();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';

    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [aggregatedInputs, setAggregatedInputs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Initial data load
    useEffect(() => {
        loadDashboardData();
    }, [user]);

    const loadDashboardData = async () => {
        if (!user) return;
        setLoading(true);

        try {
            // 1. Fetch Users from Server API (Bypasses Client Security Rules)
            // Added cache: 'no-store' to prevent displaying stale or cached data
            const usersRes = await fetch('/api/admin/users', { cache: 'no-store' });
            if (usersRes.ok) {
                const data = await usersRes.json();
                setUsers(data.users || []);
            } else {
                console.error("Failed to fetch users via API");
            }

            // 2. Fetch Schedule via Client SDK (Assumes public read or student read)
            // If this fails due to permissions, we'll log it but at least users are loaded.
            try {
                const { collection, getDocs } = await import('firebase/firestore');
                const { db } = await import('../lib/firebase');
                const scheduleSnap = await getDocs(collection(db, 'content_schedule'));
                const fetchedSchedule = [];
                scheduleSnap.forEach(doc => {
                    fetchedSchedule.push(doc.data());
                });
                setSchedule(fetchedSchedule);
            } catch (scheduleErr) {
                console.warn("Schedule fetch failed (likely permissions), using fallback/empty.", scheduleErr);
                // Fallback or empty
                setSchedule([]);
            }

            setAggregatedInputs([]);

        } catch (err) {
            console.error('Failed to load dashboard data:', err);
            // Don't show alert for permission denied since we are handling it progressively
        } finally {
            setLoading(false);
        }
    };

    const updateUserRole = async (userId, role) => {
        try {
            const { doc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('../lib/firebase');

            await updateDoc(doc(db, 'users', userId), { role });
            loadDashboardData();
        } catch (err) {
            console.error('Failed to update role:', err);
            try {
                const res = await fetch(`/api/admin/users/${userId}/role`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ role })
                });
                if (res.ok) loadDashboardData();
            } catch (apiErr) {
                console.error("API update also failed", apiErr);
            }
        }
    };

    const releaseWeek = async (weekIndex) => {
        // Optimistic update for Demo Admin
        if (user.email?.toLowerCase() === 'admin@demo.com') {
            setSchedule(prev => prev.map(w =>
                w.week_index === weekIndex ? { ...w, is_released: 1, release_date: new Date().toISOString() } : w
            ));
            return;
        }

        try {
            const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
            const { db } = await import('../lib/firebase');

            await setDoc(doc(db, 'content_schedule', `week_${weekIndex}`), {
                week_index: weekIndex,
                is_released: 1,
                release_date: new Date().toISOString(), // Use client date for simplicity or serverTimestamp()
                updatedAt: serverTimestamp()
            }, { merge: true });

            loadDashboardData();
        } catch (err) {
            console.error('Failed to release week:', err);
            alert('Failed to release content. Check console.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 ml-72 p-8 pt-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-text-main dark:text-white mb-2">
                    {TABS.find(t => t.id === activeTab)?.label}
                </h1>
                <p className="text-text-secondary">Manage users, content, and settings.</p>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <OverviewTab key="overview" stats={stats} users={users} loading={loading} />
                )}
                {activeTab === 'users' && (
                    <UsersTab key="users" users={users} onUpdateRole={updateUserRole} onRefresh={loadDashboardData} loading={loading} />
                )}
                {activeTab === 'schedule' && (
                    <ScheduleTab schedule={schedule} onRelease={releaseWeek} loading={loading} />
                )}
                {activeTab === 'insights' && (
                    <div key="insights" className="p-12 text-center text-text-secondary bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-medium text-text-main dark:text-white mb-2">AI Insights</h3>
                        <p>Coming in next phase.</p>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function OverviewTab({ stats, users, loading }) {
    if (loading) return <LoadingState />;

    const statCards = [
        { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'from-primary to-primary-light' },
        { label: 'Active Students', value: stats?.activeStudents || 0, icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
        { label: 'Completed', value: stats?.completedStudents || 0, icon: Check, color: 'from-blue-500 to-cyan-500' },
        { label: 'Recent Logins', value: stats?.recentLogins || 0, icon: Clock, color: 'from-amber-500 to-orange-500' }
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                    <div key={i} className="card p-5">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-soft`}>
                            <stat.icon className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-3xl font-bold text-text-main dark:text-white mb-1">{stat.value}</p>
                        <p className="text-text-secondary text-sm">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Recent Users */}
            <div className="card p-6">
                <h3 className="text-lg font-bold text-text-main dark:text-white mb-4">Recent Users</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-text-secondary border-b border-gray-100 dark:border-gray-800">
                                <th className="pb-3 font-medium text-sm">Name</th>
                                <th className="pb-3 font-medium text-sm">Email</th>
                                <th className="pb-3 font-medium text-sm">Role</th>
                                <th className="pb-3 font-medium text-sm">Cohort</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.slice(0, 5).map((u, i) => (
                                <tr key={u.id || i} className="border-b border-gray-50 dark:border-gray-800/50">
                                    <td className="py-4 text-text-main dark:text-white font-medium">{u.name}</td>
                                    <td className="py-4 text-text-secondary">{u.email}</td>
                                    <td className="py-4"><RoleBadge role={u.role} /></td>
                                    <td className="py-4 text-text-secondary">{u.cohort || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}

function UsersTab({ users, onUpdateRole, onRefresh, loading }) {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Add User State
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'active_student' });
    const [creatingUser, setCreatingUser] = useState(false);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            alert('Please upload a CSV file');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/admin/import', {
                method: 'POST',
                // Content-Type is set automatically with FormData
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Import failed');
            }

            let message = `Import processed!\nSuccess: ${data.summary.success}\nFailed: ${data.summary.failed}`;
            if (data.summary.failed > 0 && data.summary.errors) {
                message += '\n\nErrors:\n' + data.summary.errors.map(e => `${e.email}: ${e.error}`).join('\n');
            }
            alert(message);
            if (onRefresh) onRefresh();

        } catch (error) {
            console.error('Upload error:', error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setCreatingUser(true);

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            alert(`User ${newUser.name} created! Password: kickstart2026!`);
            setIsAddUserOpen(false);
            setNewUser({ name: '', email: '', role: 'active_student' });
            if (onRefresh) onRefresh();

        } catch (err) {
            alert(`Failed to create user: ${err.message}`);
        } finally {
            setCreatingUser(false);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    if (loading) return <LoadingState />;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Filters */}
            <div className="flex gap-4 items-center flex-wrap">
                <div className="flex-1 relative min-w-[200px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input-field pl-12"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="input-field w-auto"
                >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="active_student">Active Student</option>
                    <option value="completed_student">Completed</option>
                </select>

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileUpload}
                />

                <button
                    onClick={() => setIsAddUserOpen(true)}
                    className="btn-primary flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
                >
                    <User className="w-4 h-4" />
                    <span>Add User</span>
                </button>

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading || uploading}
                    className="btn-secondary flex items-center gap-2"
                >
                    {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>{uploading ? 'Importing...' : 'Import CSV'}</span>
                </button>
            </div>

            {/* Users Table */}
            <div className="card p-6">
                <h3 className="text-lg font-bold text-text-main dark:text-white mb-4">
                    All Users ({filteredUsers.length})
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-text-secondary border-b border-gray-100 dark:border-gray-800">
                                <th className="pb-3 font-medium text-sm">Name</th>
                                <th className="pb-3 font-medium text-sm">Email</th>
                                <th className="pb-3 font-medium text-sm">Role</th>
                                <th className="pb-3 font-medium text-sm">Cohort</th>
                                <th className="pb-3 font-medium text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((u, i) => (
                                <tr
                                    key={u.id || i}
                                    className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                                >
                                    <td className="py-4 text-text-main dark:text-white font-medium">{u.name}</td>
                                    <td className="py-4 text-text-secondary">{u.email}</td>
                                    <td className="py-4"><RoleBadge role={u.role} /></td>
                                    <td className="py-4 text-text-secondary">{u.cohort || '-'}</td>
                                    <td className="py-4">
                                        <select
                                            value={u.role}
                                            onChange={(e) => onUpdateRole(u.id, e.target.value)}
                                            className="px-3 py-1.5 text-sm rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark focus:border-primary outline-none transition-colors"
                                        >
                                            <option value="active_student">Active Student</option>
                                            <option value="completed_student">Completed</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add User Modal */}
            <AnimatePresence>
                {isAddUserOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                            onClick={() => setIsAddUserOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-surface-dark rounded-2xl shadow-2xl z-50 p-6 border border-gray-100 dark:border-gray-800"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-text-main dark:text-white">Add New User</h3>
                                <button onClick={() => setIsAddUserOpen(false)}><X className="w-5 h-5 text-text-tertiary" /></button>
                            </div>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
                                    <input
                                        required
                                        type="text"
                                        className="input-field"
                                        value={newUser.name}
                                        onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Email Address</label>
                                    <input
                                        required
                                        type="email"
                                        className="input-field"
                                        value={newUser.email}
                                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Role</label>
                                    <select
                                        className="input-field"
                                        value={newUser.role}
                                        onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                    >
                                        <option value="active_student">Active Student</option>
                                        <option value="completed_student">Completed</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddUserOpen(false)}
                                        className="btn-secondary flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creatingUser}
                                        className="btn-primary flex-1 flex justify-center"
                                    >
                                        {creatingUser ? <RefreshCw className="animate-spin" /> : 'Create User'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function RoleBadge({ role }) {
    const styles = {
        admin: 'badge-primary',
        active_student: 'badge-success',
        completed_student: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    };
    const labels = {
        admin: 'Admin',
        active_student: 'Active',
        completed_student: 'Completed'
    };
    return (
        <span className={`badge ${styles[role] || styles.active_student}`}>
            {labels[role] || role}
        </span>
    );
}

function LoadingState() {
    return (
        <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse">
                <RefreshCw className="w-5 h-5 text-primary animate-spin" />
            </div>
        </div>
    );
}

function ScheduleTab({ schedule, onRelease, loading }) {
    if (loading) return <LoadingState />;

    // Create a 12-week array, merging with existing schedule data
    const weeks = Array.from({ length: 12 }, (_, i) => {
        const weekSchedule = schedule.find(s => s.week_index === i);
        return {
            index: i,
            released: weekSchedule?.is_released === 1,
            releaseDate: weekSchedule?.release_date
        };
    });

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Hero Card */}
            <div className="p-6 bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary mb-3">
                    <Calendar className="w-3 h-3" />
                    Content Management
                </span>
                <h1 className="text-2xl font-bold text-text-main dark:text-white mb-2">
                    Content Release Schedule
                </h1>
                <p className="text-text-secondary">
                    Control when each week's content becomes available to students.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {weeks.map((week, i) => (
                    <motion.div
                        key={week.index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`p-5 bg-white dark:bg-surface-dark border rounded-2xl shadow-sm transition-all ${week.released
                            ? 'border-emerald-200 dark:border-emerald-800/50'
                            : 'border-gray-100 dark:border-gray-800'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${week.released
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                                    : 'bg-gray-100 dark:bg-gray-800 text-text-secondary'
                                    }`}>
                                    {week.released ? <Check className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-text-main dark:text-white">Week {week.index + 1}</h4>
                                    <p className="text-xs text-text-secondary">
                                        {week.releaseDate ? new Date(week.releaseDate).toLocaleDateString() : 'Not scheduled'}
                                    </p>
                                </div>
                            </div>
                            {week.released ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    Released
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                    Pending
                                </span>
                            )}
                        </div>
                        {!week.released && (
                            <button
                                onClick={() => onRelease(week.index)}
                                className="w-full py-2 px-4 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-xl transition-all shadow-glow-primary hover:shadow-glow-primary-lg flex items-center justify-center gap-2"
                            >
                                <Play className="w-4 h-4" />
                                Release Now
                            </button>
                        )}
                        {week.released && (
                            <div className="w-full py-2 px-4 bg-gray-50 dark:bg-gray-800/50 text-text-secondary text-sm font-medium rounded-xl text-center border border-gray-100 dark:border-gray-800">
                                Available
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
