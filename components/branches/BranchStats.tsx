'use client'
import React from 'react';
import { Building2, TrendingUp, Users } from 'lucide-react';
import { BranchStats as BranchStatsType } from '../../types/branch.types';
import { colors } from '../../themes/colors';

interface BranchStatsProps {
    stats: BranchStatsType;
}

export function BranchStats({ stats }: BranchStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {/* Total Branches */}
            <div className="bg-card rounded-xl border border-border-default/50 p-3 hover:shadow-lg transition-all group relative overflow-hidden">
                <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary-500/10 text-primary-500 border border-primary-500/20 group-hover:scale-110 transition-transform">
                        <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60 px-0.5">Total Branches</p>
                </div>
                <p className="text-xl font-black text-text-primary tracking-tight px-0.5">{stats.totalBranches}</p>
            </div>

            {/* Active Branches */}
            <div className="bg-card rounded-xl border border-border-default/50 p-3 hover:shadow-lg transition-all group relative overflow-hidden">
                <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary-500/10 text-primary-500 border border-primary-500/20 group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-3.5 h-3.5" />
                        </div>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60 px-0.5">Active Branches</p>
                    </div>
                    <div className="px-1.5 py-0.5 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                        <span className="text-[9px] font-black text-primary-600 tracking-widest">
                            {stats.totalBranches > 0 ? ((stats.activeBranches / stats.totalBranches) * 100).toFixed(0) : 0}%
                        </span>
                    </div>
                </div>
                <p className="text-xl font-black text-text-primary tracking-tight px-0.5">{stats.activeBranches}</p>
            </div>

            {/* Total Customers */}
            <div className="bg-card rounded-xl border border-border-default/50 p-3 hover:shadow-lg transition-all group relative overflow-hidden">
                <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                        <Users className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60 px-0.5">Total Customers</p>
                </div>
                <p className="text-xl font-black text-text-primary tracking-tight px-0.5">{stats.totalCustomers}</p>
            </div>

            {/* Total Loans */}
            <div className="bg-card rounded-xl border border-border-default/50 p-3 hover:shadow-lg transition-all group relative overflow-hidden">
                <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                        <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60 px-0.5">Total Loans</p>
                </div>
                <p className="text-xl font-black text-text-primary tracking-tight px-0.5">{stats.totalLoans}</p>
            </div>
        </div>
    );
}
