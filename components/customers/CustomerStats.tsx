import React from 'react';
import { Users, UserCheck, Shield, Activity, UserX } from 'lucide-react';
import { CustomerStats as CustomerStatsType } from '../../types/customer.types';

interface CustomerStatsProps {
    stats: CustomerStatsType;
    pendingRequestsCount?: number;
}

export function CustomerStatsCard({ stats, pendingRequestsCount = 0 }: CustomerStatsProps) {
    const { totalCustomers, activeCustomers, blockedCustomers, customersWithLoans, newThisMonth } = stats;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Total Customers */}
            <div className="bg-card/60 backdrop-blur-sm rounded-xl border border-border-default p-2.5 group overflow-hidden relative transition-all hover:shadow-lg">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full -mr-12 -mt-12 transition-transform duration-500 group-hover:scale-110" />
                <div className="flex items-center justify-between mb-1 relative z-10">
                    <div className="w-7 h-7 bg-primary-500/10 border border-primary-500/20 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
                        <Users className="w-3.5 h-3.5 text-primary-500" />
                    </div>
                    <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md uppercase tracking-tight">
                        +{newThisMonth}
                    </span>
                </div>
                <div className="relative z-10">
                    <p className="text-[9px] font-black text-text-muted mb-0 uppercase tracking-[0.2em] opacity-60">Total Customers</p>
                    <p className="text-xl font-black text-text-primary tracking-tight">{totalCustomers}</p>
                </div>
            </div>

            {/* Active Customers */}
            <div className="bg-card/60 backdrop-blur-sm rounded-xl border border-border-default p-2.5 group overflow-hidden relative transition-all hover:shadow-lg">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 transition-transform duration-500 group-hover:scale-110" />
                <div className="flex items-center justify-between mb-1 relative z-10">
                    <div className="w-7 h-7 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md font-mono">
                            {totalCustomers > 0 ? ((activeCustomers / totalCustomers) * 100).toFixed(0) : 0}%
                        </span>
                    </div>
                </div>
                <div className="relative z-10">
                    <p className="text-[9px] font-black text-text-muted mb-0 uppercase tracking-[0.2em] opacity-60">Verified Status</p>
                    <p className="text-xl font-black text-text-primary tracking-tight">{activeCustomers}</p>
                </div>
            </div>

            {/* Disabled Customers */}
            <div className="bg-card/60 backdrop-blur-sm rounded-xl border border-border-default p-2.5 group overflow-hidden relative transition-all hover:shadow-lg">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-12 -mt-12 transition-transform duration-500 group-hover:scale-110" />
                <div className="flex items-center justify-between mb-1 relative z-10">
                    <div className="w-7 h-7 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
                        <UserX className="w-3.5 h-3.5 text-rose-500" />
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-md font-mono">
                            {totalCustomers > 0 ? ((blockedCustomers / totalCustomers) * 100).toFixed(0) : 0}%
                        </span>
                    </div>
                </div>
                <div className="relative z-10">
                    <p className="text-[9px] font-black text-text-muted mb-0 uppercase tracking-[0.2em] opacity-60">Disabled Customers</p>
                    <p className="text-xl font-black text-text-primary tracking-tight">{blockedCustomers}</p>
                </div>
            </div>

            {/* With Active Loans */}
            <div className="bg-card/60 backdrop-blur-sm rounded-xl border border-border-default p-2.5 group overflow-hidden relative transition-all hover:shadow-lg">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-12 -mt-12 transition-transform duration-500 group-hover:scale-110" />
                <div className="flex items-center justify-between mb-1 relative z-10">
                    <div className="w-7 h-7 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
                        <Shield className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md font-mono">
                        {totalCustomers > 0 ? ((customersWithLoans / totalCustomers) * 100).toFixed(0) : 0}%
                    </span>
                </div>
                <div className="relative z-10">
                    <p className="text-[9px] font-black text-text-muted mb-0 uppercase tracking-[0.2em] opacity-60">Credit Engagement</p>
                    <p className="text-xl font-black text-text-primary tracking-tight">{customersWithLoans}</p>
                </div>
            </div>

            {/* Pending Requests */}
            <div className="bg-card/60 backdrop-blur-sm rounded-xl border border-border-default p-2.5 group overflow-hidden relative transition-all hover:shadow-lg">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-12 -mt-12 transition-transform duration-500 group-hover:scale-110" />
                <div className="flex items-center justify-between mb-1 relative z-10">
                    <div className="w-7 h-7 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
                        <Activity className="w-3.5 h-3.5 text-rose-500" />
                    </div>
                    {pendingRequestsCount > 0 && (
                        <div className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-md">
                            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                            <span className="text-[8px] font-black text-rose-500 uppercase tracking-tight">Active</span>
                        </div>
                    )}
                </div>
                <div className="relative z-10">
                    <p className="text-[9px] font-black text-text-muted mb-0 uppercase tracking-[0.2em] opacity-60">Pending Requests</p>
                    <p className="text-xl font-black text-text-primary tracking-tight">{pendingRequestsCount}</p>
                </div>
            </div>
        </div>
    );
}
