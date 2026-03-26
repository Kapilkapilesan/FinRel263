'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Search, Download, Upload } from 'lucide-react';
import { Loan, LoanStats as LoanStatsType } from '@/types/loan.types';
import { Branch } from '@/types/branch.types';
import { Center } from '@/types/center.types';
import { loanService } from '@/services/loan.service';
import { authService } from '@/services/auth.service';
import { useBranches, useCenters } from '@/hooks/useSharedData';
import { useLoansList } from '@/hooks/useLoans';
import { LoanStats } from '@/components/loan/list/LoanStats';
import { LoanTable } from '@/components/loan/list/LoanTable';
import { LoanDetailModal } from '@/components/loan/list/LoanDetailModal';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import BMSLoader from '@/components/common/BMSLoader';
import { Pagination } from '@/components/common/Pagination';
import { colors } from '@/themes/colors';


export default function LoanListPage() {
    const searchParams = useSearchParams();
    const statusFromUrl = searchParams.get('status');

    // React Query Hooks
    const { data: branches = [] } = useBranches();
    const { data: centers = [] } = useCenters();

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(statusFromUrl || 'all_statuses');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedBranch, setSelectedBranch] = useState(searchParams.get('branch_id') || '');
    const [selectedCenter, setSelectedCenter] = useState(searchParams.get('center_id') || '');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
    const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (statusFromUrl) {
            setStatusFilter(statusFromUrl);
            setCurrentPage(1);
        }
    }, [statusFromUrl]);

    // Debounce search term so we don't spam requests
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Data fetching via Cached React Query hook
    const filters = useMemo(() => ({
        search: debouncedSearchTerm,
        status: statusFilter,
        startDate,
        endDate,
        branchId: selectedBranch,
        centerId: selectedCenter,
        page: currentPage,
        per_page: itemsPerPage
    }), [debouncedSearchTerm, statusFilter, startDate, endDate, selectedBranch, selectedCenter, currentPage, itemsPerPage]);

    const { data: loansResponse, isLoading: loading, refetch: fetchLoans } = useLoansList(filters);
    
    const loans = loansResponse?.data || [];
    const stats: LoanStatsType = loansResponse?.meta?.stats || {
        total_count: 0,
        active_count: 0,
        completed_count: 0,
        total_disbursed: 0,
        total_outstanding: 0
    };
    const totalPages = loansResponse?.meta?.last_page || 1;
    const totalItems = loansResponse?.meta?.total || 0;

    const filteredCenters = useMemo(() => {
        if (!selectedBranch) return centers;
        return centers.filter(c => String(c.branch_id) === String(selectedBranch));
    }, [centers, selectedBranch]);

    const handleExport = async () => {
        try {
            await loanService.exportLoans();
            toast.success('Loans exported successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to export loans');
        }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            toast.error('Please upload a valid CSV file');
            return;
        }

        setImporting(true);
        try {
            await loanService.importLoans(file);
            toast.success('Loans imported successfully');
            fetchLoans();
        } catch (error: any) {
            toast.error(error.message || 'Failed to import loans');
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="p-4 max-w-7xl mx-auto space-y-4 min-h-screen bg-app-background transition-colors">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-text-primary tracking-tight uppercase">LOAN DIRECTORY</h1>
                    <p className="text-xs text-text-muted mt-0.5 font-medium uppercase">VIEW AND MANAGE ALL LOAN ACCOUNTS</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImport}
                        accept=".csv"
                        className="hidden"
                    />
                    {authService.hasPermission('loans.view') && (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={importing}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-card border border-border-divider text-text-secondary px-5 py-2 rounded-2xl hover:bg-hover transition-all shadow-sm font-bold text-xs uppercase tracking-widest disabled:opacity-50"
                        >
                            <Upload className="w-3.5 h-3.5 text-text-muted opacity-50" />
                            <span>{importing ? 'Importing...' : 'Import CSV'}</span>
                        </button>
                    )}
                    {authService.hasPermission('loans.view') && (
                        <button
                            onClick={handleExport}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-card border border-border-divider text-text-secondary px-5 py-2 rounded-2xl hover:bg-hover transition-all shadow-sm font-bold text-xs uppercase tracking-widest"
                        >
                            <Download className="w-3.5 h-3.5 text-text-muted opacity-50" />
                            <span>Export CSV</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Statistics */}
            <LoanStats stats={stats} />

            {/* Search and Filters */}
            <div className="bg-card rounded-2xl border border-border-default p-3 shadow-sm space-y-4 transition-colors">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex-1 relative w-full max-w-md">
                        <Search className="w-4 h-4 text-text-muted opacity-50 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search by contract no, customer name..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-12 pr-4 py-2 bg-input border border-border-input rounded-xl outline-none focus:ring-2 transition-all text-sm text-text-primary"
                            style={{ '--tw-ring-color': `${colors.primary[500]}20` } as any}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                        {/* Branch Filter */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Branch:</span>
                            <SearchableSelect
                                options={branches.map(b => ({ id: b.id, label: b.branch_name }))}
                                value={selectedBranch}
                                onChange={(val) => {
                                    setSelectedBranch(val ? String(val) : '');
                                    setSelectedCenter('');
                                    setCurrentPage(1);
                                }}
                                placeholder="All Branches"
                                searchPlaceholder="Search branch..."
                                className="min-w-[150px]"
                            />
                        </div>

                        {/* Center Filter */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Center:</span>
                            <SearchableSelect
                                options={filteredCenters.map(c => ({ id: c.id, label: c.center_name, subLabel: c.CSU_id }))}
                                value={selectedCenter}
                                onChange={(val) => {
                                    setSelectedCenter(val ? String(val) : '');
                                    setCurrentPage(1);
                                }}
                                placeholder="All Centers"
                                searchPlaceholder="Search center..."
                                className="min-w-[150px]"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Status:</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="bg-input border border-border-input text-text-secondary text-xs font-bold rounded-xl outline-none focus:ring-2 block px-3 py-2 transition-all cursor-pointer appearance-none"
                                style={{ '--tw-ring-color': `${colors.primary[500]}20` } as any}
                            >
                                <option value="All">All Active</option>
                                <option value="Active">Active</option>
                                <option value="approved">Approved</option>
                                <option value="Completed">Completed</option>
                                <option value="pending_1st">Pending 1st</option>
                                <option value="pending_2nd">Pending 2nd</option>
                                <option value="sent_back">Sent Back</option>
                                <option value="all_statuses">All Statuses</option>
                            </select>
                        </div>

                        {/* Date Range Filter */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Date:</span>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-input border border-border-input rounded-xl">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="bg-transparent text-text-secondary text-[10px] font-bold outline-none focus:ring-0"
                                />
                                <span className="text-text-muted text-[10px] font-black uppercase opacity-40">to</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => {
                                        setEndDate(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="bg-transparent text-text-secondary text-[10px] font-bold outline-none focus:ring-0"
                                />
                                {(startDate || endDate) && (
                                    <button
                                        onClick={() => {
                                            setStartDate('');
                                            setEndDate('');
                                            setCurrentPage(1);
                                        }}
                                        className="text-[9px] text-red-500 font-black uppercase hover:underline ml-2"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Legacy Quick Toggles */}
                <div className="flex items-center gap-2 border-t border-border-divider pt-3">
                    <button
                        onClick={() => {
                            setStatusFilter('all_statuses');
                            setCurrentPage(1);
                        }}
                        className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm ${statusFilter === 'all_statuses'
                            ? 'bg-text-primary text-card'
                            : 'bg-muted text-text-muted hover:bg-hover'
                            }`}
                    >
                        ALL
                    </button>
                    <button
                        onClick={() => {
                            setStatusFilter('All');
                            setCurrentPage(1);
                        }}
                        className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm ${statusFilter === 'All'
                            ? 'bg-text-primary text-card'
                            : 'bg-muted text-text-muted hover:bg-hover'
                            }`}
                    >
                        ALL ACTIVE
                    </button>
                    <button
                        onClick={() => {
                            setStatusFilter('Active');
                            setCurrentPage(1);
                        }}
                        className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm ${statusFilter === 'Active'
                            ? 'text-white'
                            : 'bg-muted text-text-muted hover:bg-hover'
                            }`}
                        style={statusFilter === 'Active' ? { backgroundColor: colors.primary[600] } : {}}
                    >
                        DISBURSED
                    </button>
                    <button
                        onClick={() => {
                            setStatusFilter('Completed');
                            setCurrentPage(1);
                        }}
                        className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm ${statusFilter === 'Completed'
                            ? 'bg-green-600 text-white'
                            : 'bg-muted text-text-muted hover:bg-hover'
                            }`}
                    >
                        COMPLETED
                    </button>
                    <button
                        onClick={() => {
                            setStatusFilter('pending_1st');
                            setCurrentPage(1);
                        }}
                        className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm ${statusFilter === 'pending_1st'
                            ? 'bg-amber-600 text-white'
                            : 'bg-muted text-text-muted hover:bg-hover'
                            }`}
                    >
                        PENDING
                    </button>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="bg-card rounded-2xl border border-border-default min-h-[500px] flex flex-col items-center justify-center space-y-4 shadow-sm">
                    <BMSLoader message="Processing loans..." size="medium" />
                </div>
            ) : (
                <>
                    <LoanTable loans={loans} onView={setSelectedLoan} />

                    <Pagination
                        currentPage={currentPage}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={(newItemsPerPage) => {
                            setItemsPerPage(newItemsPerPage);
                            setCurrentPage(1);
                        }}
                        itemName="LOANS"
                    />
                </>
            )}

            {/* Detail Modal */}
            {selectedLoan && (
                <LoanDetailModal
                    loan={selectedLoan}
                    onClose={() => setSelectedLoan(null)}
                />
            )}
        </div>
    );
}
