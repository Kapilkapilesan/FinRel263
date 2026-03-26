'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    AlertTriangle,
    Clock,
    X,
    LogOut,
    ShieldAlert
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { maintenanceModeService, MaintenanceStatus } from '../../services/maintenanceMode.service';
import { authService } from '../../services/auth.service';
import SystemMaintenance from './SystemMaintenance';

export function MaintenanceGuard() {
    const [status, setStatus] = useState<MaintenanceStatus | null>(null);
    const [showWarning, setShowWarning] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null); // in seconds
    const [isBlocked, setIsBlocked] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    const isExcludedRole = useCallback(() => {
        const user = authService.getCurrentUser();
        if (!user) return true; // Not logged in, handled by main auth guard
        
        // Allow ONLY super_admin or users on the maintenance-mode page
        const isSuperAdmin = authService.hasRole('super_admin');
        const isMaintenancePath = pathname === '/maintenance/maintenance-mode';
        
        return isSuperAdmin || isMaintenancePath;
    }, [pathname]);

    const checkMaintenance = useCallback(async () => {
        try {
            const response = await maintenanceModeService.getStatus();
            const data = response.data;
            setStatus(data);

            const now = new Date(data.server_time).getTime();

            // 1. Immediate Maintenance Check
            if (data.is_active && !isExcludedRole()) {
                setIsBlocked(true);
                return;
            } else {
                setIsBlocked(false);
            }

            // 2. Scheduled Maintenance Check
            if (data.start_time) {
                const startTime = new Date(data.start_time).getTime();
                const endTime = data.end_time ? new Date(data.end_time).getTime() : null;
                const diffMs = startTime - now;
                const diffMins = diffMs / (1000 * 60);

                // If within scheduled window
                if (diffMs <= 0 && (!endTime || now < endTime) && !isExcludedRole()) {
                    setIsBlocked(true);
                    return;
                }

                // If within 5 minute warning zone - ONLY for non-excluded roles
                if (diffMs > 0 && diffMins <= 5 && !isExcludedRole()) {
                    setCountdown(Math.floor(diffMs / 1000));
                    setShowWarning(true);
                } else {
                    // Not in warning zone
                    if (diffMs > 0) {
                        setShowWarning(false);
                        setCountdown(null);
                    }
                }
            } else {
                setShowWarning(false);
                setCountdown(null);
            }
        } catch (error: any) {
            console.error('Maintenance check failed', error);
            // If the status check itself returns 503 (Blocked by middleware)
            if (error.message?.includes('Maintenance') && !isExcludedRole()) {
                setIsBlocked(true);
            }
        }
    }, [isExcludedRole]);

    useEffect(() => {
        // Initial check
        checkMaintenance();

        // Polling every 15 seconds for better responsiveness
        const pollInterval = setInterval(checkMaintenance, 15000);

        return () => clearInterval(pollInterval);
    }, [checkMaintenance]);

    // Countdown timer effect
    useEffect(() => {
        if (countdown !== null && countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0 && !isExcludedRole()) {
            setIsBlocked(true);
        }
    }, [countdown, isExcludedRole]);

    // If blocked, show the premium maintenance screen
    if (isBlocked && pathname !== '/login') {
        return <SystemMaintenance message={status?.message || undefined} endTime={status?.end_time || undefined} />;
    }

    if (!showWarning || countdown === null) {
        return null;
    }


    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <>
            {/* Top Banner Timer */}
            <div className="fixed top-0 left-0 right-0 z-[9999] bg-[#d32f2f] text-white py-3 flex items-center justify-center gap-6 animate-in slide-in-from-top duration-500 shadow-xl border-b border-white/10">
                <div className="bg-white/20 p-2 rounded-lg">
                    <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <div className="flex flex-col items-center leading-none">
                    <span className="text-[12px] font-black uppercase tracking-[0.2em] opacity-90 mb-1">System Offline</span>
                    <span className="text-2xl font-black tabular-nums tracking-tighter">{formatTime(countdown)}</span>
                </div>
            </div>

            {/* Warning Modal */}
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300 relative">
                    <button
                        onClick={() => setShowWarning(false)}
                        className="absolute top-10 right-10 p-3 hover:bg-gray-100 rounded-full transition-colors group"
                    >
                        <X className="w-8 h-8 text-gray-400 group-hover:text-gray-600" />
                    </button>

                    <div className="p-16 text-center">
                        <div className="mx-auto w-28 h-28 mb-12 flex items-center justify-center">
                            <AlertTriangle className="w-24 h-24 text-gray-900" strokeWidth={1.5} />
                        </div>

                        <h2 className="text-[2.75rem] font-black text-gray-900 mb-6 leading-tight tracking-tight uppercase">Maintenance Pending</h2>
                        <p className="text-gray-500 font-bold text-xl mb-12 tracking-tight">
                            Please save your work immediately.
                        </p>

                        <div className="bg-gray-50/50 p-10 rounded-[2.5rem] border border-gray-100 mb-12 relative overflow-hidden">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-1 border border-gray-100 rounded-full">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Scheduled Window</span>
                            </div>

                            <div className="flex items-center justify-center gap-10">
                                <div className="text-center">
                                    <p className="text-3xl font-black text-gray-900">
                                        {status?.start_time ? new Date(status.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--'}
                                    </p>
                                </div>
                                <div className="text-gray-400">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-black text-gray-900">
                                        {status?.end_time ? new Date(status.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowWarning(false)}
                            className="w-full py-7 bg-gray-900 text-white font-black text-xl rounded-[2rem] shadow-xl hover:bg-gray-800 active:scale-[0.98] transition-all tracking-wide uppercase"
                        >
                            I Understand
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
