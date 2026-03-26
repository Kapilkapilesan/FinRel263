'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    FileText, TrendingUp, BarChart3, CreditCard, ClipboardList, File,
    Search, Filter, Download, Printer, ChevronLeft, ChevronRight,
    Calendar, Clock, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
    documentPrintLogService,
    DocumentPrintLogEntry,
    PrintLogStats,
    DocumentType
} from '@/services/documentPrintLog.service';
import { branchService } from '@/services/branch.service';
import { Branch } from '@/types/branch.types';
import { toast } from 'react-toastify';

const TABS: { key: DocumentType; label: string; icon: React.ReactNode }[] = [
    { key: 'loan_agreement', label: 'Loan Agreement', icon: <FileText className="w-4 h-4" /> },
    { key: 'investment_agreement', label: 'Investment Agreement', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'report', label: 'Reports', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'repayment', label: 'Repayment', icon: <CreditCard className="w-4 h-4" /> },
    { key: 'loan_list', label: 'Loan list', icon: <ClipboardList className="w-4 h-4" /> },
    { key: 'document', label: 'Document', icon: <File className="w-4 h-4" /> },
];

export default function DocumentPrintLogPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const currentTab = (searchParams.get('tab') as DocumentType) || 'loan_agreement';

    const [logs, setLogs] = useState<DocumentPrintLogEntry[]>([]);
    const [stats, setStats] = useState<PrintLogStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, lastPage: 1, from: 0, to: 0, perPage: 15 });
    const [showFilters, setShowFilters] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [branchFilter, setBranchFilter] = useState('');
    const [branches, setBranches] = useState<Branch[]>([]);

    const handleTabChange = (tab: DocumentType) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.push(`${pathname}?${params.toString()}`);
        setPage(1);
        setSearch('');
        setSearchInput('');
        setDateFrom('');
        setDateTo('');
        setStatusFilter('');
        setBranchFilter('');
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [logsData, statsData] = await Promise.all([
                documentPrintLogService.getLogs({
                    document_type: currentTab,
                    search: search || undefined,
                    date_from: dateFrom || undefined,
                    date_to: dateTo || undefined,
                    status: statusFilter || undefined,
                    branch_id: branchFilter ? parseInt(branchFilter) : undefined,
                    page,
                    per_page: 15,
                }),
                documentPrintLogService.getStats(currentTab, branchFilter ? parseInt(branchFilter) : undefined),
            ]);

            setLogs(logsData.data);
            setPagination({
                total: logsData.total,
                lastPage: logsData.last_page,
                from: logsData.from || 0,
                to: logsData.to || 0,
                perPage: logsData.per_page,
            });
            setStats(statsData);
        } catch (error) {
            console.error('Failed to fetch data', error);
            toast.error('Failed to load print logs');
        } finally {
            setLoading(false);
        }
    }, [currentTab, search, page, dateFrom, dateTo, statusFilter, branchFilter]);

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const data = await branchService.getBranchesDropdown();
                setBranches(data);
            } catch (error) {
                console.error('Failed to fetch branches', error);
            }
        };
        fetchBranches();
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSearch = () => {
        setSearch(searchInput);
        setPage(1);
    };

    const handleExport = async () => {
        try {
            const data = await documentPrintLogService.exportLogs({
                document_type: currentTab,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                branch_id: branchFilter ? parseInt(branchFilter) : undefined,
            });

            // Convert to CSV
            const tabConfig = TABS.find(t => t.key === currentTab);
            const headers = ['Date', 'Time', 'Staff ID', 'Document ID', 'User', 'Branch', 'Print Count', 'Status'];
            const rows = data.map(log => [
                formatDate(log.created_at),
                formatTime(log.created_at),
                log.staff_id || log.user?.staff_id || '-',
                log.document_id || '-',
                log.user?.full_name || log.user?.name || '-',
                log.branch?.branch_name || log.branch?.name || '-',
                log.print_count || '-',
                log.status,
            ]);

            const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${tabConfig?.label || currentTab}_print_logs.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Export downloaded successfully');
        } catch (error) {
            console.error('Export failed', error);
            toast.error('Failed to export logs');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const getStatusBadge = (status: string) => {
        if (status === 'success') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle className="w-3 h-3" /> Success
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                <XCircle className="w-3 h-3" /> Failed
            </span>
        );
    };

    const tabLabel = TABS.find(t => t.key === currentTab)?.label || currentTab;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <Printer className="w-6 h-6 text-primary-500" />
                        Document Print Log
                    </h1>
                    <p className="text-text-secondary mt-1">
                        Track and monitor document printing activities
                    </p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border-default rounded-xl text-sm font-semibold text-text-primary hover:bg-hover transition-all shadow-sm"
                >
                    <Download className="w-4 h-4" />
                    Export Log
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="bg-card border border-border-default/50 rounded-2xl p-1.5 shadow-sm">
                <div className="flex flex-wrap gap-1">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => handleTabChange(tab.key)}
                            className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${currentTab === tab.key
                                ? 'bg-app-background shadow-sm text-primary-600 ring-1 ring-border-default'
                                : 'text-text-secondary hover:text-text-primary hover:bg-hover'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card p-5 rounded-2xl border border-border-default/50 shadow-sm">
                    <p className="text-text-muted text-[10px] font-black uppercase tracking-widest">Total Prints Today</p>
                    <h3 className="text-3xl font-black mt-2 text-text-primary">
                        {stats?.total_prints_today ?? 0}
                    </h3>
                </div>
                <div className="bg-card p-5 rounded-2xl border border-border-default/50 shadow-sm">
                    <p className="text-text-muted text-[10px] font-black uppercase tracking-widest">Successful Prints</p>
                    <h3 className="text-3xl font-black mt-2 text-emerald-500">
                        {stats?.successful_prints ?? 0}
                    </h3>
                </div>
                <div className="bg-card p-5 rounded-2xl border border-border-default/50 shadow-sm">
                    <p className="text-text-muted text-[10px] font-black uppercase tracking-widest">Failed Prints</p>
                    <h3 className="text-3xl font-black mt-2 text-red-500">
                        {stats?.failed_prints ?? 0}
                    </h3>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-card rounded-2xl border border-border-default/50 shadow-sm p-4">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[250px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                            type="text"
                            placeholder={`Search ${tabLabel} logs...`}
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            className="w-full pl-10 pr-4 py-2.5 bg-input border border-border-default/50 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-text-primary"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${showFilters
                            ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 border-primary-200 dark:border-primary-500/30'
                            : 'bg-card border-border-default/50 text-text-secondary hover:bg-hover'
                            }`}
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                </div>

                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-border-default/50 flex flex-wrap gap-4 items-end">
                        <div className="w-44">
                            <label className="block text-xs font-black text-text-muted uppercase mb-2 tracking-widest">
                                From Date
                            </label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                                className="w-full px-3 py-2.5 bg-input border border-border-default/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 text-text-primary"
                            />
                        </div>
                        <div className="w-44">
                            <label className="block text-xs font-black text-text-muted uppercase mb-2 tracking-widest">
                                To Date
                            </label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={e => { setDateTo(e.target.value); setPage(1); }}
                                className="w-full px-3 py-2.5 bg-input border border-border-default/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 text-text-primary"
                            />
                        </div>
                        <div className="w-40">
                            <label className="block text-xs font-black text-text-muted uppercase mb-2 tracking-widest">
                                Status
                            </label>
                            <select
                                value={statusFilter}
                                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                                className="w-full px-3 py-2.5 bg-input border border-border-default/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 text-text-primary"
                            >
                                <option value="">All</option>
                                <option value="success">Success</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                        <div className="w-48">
                            <label className="block text-xs font-black text-text-muted uppercase mb-2 tracking-widest">
                                Branch
                            </label>
                            <select
                                value={branchFilter}
                                onChange={e => { setBranchFilter(e.target.value); setPage(1); }}
                                className="w-full px-3 py-2.5 bg-input border border-border-default/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 text-text-primary"
                            >
                                <option value="">All Branches</option>
                                {branches.map(branch => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.branch_name} ({branch.branch_code})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={() => { setDateFrom(''); setDateTo(''); setStatusFilter(''); setBranchFilter(''); setSearch(''); setSearchInput(''); setPage(1); }}
                            className="px-4 py-2.5 text-sm font-semibold text-text-muted hover:text-text-primary transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-card rounded-2xl border border-border-default/50 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-table-header/30 border-b border-border-default/50">
                                <th className="px-6 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Date</th>
                                <th className="px-6 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Time</th>
                                <th className="px-6 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Staff ID</th>
                                <th className="px-6 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Document ID</th>
                                <th className="px-6 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">User</th>
                                <th className="px-6 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Branch</th>
                                <th className="px-6 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">P. Count</th>
                                <th className="px-6 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default/50">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={8} className="px-6 py-4">
                                            <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-14 h-14 rounded-2xl bg-muted-bg flex items-center justify-center">
                                                <Printer className="w-7 h-7 text-text-muted" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-text-primary">No {tabLabel} logs found</p>
                                                <p className="text-sm text-text-muted mt-1">
                                                    Logs will appear here once printing activities for {tabLabel} are recorded in the system.
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} className="hover:bg-hover transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-text-muted" />
                                                <span className="text-sm font-bold text-text-primary">
                                                    {formatDate(log.created_at)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-primary-500" />
                                                <span className="text-sm font-bold text-text-primary">
                                                    {formatTime(log.created_at)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-text-primary">
                                                {log.staff_id || log.user?.staff_id || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                                                {log.document_id || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-text-primary">
                                                {log.user?.full_name || log.user?.name || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-text-primary">
                                                {log.branch?.branch_name || log.user?.staff?.branch?.branch_name || log.branch?.name || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-text-primary">
                                                {log.print_count ? `${log.print_count}x` : '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(log.status)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-border-default/50">
                    <p className="text-sm text-text-muted font-semibold">
                        Showing {pagination.from}-{pagination.to} of {pagination.total} entries
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="px-3 py-1.5 text-sm font-semibold text-text-secondary border border-border-default/50 rounded-lg hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(pagination.lastPage, p + 1))}
                            disabled={page >= pagination.lastPage}
                            className="px-3 py-1.5 text-sm font-semibold text-text-secondary border border-border-default/50 rounded-lg hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
