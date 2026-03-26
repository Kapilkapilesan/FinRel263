'use client'

import React from 'react';
import { Gauge, Info, TrendingUp, Users, Target, Activity, ShieldCheck } from 'lucide-react';
import { StaffCollectionEfficiency } from '@/types/dashboard.types';
import { colors } from '@/themes/colors';

interface StaffCollectionEfficiencyGaugeProps {
    efficiency: StaffCollectionEfficiency | null;
    staffList?: { staff_id: string; full_name: string }[];
    selectedStaffId?: string;
    onStaffChange?: (staffId: string) => void;
    isManager?: boolean;
}

export default function StaffCollectionEfficiencyGauge({
    efficiency,
    staffList,
    selectedStaffId,
    onStaffChange,
    isManager = false
}: StaffCollectionEfficiencyGaugeProps) {
    const percentage = efficiency?.efficiency_percentage || 0;
    const status = efficiency?.status || 'Good';

    const getStatusTheme = (status: string) => {
        switch (status) {
            case 'Critical':
                return {
                    primary: colors.danger[500],
                    gradient: 'from-danger-500 to-danger-600',
                    bg: 'bg-danger-500/10',
                    border: 'border-danger-500/20',
                    glow: 'shadow-danger-500/20'
                };
            case 'Good':
                return {
                    primary: colors.warning[500],
                    gradient: 'from-warning-400 to-warning-600',
                    bg: 'bg-warning-500/10',
                    border: 'border-warning-500/20',
                    glow: 'shadow-warning-500/20'
                };
            case 'Excellent':
                return {
                    primary: colors.success[500],
                    gradient: 'from-success-500 to-success-600',
                    bg: 'bg-success-500/10',
                    border: 'border-success-500/20',
                    glow: 'shadow-success-500/20'
                };
            default:
                return {
                    primary: colors.gray[500],
                    gradient: 'from-gray-400 to-gray-600',
                    bg: 'bg-muted-bg',
                    border: 'border-border-default',
                    glow: 'shadow-gray-500/10'
                };
        }
    };

    const theme = getStatusTheme(status);
    const needleRotation = (Math.min(percentage, 100) / 100) * 180 - 90;

    return (
        <div className="w-full bg-card rounded-[2rem] p-6 border border-border-default relative overflow-hidden group">
            {/* Background Branding Elements */}
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 relative z-10">
                <div className="flex items-center gap-5">
                    <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white transition-all duration-500 group-hover:rotate-6"
                        style={{ background: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[700]})` }}
                    >
                        <Target className="w-5 h-5" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-text-primary tracking-tight uppercase leading-none">
                            Collection Efficiency
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                                {isManager ? 'Granular Performance Audit' : 'Personal Yield Monitoring'}
                            </p>
                        </div>
                    </div>
                </div>

                {isManager && staffList && staffList.length > 0 && (
                    <div className="flex items-center gap-3 bg-muted-bg p-2 rounded-2xl border border-border-default backdrop-blur-sm group/select">
                        <Users className="w-4 h-4 ml-3 text-text-muted group-focus-within/select:text-primary-600 transition-colors" />
                        <select
                            value={selectedStaffId || ''}
                            onChange={(e) => onStaffChange?.(e.target.value)}
                            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border-none rounded-xl bg-card text-text-primary ring-1 ring-border-default focus:ring-4 focus:ring-primary-500/10 transition-all outline-none min-w-[240px]"
                        >
                            <option value="">Filter by Entity...</option>
                            {staffList.map((staff) => (
                                <option key={staff.staff_id} value={staff.staff_id}>
                                    {staff.full_name.toUpperCase()} (ID: {staff.staff_id})
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 2xl:grid-cols-12 gap-8 items-center relative z-10">
                {/* Visual Gauge Container */}
                <div className="lg:col-span-12 2xl:col-span-6 flex flex-col items-center justify-center relative bg-muted-bg/50 rounded-[2rem] py-8 border border-border-default group/gauge overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/50 pointer-events-none" />

                    <div className="relative w-full max-w-[400px] aspect-[1.6/1]">
                        <svg viewBox="0 0 200 120" className="w-full h-full">
                            <defs>
                                <linearGradient id="premiumGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor={colors.danger[500]} />
                                    <stop offset="85%" stopColor={colors.danger[500]} />
                                    <stop offset="95%" stopColor={colors.warning[500]} />
                                    <stop offset="98%" stopColor={colors.success[500]} />
                                    <stop offset="100%" stopColor={colors.success[500]} />
                                </linearGradient>
                                <filter id="needleShadow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="2" result="blur" />
                                    <feOffset dx="0" dy="2" result="offsetBlur" />
                                    <feComposite in="SourceGraphic" in2="offsetBlur" operator="over" />
                                </filter>
                            </defs>

                            {/* Scale Indicators */}
                            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="var(--border-default)" strokeWidth="16" strokeLinecap="round" />

                            {/* The Progress Track */}
                            <path
                                d="M 20 100 A 80 80 0 0 1 180 100"
                                fill="none"
                                stroke="url(#premiumGaugeGradient)"
                                strokeWidth="16"
                                strokeLinecap="round"
                                strokeDasharray={`${(percentage / 100) * 251}, 251`}
                                className="transition-all duration-1000 ease-in-out"
                                style={{ strokeOpacity: 0.9 }}
                            />

                            {/* Needle Geometry */}
                            <g transform={`rotate(${needleRotation} 100 100)`} className="transition-transform duration-1000 ease-in-out">
                                <circle cx="100" cy="100" r="10" fill="var(--text-primary)" />
                                <path d="M 97 100 L 100 25 L 103 100 Z" fill="var(--text-primary)" />
                                <circle cx="100" cy="100" r="5" fill={theme.primary} className="animate-pulse" />
                            </g>

                            {/* Markers */}
                            <text x="18" y="115" className="text-[6px] font-black fill-gray-300 uppercase tracking-widest">Low</text>
                            <text x="172" y="115" className="text-[6px] font-black fill-gray-300 uppercase tracking-widest">Excellent</text>
                        </svg>

                        {/* Floating Status Badge */}
                        <div className="absolute left-1/2 -translate-x-1/2 -bottom-4 flex flex-col items-center">
                            <div className={`px-8 py-3 rounded-2xl bg-card border ${theme.border} flex flex-col items-center min-w-[140px] transform transition-transform duration-500`}>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-4xl font-black tabular-nums tracking-tighter`} style={{ color: theme.primary }}>
                                        {percentage.toFixed(0)}
                                    </span>
                                    <span className="text-sm font-black text-text-muted">%</span>
                                </div>
                                <div className="h-px w-10 bg-border-divider my-1.5" />
                                <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.4em]">
                                    {status} Yield
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance Analytics Panel */}
                <div className="lg:col-span-12 2xl:col-span-6 space-y-6">
                    <div className="bg-card rounded-[1.5rem] p-6 border border-border-default relative overflow-hidden group/info active:shadow-none transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover/info:opacity-10 transition-opacity">
                            <Activity size={80} className="text-primary-600" />
                        </div>

                        <div className="flex items-start gap-5 mb-6">
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${theme.bg} transition-all duration-500`}>
                                <Info className="w-5 h-5" style={{ color: theme.primary }} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-1">Analytical Verdict</h4>
                                <h2 className="text-lg font-black text-text-primary tracking-tight leading-tight">
                                    {percentage >= 98 ? 'Institutional Excellence Verified' : percentage >= 95 ? 'Stable Operational Flow' : 'Deficit Risk Advisory'}
                                </h2>
                                <p className="text-xs text-text-secondary mt-2.5 leading-relaxed font-bold tracking-tight opacity-70">
                                    {efficiency?.message || "Select an entity profile to initialize the performance auditing system."}
                                </p>
                            </div>
                        </div>

                        {/* Financial Delta Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-muted-bg rounded-2xl border border-border-default group-hover/info:bg-card transition-colors duration-500">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Monthly Quota</p>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-xs font-bold text-text-muted">Rs.</span>
                                    <span className="text-xl font-black text-text-primary tabular-nums tracking-tighter">
                                        {(efficiency?.monthly_target || 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <div className="p-4 bg-primary-500/10 rounded-2xl border border-primary-500/20 group-hover/info:bg-primary-500/15 transition-colors duration-500">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                                    <p className="text-[9px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">Realized Capital</p>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-xs font-bold text-primary-500">Rs.</span>
                                    <span className="text-xl font-black text-primary-600 dark:text-primary-400 tabular-nums tracking-tighter">
                                        {(efficiency?.total_collection || 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Threshold Calibration Benchmarks */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 px-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-primary-500" />
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Protocol Thresholds</p>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Critical', desc: '< 95%', type: 'Critical' },
                                { label: 'Good', desc: '95% - 98%', type: 'Good' },
                                { label: 'Excellent', desc: '>= 98%', type: 'Excellent' }
                            ].map((lvl) => {
                                const t = getStatusTheme(lvl.type);
                                const isCurrent = status === lvl.type;
                                return (
                                    <div
                                        key={lvl.label}
                                        className={`flex flex-col p-4 rounded-2xl border transition-all duration-700 ${isCurrent ? `${t.bg} ${t.border} z-10 scale-105 shadow-lg` : 'border-transparent bg-muted-bg opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100'
                                            }`}
                                    >
                                        <div className="w-2.5 h-2.5 rounded-full mb-3" style={{ backgroundColor: t.primary }} />
                                        <span className="text-[10px] font-black text-text-primary uppercase tracking-tight">{lvl.label}</span>
                                        <span className="text-[9px] font-bold text-text-muted mt-1 uppercase tracking-tighter">{lvl.desc}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
