'use client'

import React from 'react';
import {
    Coins,
    TrendingUp,
    ArrowDownCircle,
    ArrowUpCircle,
    Activity,
    ShieldCheck
} from 'lucide-react';
import { AdminDashboardStats } from '@/types/admin-dashboard.types';

interface AdminStatsCardsProps {
    stats: AdminDashboardStats;
}

export default function AdminStatsCards({ stats }: AdminStatsCardsProps) {
    const cards = [
        {
            label: "Shareholders Capital",
            value: stats.shareholdersTotalPersistentCapital,
            icon: <ShieldCheck className="w-5 h-5" />,
            color: "blue",
            description: "Equity Investment Total"
        },
        {
            label: "Investment Total",
            value: stats.investmentTotal,
            icon: <Coins className="w-5 h-5" />,
            color: "indigo",
            description: "Portfolio Valuation"
        },
        {
            label: "Total Income",
            value: stats.totalIncome,
            icon: <ArrowUpCircle className="w-5 h-5" />,
            color: "blue",
            description: "Gross Revenue Collected"
        },
        {
            label: "Total Expense",
            value: stats.totalExpense,
            icon: <ArrowDownCircle className="w-5 h-5" />,
            color: "rose",
            description: "Operating Outflow"
        },
        {
            label: "Net Flow",
            value: stats.netFlow,
            icon: <Activity className="w-5 h-5" />,
            color: "amber",
            description: "Net Profit Margin"
        },
        {
            label: "Fund Truncation",
            value: stats.totalFundTruncation,
            icon: <TrendingUp className="w-5 h-5" />,
            color: "violet",
            description: "Asset Tracking"
        }
    ];

    const getColorClasses = (color: string) => {
        const themes: Record<string, string> = {
            blue: "bg-blue-600",
            indigo: "bg-indigo-600",
            emerald: "bg-blue-600",
            rose: "bg-rose-600",
            amber: "bg-amber-600",
            violet: "bg-violet-600"
        };
        return themes[color] || themes.blue;
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-1.5">
            {cards.map((card, index) => (
                <div
                    key={index}
                    className="group relative bg-card rounded-xl p-3 border border-border-default overflow-hidden"
                >


                    <div className="relative z-10 flex flex-col h-full">
                        <div className={`p-1.5 rounded-xl w-fit mb-2 ${getColorClasses(card.color)}`}>
                            <div className="text-white">
                                {React.cloneElement(card.icon as React.ReactElement<any>, { size: 16 })}
                            </div>
                        </div>

                        <div className="mt-auto">
                            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-0.5 transition-colors">
                                {card.label}
                            </p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-[10px] font-bold text-text-muted">LKR</span>
                                <h3 className="text-lg font-black text-text-primary tracking-tighter">
                                    {(card.value / 1000000).toFixed(2)}M
                                </h3>
                            </div>
                            <p className="text-[8px] font-bold text-text-muted mt-1 italic flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-border-default" />
                                {card.description}
                            </p>
                        </div>
                    </div>

                    {/* Subtle corner accent */}
                    <div className={`absolute -right-3 -bottom-3 w-12 h-12 rounded-full opacity-5 ${getColorClasses(card.color).split(' ')[0]}`} />
                </div>
            ))}
        </div>
    );
}
