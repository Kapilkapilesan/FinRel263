'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';
import { colors } from '@/themes/colors';
import { FinanceOverviewStats } from '@/types/finance.types';

interface FinanceStatsProps {
    stats: FinanceOverviewStats;
}

export const FinanceStats: React.FC<FinanceStatsProps> = ({ stats }) => {
    const cards = [
        {
            label: 'Total Inflow',
            value: `Rs. ${stats.totalIncome.toLocaleString()}`,
            change: stats.incomeChange,
            icon: TrendingUp,
            color: colors.success[600],
            bgClass: 'bg-emerald-50 dark:bg-emerald-900/20',
            badge: 'Revenue'
        },
        {
            label: 'Total Outflow',
            value: `Rs. ${stats.totalExpense.toLocaleString()}`,
            change: stats.expenseChange,
            icon: TrendingDown,
            color: colors.danger[600], // Using the 'danger' token from colors.ts
            bgClass: 'bg-rose-50 dark:bg-rose-900/20',
            badge: 'Expenses'
        },
        {
            label: 'Net Positioning',
            value: `Rs. ${stats.netProfit.toLocaleString()}`,
            change: stats.profitChange,
            icon: Activity,
            color: colors.primary[600],
            bgClass: 'bg-primary-50 dark:bg-primary-900/20',
            badge: 'Performance'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards.map((card, index) => {
                const Icon = card.icon;
                const isPositive = card.change >= 0;

                return (
                    <div
                        key={index}
                        className="group bg-card/80 backdrop-blur-md p-6 rounded-[2rem] border border-border-default shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-1"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700 group-hover:scale-110 shadow-lg group-hover:rotate-3 ${card.bgClass}`}
                                style={{
                                    boxShadow: `0 10px 20px ${card.color}15`
                                }}
                            >
                                <Icon className="w-7 h-7" style={{ color: card.color }} />
                            </div>
                            <div className="flex flex-col items-end">
                                <span
                                    className="text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest border mb-2"
                                    style={{
                                        backgroundColor: `${card.color}10`,
                                        color: card.color,
                                        borderColor: `${card.color}20`
                                    }}
                                >
                                    {card.badge}
                                </span>
                                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg ${isPositive ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
                                    }`}>
                                    {isPositive ? (
                                        <TrendingUp className="w-3 h-3" />
                                    ) : (
                                        <TrendingDown className="w-3 h-3" />
                                    )}
                                    <span className="text-[10px] font-black tracking-tight">
                                        {isPositive ? '+' : ''}{card.change}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1.5 opacity-60">
                                {card.label}
                            </p>
                            <h3 className="text-2xl font-black text-text-primary tracking-tighter tabular-nums">
                                {card.value}
                            </h3>
                            <div className="flex items-center gap-2 mt-4">
                                <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
                                    Synchronization complete
                                </span>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
