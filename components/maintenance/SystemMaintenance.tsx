'use client';

import React from 'react';
import { Settings, LogOut, ShieldAlert, Clock, AlertTriangle } from 'lucide-react';
import { authService } from '../../services/auth.service';

interface SystemMaintenanceProps {
    message?: string;
    endTime?: string;
}

export default function SystemMaintenance({ message, endTime }: SystemMaintenanceProps) {
    const handleLogout = () => {
        authService.logout();
        window.location.href = '/login';
    };

    const formatEndTime = (time?: string) => {
        if (!time) return 'TBA';
        return new Date(time).toLocaleString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            day: '2-digit',
            month: 'short'
        });
    };

    return (
        <div className="fixed inset-0 z-[99999] bg-[#0a0a0b] flex items-center justify-center p-6 overflow-hidden">
            {/* Dynamic Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/10 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-600/10 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
            
            <div className="relative w-full max-w-2xl">
                {/* Main Card */}
                <div className="bg-card/40 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-12 md:p-16 shadow-2xl relative overflow-hidden group">
                    {/* Animated Border */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/20 via-transparent to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                    <div className="relative z-10 flex flex-col items-center text-center">
                        {/* Icon Animation */}
                        <div className="relative mb-12">
                            <div className="absolute inset-0 bg-primary-500/20 blur-2xl rounded-full scale-150 animate-pulse" />
                            <div className="w-24 h-24 bg-gradient-to-tr from-primary-500 to-primary-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary-500/40 relative">
                                <Settings className="w-12 h-12 text-white animate-[spin_8s_linear_infinite]" />
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center border-4 border-[#0a0a0b]">
                                    <AlertTriangle className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Text Content */}
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
                            SYSTEM UNDER<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-amber-400">MAINTENANCE</span>
                        </h1>
                        
                        <p className="text-gray-400 text-lg md:text-xl font-medium max-w-md mx-auto mb-12 leading-relaxed">
                            {message || "System is currently in Maintenance mode. Access to most features is restricted."}
                        </p>

                        {/* Status Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-12">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-start gap-2">
                                <div className="flex items-center gap-2 text-primary-400">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Expected Completion</span>
                                </div>
                                <span className="text-white font-bold text-lg">{formatEndTime(endTime)}</span>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-start gap-2">
                                <div className="flex items-center gap-2 text-amber-400">
                                    <ShieldAlert className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Access Support</span>
                                </div>
                                <span className="text-white font-bold text-lg">Administrators Only</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 w-full">
                            <button 
                                onClick={() => window.location.reload()}
                                className="flex-1 bg-white text-black py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 active:scale-95 transition-all shadow-xl"
                            >
                                Check Status
                            </button>
                            <button 
                                onClick={handleLogout}
                                className="flex-1 bg-white/5 border border-white/10 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <LogOut className="w-5 h-5" />
                                Secure Logout
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Quote */}
                <div className="mt-8 text-center text-gray-500 font-bold text-xs uppercase tracking-[0.3em] opacity-50">
                    BMS CAPITAL • INFRASTRUCTURE UNIT
                </div>
            </div>
        </div>
    );
}
