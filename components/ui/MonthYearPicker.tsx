'use client'

import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { colors } from '@/themes/colors';

interface MonthYearPickerProps {
    selectedMonth: number;
    selectedYear: number;
    onChange: (month: number, year: number) => void;
    className?: string;
}

export default function MonthYearPicker({
    selectedMonth,
    selectedYear,
    onChange,
    className = ''
}: MonthYearPickerProps) {
    // Format value as YYYY-MM or empty string for native input
    const value = selectedYear !== 0 && selectedMonth !== 0 
        ? `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`
        : '';

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (!val) {
            onChange(0, 0); // Reset to "All"
        } else {
            const [y, m] = val.split('-');
            onChange(parseInt(m, 10), parseInt(y, 10));
        }
    };

    return (
        <div className={`flex items-center gap-4 bg-muted-bg/30 dark:bg-card/40 backdrop-blur-xl p-3 rounded-2xl lg:rounded-3xl border border-border-default dark:border-border-divider/30 transition-all hover:border-primary-500/30 ${className}`}>
            <div className="flex items-center gap-3 pl-4 pr-2 border-r border-border-divider/20 py-1">
                <Calendar className="w-4 h-4 text-primary-500" />
                <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.25em] whitespace-nowrap">Period Filter</span>
            </div>

            <div className="flex items-center gap-2 pr-1">
                <div className="relative group/pick">
                    <input
                        type="month"
                        value={value}
                        onChange={handleDateChange}
                        onClick={(e) => {
                            if ('showPicker' in HTMLInputElement.prototype) {
                                e.currentTarget.showPicker();
                            }
                        }}
                        className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden pl-4 pr-10 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl bg-card border border-border-divider/30 text-text-primary outline-none transition-all cursor-pointer hover:bg-muted-bg dark:hover:bg-white/10 focus:ring-2 focus:ring-primary-500/50"
                        style={{ colorScheme: 'light dark' }}
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted/60 dark:text-white/60 group-hover/pick:text-primary-500 transition-colors pointer-events-none" />
                </div>
            </div>
        </div>
    );
}
