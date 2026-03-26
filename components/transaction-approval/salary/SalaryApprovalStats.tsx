'use client';

import React from 'react';
import { Clock, CheckCircle2, DollarSign } from 'lucide-react';
import { colors } from '@/themes/colors';

interface SalaryApprovalStatsProps {
    pendingCount: number;
    pendingAmount: number;
    approvedCount: number;
    approvedAmount: number;
    monthlyTotal: number;
    monthlyCount: number;
}

export function SalaryApprovalStats({
    pendingCount,
    pendingAmount,
    approvedCount,
    approvedAmount,
    monthlyTotal,
    monthlyCount
}: SalaryApprovalStatsProps) {
    const statCards = [
        {
            label: 'Awaiting Approval',
            value: `Rs. ${pendingAmount.toLocaleString()}`,
            subValue: `${pendingCount} records waiting`,
            icon: Clock,
            color: colors.warning[600],
            bgColor: `${colors.warning[500]}20`,
            badge: 'Pending'
        },
        {
            label: 'Authorized / Approved',
            value: `Rs. ${approvedAmount.toLocaleString()}`,
            subValue: `${approvedCount} payments completed`,
            icon: CheckCircle2,
            color: colors.success[600],
            bgColor: `${colors.success[500]}20`,
            badge: 'Verified'
        },
        {
            label: 'Monthly Total',
            value: `Rs. ${monthlyTotal.toLocaleString()}`,
            subValue: `${monthlyCount} records for 2026-01`,
            icon: DollarSign,
            color: colors.primary[600],
            bgColor: `${colors.primary[500]}20`,
            badge: 'Monthly'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {statCards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <div
                        key={index}
                        className="group bg-card/90 backdrop-blur-md p-5 rounded-2xl border border-border-default shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-105 shadow-sm"
                                style={{ backgroundColor: card.bgColor }}
                            >
                                <Icon className="w-5 h-5" style={{ color: card.color }} />
                            </div>
                            <span
                                className="text-[8px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest border"
                                style={{
                                    backgroundColor: `${card.color}10`,
                                    color: card.color,
                                    borderColor: `${card.color}20`
                                }}
                            >
                                {card.badge}
                            </span>
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-0.5 opacity-60">{card.label}</p>
                            <h3 className="text-2xl font-black text-text-primary tracking-tight leading-none tabular-nums">{card.value}</h3>
                            <p className="text-[9px] text-text-muted font-bold uppercase tracking-wider mt-1">{card.subValue}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
