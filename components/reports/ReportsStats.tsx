'use client';

import React from 'react';
import { FileText, Download, BarChart3, Calendar } from 'lucide-react';
import { ReportStats } from '../../types/report.types';
import { colors } from '@/themes/colors';

interface ReportsStatsProps {
    stats: ReportStats | null;
    isLoading: boolean;
}

export function ReportsStats({ stats, isLoading }: ReportsStatsProps) {
    const statCards = [
        {
            label: 'Total Reports',
            value: stats?.total_reports ?? 0,
            icon: FileText,
            color: colors.primary[500],
            bgColor: 'bg-primary-500/10',
            shadow: colors.primary[600]
        },
        {
            label: 'Downloads Month',
            value: stats?.downloads_this_month ?? 0,
            icon: Download,
            color: colors.primary[500],
            bgColor: 'bg-primary-500/10',
            shadow: colors.primary[600]
        },
        {
            label: 'Scheduled Tasks',
            value: stats?.scheduled_reports ?? 0,
            icon: BarChart3,
            color: colors.primary[500],
            bgColor: 'bg-primary-500/10',
            shadow: colors.primary[500]
        },
        {
            label: 'Last Generated',
            value: stats?.last_generated ?? 'Never',
            icon: Calendar,
            color: colors.warning[500],
            bgColor: 'bg-warning-500/10',
            shadow: colors.warning[600],
            isText: true
        }
    ];

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-card/80 rounded-2xl p-5 shadow-lg shadow-black/5 dark:shadow-black/20 border border-border-default animate-pulse">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-muted-bg rounded-xl"></div>
                            <div className="flex-1">
                                <div className="h-2.5 bg-muted-bg rounded w-16 mb-2"></div>
                                <div className="h-6 bg-muted-bg rounded w-12"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {statCards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <div
                        key={index}
                        className="group bg-card p-5 rounded-2xl border border-border-default shadow-lg shadow-black/5 dark:shadow-black/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
                    >
                        <div className="flex items-center gap-4">
                            <div
                                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-105 shadow-sm ${card.bgColor}`}
                            >
                                <Icon className="w-5 h-5 transition-transform group-hover:scale-110" style={{ color: card.color }} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-0.5 opacity-60">{card.label}</p>
                                <p className={`font-black text-text-primary tracking-tight ${card.isText ? 'text-sm' : 'text-3xl'}`}>
                                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
