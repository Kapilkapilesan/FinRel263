'use client';

import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, UserCheck, Calendar } from 'lucide-react';
import { colors } from '@/themes/colors';
import { SummaryStats } from './types';

interface CollectionStatsProps {
    stats: SummaryStats;
    isLoading?: boolean;
    onClearFilter?: () => void;
    filteredBranchName?: string;
}

export function CollectionStats({ stats, isLoading, onClearFilter, filteredBranchName }: CollectionStatsProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-card rounded-2xl p-3 border border-border-default animate-pulse">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-muted-bg rounded-lg" />
                            <div className="h-3 bg-muted-bg rounded w-16" />
                        </div>
                        <div className="h-6 bg-muted-bg rounded w-24" />
                    </div>
                ))}
            </div>
        );
    }

    const isPositiveVariance = stats.totalVariance >= 0;

    return (
        <div className="space-y-4">
            {filteredBranchName && (
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Filtered By:</span>
                    <div className="flex items-center gap-2 px-3 py-1 bg-primary-500/10 border border-primary-500/20 rounded-full">
                        <span className="text-xs font-black text-primary-500 uppercase">{filteredBranchName}</span>
                        <button 
                            onClick={onClearFilter}
                            className="p-0.5 hover:bg-primary-500/20 rounded-full transition-colors"
                        >
                            <svg className="w-3 h-3 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
            {/* Total Expectation */}
            <div className="bg-card rounded-2xl p-3 border border-border-default/50 transition-all group">
                <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: `${colors.primary[500]}1a`, color: colors.primary[600] }}>
                        <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] text-text-muted uppercase font-black tracking-widest">Total Expectation</p>
                        <p className="text-[10px] text-text-muted/60 font-bold whitespace-nowrap">Due + Arrears + Penalties</p>
                    </div>
                </div>
                <p className="text-xl font-black text-text-primary tracking-tight">LKR {stats.totalTarget.toLocaleString()}</p>
            </div>

            {/* Actual Collection */}
            <div className="bg-card rounded-2xl p-3 shadow-sm border border-border-default/50 transition-all hover:shadow-xl group">
                <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-8 h-8 bg-primary-500/10 text-primary-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] text-text-muted uppercase font-black tracking-widest">Actual Collection</p>
                        <p className="text-[10px] text-text-muted/60 font-bold whitespace-nowrap">Cash Received Today</p>
                    </div>
                </div>
                <p className="text-xl font-black text-primary-500 tracking-tight leading-tight">LKR {stats.totalCollected.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1.5 bg-muted-bg rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary-500 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(stats.achievement, 100)}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-black text-primary-500">{stats.achievement}%</span>
                </div>
            </div>

            {/* Collection Balance */}
            <div className="bg-card rounded-2xl p-3 shadow-sm border border-border-default/50 transition-all hover:shadow-xl group">
                <div className="flex items-center gap-2.5 mb-1.5">
                    <div className={`w-8 h-8 ${isPositiveVariance ? 'bg-primary-500/10 text-primary-500' : 'bg-rose-500/10 text-rose-500'} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        {isPositiveVariance ? (
                            <TrendingUp className="w-4 h-4" />
                        ) : (
                            <TrendingDown className="w-4 h-4" />
                        )}
                    </div>
                    <div>
                        <p className="text-[10px] text-text-muted uppercase font-black tracking-widest">Balance</p>
                        <p className="text-[10px] text-text-muted/60 font-bold whitespace-nowrap">Surplus / Shortfall</p>
                    </div>
                </div>
                <p className={`text-xl font-black tracking-tight ${isPositiveVariance ? 'text-primary-500' : 'text-rose-500'}`}>
                    {isPositiveVariance ? '+' : ''}{stats.totalVariance.toLocaleString()}
                </p>
            </div>

            {/* Scheduled Customers */}
            <div className="bg-card rounded-2xl p-3 shadow-sm border border-border-default/50 transition-all hover:shadow-xl group">
                <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-8 h-8 bg-primary-500/10 text-primary-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] text-text-muted uppercase font-black tracking-widest">Due Customers</p>
                        <p className="text-[10px] text-text-muted/60 font-bold whitespace-nowrap">Scheduled Today</p>
                    </div>
                </div>
                <p className="text-xl font-black text-text-primary tracking-tight leading-tight">{stats.totalDueCustomers.toLocaleString()}</p>
            </div>

            {/* Paid Customers */}
            <div className="bg-card rounded-2xl p-3 shadow-sm border border-border-default/50 transition-all hover:shadow-xl group">
                <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-8 h-8 bg-primary-500/10 text-primary-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] text-text-muted uppercase font-black tracking-widest">Paid Today</p>
                        <p className="text-[10px] text-text-muted/60 font-bold whitespace-nowrap">Payments Made</p>
                    </div>
                </div>
                <p className="text-xl font-black text-text-primary tracking-tight leading-tight">{stats.totalPaidCustomers.toLocaleString()}</p>
            </div>

            {/* Active Portfolio */}
            <div className="bg-card rounded-2xl p-3 shadow-sm border border-border-default/50 transition-all hover:shadow-xl group">
                <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-8 h-8 bg-primary-500/10 text-primary-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] text-text-muted uppercase font-black tracking-widest">Active Loans</p>
                        <p className="text-[10px] text-text-muted/60 font-bold whitespace-nowrap">Total Portfolio</p>
                    </div>
                </div>
                <p className="text-xl font-black text-text-primary tracking-tight leading-tight">{stats.totalActiveCustomers.toLocaleString()}</p>
            </div>
            </div>
        </div>
    );
}
