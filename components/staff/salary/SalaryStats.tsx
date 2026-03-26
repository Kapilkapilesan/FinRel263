import React from 'react';
import { DollarSign, UserCheck, Users } from 'lucide-react';
import { SalaryStats } from '@/types/salary.types';
import { colors } from '@/themes/colors';

interface SalaryStatsCardProps {
    stats: SalaryStats;
}

export const SalaryStatsCard: React.FC<SalaryStatsCardProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
            <div className="p-2.5 rounded-xl border border-primary-500/20 bg-primary-500/10 transition-all">
                <div className="flex items-center justify-between mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-primary-500/20 flex items-center justify-center">
                        <DollarSign className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-600 dark:text-primary-400 border border-primary-500/20">
                        {stats.currentMonth ?
                            (() => {
                                const parts = stats.currentMonth.split(' ');
                                if (parts.length === 2) {
                                    const date = new Date(`${parts[0]} 1, ${parts[1]}`);
                                    if (!isNaN(date.getTime())) {
                                        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                                    }
                                }
                                return stats.currentMonth;
                            })()
                            : '2026-01'}
                    </span>
                </div>
                <h3 className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] px-0.5">Total Payroll</h3>
                <p className="text-lg font-black text-text-primary mt-0.5 px-0.5">
                    Rs. {stats.totalPayroll.toLocaleString()}
                </p>
                <p className="text-[10px] text-text-muted font-medium mt-0.5 uppercase tracking-tight px-0.5">{stats.processedCount} salaries processed</p>
            </div>

            <div className="bg-card p-2.5 rounded-xl border border-border-default/50">
                <div className="flex items-center justify-between mb-1.5">
                    <div className="w-7 h-7 bg-muted-bg/50 rounded-lg border border-border-default/50 flex items-center justify-center">
                        <DollarSign className="w-3.5 h-3.5 text-text-muted" />
                    </div>
                </div>
                <h3 className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] px-0.5">Average Salary</h3>
                <p className="text-lg font-black text-text-primary mt-0.5 px-0.5">
                    Rs. {stats.averageSalary.toLocaleString()}
                </p>
                <p className="text-[10px] text-text-muted font-medium mt-0.5 uppercase tracking-tight px-0.5">Per employee this month</p>
            </div>

            <div className="bg-card p-2.5 rounded-xl border border-border-default/50">
                <div className="flex items-center justify-between mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                        <UserCheck className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="w-6 h-6 rounded-full bg-primary-500/10 border border-primary-500/10 flex items-center justify-center">
                        <Users className="w-3 h-3 text-primary-600 dark:text-primary-400" />
                    </div>
                </div>
                <h3 className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] px-0.5">Active Headcount</h3>
                <p className="text-lg font-black text-text-primary mt-0.5 px-0.5">
                    {stats.activeHeadcount}
                </p>
                <p className="text-[10px] text-text-muted font-medium mt-0.5 uppercase tracking-tight px-0.5">{stats.eligibleForPayroll} Eligible for payroll</p>
            </div>
        </div>
    );
};
