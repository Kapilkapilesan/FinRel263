'use client'

import { TrendingUp, DollarSign, Clock, Wallet, ArrowUpRight, Activity } from 'lucide-react';
import { DashboardStats } from '@/types/dashboard.types';
import { colors } from '@/themes/colors';

interface DashboardStatsCardsProps {
    stats: DashboardStats;
    isManager?: boolean;
    selectedMonth?: number;
    selectedYear?: number;
}

export default function DashboardStatsCards({ stats, isManager, selectedMonth, selectedYear }: DashboardStatsCardsProps) {
    const isAllMonth = selectedMonth === 0;
    const isAllYear = selectedYear === 0;

    const prefix = (isAllMonth && isAllYear) ? 'Total' : (isAllMonth ? 'Yearly' : (isAllYear ? 'Combined' : 'Monthly'));

    const cards = [
        {
            label: isManager ? `Active Loans` : `Active Loans`,
            value: stats.activeLoansCount.toLocaleString(),
            // subLabel: `${prefix} System Count`,
            icon: Activity,
            iconClass: "text-violet-600 dark:text-violet-400",
            bgClass: "bg-violet-50 dark:bg-violet-900/20",
            dotClass: "bg-violet-600 dark:bg-violet-400",
            gradient: 'from-violet-500/5 to-transparent'
        },
        {
            label: isManager ? `Approve Amounts` : `Disbursements`,
            value: `${(stats.totalDisbursementsAmount / 1000000).toFixed(2)}M`,
            // subLabel: `${prefix} Capital Flow`,
            icon: DollarSign,
            iconClass: "text-emerald-600 dark:text-emerald-400",
            bgClass: "bg-emerald-50 dark:bg-emerald-900/20",
            dotClass: "bg-emerald-600 dark:bg-emerald-400",
            gradient: 'from-emerald-500/5 to-transparent'
        },
        {
            label: isManager ? `Pending Approvals` : `Pending Approvals`,
            value: stats.pendingApprovalsCount.toLocaleString(),
            // subLabel: `${prefix} Awaiting Layer`,
            icon: Clock,
            iconClass: "text-amber-600 dark:text-amber-400",
            bgClass: "bg-amber-50 dark:bg-amber-900/20",
            dotClass: "bg-amber-600 dark:bg-amber-400",
            gradient: 'from-amber-500/5 to-transparent'
        },
        {
            label: isManager ? `Collection Amount` : `Collection`,
            value: `${(stats.todayCollectionAmount / 1000).toFixed(1)}K`,
            // subLabel: `${prefix} Operational Inflow`,
            icon: Wallet,
            iconClass: "text-indigo-600 dark:text-indigo-400",
            bgClass: "bg-indigo-50 dark:bg-indigo-900/20",
            dotClass: "bg-indigo-600 dark:bg-indigo-400",
            gradient: 'from-indigo-500/5 to-transparent'
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <div
                        key={index}
                        className="group relative bg-card border border-border-default p-3 rounded-2xl"
                    >
                        {/* Dynamic Hover Gradient */}
                        {/* <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} /> */}

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-2">
                                <div
                                    className={`w-9 h-9 rounded-2xl flex items-center justify-center ${card.bgClass}`}
                                >
                                    <Icon size={18} className={card.iconClass} strokeWidth={2.5} />
                                </div>
                                {/* <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-2 group-hover:translate-x-0">
                                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Trace</span>
                                    <ArrowUpRight className="w-3.5 h-3.5 text-text-muted" />
                                </div> */}
                                {/* <div className="absolute top-0 right-0 p-2 group-hover:hidden">
                                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${card.dotClass}`} />
                                </div> */}
                            </div>

                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] leading-none mb-0.5">
                                    {card.label}
                                </p>
                                <h3 className="text-3xl font-black text-text-primary tracking-tighter tabular-nums leading-none">
                                    {card.value}
                                </h3>
                                {/* <div className="pt-3 flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                    <div className="w-6 h-[2px] rounded-full bg-border-default group-hover:bg-primary-500 transition-all duration-500" />
                                    <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
                                        {card.subLabel}
                                    </p>
                                </div> */}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
