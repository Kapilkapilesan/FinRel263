import React from 'react';
import { Users, UserCheck, Shield } from 'lucide-react';
import { colors } from '@/themes/colors';
import { StaffStats } from '../../types/staff.types';

interface StaffStatsProps {
    stats: StaffStats;
}

export function StaffStatsCard({ stats }: StaffStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="bg-card rounded-xl border border-border-default p-2 transition-all group">
                <div className="flex items-center justify-between mb-1">
                    <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary-500/10 text-primary-500 group-hover:scale-110 transition-transform"
                    >
                        <Users className="w-3.5 h-3.5" />
                    </div>
                </div>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-0.5 px-0.5">Total Users</p>
                <p className="text-lg font-black text-text-primary tracking-tight px-0.5">{stats.totalUsers}</p>
            </div>

            <div className="bg-card rounded-xl border border-border-default p-2 transition-all group">
                <div className="flex items-center justify-between mb-1">
                    <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary-500/10 text-primary-500 group-hover:scale-110 transition-transform"
                    >
                        <UserCheck className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[9px] font-black text-primary-600 bg-primary-500/10 px-1.5 py-0.5 rounded-md">
                        {stats.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(0) : 0}% Active
                    </span>
                </div>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-0.5 px-0.5">Active Users</p>
                <p className="text-lg font-black text-text-primary tracking-tight px-0.5">{stats.activeUsers}</p>
            </div>

            <div className="bg-card rounded-xl border border-border-default p-2 transition-all group">
                <div className="flex items-center justify-between mb-1">
                    <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform"
                    >
                        <Shield className="w-3.5 h-3.5" />
                    </div>
                </div>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-0.5 px-0.5">User Roles</p>
                <p className="text-lg font-black text-text-primary tracking-tight px-0.5">{stats.totalRoles}</p>
            </div>
        </div>
    );
}
