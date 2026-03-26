'use client';

import React from 'react';
import { Users, TrendingUp, TrendingDown, LayoutPanelLeft, ArrowRightLeft, Landmark } from 'lucide-react';
import { colors } from '@/themes/colors';

interface Props {
    stats: {
        total_income: number;
        total_expense: number;
        net_flow: number;
        total_truncation: number;
        total_shareholder_investment?: number;
        total_customer_investment?: number;
    }
}

export function FundTruncationStats({ stats }: Props) {
    const statCards = [
        {
            label: 'Shareholders Total',
            value: stats.total_shareholder_investment || 0,
            subLabel: 'Resident Capital',
            icon: Users,
            iconClass: 'text-primary-600 dark:text-primary-400',
            bgClass: 'bg-primary-50 dark:bg-primary-900/20',
            gradient: 'from-primary-500/5 to-transparent'
        },
        {
            label: 'Investment Total',
            value: stats.total_customer_investment || 0,
            subLabel: 'Managed Assets',
            icon: Landmark,
            iconClass: 'text-indigo-600 dark:text-indigo-400',
            bgClass: 'bg-indigo-50 dark:bg-indigo-900/20',
            gradient: 'from-indigo-500/5 to-transparent'
        },
        {
            label: 'Total Inflow',
            value: stats.total_income,
            subLabel: 'Monthly Cycle',
            icon: TrendingUp,
            iconClass: 'text-primary-600 dark:text-primary-400',
            bgClass: 'bg-primary-50 dark:bg-primary-900/20',
            gradient: 'from-primary-500/5 to-transparent'
        },
        {
            label: 'Total Outflow',
            value: stats.total_expense,
            subLabel: 'Monthly Cycle',
            icon: TrendingDown,
            iconClass: 'text-rose-600 dark:text-rose-400',
            bgClass: 'bg-rose-50 dark:bg-rose-900/20',
            gradient: 'from-rose-500/5 to-transparent'
        },
        {
            label: 'Net Positioning',
            value: stats.net_flow,
            subLabel: 'Institutional Flow',
            icon: LayoutPanelLeft,
            iconClass: 'text-primary-600 dark:text-primary-400',
            bgClass: 'bg-primary-50 dark:bg-primary-900/20',
            gradient: 'from-primary-500/5 to-transparent'
        },
        {
            label: 'Fund Truncation',
            value: stats.total_truncation,
            subLabel: 'Terminal Volume',
            icon: ArrowRightLeft,
            iconClass: 'text-indigo-600 dark:text-indigo-400',
            bgClass: 'bg-indigo-50 dark:bg-indigo-900/20',
            gradient: 'from-indigo-500/5 to-transparent'
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
            {statCards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <div
                        key={index}
                        className="group relative bg-card h-full min-h-[100px] p-4 rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-border-default overflow-hidden"
                    >
                        {/* Top Row: Label and Indicator */}
                        <div className="flex justify-between items-start z-10 relative">
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] group-hover:text-text-secondary transition-colors">
                                {card.label}
                            </p>
                            <div className={`w-2 h-2 rounded-full shadow-sm ${card.bgClass.replace('bg-', 'bg-').split(' ')[0].replace('/20', '')} animate-pulse`} />
                        </div>

                        {/* Middle: Value */}
                        <div className="mt-2 z-10 relative">
                            <h3 className="text-2xl font-black text-text-primary tracking-tighter tabular-nums leading-none">
                                {Number(card.value).toLocaleString()}
                            </h3>
                            <p className="mt-1 text-[8px] font-bold text-text-muted/60 uppercase tracking-widest flex items-center gap-1">
                                <span className={`w-1 h-1 rounded-full ${card.iconClass.split(' ')[0].replace('text-', 'bg-')}`} />
                                {card.subLabel}
                            </p>
                        </div>

                        {/* Background Icon (Faint) */}
                        <div className="absolute -bottom-2 -right-2 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 rotate-[-15deg] z-0">
                            <Icon size={70} className="text-text-primary" strokeWidth={1.5} />
                        </div>

                        {/* Hover Gradient Overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
                    </div>
                );
            })}
        </div>
    );
}
