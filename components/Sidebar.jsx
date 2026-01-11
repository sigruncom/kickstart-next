'use client';
import { motion } from 'framer-motion';
import { Lock, Check, Sparkles, BookOpen, Settings, BarChart3, Users, Calendar, LogOut } from 'lucide-react';
import { useApp } from './AppContext';
import { useAuth } from './AuthContext';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

const ADMIN_TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'schedule', label: 'Content Schedule', icon: Calendar },
    { id: 'insights', label: 'AI Insights', icon: Sparkles }
];

export default function Sidebar() {
    const {
        curriculum,
        currentWeek,
        isWeekUnlocked,
        isWeekComplete,
        navigateTo,
        setAiCoachOpen,
        getProgress
    } = useApp();
    const { isAdmin, logout } = useAuth();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const isAdminDashboard = pathname?.startsWith('/dashboard/admin');
    const currentTab = searchParams.get('tab') || 'overview';

    // RENDER: Admin Sidebar Layout
    if (isAdminDashboard) {
        return (
            <aside className="sidebar fixed left-0 top-0 bottom-0 overflow-y-auto z-50">
                {/* Logo */}
                <div className="p-6 pb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center shadow-glow-primary">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg text-text-main dark:text-white tracking-tight">
                            Kickstart AI Coach
                        </span>
                    </div>
                    <div className="mt-2 ml-1">
                        <span className="text-[10px] uppercase font-bold text-primary tracking-wider bg-primary/10 px-2 py-1 rounded-md">
                            Administrator
                        </span>
                    </div>
                </div>

                <div className="px-6 mb-3">
                    <h3 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                        Management
                    </h3>
                </div>

                <nav className="flex-1 px-3 space-y-1">
                    {ADMIN_TABS.map((tab) => {
                        const isActive = currentTab === tab.id;
                        return (
                            <Link
                                key={tab.id}
                                href={`/dashboard/admin?tab=${tab.id}`}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${isActive
                                        ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                        : 'text-text-secondary hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-text-main'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 mt-auto border-t border-gray-100 dark:border-gray-800">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-main transition-colors"
                    >
                        <LogOut className="w-4 h-4 rotate-180" />
                        Exit Admin Mode
                    </Link>
                </div>
            </aside>
        );
    }


    // RENDER: Student Sidebar Layout (Existing)
    const progress = getProgress();
    const weeksCompleted = curriculum.filter((_, i) => isWeekComplete(i)).length;

    return (
        <aside className="sidebar fixed left-0 top-0 bottom-0 overflow-y-auto z-50">
            {/* Logo */}
            <div className="p-6 pb-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center shadow-glow-primary">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg text-text-main dark:text-white tracking-tight">
                        Kickstart AI Coach
                    </span>
                </div>
            </div>

            {/* Admin Link */}
            {isAdmin && (
                <div className="px-6 mt-6">
                    <Link
                        href="/dashboard/admin"
                        className="flex items-center gap-3 px-4 py-3 bg-gray-900 text-white rounded-xl shadow-lg shadow-gray-900/20 hover:bg-black transition-all group"
                    >
                        <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                        <span className="font-semibold text-sm">Admin Dashboard</span>
                    </Link>
                </div>
            )}

            {/* Course Progress */}
            <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-text-main dark:text-white">Course Progress</span>
                    <span className="text-sm font-bold text-primary">{progress.percentage}%</span>
                </div>
                <div className="progress-bar mb-2">
                    <motion.div
                        className="progress-bar-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress.percentage}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                </div>
                <p className="text-xs text-text-secondary">
                    {weeksCompleted} of {curriculum.length} Weeks Completed
                </p>
            </div>

            {/* Modules Section */}
            <div className="px-6 mb-3">
                <h3 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                    Modules
                </h3>
            </div>

            {/* Week Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 space-y-1 mb-6">
                {curriculum.map((week, weekIndex) => {
                    const unlocked = isWeekUnlocked(weekIndex);
                    const complete = isWeekComplete(weekIndex);
                    const isCurrent = weekIndex === currentWeek;

                    return (
                        <motion.button
                            key={week.id}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: weekIndex * 0.03 }}
                            onClick={() => unlocked && navigateTo(weekIndex)}
                            disabled={!unlocked}
                            className={`w-full text-left relative module-item ${isCurrent ? 'active' : ''
                                } ${!unlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {/* Status Icon */}
                            <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${complete
                                    ? 'bg-success text-white'
                                    : isCurrent
                                        ? 'bg-primary text-white'
                                        : unlocked
                                            ? 'bg-gray-100 dark:bg-gray-800 text-text-secondary'
                                            : 'bg-gray-100 dark:bg-gray-800 text-text-tertiary'
                                    }`}
                            >
                                {complete ? (
                                    <Check className="w-4 h-4" strokeWidth={2.5} />
                                ) : unlocked ? (
                                    <BookOpen className="w-3.5 h-3.5" />
                                ) : (
                                    <Lock className="w-3.5 h-3.5" />
                                )}
                            </div>

                            {/* Week Info */}
                            <div className="flex-1 min-w-0">
                                <span
                                    className={`font-semibold text-sm block truncate ${isCurrent
                                        ? 'text-primary'
                                        : complete
                                            ? 'text-text-main dark:text-white'
                                            : 'text-text-main dark:text-gray-200'
                                        }`}
                                >
                                    Week {week.id}: {week.title}
                                </span>
                                {isCurrent && (
                                    <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">
                                        In Progress
                                    </span>
                                )}
                            </div>
                        </motion.button>
                    );
                })}
            </nav>

            {/* AI Coach Button */}
            <div className="p-4 mt-auto">
                <button
                    onClick={() => setAiCoachOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all duration-200 shadow-glow-primary hover:shadow-glow-primary-lg"
                >
                    <Sparkles className="w-5 h-5" />
                    <span>Ask AI Coach</span>
                </button>
                <p className="text-[11px] text-center text-text-secondary mt-2 flex items-center justify-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-success rounded-full"></span>
                    Progress saved locally
                </p>
            </div>
        </aside>
    );
}
