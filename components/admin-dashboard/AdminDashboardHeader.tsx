'use client'

import React from 'react';
import { Sparkles, Calendar, Zap } from 'lucide-react';
import { colors } from '@/themes/colors';

interface AdminDashboardHeaderProps {
    userName: string;
}

export default function AdminDashboardHeader({ userName }: AdminDashboardHeaderProps) {
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="relative overflow-hidden bg-card rounded-2xl border border-border-default transition-all duration-500 mb-4 w-full group">
            <div className="relative z-10 p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Greeting Section */}
                <div className="flex-1">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-text-primary tracking-tighter leading-none mb-2">
                        Welcome back, <br className="sm:hidden" />
                        <span style={{ color: colors.primary[600] }}>
                            {userName}
                        </span>
                    </h1>
                </div>

                {/* Status Widgets */}
                <div className="flex flex-col sm:flex-row gap-3 items-center self-end md:self-center">
                    <div className="flex items-center gap-3 bg-muted-bg/50 p-3 rounded-2xl border border-border-default/50 transition-colors hover:bg-card">
                        <div className="p-2 bg-card rounded-xl border border-border-default">
                            <Calendar className="w-5 h-5" style={{ color: colors.primary[600] }} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-0.5">Current Session</p>
                            <p className="text-sm font-black text-text-primary tracking-tight">{today}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
