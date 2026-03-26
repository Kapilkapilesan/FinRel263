'use client'

import React from 'react';
import { Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { colors } from '@/themes/colors';

export interface DueListSummary {
    todayDue: number;
    todayPaymentsCount: number;
    eighthOfMonthDue: number;
    eighthOfMonthCount: number;
    fifteenthOfMonthDue: number;
    fifteenthOfMonthCount: number;
}

interface DueListStatsProps {
    summary: DueListSummary;
    isLoading?: boolean;
}

export function DueListStats({ summary, isLoading }: DueListStatsProps) {
    const statCards = [
        {
            label: '8th of Month',
            amount: summary.eighthOfMonthDue,
            count: summary.eighthOfMonthCount,
            icon: TrendingUp,
            bgColor: 'bg-purple-100',
            iconColor: 'text-purple-600',
            gradientBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
        },
        {
            label: '15th of Month',
            amount: summary.fifteenthOfMonthDue,
            count: summary.fifteenthOfMonthCount,
            icon: DollarSign,
            bgColor: 'bg-orange-100',
            iconColor: 'text-orange-600',
            gradientBg: 'bg-gradient-to-br from-orange-500 to-orange-600',
        },
    ];

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-card rounded-2xl border border-border-default p-3 animate-pulse">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-8 h-8 bg-muted-bg rounded-lg" />
                        </div>
                        <div className="h-3 bg-muted-bg rounded w-24 mb-1" />
                        <div className="h-6 bg-muted-bg rounded w-32 mb-1" />
                        <div className="h-2 bg-muted-bg rounded w-20" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {statCards.map((card, index) => (
                <div
                    key={index}
                    className="bg-card rounded-xl border border-border-default p-3 transition-all duration-300 group overflow-hidden relative hover:shadow-sm"
                >
                    {/* Background decoration */}
                    <div
                        className={`absolute top-0 right-0 w-16 h-16 rounded-full -mr-8 -mt-8 opacity-50 transition-transform group-hover:scale-110 ${card.bgColor}`}
                        style={(card as any).isPrimary ? { backgroundColor: colors.primary[100] } : {}}
                    />

                    <div className="relative z-10 flex flex-col gap-1">
                        <div
                            className={`w-6 h-6 rounded-md flex items-center justify-center shadow-sm ${card.gradientBg}`}
                            style={(card as any).isPrimary ? { background: `linear-gradient(to bottom right, ${colors.primary[500]}, ${colors.primary[600]})` } : {}}
                        >
                            <card.icon className="w-3 h-3 text-white" />
                        </div>

                        <div>
                            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-0.5">
                                {card.label.toUpperCase()}
                            </p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-[9px] font-black text-text-primary">LKR</span>
                                <span className="text-base font-black text-text-primary leading-none">
                                    {card.amount.toLocaleString()}
                                </span>
                            </div>
                             <p className="text-[8px] text-text-secondary mt-0.5 font-bold uppercase tracking-tight">
                                {card.count} total payment{card.count !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
