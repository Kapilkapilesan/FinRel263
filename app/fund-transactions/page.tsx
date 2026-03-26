'use client';

import React, { useState, useEffect } from 'react';
import { FundTruncationStats } from '../../components/fund-transactions/FundTruncationStats';
import { ShareholdersTable } from '../../components/fund-transactions/InvestmentsTable';
import { CustomerInvestmentsTable } from '../../components/fund-transactions/CustomerInvestmentsTable';
import { LoanDisbursementTable } from '../../components/fund-transactions/LoanDisbursementTable';
import { SalaryDisbursementTable } from '../../components/fund-transactions/SalaryDisbursementTable';
import { PayoutModal } from '../../components/fund-transactions/PayoutModal';
import { toast } from 'react-toastify';
import {
    useFundStats,
    usePendingLoans,
    usePendingSalaries,
    useShareholders,
    useCustomerInvestments,
    useStaffLoans,
    useInvestmentPayouts
} from '../../hooks/useFundTransactions';
import { useBranches } from '../../hooks/useSharedData';
import { useQueryClient } from '@tanstack/react-query';
import { financeService } from '../../services/finance.service';
import { investmentService } from '../../services/investment.service';
import { shareholderService } from '../../services/shareholder.service';
import { staffLoanService } from '../../services/staffLoan.service';
import { StaffLoanDisbursementTable } from '../../components/fund-transactions/StaffLoanDisbursementTable';
import { InvestmentPayoutsTable } from '../../components/fund-transactions/InvestmentPayoutsTable';
import { authService } from '../../services/auth.service';
import { colors } from '@/themes/colors';
import { bankBranchService } from '../../services/bank-branch.service';
import { BankBranchHistoryTable } from '../../components/fund-transactions/bank-branch-history-table';
import { ArrowLeftRight, Calendar, Download, Filter } from 'lucide-react';
import BMSLoader from '../../components/common/BMSLoader';
import { SearchableSelect } from '../../components/common/SearchableSelect';
import { branchService } from '../../services/branch.service';
import { Branch } from '../../types/branch.types';

export default function FundTransactionsPage() {
    // Permission checks
    const canViewShareholders = authService.hasPermission('finance.shareholders');
    const canViewInvestments = authService.hasPermission('finance.investments');
    const canDisburseLoans = authService.hasPermission('finance.transfer_funds');
    const canDisburseSalaries = authService.hasPermission('finance.disburse_salary');
    const canDisburseStaffLoans = authService.hasPermission('finance.staffloans');
    const canProcessInvestmentPayouts = authService.hasPermission('finance.investmentpayouts');

    // Determine initial active tab based on permissions
    const getInitialTab = (): 'shareholders' | 'investments' | 'loans' | 'salaries' | 'staff-loans' | 'investment-payouts' => {
        if (canViewShareholders) return 'shareholders';
        if (canViewInvestments) return 'investments';
        if (canDisburseLoans) return 'loans';
        if (canDisburseSalaries) return 'salaries';
        if (canDisburseStaffLoans) return 'staff-loans';
        if (canProcessInvestmentPayouts) return 'investment-payouts';
        return 'shareholders'; // fallback
    };

    const [activeTab, setActiveTab] = useState<'shareholders' | 'investments' | 'loans' | 'salaries' | 'staff-loans' | 'investment-payouts' | 'bank-branch'>(getInitialTab());

    const [payoutModal, setPayoutModal] = useState<{
        isOpen: boolean;
        recipientName: string;
        amount: number;
        approvedAmount?: number;
        type: 'loan' | 'salary' | 'bulk-salary' | 'staff-loan' | 'investment';
        bankDetails?: {
            bankName: string;
            accountNumber: string;
            branch?: string;
            holderName?: string;
        };
        documents?: any[];
        id: string | string[];
    }>({
        isOpen: false,
        recipientName: '',
        amount: 0,
        approvedAmount: undefined,
        type: 'loan',
        bankDetails: undefined,
        documents: undefined,
        id: ''
    });

    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);
    
    // Dates
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedDay, setSelectedDay] = useState(new Date().getDate());
    const [period, setPeriod] = useState<'day' | 'month' | 'year' | 'all'>('month');

    // Bank & Branch tab data (Yana's feature)
    const [bankBranchActivities, setBankBranchActivities] = useState<any[]>([]);

    // Branch selection
    const { data: globalBranches = [] } = useBranches();
    const branches = globalBranches;
    const [selectedBranch, setSelectedBranch] = useState<number | undefined>(undefined);
    const [selectedBranchName, setSelectedBranchName] = useState<string>('All Branches');

    // Derived Query Parameters
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    const queryMonth = (period === 'day' || period === 'month') ? selectedMonth : undefined;
    const queryYear = (period !== 'all') ? selectedYear : undefined;
    const queryDate = (period === 'day') ? dateStr : undefined;
    const queryStatsDate = (period !== 'all') ? dateStr : undefined;

    // React Query Cached Fetches
    const { data: statsData, isLoading: loadingStats } = useFundStats(selectedBranch, queryStatsDate, period);
    
    // Only fetch data for the active tab
    const { data: shareholdersData = [] } = useShareholders(selectedBranch, queryMonth, queryYear, activeTab === 'shareholders' && canViewShareholders);
    const { data: customerInvestmentsData = [] } = useCustomerInvestments(selectedBranch, queryMonth, queryYear, activeTab === 'investments' && canViewInvestments);
    const { data: loansData = [] } = usePendingLoans(selectedBranch, queryDate, queryMonth, queryYear, activeTab === 'loans' && canDisburseLoans);
    const { data: salariesData = [] } = usePendingSalaries(selectedBranch, queryDate, queryMonth, queryYear, activeTab === 'salaries' && canDisburseSalaries);
    const { data: staffLoansData = [] } = useStaffLoans(selectedBranch, queryMonth, queryYear, activeTab === 'staff-loans' && canDisburseStaffLoans);
    const { data: payoutsData = [] } = useInvestmentPayouts(selectedBranch, queryMonth, queryYear, activeTab === 'investment-payouts' && canProcessInvestmentPayouts);

    const stats = statsData || {
        total_income: 0, total_expense: 0, net_flow: 0, total_truncation: 0,
        total_shareholder_investment: 0, total_customer_investment: 0
    };

    const shareholders = shareholdersData;
    const customerInvestments = customerInvestmentsData;
    const loans = loansData;
    const salaries = salariesData;
    const staffLoans = staffLoansData;
    const investmentPayouts = payoutsData;

    // Fetch bank branch activities when tab is active (Yana's feature)
    useEffect(() => {
        if (activeTab !== 'bank-branch') return;
        const fetchBankBranchActivities = async () => {
            try {
                const data = await bankBranchService.getHistory({
                    branch_id: selectedBranch,
                    period: period,
                    date: dateStr
                });
                setBankBranchActivities(data.activities);
            } catch (error) {
                console.error('Failed to fetch bank branch activities', error);
            }
        };
        fetchBankBranchActivities();
    }, [activeTab, selectedBranch, selectedMonth, selectedYear, selectedDay, period]);

    // TEAMMATE's async handleDisburseClick with backend enrichment + YOUR local fallback for other types
    const handleDisburseClick = async (type: 'loan' | 'salary' | 'staff-loan' | 'investment', record: any) => {
        // Initial modal state with basic "fast" data
        setPayoutModal({
            isOpen: true,
            recipientName: type === 'loan' || type === 'investment'
                ? record.investment?.customer?.full_name || record.customer?.full_name
                : record.staff?.full_name,
            amount: type === 'loan'
                ? parseFloat(record.net_disbursed_amount ?? record.approved_amount)
                : type === 'staff-loan'
                    ? parseFloat(record.amount)
                    : type === 'investment'
                        ? parseFloat(record.total_payout)
                        : parseFloat(record.net_payable),
            approvedAmount: type === 'loan' ? parseFloat(record.approved_amount) : undefined,
            bankDetails: undefined,
            type,
            id: record.id
        });

        // TEAMMATE's backend enrichment for loans
        if (type === 'loan') {
            try {
                const detailedData = await financeService.getLoanSettlementDetails(record.id);
                setPayoutModal(prev => ({
                    ...prev,
                    bankDetails: {
                        bankName: detailedData.bank_details.bank_name,
                        accountNumber: detailedData.bank_details.account_number,
                        branch: detailedData.bank_details.branch,
                        holderName: detailedData.bank_details.holder_name
                    },
                    documents: detailedData.documents,
                    recipientName: detailedData.customer.full_name,
                    amount: detailedData.loan.net_disbursed_amount,
                }));
            } catch (err) {
                console.error("Failed to enrich settlement data", err);
                toast.error("Failed to fetch formal bank profile. Using local fallback.");
                // Fall back to local bank details (YOUR original logic)
                if (record.borrower_bank_details) {
                    setPayoutModal(prev => ({
                        ...prev,
                        bankDetails: {
                            bankName: record.borrower_bank_details.bank_name,
                            accountNumber: record.borrower_bank_details.account_number,
                            branch: record.borrower_bank_details.branch,
                            holderName: record.customer?.full_name
                        },
                        documents: record.documents,
                    }));
                }
            }
        } else {
            // YOUR logic for other types
            let bankDetails: any;
            if ((type === 'salary' || type === 'staff-loan') && record.staff) {
                bankDetails = {
                    bankName: record.staff.bank_name || '',
                    accountNumber: record.staff.bank_account_number || '',
                    branch: record.staff.bank_branch || '',
                    holderName: record.staff.account_holder_name || record.staff.full_name
                };
            } else if (type === 'investment') {
                const bankData = record.investment?.bank_details || record.bank_details;
                const customer = record.investment?.customer || record.customer;
                if (bankData) {
                    bankDetails = {
                        bankName: bankData.bank_name || '',
                        accountNumber: bankData.account_number || '',
                        branch: bankData.branch || '',
                        holderName: bankData.holder_name || customer?.full_name || ''
                    };
                }
            }
            setPayoutModal(prev => ({ ...prev, bankDetails }));
        }
    };

    const handleBulkSalaryDisburse = (selectedRecords: any[]) => {
        const totalAmount = selectedRecords.reduce((sum, rec) => sum + parseFloat(rec.net_payable), 0);
        setPayoutModal({
            isOpen: true,
            recipientName: `${selectedRecords.length} Staff Members (Bulk Transfer)`,
            amount: totalAmount,
            type: 'bulk-salary',
            id: selectedRecords.map(r => r.id.toString())
        });
    };

    const handleConfirmPayout = async (refNo: string, remark: string, payoutMethod: string = 'BANK', manualRefNo?: string) => {
        setIsLoading(true);
        try {
            let success = false;

            if (payoutModal.type === 'loan') {
                // TEAMMATE's secure settlement execution
                await financeService.executeSettlement(Number(payoutModal.id), refNo);
                success = true;
                toast.success('Funds Transferred & Protocol Finalized!');
            } else if (payoutModal.type === 'salary') {
                await financeService.disburseSalary(Number(payoutModal.id), refNo);
                success = true;
                toast.success('Salary disbursed successfully!');
            } else if (payoutModal.type === 'bulk-salary') {
                const ids = payoutModal.id as string[];
                await Promise.all(ids.map(id => financeService.disburseSalary(Number(id), refNo)));
                success = true;
                toast.success(`${ids.length} Salaries disbursed successfully!`);
            } else if (payoutModal.type === 'staff-loan') {
                await staffLoanService.disburse(Number(payoutModal.id), refNo);
                success = true;
                toast.success('Staff Loan disbursed successfully!');
            } else if (payoutModal.type === 'investment') {
                await investmentService.settlePayout(Number(payoutModal.id), refNo, manualRefNo, payoutMethod);
                success = true;
                toast.success('Investment yield disbursed successfully!');
            }

            // Close modal immediately after successful API call
            if (success) {
                setPayoutModal(prev => ({ ...prev, isOpen: false }));
            }

            // Process background operations without blocking UI
            try {
                if (payoutModal.type === 'loan') {
                    queryClient.invalidateQueries({ queryKey: ['fundingLoans'] });
                } else if (payoutModal.type === 'salary' || payoutModal.type === 'bulk-salary') {
                    queryClient.invalidateQueries({ queryKey: ['fundingSalaries'] });
                } else if (payoutModal.type === 'staff-loan') {
                    queryClient.invalidateQueries({ queryKey: ['fundingStaffLoans'] });
                } else if (payoutModal.type === 'investment') {
                    queryClient.invalidateQueries({ queryKey: ['fundingPayouts'] });
                    queryClient.invalidateQueries({ queryKey: ['fundingInvestments'] });
                }
                queryClient.invalidateQueries({ queryKey: ['fundStats'] });
            } catch (bgError) {
                console.error('Background refresh failed:', bgError);
            }

        } catch (error: any) {
            toast.error(error.message || 'Disbursement failed');
        } finally {
            setIsLoading(false);
        }
    };

    if (loadingStats) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <BMSLoader message="Architecting Truncation Intelligence..." size="small" />
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-app-background">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none text-red-100">
                <div
                    className="absolute -top-[5%] -left-[5%] w-[35%] h-[35%] rounded-full opacity-5 blur-[100px]"
                    style={{ background: `radial-gradient(circle, ${colors.primary[400]}, transparent)` }}
                />
                <div
                    className="absolute bottom-[5%] -right-[5%] w-[30%] h-[30%] rounded-full opacity-5 blur-[80px]"
                    style={{ background: `radial-gradient(circle, ${colors.indigo[400]}, transparent)` }}
                />
            </div>

            <div className="relative z-10 p-4 max-w-[1500px] mx-auto space-y-4 animate-in fade-in duration-700">
                {/* High Density Header */}
                {/* High Density Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card p-8 rounded-[2.5rem] shadow-xl border border-border-default">
                    <div className="flex items-center gap-6">
                        <div
                            className="p-4 rounded-2xl shadow-lg transform transition-transform hover:scale-105 duration-500"
                            style={{
                                background: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[700]})`,
                                boxShadow: `0 8px 16px ${colors.primary[600]}25`
                            }}
                        >
                            <ArrowLeftRight className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-text-primary tracking-tight uppercase leading-none mb-1.5">Fund Truncation</h1>
                            <p className="text-[10px] text-text-muted font-bold tracking-[0.2em] uppercase">
                                Institutional Liquidity & Capital Allocation Matrix
                            </p>
                        </div>
                    </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="flex bg-muted-bg p-1.5 rounded-full border border-border-default h-[46px] items-center">
                                {(['day', 'month', 'year', 'all'] as const).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriod(p)}
                                        className={`px-5 py-2 text-[9px] h-full font-black uppercase tracking-widest rounded-full transition-all duration-300 ${period === p
                                            ? 'bg-card text-primary-600 shadow-lg scale-105 ring-1 ring-border-default'
                                            : 'text-text-muted hover:text-text-secondary'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>

                            {/* YOUR branch filter */}
                            <div className="w-[300px]">
                                <SearchableSelect
                                    placeholder="SELECT BRANCH"
                                    options={branches.map(b => ({ id: b.id, label: b.branch_name }))}
                                    onChange={(val) => {
                                        setSelectedBranch(val ? Number(val) : undefined);
                                        const branch = branches.find(b => b.id.toString() === val?.toString());
                                        setSelectedBranchName(branch?.branch_name || 'All Branches');
                                    }}
                                    value={selectedBranch}
                                />
                            </div>

                            {period !== 'all' && (
                                <div className="flex items-center gap-2 bg-muted-bg p-1.5 rounded-full border border-border-default">
                                    {period === 'day' ? (
                                        <div className="relative">
                                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                            <input
                                                type="date"
                                                value={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`}
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        const d = new Date(e.target.value);
                                                        setSelectedYear(d.getFullYear());
                                                        setSelectedMonth(d.getMonth() + 1);
                                                        setSelectedDay(d.getDate());
                                                    }
                                                }}
                                                className="pl-9 pr-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-full bg-card border-none text-text-primary shadow-sm outline-none cursor-pointer hover:bg-hover transition-colors"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <select
                                                value={selectedMonth}
                                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                                disabled={period === 'year'}
                                                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-full bg-card border-none text-text-primary shadow-sm outline-none cursor-pointer appearance-none min-w-[100px] text-center hover:bg-hover transition-colors"
                                            >
                                                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, index) => (
                                                    <option key={month} value={index + 1}>{month}</option>
                                                ))}
                                            </select>
                                            <select
                                                value={selectedYear}
                                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-full bg-card border-none text-text-primary shadow-sm outline-none cursor-pointer appearance-none min-w-[80px] text-center hover:bg-hover transition-colors"
                                            >
                                                {[2024, 2025, 2026, 2027, 2028].map(y => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                </div>

                <FundTruncationStats stats={stats} />

                {/* High Density Navigation Tabs */}
                <div className="bg-card p-2 rounded-[2.5rem] shadow-lg border border-border-default mt-6">
                    <div className="flex flex-wrap items-center gap-2">
                        {[
                            { id: 'shareholders', label: 'Shareholders', visible: canViewShareholders },
                            { id: 'investments', label: 'Investments', visible: canViewInvestments },
                            { id: 'loans', label: 'Loans', count: loans.length, visible: canDisburseLoans },
                            { id: 'salaries', label: 'Salaries', count: salaries.length, visible: canDisburseSalaries },
                            { id: 'staff-loans', label: 'Staff Loans', count: staffLoans.length, visible: canDisburseStaffLoans },
                            { id: 'investment-payouts', label: 'Investment Return', count: investmentPayouts.length, visible: canProcessInvestmentPayouts },
                            { id: 'bank-branch', label: 'Bank & Branch', count: bankBranchActivities.length, visible: true }
                        ].filter(tab => tab.visible).map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all duration-300 rounded-[2rem] flex items-center gap-2.5 relative group ${activeTab === tab.id
                                    ? 'bg-primary-600 text-white shadow-xl translate-y-[-1px]'
                                    : 'text-text-muted hover:text-text-primary hover:bg-muted-bg'
                                    }`}
                            >
                                <span>{tab.label}</span>
                                {tab.count !== undefined && tab.count > 0 && (
                                    <span className={`flex items-center justify-center min-w-[18px] h-4.5 rounded-md px-1 text-[8px] font-black ${activeTab === tab.id ? 'bg-white text-primary-600' : 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30'
                                        }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="animate-in slide-in-from-bottom-4 duration-500 bg-card/80 backdrop-blur-xl rounded-2xl p-4 border border-border-default shadow-lg overflow-hidden">
                    {activeTab === 'shareholders' && <ShareholdersTable records={shareholders} />}
                    {activeTab === 'investments' && <CustomerInvestmentsTable records={customerInvestments} showActions={false} />}
                    {activeTab === 'loans' && (
                        <LoanDisbursementTable
                            records={loans}
                            onDisburse={(rec) => handleDisburseClick('loan', rec)}
                        />
                    )}
                    {activeTab === 'salaries' && (
                        <SalaryDisbursementTable
                            records={salaries}
                            onDisburse={(rec) => handleDisburseClick('salary', rec)}
                            onBulkDisburse={handleBulkSalaryDisburse}
                        />
                    )}
                    {activeTab === 'staff-loans' && (
                        <StaffLoanDisbursementTable
                            records={staffLoans}
                            onDisburse={(rec) => handleDisburseClick('staff-loan', rec)}
                        />
                    )}
                    {activeTab === 'investment-payouts' && (
                        <InvestmentPayoutsTable
                            records={investmentPayouts}
                            onDisburse={(rec) => handleDisburseClick('investment', rec)}
                            onSettle={(id) => { }}
                        />
                    )}
                    {activeTab === 'bank-branch' && (
                        <BankBranchHistoryTable
                            records={bankBranchActivities}
                        />
                    )}
                </div>
            </div>

            <PayoutModal
                isOpen={payoutModal.isOpen}
                onClose={() => setPayoutModal(prev => ({ ...prev, isOpen: false }))}
                recipientName={payoutModal.recipientName}
                amount={payoutModal.amount}
                approvedAmount={payoutModal.approvedAmount}
                bankDetails={payoutModal.bankDetails}
                documents={payoutModal.documents}
                onConfirm={handleConfirmPayout}
                isProcessing={isLoading}
            />
        </div >
    );
}
