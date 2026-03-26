'use client'

import { Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { authService, User } from '@/services/auth.service';
import AdminDashboardHeader from '@/components/admin-dashboard/AdminDashboardHeader';
import AdminStatsCards from '@/components/admin-dashboard/AdminStatsCards';
import CollectionEfficiencyGauge from '@/components/admin-dashboard/charts/CollectionEfficiencyGauge';
import TotalCollectionChart from '@/components/admin-dashboard/charts/TotalCollectionChart';
import FinancialPerformanceChart from '@/components/admin-dashboard/charts/FinancialPerformanceChart';
import TotalIncomeChart from '@/components/admin-dashboard/charts/TotalIncomeChart';
import TotalDisbursementsChart from '@/components/admin-dashboard/charts/TotalDisbursementsChart';
import MonthYearPicker from '@/components/ui/MonthYearPicker';
import { adminDashboardService } from '@/services/admin-dashboard.service';
import {
    AdminDashboardStats,
    BranchCollectionEfficiency,
    MonthlyCollectionData,
    MonthlyFinancialData,
    Branch
} from '@/types/admin-dashboard.types';
import BMSLoader from '@/components/common/BMSLoader';
import { colors } from '@/themes/colors';

export default function AdminDashboard() {
    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<AdminDashboardStats | null>(null);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
    const [collectionEfficiency, setCollectionEfficiency] = useState<BranchCollectionEfficiency | null>(null);
    const [monthlyCollections, setMonthlyCollections] = useState<MonthlyCollectionData[]>([]);
    const [financialData, setFinancialData] = useState<MonthlyFinancialData[]>([]);
    const [monthlyIncome, setMonthlyIncome] = useState<MonthlyCollectionData[]>([]);
    const [monthlyDisbursements, setMonthlyDisbursements] = useState<MonthlyCollectionData[]>([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const canViewFinancial = authService.hasModulePermission('admin_dashboard', 'view_financial');

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        loadDashboardData(true);
    }, []);

    useEffect(() => {
        if (!isLoading) {
            loadDashboardData(false);
        }
    }, [selectedMonth, selectedYear]);

    const loadDashboardData = async (initial = false) => {
        if (initial) setIsLoading(true);
        else setIsRefreshing(true);

        try {
            // Conditionally fetch data based on permissions to prevent 403 errors
            const [
                statsData,
                branchesData,
                collectionsData,
                financialDataResponse,
                incomeData,
                disbursementsData
            ] = await Promise.all([
                canViewFinancial ? adminDashboardService.getAdminStats(selectedMonth, selectedYear) : Promise.resolve(null),
                adminDashboardService.getBranches().catch(() => []), // Soft fail for branches
                canViewFinancial ? adminDashboardService.getMonthlyCollections(null, selectedYear) : Promise.resolve([]),
                canViewFinancial ? adminDashboardService.getFinancialPerformance(selectedYear) : Promise.resolve([]),
                canViewFinancial ? adminDashboardService.getMonthlyIncome(null, selectedYear) : Promise.resolve([]),
                canViewFinancial ? adminDashboardService.getMonthlyDisbursements(null, selectedYear) : Promise.resolve([])
            ]);

            setStats(statsData);
            setBranches(branchesData || []);
            setMonthlyCollections(collectionsData || []);
            setFinancialData(financialDataResponse || []);
            setMonthlyIncome(incomeData || []);
            setMonthlyDisbursements(disbursementsData || []);

            if (initial && branchesData && branchesData.length > 0) {
                const firstBranchId = branchesData[0].id;
                setSelectedBranch(firstBranchId);
                if (canViewFinancial) {
                    loadCollectionEfficiency(firstBranchId);
                }
            } else if (selectedBranch && canViewFinancial) {
                loadCollectionEfficiency(selectedBranch);
            }
        } catch (error) {
            console.error('Error loading admin dashboard data:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const loadCollectionEfficiency = async (branchId: number) => {
        if (!canViewFinancial) return; // Prevent 403 if restricted
        try {
            const efficiency = await adminDashboardService.getCollectionEfficiency(branchId, selectedMonth, selectedYear);
            setCollectionEfficiency(efficiency);
        } catch (error) {
            console.error('Error loading collection efficiency:', error);
        }
    };

    const handleBranchChange = (branchId: number) => {
        setSelectedBranch(branchId);
        loadCollectionEfficiency(branchId);
    };



    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)]">
                <BMSLoader message="Initializing Console..." size="large" />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-3 md:p-4 relative overflow-hidden bg-app-background">
            {/* Soft Ambient Background Glows */}
            <div
                className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
                style={{ backgroundColor: `${colors.primary[500]}0D` }}
            />
            <div
                className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
                style={{ backgroundColor: `${colors.indigo[500]}0D` }}
            />

            <div className="relative z-10 max-w-[1600px] mx-auto space-y-6">
                {/* Header Section */}
                <div className="space-y-4">
                    <AdminDashboardHeader userName={user?.name || user?.full_name || 'Admin'} />

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-4">
                            {!canViewFinancial && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 rounded-full border border-amber-500/20 text-amber-600 text-[10px] font-black uppercase tracking-widest">
                                    <Zap className="w-3 h-3" />
                                    Financial Access Restricted
                                </div>
                            )}
                            {isRefreshing && (
                                <div
                                    className="flex items-center gap-2 text-xs font-bold animate-pulse"
                                    style={{ color: colors.primary[600] }}
                                >
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: colors.primary[600] }}
                                    />
                                    Refreshing Data...
                                </div>
                            )}
                        </div>

                        <div className="flex-shrink-0">
                            <MonthYearPicker
                                selectedMonth={selectedMonth}
                                selectedYear={selectedYear}
                                onChange={(m, y) => {
                                    setSelectedMonth(m);
                                    setSelectedYear(y);
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Statistics Grid - Only shown if user has financial privileges */}
                {canViewFinancial && stats && <AdminStatsCards stats={stats} />}

                {/* Bento Grid Charts - Only shown if user has financial privileges */}
                {canViewFinancial ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-start">
                        {/* Gauge Chart - Operational (Target %) */}
                        <div className="lg:col-span-12 bg-card rounded-2xl md:rounded-3xl border border-border-default p-4 md:p-6 shadow-sm transition-all hover:shadow-xl group">
                            <CollectionEfficiencyGauge
                                efficiency={collectionEfficiency}
                                branches={branches}
                                selectedBranch={selectedBranch}
                                onBranchChange={handleBranchChange}
                                hideMonetary={!canViewFinancial}
                            />
                        </div>

                        {/* Performance Line Chart */}
                        <div className="lg:col-span-12 2xl:col-span-8 bg-card rounded-2xl md:rounded-3xl border border-border-default p-4 md:p-6 shadow-sm transition-all hover:shadow-xl">
                            <FinancialPerformanceChart data={financialData} />
                        </div>

                        {/* Total Collection Chart */}
                        <div className="lg:col-span-12 2xl:col-span-4 bg-card rounded-3xl border border-border-default p-6 shadow-sm transition-all hover:shadow-xl">
                            <TotalCollectionChart
                                data={monthlyCollections}
                                branches={branches}
                                onBranchChange={(id) => adminDashboardService.getMonthlyCollections(id, selectedYear).then(setMonthlyCollections)}
                            />
                        </div>

                        {/* Side-by-Side Bento Boxes */}
                        <div className="lg:col-span-6 bg-card rounded-3xl border border-border-default p-6 shadow-sm transition-all hover:shadow-xl">
                            <TotalIncomeChart
                                data={monthlyIncome}
                                branches={branches}
                                onBranchChange={(id) => adminDashboardService.getMonthlyIncome(id, selectedYear).then(setMonthlyIncome)}
                            />
                        </div>

                        <div className="lg:col-span-6 bg-card rounded-3xl border border-border-default p-6 shadow-sm transition-all hover:shadow-xl">
                            <TotalDisbursementsChart
                                data={monthlyDisbursements}
                                branches={branches}
                                onBranchChange={(id) => adminDashboardService.getMonthlyDisbursements(id, selectedYear).then(setMonthlyDisbursements)}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="py-32 flex flex-col items-center justify-center bg-card/50 rounded-[3rem] border-2 border-dashed border-border-default backdrop-blur-sm">
                        <Zap className="w-16 h-16 text-text-muted mb-6 animate-pulse" />
                        <h3 className="text-2xl font-black text-text-primary tracking-tight">Management Console Active</h3>
                        <p className="text-sm text-text-secondary max-w-sm text-center mt-2 leading-relaxed">
                            Your account is synchronized. Higher-level financial intelligence requires additional authorization.
                        </p>
                    </div>
                )}

                {/* Footer Accent */}
                <div className="pt-10 flex items-center justify-center gap-4 text-[10px] font-black text-text-muted uppercase tracking-[0.5em]">
                    <div className="h-px w-20 bg-border-divider" />
                    FinCore Strategic Intelligence
                    <div className="h-px w-20 bg-border-divider" />
                </div>
            </div>
        </div>
    );
}
