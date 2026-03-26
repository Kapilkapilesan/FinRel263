'use client';

import React from 'react';
import { Building2, TrendingUp, TrendingDown, Users, UserCheck, Calendar } from 'lucide-react';
import { colors } from '@/themes/colors';
import { BranchCollection } from './types';

interface CollectionBranchTableProps {
    branchCollections: BranchCollection[];
    isLoading?: boolean;
    selectedBranchId?: string | null;
    onBranchSelect?: (branchId: string | null) => void;
    onViewDetails: (branchId: string, branchName: string) => void;
}

export function CollectionBranchTable({ 
    branchCollections, 
    isLoading, 
    selectedBranchId, 
    onBranchSelect, 
    onViewDetails 
}: CollectionBranchTableProps) {
    if (isLoading) {
        return (
            <div className="bg-card rounded-2xl shadow-sm border border-border-default overflow-hidden animate-pulse">
                <div className="p-6 border-b border-border-default bg-table-header">
                    <div className="h-6 bg-muted-bg rounded w-48" />
                </div>
                <div className="p-6 space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 bg-muted-bg/50 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    const totals = branchCollections.reduce((acc, curr) => ({
        target: acc.target + curr.target,
        collected: acc.collected + curr.collected,
        variance: acc.variance + curr.variance,
        total_active_customers: acc.total_active_customers + curr.total_active_customers,
        due_customers: acc.due_customers + curr.due_customers,
        paid_customers: acc.paid_customers + curr.paid_customers,
    }), { target: 0, collected: 0, variance: 0, total_active_customers: 0, due_customers: 0, paid_customers: 0 });

    const totalAchievement = totals.target > 0
        ? ((totals.collected / totals.target) * 100).toFixed(1)
        : '0.0';

    const getStatusBadge = (achievement: number) => {
        if (achievement >= 100) {
            return { label: 'Exceeded', class: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500' };
        } else if (achievement >= 80) {
            return { label: 'On Track', class: 'border-primary-500/20 bg-primary-500/10 text-primary-500' };
        } else if (achievement >= 50) {
            return { label: 'Fair', class: 'border-amber-500/20 bg-amber-500/10 text-amber-500' };
        } else if (achievement > 0) {
            return { label: 'Low', class: 'border-rose-500/20 bg-rose-500/10 text-rose-500' };
        }
        return { label: 'No Data', class: 'border-border-default bg-muted-bg text-text-muted' };
    };

    return (
        <div className="bg-card rounded-2xl shadow-sm border border-border-default overflow-hidden">
            <div className="p-6 border-b border-border-default bg-table-header">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-text-primary tracking-tight">Branch Performance</h2>
                        <p className="text-xs text-text-muted font-medium mt-0.5">Breakdown of collection performance by branch</p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-table-header border-b border-border-default">
                        <tr>
                            <th className="text-left px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Branch</th>
                            <th className="text-right px-4 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Expectation</th>
                            <th className="text-right px-4 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Collected</th>
                            <th className="text-right px-4 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Balance</th>
                            <th className="text-center px-4 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                                <div className="flex items-center justify-center gap-1.5">
                                    <Calendar className="w-3 h-3" /> Due
                                </div>
                            </th>
                            <th className="text-center px-4 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                                <div className="flex items-center justify-center gap-1.5">
                                    <UserCheck className="w-3 h-3" /> Paid
                                </div>
                            </th>
                            <th className="text-center px-4 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                                <div className="flex items-center justify-center gap-1.5">
                                    <Users className="w-3 h-3" /> Active
                                </div>
                            </th>
                            <th className="text-center px-4 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Rate</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-divider">
                        {branchCollections.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-text-muted font-medium italic">
                                    No branch data available for this period.
                                </td>
                            </tr>
                        ) : (
                            <>
                                {branchCollections.map((branch, index) => {
                                    const isPositiveVariance = branch.variance >= 0;

                                    return (
                                        <tr 
                                            key={index} 
                                            className={`hover:bg-table-row-hover transition-colors group cursor-pointer ${selectedBranchId === branch.branchId ? 'bg-primary-500/5' : ''}`}
                                            onClick={() => onViewDetails(branch.branchId, branch.branch)}
                                        >
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onBranchSelect?.(branch.branchId);
                                                    }}
                                                    className="font-bold hover:underline transition-all flex items-center gap-2 group text-left"
                                                    style={{ color: colors.primary[600] }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.color = colors.primary[700];
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.color = colors.primary[600];
                                                    }}
                                                >
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    {branch.branch}
                                                </button>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-right text-text-primary font-mono font-black">
                                                {branch.target.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-right font-black text-primary-500 font-mono">
                                                {branch.collected.toLocaleString()}
                                            </td>
                                            <td className={`px-4 py-4 text-sm text-right font-black font-mono ${isPositiveVariance ? 'text-primary-500' : 'text-rose-500'}`}>
                                                <span className="inline-flex items-center gap-1">
                                                    {isPositiveVariance ? '+' : ''}{branch.variance.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-center text-primary-500 font-black font-mono">
                                                {branch.due_customers}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-center text-primary-500 font-black font-mono">
                                                {branch.paid_customers}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-center text-text-secondary font-mono font-bold">
                                                {branch.total_active_customers}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                {(() => {
                                                    const badge = getStatusBadge(branch.achievement);
                                                    return (
                                                        <span
                                                            className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${badge.class}`}
                                                        >
                                                            {branch.achievement}%
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                        </tr>
                                    );
                                })}
                                <tr 
                                    className={`bg-table-header font-black border-t border-border-default/50 hover:bg-table-row-hover cursor-pointer transition-colors ${!selectedBranchId ? 'bg-primary-500/5' : ''}`}
                                    onClick={() => onBranchSelect?.(null)}
                                >
                                    <td className="px-6 py-5 text-sm text-text-primary uppercase tracking-widest flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full bg-primary-500 transition-opacity ${!selectedBranchId ? 'opacity-100' : 'opacity-0'}`} />
                                        Total
                                    </td>
                                    <td className="px-4 py-5 text-sm text-right text-text-primary font-mono">
                                        {totals.target.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-5 text-sm text-right text-primary-500 font-mono">
                                        {totals.collected.toLocaleString()}
                                    </td>
                                    <td className={`px-4 py-5 text-sm text-right font-mono ${totals.variance >= 0 ? 'text-primary-500' : 'text-rose-500'}`}>
                                        {totals.variance >= 0 ? '+' : ''}{totals.variance.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-5 text-sm text-center text-primary-500 font-mono">
                                        {totals.due_customers}
                                    </td>
                                    <td className="px-4 py-5 text-sm text-center text-primary-500 font-mono">
                                        {totals.paid_customers}
                                    </td>
                                    <td className="px-4 py-5 text-sm text-center text-text-primary font-mono">
                                        {totals.total_active_customers}
                                    </td>
                                    <td className="px-4 py-5 text-center">
                                        {(() => {
                                            const achievementVal = parseFloat(totalAchievement);
                                            const badge = getStatusBadge(achievementVal);
                                            return (
                                                <span
                                                    className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${badge.class}`}
                                                >
                                                    {totalAchievement}%
                                                </span>
                                            );
                                        })()}
                                    </td>
                                </tr>
                            </>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
