'use client';

import React, { useEffect, useState } from 'react';
import { Download, Plus, Wallet, TrendingUp, Activity } from 'lucide-react';
import { toast } from 'react-toastify';
import { financeService } from '@/services/finance.service';
import BMSLoader from '@/components/common/BMSLoader';
import { FinanceOverviewData } from '@/types/finance.types';
import { FinanceStats } from './FinanceStats';
import { FinanceBreakdown } from './FinanceBreakdown';
import { RecentTransactions } from './RecentTransactions';
import { colors } from '@/themes/colors';

export default function FinanceOverviewPage() {
    const [data, setData] = useState<FinanceOverviewData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const overviewData = await financeService.getOverview();
            setData(overviewData);
        } catch (error: any) {
            console.error('Failed to load finance data:', error);
            toast.error(error.message || 'Failed to load finance overview');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <BMSLoader message="Architecting financial intelligence..." size="small" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="min-h-screen relative overflow-hidden bg-app-background">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full opacity-10 blur-[120px]"
                    style={{ background: `radial-gradient(circle, ${colors.primary[400]}, transparent)` }}
                />
                <div
                    className="absolute bottom-[10%] -right-[5%] w-[35%] h-[35%] rounded-full opacity-5 blur-[100px]"
                    style={{ background: `radial-gradient(circle, ${colors.indigo[400]}, transparent)` }}
                />
            </div>

            <div className="relative z-10 p-6 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-700">
                {/* Modern Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/70 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl border border-border-default/50">
                    <div className="flex items-center gap-6">
                        <div
                            className="p-4 rounded-2xl shadow-lg transform transition-transform hover:scale-105 duration-500"
                            style={{
                                background: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[700]})`,
                                boxShadow: `0 10px 20px ${colors.primary[600]}30`
                            }}
                        >
                            <Wallet className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-text-primary tracking-tight uppercase leading-none">Finance Overview</h1>
                            <p className="text-[10px] text-text-muted font-bold tracking-[0.3em] uppercase mt-2">
                                Institutional Capital Management & Treasury Control
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden lg:flex flex-col items-end mr-4">
                            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest leading-none">Operating Status</span>
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1.5 mt-1.5 uppercase">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Real-time Ledger Active
                            </span>
                        </div>

                        <div className="flex items-center gap-2 bg-input/50 p-1.5 rounded-2xl border border-border-default">
                            <button className="flex items-center gap-2.5 px-6 py-3 bg-card hover:bg-hover text-text-secondary rounded-xl transition-all duration-300 shadow-sm border border-border-default font-black text-[10px] uppercase tracking-wider active:scale-95 group">
                                <Download className="w-3.5 h-3.5 text-text-muted group-hover:text-primary-600 transition-colors" />
                                Export
                            </button>
                            <button
                                className="flex items-center gap-2.5 px-6 py-3 rounded-xl transition-all duration-300 shadow-xl active:scale-95 group overflow-hidden relative"
                                style={{
                                    background: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[700]})`,
                                    boxShadow: `0 8px 16px ${colors.primary[600]}40`
                                }}
                            >
                                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                                <Plus className="w-3.5 h-3.5 text-white" />
                                <span className="text-white font-black text-[10px] uppercase tracking-wider">New Entry</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Performance Stats */}
                <FinanceStats stats={data.stats} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Charts Breakdown */}
                    <div className="lg:col-span-8">
                        <FinanceBreakdown
                            incomeBreakdown={data.incomeBreakdown}
                            expenseBreakdown={data.expenseBreakdown}
                        />
                    </div>

                    {/* Recent Transactions */}
                    <div className="lg:col-span-4">
                        <RecentTransactions transactions={data.recentTransactions} />
                    </div>
                </div>
            </div>
        </div>
    );
}
