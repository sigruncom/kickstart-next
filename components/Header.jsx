'use client';
import { Moon, Sun, User, ChevronRight, Bell, HelpCircle, Users, LogOut, BookOpen } from 'lucide-react';
import { useApp } from './AppContext';
import { useAuth } from './AuthContext';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
// ... imports

export default function Header() {
    const { getCurrentWeek, darkMode, toggleDarkMode } = useApp();
    const { user, userProfile, logout } = useAuth();
    const pathname = usePathname();

    const week = getCurrentWeek();
    const isAdminDashboard = pathname?.startsWith('/dashboard/admin');

    const getRoleDisplay = (role) => {
        switch (role) {
            case 'admin': return 'Administrator';
            case 'active_student': return 'Active Student';
            case 'completed_student': return 'Graduate';
            default: return 'Member';
        }
    };

    return (
        <header className="h-16 bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 sticky top-0 z-30 ml-72">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm">
                <span className="text-text-secondary hover:text-text-main cursor-pointer transition-colors">
                    Home
                </span>
                {isAdminDashboard ? (
                    <>
                        <ChevronRight className="w-4 h-4 text-text-tertiary" />
                        <span className="font-medium text-text-main dark:text-white">
                            Admin Dashboard
                        </span>
                    </>
                ) : (
                    <>
                        <ChevronRight className="w-4 h-4 text-text-tertiary" />
                        <span className="text-text-secondary hover:text-text-main cursor-pointer transition-colors">
                            Kickstart Program
                        </span>
                        {week && (
                            <>
                                <ChevronRight className="w-4 h-4 text-text-tertiary" />
                                <span className="font-medium text-text-main dark:text-white">
                                    Week {week.id}
                                </span>
                            </>
                        )}
                    </>
                )}
            </nav>

            {/* Right side navigation */}
            <div className="flex items-center gap-1">
                {/* Nav links */}
                <Link href="/dashboard" className="nav-tab">
                    Dashboard
                </Link>
                <a
                    href="https://programs.sigrun.com/communities/groups/somba-kickstart-january-2026/home"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nav-tab flex items-center gap-1.5"
                >
                    <Users className="w-4 h-4" />
                    Community
                </a>
                <a
                    href="https://programs.sigrun.com/communities/groups/somba-kickstart-january-2026/learning"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nav-tab flex items-center gap-1.5"
                >
                    <BookOpen className="w-4 h-4" />
                    Courses
                </a>
                <a
                    href="mailto:info@sigrun.com"
                    className="nav-tab flex items-center gap-1.5"
                >
                    <HelpCircle className="w-4 h-4" />
                    Support
                </a>

                {/* Divider */}
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-3"></div>

                {/* Dark mode toggle */}
                <button
                    onClick={toggleDarkMode}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Toggle dark mode"
                >
                    {darkMode ? (
                        <Sun className="w-5 h-5 text-amber-500" />
                    ) : (
                        <Moon className="w-5 h-5 text-text-secondary" />
                    )}
                </button>

                {/* Logout button */}
                <button
                    onClick={() => logout()}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Logout"
                    title="Logout"
                >
                    <LogOut className="w-5 h-5 text-text-secondary" />
                </button>

                {/* User profile */}
                <div className="user-profile ml-2">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-text-main dark:text-white">
                            {userProfile?.name || user?.displayName || user?.email?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-[11px] text-text-secondary">
                            {getRoleDisplay(userProfile?.role)}
                        </p>
                    </div>
                    <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center ring-2 ring-white dark:ring-surface-dark shadow-soft">
                        <User className="w-5 h-5 text-white" />
                    </div>
                </div>
            </div>
        </header>
    );
}
