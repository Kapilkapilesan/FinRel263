'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Search, User, LogOut, ChevronDown, Moon, Sun, Clock, Building2, ArrowLeftRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useBranchContext } from '../../contexts/BranchContext';
import { authService, LogoutType } from '../../services/auth.service';
import { sessionService, WorkStatus, getWorkStatusLabel, getWorkStatusColor } from '../../services/session.service';
import { toast } from 'react-toastify';
import { NotificationDropdown } from './NotificationDropdown';
import { BranchSwitcher } from './BranchSwitcher';
import { SecureImage } from '../common/SecureImage';
import { API_BASE_URL } from '@/services/api.config';

interface HeaderProps {
    user: {
        name: string;
        role: string;
        branch?: string;
        avatar_url?: string;
        staff_id?: string;
        user_name?: string;
    };
    onLogout: () => void;
    onToggleSidebar: () => void;
    onProfileSettings?: () => void;
}

export function Header({ user, onLogout, onToggleSidebar, onProfileSettings }: HeaderProps) {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showMidnightWarning, setShowMidnightWarning] = useState(false);
    const [midnightWarningMessage, setMidnightWarningMessage] = useState<string | null>(null);
    const [countdownSeconds, setCountdownSeconds] = useState<number>(300);
    const [isCountdownActive, setIsCountdownActive] = useState(false);
    const [isAccountLocking, setIsAccountLocking] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [todayWorkedTime, setTodayWorkedTime] = useState<string>('0h 0m');
    const [tempPromo, setTempPromo] = useState<{ target_role_name: string, end_date: string } | null>(null);

    const userMenuRef = useRef<HTMLDivElement>(null);
    const userMenuButtonRef = useRef<HTMLButtonElement>(null);
    const pathname = usePathname();
    const router = useRouter();

    const { isDarkMode, toggleTheme } = useTheme();

    // Check if user is admin or super_admin - they don't need session tracking
    const isAdminOrSuperAdmin = authService.hasPermission('sessions.bypass') || authService.hasPermission('admin_dashboard.view');

    // Work status: maps to backend logout types
    // 'office_work' -> STAY_IN_OFFICE (temporary, session stays open)
    // 'on_field' -> ON_WORK (temporary, session stays open)  
    // 'logged_out' -> LOGOUT (permanent, session closes)
    const [workStatus, setWorkStatus] = useState<WorkStatus>('office_work');

    // Close menus on route change
    useEffect(() => {
        setShowUserMenu(false);
    }, [pathname]);

    // Close user menu on outside click
    useEffect(() => {
        if (!showUserMenu) return;

        function handleClickOutside(event: MouseEvent) {
            if (
                userMenuRef.current &&
                !userMenuRef.current.contains(event.target as Node) &&
                userMenuButtonRef.current &&
                !userMenuButtonRef.current.contains(event.target as Node)
            ) {
                setShowUserMenu(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserMenu]);

    // Fetch current session and check midnight warning (only for non-admin users)
    const fetchSessionData = useCallback(async () => {
        // Skip session tracking for admins
        if (isAdminOrSuperAdmin) return;

        try {
            const [sessionResponse, todayResponse] = await Promise.all([
                sessionService.getCurrentSession(),
                sessionService.getTodaySessions()
            ]);

            // Update worked time
            if (todayResponse?.data) {
                setTodayWorkedTime(sessionService.formatWorkedTime(todayResponse.data.total_worked_minutes));

                // Check midnight warning
                if (todayResponse.data.should_show_midnight_warning) {
                    setShowMidnightWarning(true);
                }
            }

            // Determine current work status from session
            if (sessionResponse?.data?.session) {
                const currentStatus = sessionService.getCurrentWorkStatus(sessionResponse.data.session);
                setWorkStatus(currentStatus);

                if (sessionResponse.data.should_show_midnight_warning) {
                    setShowMidnightWarning(true);
                }
            }
        } catch (error) {
            console.error('Failed to fetch session data:', error);
        }
    }, [isAdminOrSuperAdmin]);

    // Check for midnight warning periodically (only for non-admin users)
    useEffect(() => {
        if (isAdminOrSuperAdmin) return;

        fetchSessionData();

        // Check every 5 minutes
        const interval = setInterval(fetchSessionData, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [fetchSessionData, isAdminOrSuperAdmin]);

    // Check midnight warning specifically (only for non-admin users)
    useEffect(() => {
        if (isAdminOrSuperAdmin) return;

        const performTimeCheck = () => {
            const now = new Date();
            const midnight = new Date(now);
            midnight.setHours(24, 0, 0, 0); // Set to next midnight (00:00:00)

            const diffMs = midnight.getTime() - now.getTime();
            const diffSeconds = Math.floor(diffMs / 1000);

            // Production logic: Trigger when 5 minutes (300 seconds) or less remain
            if (diffSeconds <= 300 && diffSeconds > 0) {
                if (!isCountdownActive) {
                    setCountdownSeconds(diffSeconds); // Set exact remaining seconds
                    setShowMidnightWarning(true);
                    setIsCountdownActive(true);
                    setMidnightWarningMessage("It is almost midnight. Please log out now to save your work. Your account will lock at 12:00 AM.");
                }
            }
        };

        const interval = setInterval(performTimeCheck, 5000); // Check every 5 seconds for better precision
        performTimeCheck();

        return () => clearInterval(interval);
    }, [isCountdownActive, isAdminOrSuperAdmin]);

    // Handle work status change (temporary logout types) - only for staff
    const handleWorkStatusChange = async (newStatus: WorkStatus) => {
        if (isUpdatingStatus || isAdminOrSuperAdmin) return;

        setIsUpdatingStatus(true);

        try {
            if (newStatus === 'logged_out') {
                setShowLogoutConfirm(true);
                setIsUpdatingStatus(false);
                return;
            }

            // Map frontend status to backend logout type
            const logoutType: LogoutType = newStatus === 'on_field' ? 'ON_WORK' : 'STAY_IN_OFFICE';

            // Log out with the specific type (this clears storage and revokes token)
            await authService.logout(logoutType);

            // Trigger local cleanup and redirect
            onLogout();
            router.push('/login');
        } catch (error) {
            console.error('Failed to update work status:', error);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    // Handle permanent logout
    const handleLogout = async () => {
        setShowLogoutConfirm(false);
        setShowUserMenu(false);

        try {
            await authService.logout('LOGOUT');
            onLogout();
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            // Still redirect even if API fails
            onLogout();
            router.push('/login');
        }
    };

    // Quick logout for admins (no confirmation needed)
    const handleAdminLogout = async () => {
        setShowUserMenu(false);
        try {
            await authService.logout('LOGOUT');
            onLogout();
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            onLogout();
            router.push('/login');
        }
    };

    // Dismiss midnight warning modal (but keep background countdown running)
    const dismissMidnightWarning = () => {
        setShowMidnightWarning(false);
        // We do NOT reset countdown here for Option 2
    };

    // Countdown timer effect - runs in background once triggered
    useEffect(() => {
        if (!isCountdownActive) return;

        // Start countdown from existing state
        const countdownInterval = setInterval(() => {
            setCountdownSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    // Timer expired - lock account immediately
                    handleMidnightTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(countdownInterval);
    }, [isCountdownActive]);

    // Handle midnight timeout - discard session and lock account
    const handleMidnightTimeout = async () => {
        if (isAccountLocking) return;
        setIsAccountLocking(true);

        try {
            // Call API to discard session and lock account
            await sessionService.midnightTimeoutLock();

            // Show toast and redirect to login
            toast.error('Your session has been discarded due to timeout. Your account is now locked. Please contact your manager to unlock.', { autoClose: false });

            onLogout();
            router.push('/login');
        } catch (error) {
            console.error('Failed to lock account:', error);
            // Still logout
            onLogout();
            router.push('/login');
        } finally {
            setIsAccountLocking(false);
        }
    };

    useEffect(() => {
        setTempPromo(authService.getTemporaryPromotion());
    }, []);

    return (
        <>
            {/* Midnight Warning Modal with Countdown */}
            {showMidnightWarning && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8">
                        <div className="flex items-center justify-center mb-4">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${countdownSeconds <= 30
                                ? 'bg-red-100 dark:bg-red-900/30'
                                : 'bg-yellow-100 dark:bg-yellow-900/30'
                                }`}>
                                <span className={`text-3xl font-bold ${countdownSeconds <= 30
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-yellow-600 dark:text-yellow-400'
                                    }`}>
                                    {Math.floor(countdownSeconds / 60)}:{String(countdownSeconds % 60).padStart(2, '0')}
                                </span>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-text-primary text-center mb-2">
                            {countdownSeconds <= 10 ? '⚠️ Account Lock Imminent!' : 'Midnight Approaching!'}
                        </h3>
                        <p className="text-text-secondary text-center mb-4">
                            {midnightWarningMessage || 'It is almost midnight. Please log out to save your work hours.'}
                        </p>
                        <div className={`p-3 rounded-xl text-center mb-6 ${countdownSeconds <= 30
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                            : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                            }`}>
                            <p className="text-sm font-medium">
                                {countdownSeconds <= 30
                                    ? `Your account will be LOCKED in ${countdownSeconds} seconds!`
                                    : `Time remaining: ${Math.floor(countdownSeconds / 60)}m ${countdownSeconds % 60}s`
                                }
                            </p>
                            <p className="text-xs mt-1 opacity-80">
                                If you don't logout, your session will be discarded and your account will be locked.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={dismissMidnightWarning}
                                disabled={isAccountLocking}
                                className="flex-1 px-4 py-2.5 border border-border-default rounded-xl hover:bg-hover transition-colors font-medium disabled:opacity-50"
                            >
                                Dismiss
                            </button>
                            <button
                                onClick={() => {
                                    dismissMidnightWarning();
                                    handleLogout();
                                }}
                                disabled={isAccountLocking}
                                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                            >
                                {isAccountLocking ? 'Locking...' : 'Logout Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8">
                        <div className="flex items-center justify-center mb-4">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                <LogOut className="w-8 h-8 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-text-primary text-center mb-2">
                            End Your Work Day?
                        </h3>
                        <p className="text-text-secondary text-center mb-2">
                            If you logout, your session will be closed and your attendance will be recorded.
                        </p>
                        <p className="text-sm text-text-muted text-center mb-6">
                            Today's work: <span className="font-semibold text-text-primary">{todayWorkedTime}</span>
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 px-4 py-2.5 border border-border-default rounded-xl hover:bg-hover transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                            >
                                Yes, Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header className="bg-card h-16 flex items-center justify-between px-6 border-b border-border-default transition-colors">
                {/* Left Section */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 hover:bg-hover rounded-xl transition-colors lg:hidden"
                    >
                        <Menu className="w-5 h-5 text-text-primary" />
                    </button>

                    <div className="relative group/search">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-text-muted group-focus-within/search:text-primary-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            name="main-search"
                            autoComplete="off"
                            placeholder="Search customers, loans, contracts..."
                            className="pl-10 pr-4 py-2.5 bg-input border border-border-default/50 rounded-xl w-80 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-card focus:border-primary-500/50 transition-all text-sm text-text-primary placeholder:text-text-muted/50"
                        />
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-3">
                    {/* Today's Worked Time - Only for staff (not admin) */}
                    {!isAdminOrSuperAdmin && (
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-primary-500 dark:bg-primary-600 rounded-xl shadow-lg shadow-primary-500/30 ring-1 ring-white/10">
                            <Clock className="w-4 h-4 text-white" />
                            <span className="text-sm text-white font-bold">{todayWorkedTime}</span>
                        </div>
                    )}

                    {/* Date & Time */}
                    <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-app-background rounded-xl">
                        <p className="text-sm text-text-secondary font-medium">
                            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                    </div>

                    {/* Temporary Promotion Badge */}
                    {tempPromo && (
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl" title={`Acting as ${tempPromo.target_role_name} until ${tempPromo.end_date}`}>
                            <div className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </div>
                            <span className="text-xs text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider">
                                Acting {tempPromo.target_role_name}
                            </span>
                        </div>
                    )}

                    {/* Branch Switcher - shows when user has multiple effective branches (temp promotion) */}
                    <BranchSwitcher />

                    {/* Dark Mode Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 hover:bg-hover rounded-xl transition-colors"
                        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {isDarkMode ? (
                            <Sun className="w-5 h-5 text-yellow-500" />
                        ) : (
                            <Moon className="w-5 h-5 text-gray-600" />
                        )}
                    </button>

                    {/* Notifications */}
                    <NotificationDropdown />

                    {/* User Menu */}
                    <div className="relative">
                        <button
                            ref={userMenuButtonRef}
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-3 pl-2 pr-3 py-2 hover:bg-hover rounded-xl transition-colors"
                        >
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 overflow-hidden">
                                <SecureImage
                                    src={(user.staff_id || user.user_name) ? `${API_BASE_URL}/media/staff-profiles/${user.staff_id || user.user_name}` : user.avatar_url || ''}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                    fallbackName={user.name}
                                />
                            </div>
                            <div className="hidden md:block text-left">
                                <p className="text-sm text-text-primary font-semibold tracking-tight">{user.name}</p>
                                <p className="text-xs text-text-muted font-medium">{user.role}</p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-text-secondary hidden md:block" />
                        </button>

                        {/* User Dropdown */}
                        {showUserMenu && (
                            <div
                                ref={userMenuRef}
                                className="absolute right-0 mt-2 w-72 bg-card rounded-2xl shadow-xl border border-border-default z-50"
                            >
                                <div className="p-4 border-b border-border-default">
                                    <p className="text-text-primary font-semibold tracking-tight">{user.name}</p>
                                    <p className="text-sm text-text-secondary font-medium mt-0.5">{user.role}</p>
                                    {user.branch && (
                                        <p className="text-xs text-text-muted mt-1 font-medium">Branch: {user.branch}</p>
                                    )}

                                    {/* Work Status Selector - Only for staff (not admin/super_admin) */}
                                    {!isAdminOrSuperAdmin && (
                                        <div className="mt-4">
                                            <label className="block text-xs text-text-secondary mb-2 font-medium">
                                                Work Status
                                            </label>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleWorkStatusChange('office_work')}
                                                    disabled={isUpdatingStatus}
                                                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${workStatus === 'office_work'
                                                        ? 'bg-primary-500/10 text-primary-700 dark:text-primary-400 ring-2 ring-primary-500/30'
                                                        : 'bg-muted-bg text-text-secondary hover:bg-hover'
                                                        } ${isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    Office Work
                                                </button>
                                                <button
                                                    onClick={() => handleWorkStatusChange('on_field')}
                                                    disabled={isUpdatingStatus}
                                                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${workStatus === 'on_field'
                                                        ? 'bg-primary-500/10 text-primary-700 dark:text-primary-400 ring-2 ring-primary-500/30'
                                                        : 'bg-muted-bg text-text-secondary hover:bg-hover'
                                                        } ${isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    On Field
                                                </button>
                                            </div>
                                            <p className="text-xs text-text-muted mt-2">
                                                {workStatus === 'office_work'
                                                    ? 'Working from office'
                                                    : 'Working on field / in a meeting'}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="p-2">
                                    <button
                                        onClick={onProfileSettings}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-text-secondary hover:bg-hover rounded-xl transition-colors font-medium"
                                    >
                                        <User className="w-4 h-4" />
                                        <span className="text-sm">Profile Settings</span>
                                    </button>

                                    {/* Different logout behavior for admin vs staff */}
                                    {isAdminOrSuperAdmin ? (
                                        // Simple logout for admins - no confirmation needed
                                        <button
                                            onClick={handleAdminLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors mt-1 font-medium"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span className="text-sm">Logout</span>
                                        </button>
                                    ) : (
                                        // Staff logout with confirmation
                                        <button
                                            onClick={() => setShowLogoutConfirm(true)}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors mt-1 font-medium"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span className="text-sm">End Work Day</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>
        </>
    );
}
