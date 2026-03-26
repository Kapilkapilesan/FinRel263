import React from 'react';
import { Users, DollarSign, TrendingUp, PieChart, Percent, Layers } from 'lucide-react';
import { Shareholder, ShareholderSystemInfo } from '@/types/shareholder.types';

interface ShareholderStatsProps {
    shareholders: Shareholder[];
    systemInfo: ShareholderSystemInfo | null;
}

export function ShareholderStats({ shareholders, systemInfo }: ShareholderStatsProps) {
    const totalInvestment = shareholders.reduce((sum, s) => sum + s.total_investment, 0);
    const totalShares = shareholders.reduce((sum, s) => sum + s.shares, 0);
    const totalPercentage = shareholders.reduce((sum, s) => sum + s.percentage, 0);
    const averageInvestment = shareholders.length > 0 ? totalInvestment / shareholders.length : 0;

    const stats = [
        {
            label: 'Total Shareholders',
            value: shareholders.length.toString(),
            subLabel: 'Active investors',
            icon: Users,
            iconBg: 'bg-blue-100 dark:bg-blue-500/10',
            iconColor: 'text-blue-600 dark:text-blue-400',
        },
        {
            label: 'Total Shares Allocated',
            value: `${totalShares}`,
            subLabel: `of ${systemInfo?.total_shares || 100} total shares`,
            icon: Layers,
            iconBg: 'bg-purple-100 dark:bg-purple-500/10',
            iconColor: 'text-purple-600 dark:text-purple-400',
        },
        {
            label: 'Percentage Allocated',
            value: `${totalPercentage.toFixed(2)}%`,
            subLabel: `${(100 - totalPercentage).toFixed(2)}% available`,
            icon: Percent,
            iconBg: 'bg-indigo-100 dark:bg-indigo-500/10',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
        },
        {
            label: 'Average Investment',
            value: `LKR ${(averageInvestment / 1000000).toFixed(2)}M`,
            subLabel: 'Per shareholder',
            icon: TrendingUp,
            iconBg: 'bg-green-100 dark:bg-green-500/10',
            iconColor: 'text-green-600 dark:text-green-400',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <div
                        key={index}
                        className="bg-card rounded-2xl border border-border-default p-5 hover:shadow-lg transition-all duration-300 hover:border-border-divider group"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-11 h-11 ${stat.iconBg} rounded-xl flex items-center justify-center transition-transform group-hover:scale-105`}>
                                <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className="text-3xl font-black text-text-primary tracking-tight">{stat.value}</p>
                        <p className="text-xs text-text-muted mt-1">{stat.subLabel}</p>
                    </div>
                );
            })}
        </div>
    );
}
