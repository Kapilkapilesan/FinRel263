"use client";

import React, { useState, useEffect } from 'react';
import {
    FileText,
    DollarSign,
    TrendingUp,
    Download,
    Search,
    Calendar,
    ChevronRight,
    ArrowLeftRight,
    Users,
    SearchCode,
    LayoutDashboard
} from 'lucide-react';
import { Building2 } from 'lucide-react';
import { financeService } from '../../services/finance.service';
import { branchService } from '../../services/branch.service';
import { Branch } from '../../types/branch.types';
import { toast } from 'react-toastify';
import { colors } from '@/themes/colors';
import { Pagination } from '../../components/common/Pagination';

export default function FundTruncationSummaryPage() {
    const [activeTab, setActiveTab] = useState<'loans' | 'investments' | 'salaries' | 'staff_loans'>('loans');
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<{
        stats: { loans: number; investments: number; salaries: number; staff_loans: number };
        records: { data: any[]; current_page: number; last_page: number; total: number; per_page: number };
    }>({
        stats: { loans: 0, investments: 0, salaries: 0, staff_loans: 0 },
        records: { data: [], current_page: 1, last_page: 1, total: 0, per_page: 15 }
    });

    const [period, setPeriod] = useState<'day' | 'month' | 'year' | 'all'>('month');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(undefined);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);

    const fetchBranches = async () => {
        try {
            const result = await branchService.getBranchesDropdown();
            setBranches(result);
        } catch (error: any) {
            console.error('Failed to fetch branches:', error);
        }
    };

    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return new Intl.DateTimeFormat('en-GB', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).format(date);
        } catch (e) {
            return dateStr;
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchSummary = async () => {
        setIsLoading(true);
        try {
            const result = await financeService.getTruncationSummary(selectedDate, period, selectedBranchId, page, perPage, activeTab, searchTerm);
            setData(result);
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch summary');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, [selectedDate, period, selectedBranchId, page, perPage, activeTab, searchTerm]);

    const handleExport = () => {
        const records = data.records.data;
        if (records.length === 0) {
            toast.error('No records to export');
            return;
        }

        const headers = activeTab === 'loans'
            ? ["Date", "Loan ID", "Customer", "Amount", "Status"]
            : activeTab === 'investments'
                ? ["Date", "Investment ID", "Customer", "Amount", "Reference"]
                : activeTab === 'salaries'
                    ? ["Date", "Staff Name", "Month", "Net Payable", "Method"]
                    : ["Date", "Staff Name", "Amount", "Purpose", "Reference"];

        const csvContent = [
            headers.join(','),
            ...records.map((rec: any) => {
                const row = activeTab === 'loans'
                    ? [rec.activation_date, rec.loan_id, rec.customer?.full_name, rec.approved_amount, rec.status]
                    : activeTab === 'investments'
                        ? [rec.paid_at, rec.investment?.account_no, rec.investment?.customer?.full_name, rec.total_payout, rec.reference_code]
                        : activeTab === 'salaries'
                            ? [rec.payment_date, rec.staff?.full_name, rec.month, rec.net_payable, rec.payment_method]
                            : [rec.disbursed_at, rec.staff?.full_name, rec.amount, rec.purpose, rec.payment_reference];
                return row.map(v => `"${v}"`).join(",");
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `truncation_summary_${activeTab}_${period}_${selectedDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    return (
        <div className="min-h-screen relative overflow-hidden bg-app-background">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full opacity-10 blur-[120px]"
                    style={{ background: `radial-gradient(circle, ${colors.primary[400]}, transparent)` }}
                />
            </div>

            <div className="relative z-10 p-6 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-700">
                {/* Balanced Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card/70 backdrop-blur-xl p-6 rounded-[2rem] shadow-xl border border-border-default/50">
                    <div className="flex items-center gap-5">
                        <div
                            className="p-3.5 rounded-2xl shadow-lg transition-all duration-500"
                            style={{
                                background: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[700]})`,
                                boxShadow: `0 10px 20px ${colors.primary[600]}30`
                            }}
                        >
                            <LayoutDashboard className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-text-primary tracking-tight uppercase leading-none">Truncation Summary</h1>
                            <p className="text-[10px] text-text-muted font-bold tracking-[0.2em] uppercase mt-2">
                                Historical log of all disbursed funds & settlements
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex bg-muted-bg/50 p-1.5 rounded-2xl border border-border-default/50 backdrop-blur-sm">
                            {['day', 'month', 'year', 'all'].map((p: any) => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${period === p
                                        ? 'bg-card text-primary-600 shadow-lg scale-105'
                                        : 'text-text-muted hover:text-text-secondary'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>

                        {period !== 'all' && (
                            <div className="flex items-center gap-2 bg-muted-bg/50 p-1.5 rounded-2xl border border-border-default/50">
                                <div className="relative group">
                                    <Calendar className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-primary-500 transition-colors" />
                                    <input
                                        type={period === 'day' ? 'date' : period === 'month' ? 'month' : 'number'}
                                        value={period === 'year' ? selectedDate.split('-')[0] : (period === 'month' ? selectedDate.substring(0, 7) : selectedDate)}
                                        onChange={(e) => {
                                            if (period === 'year') {
                                                setSelectedDate(`${e.target.value}-01-01`);
                                            } else if (period === 'month') {
                                                setSelectedDate(`${e.target.value}-01`);
                                            } else {
                                                setSelectedDate(e.target.value);
                                            }
                                        }}
                                        className="pl-9 pr-4 py-2.5 bg-card border-none rounded-xl text-[10px] font-black uppercase tracking-widest outline-none ring-1 ring-border-default hover:ring-primary-300 transition-all w-44 text-text-primary"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-2 bg-muted-bg/50 p-1.5 rounded-2xl border border-border-default/50">
                            <div className="relative group">
                                <Building2 className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-primary-500 transition-colors" />
                                <select
                                    value={selectedBranchId || ''}
                                    onChange={(e) => setSelectedBranchId(e.target.value ? Number(e.target.value) : undefined)}
                                    className="pl-9 pr-8 py-2.5 bg-card border-none rounded-xl text-[10px] font-black uppercase tracking-widest outline-none ring-1 ring-border-default hover:ring-primary-300 transition-all w-48 text-text-primary appearance-none cursor-pointer"
                                >
                                    <option value="">All Branches</option>
                                    {branches.map((branch) => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.branch_name}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <ChevronRight className="w-3 h-3 text-text-muted rotate-90" />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-6 py-3 hover:opacity-90 text-white rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95"
                            style={{
                                background: `linear-gradient(135deg, ${colors.primary[500]}, ${colors.primary[600]})`,
                                boxShadow: `0 10px 20px ${colors.primary[600]}30`
                            }}
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Balanced Statistics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Loans Disbursed', value: data.stats.loans, icon: DollarSign, color: colors.primary[600] },
                        { label: 'Investment Completed', value: data.stats.investments, icon: TrendingUp, color: colors.primary[500] },
                        { label: 'Salaries Paid', value: data.stats.salaries, icon: Users, color: colors.warning[600] },
                        { label: 'Staff Loans', value: data.stats.staff_loans, icon: FileText, color: colors.primary[400] },
                    ].map((stat, i) => (
                        <div key={i} className="bg-card p-6 rounded-[2rem] border border-border-default shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                            <div className="relative z-10 flex flex-col gap-2">
                                <span className="text-text-muted text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">{stat.label}</span>
                                <span className="text-3xl font-black text-text-primary tabular-nums leading-none">{stat.value}</span>
                            </div>
                            <stat.icon
                                className="w-14 h-14 absolute -right-2 -bottom-2 opacity-[0.05] group-hover:opacity-10 group-hover:scale-110 transition-all duration-700"
                                style={{ color: stat.color }}
                            />
                            <div className="absolute top-4 right-4 p-1">
                                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: stat.color }} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="bg-card rounded-[2.5rem] border border-border-default shadow-xl overflow-hidden flex flex-col min-h-[600px]">
                    {/* Balanced Tabs */}
                    <div className="flex flex-wrap items-center bg-muted-bg/30 px-6 pt-6 gap-8 border-b border-border-default">
                        {[
                            { id: 'loans', label: 'Loan Disbursements', icon: DollarSign },
                            { id: 'investments', label: 'Investment Returns', icon: TrendingUp },
                            { id: 'salaries', label: 'Staff Salaries', icon: Users },
                            { id: 'staff_loans', label: 'Staff Loans', icon: FileText },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id as any);
                                    setPage(1);
                                }}
                                className={`flex items-center gap-2 pb-6 text-[10px] font-black uppercase tracking-widest transition-all relative group ${activeTab === tab.id
                                    ? 'text-primary-600'
                                    : 'text-text-muted hover:text-text-secondary'
                                    }`}
                            >
                                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary-600' : 'text-text-muted/50 group-hover:text-text-muted'}`} />
                                {tab.label}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-600 rounded-t-full shadow-[0_-2px_10px_rgba(124,58,237,0.3)]"></div>
                                )}
                            </button>
                        ))}

                        <div className="ml-auto mb-5 relative group">
                            <SearchCode className="w-4 h-4 text-text-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-primary-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Quick search catalog..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(1);
                                }}
                                className="pl-11 pr-5 py-3 bg-input/50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none ring-1 ring-border-default focus:ring-4 focus:ring-primary-500/10 w-72 transition-all text-text-primary"
                            />
                        </div>
                    </div>

                    {/* Table Content */}
                    <div className="flex-1 p-0 overflow-x-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="h-full flex flex-col items-center justify-center py-20 gap-4">
                                <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-[11px] text-text-muted font-black uppercase tracking-widest animate-pulse">Filtering your summary...</p>
                            </div>
                        ) : data.records.data.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center py-24 gap-6">
                                <div className="p-8 bg-muted-bg rounded-full shadow-inner ring-8 ring-muted-bg/50">
                                    <Search className="w-12 h-12 text-text-muted/30" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-text-primary font-black uppercase text-xs tracking-widest">No matching records found</h3>
                                    <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider mt-2 opacity-60">Try adjusting your filters or refining your search</p>
                                </div>
                            </div>
                        ) : (
                            <table className="w-full text-left border-separate border-spacing-0">
                                <thead>
                                    <tr className="bg-muted-bg/40">
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-text-muted tracking-[0.2em] border-b border-border-default whitespace-nowrap">Date & Time</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-text-muted tracking-[0.2em] border-b border-border-default whitespace-nowrap">Recipient Entity</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-text-muted tracking-[0.2em] text-right border-b border-border-default whitespace-nowrap">Allocated Amount</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-text-muted tracking-[0.2em] border-b border-border-default whitespace-nowrap">Registry / Method</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-text-muted tracking-[0.2em] border-b border-border-default whitespace-nowrap">Branch</th>
                                        <th className="px-8 py-5 border-b border-border-default"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-default/50">
                                    {data.records.data.map((rec: any, idx: number) => (
                                        <tr key={idx} className="group hover:bg-hover transition-all duration-500">
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-black text-text-primary font-mono tracking-tight">
                                                        {activeTab === 'loans'
                                                            ? formatDateTime(rec.approve_history?.disbursement_requested_by?.at || rec.approve_history?.activated_by?.at || rec.activation_date)
                                                            : activeTab === 'investments'
                                                                ? (rec.paid_at ? formatDateTime(rec.paid_at) : 'N/A')
                                                                : activeTab === 'salaries'
                                                                    ? formatDateTime(rec.payment_date)
                                                                    : formatDateTime(rec.disbursed_at)}
                                                    </span>
                                                    <span className="text-[9px] text-text-muted font-black uppercase tracking-widest opacity-60">Verified Output</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-muted-bg border border-border-default rounded-xl flex items-center justify-center flex-shrink-0 group-hover:border-primary-500/50 group-hover:scale-105 transition-all overflow-hidden shadow-sm">
                                                        <span className="text-primary-500 text-lg font-black uppercase">
                                                            {(activeTab === 'loans' ? rec.customer?.full_name : activeTab === 'investments' ? rec.investment?.customer?.full_name : rec.staff?.full_name)?.charAt(0) || 'N'}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-base font-black text-text-primary uppercase tracking-tight leading-none group-hover:text-primary-600 transition-colors">
                                                            {activeTab === 'loans' ? rec.customer?.full_name : activeTab === 'investments' ? rec.investment?.customer?.full_name : rec.staff?.full_name}
                                                        </span>
                                                        <span className="text-[10px] text-text-muted font-bold mt-2 tracking-widest uppercase">
                                                            {activeTab === 'loans' ? `Loan: ${rec.loan_id}` : activeTab === 'investments' ? `INV: ${rec.investment?.account_no}` : `Staff: ${rec.staff?.staff_id}`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-lg font-black text-text-primary tabular-nums tracking-tighter">
                                                        {Number(activeTab === 'loans' ? rec.approved_amount : activeTab === 'investments' ? rec.total_payout : rec.net_payable || rec.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                    <div className="flex items-center justify-end gap-1.5 px-2 py-0.5 bg-primary-50 dark:bg-primary-900/10 rounded-lg w-fit ml-auto border border-primary-100/50 dark:border-primary-500/10">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                                                        <span className="text-[9px] text-primary-600 dark:text-primary-400 font-black uppercase tracking-widest">Finalized</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-black text-text-primary tracking-widest uppercase leading-none">
                                                        {activeTab === 'loans' ? 'Cash / Transfer' : activeTab === 'investments' ? rec.reference_code : activeTab === 'salaries' ? rec.payment_method : rec.payment_reference}
                                                    </span>
                                                    <span className="text-[9px] text-text-muted font-bold uppercase tracking-widest opacity-60">System Protocol</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="px-3 py-1.5 bg-muted-bg text-text-muted rounded-lg text-[9px] font-black uppercase tracking-widest border border-border-default group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 group-hover:text-primary-600 group-hover:border-primary-100 dark:group-hover:border-primary-900/30 transition-all duration-300">
                                                    {(activeTab === 'loans' ? rec.center?.branch?.branch_name : (activeTab === 'investments' ? rec.investment?.branch?.branch_name : rec.staff?.branch?.branch_name)) || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button className="p-2 text-text-muted/50 hover:text-primary-600 transition-all opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0">
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination & Summary */}
                    <div className="flex-1 lg:flex-shrink-0">
                        <Pagination
                            currentPage={page}
                            totalItems={data.records.total}
                            itemsPerPage={perPage}
                            onPageChange={(p) => setPage(p)}
                            onItemsPerPageChange={(val) => {
                                setPerPage(val);
                                setPage(1);
                            }}
                            itemName="transactions"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
