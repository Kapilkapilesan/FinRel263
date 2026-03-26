'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ShieldCheck, RefreshCw, AlertCircle, Check, X, Search } from 'lucide-react';
import { Loan } from '@/types/loan.types';
import { loanService } from '@/services/loan.service';
import { LoanDetailModal } from '@/components/loan/list/LoanDetailModal';
import { toast } from 'react-toastify';
import BMSLoader from '@/components/common/BMSLoader';
import { colors } from '@/themes/colors';
import { usePendingCancellations } from '@/hooks/useLoans';
import { useQueryClient } from '@tanstack/react-query';

export default function LoanCancellationApprovalPage() {
    const queryClient = useQueryClient();
    const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
    const [approveConfirmLoan, setApproveConfirmLoan] = useState<Loan | null>(null);
    const [approving, setApproving] = useState(false);
    const [managerReason, setManagerReason] = useState('');
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');

    const filters = React.useMemo(() => ({
        search: searchTerm,
        per_page: 50
    }), [searchTerm]);

    const { data: response, isLoading: loading } = usePendingCancellations(filters);
    const loans = response?.data || [];

    const handleApproveCancel = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!approveConfirmLoan) return;
        
        try {
            setApproving(true);
            await loanService.approveCancellation(approveConfirmLoan.id, managerReason);
            toast.success('Loan cancellation approved successfully.');
            setApproveConfirmLoan(null);
            setManagerReason('');
            queryClient.invalidateQueries({ queryKey: ['cancellationApprovals'] });
        } catch (error: any) {
            toast.error(error.message || 'Failed to approve cancellation');
        } finally {
            setApproving(false);
        }
    }, [approveConfirmLoan, managerReason, queryClient]);

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-text-primary tracking-tight flex items-center gap-3 uppercase">
                        Cancellation Approvals
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 text-sm font-black border border-amber-500/20 shadow-inner">
                            {loans.length}
                        </span>
                    </h1>
                    <p className="text-text-muted font-bold mt-2 uppercase tracking-widest text-[10px] opacity-60">
                        Review and approve loan cancellation requests by field officers.
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['cancellationApprovals'] })}
                        className="flex w-full md:w-auto items-center justify-center gap-3 px-8 py-3 bg-muted border border-border-divider text-text-primary font-black rounded-2xl hover:bg-hover transition-all shadow-sm active:scale-95 text-[10px] uppercase tracking-widest h-[46px]"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''} text-primary-500`} />
                        Refresh List
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-3xl p-6 border border-border-default shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                <div className="col-span-1 md:col-span-6 relative">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 block">Search Requests</label>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search by ID, Customer Name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-muted border border-border-divider rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm font-bold text-text-primary placeholder:font-medium placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
                        />
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-card rounded-[2.5rem] border border-border-default/50 shadow-2xl overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                        <BMSLoader message="Fetching pending cancellations..." size="xsmall" />
                    </div>
                ) : loans.length > 0 ? (
                    <div className="divide-y divide-border-divider">
                        <div className="bg-table-header px-6 py-4">
                            <div className="grid grid-cols-12 gap-4 text-[10px] font-black text-text-muted uppercase tracking-widest">
                                <div className="col-span-2">Contract ID</div>
                                <div className="col-span-3">Customer Info</div>
                                <div className="col-span-4">Cancellation Reason</div>
                                <div className="col-span-3 text-right">Actions</div>
                            </div>
                        </div>
                        {loans.map(loan => (
                            <div key={loan.id} className="grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-hover transition-colors group">
                                <div className="col-span-2">
                                    <p className="font-bold text-text-primary text-sm">{loan.contract_number || loan.loan_id}</p>
                                    <p className="text-[10px] font-black text-text-muted mt-0.5 tracking-widest uppercase opacity-70">
                                        Amount: {Number(loan.approved_amount).toLocaleString()}
                                    </p>
                                </div>
                                <div className="col-span-3">
                                    <p className="text-sm font-bold text-text-primary truncate">{loan.customer?.full_name}</p>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60">NIC: {loan.customer?.nic}</p>
                                    <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mt-0.5">By: {loan.staff?.full_name || 'Unknown'}</p>
                                </div>
                                <div className="col-span-4">
                                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">
                                        <p className="text-[11px] font-bold text-amber-600 italic">
                                            "{loan.cancellation_reason_staff}"
                                        </p>
                                    </div>
                                </div>
                                <div className="col-span-3 flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => setSelectedLoan(loan)}
                                        className="px-4 py-2 rounded-xl bg-muted hover:bg-primary-500/10 transition-all border border-border-divider text-primary-600 text-[10px] font-black uppercase tracking-widest"
                                    >
                                        View
                                    </button>
                                    <button
                                        onClick={() => setApproveConfirmLoan(loan)}
                                        className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 transition-all border border-emerald-500/20 text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
                                    >
                                        <Check className="w-3 h-3" /> Approve
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-[400px]">
                        <div className="flex flex-col items-center animate-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center text-emerald-500 border border-emerald-500/20 mb-8 shadow-2xl shadow-emerald-500/10">
                                <ShieldCheck className="w-12 h-12" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-2xl font-black text-text-primary uppercase tracking-tight">All Caught Up!</h3>
                                <p className="text-text-muted font-bold uppercase tracking-[0.2em] text-[10px] opacity-60">
                                    There are no pending cancellation requests.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {selectedLoan && (
                <LoanDetailModal
                    loan={selectedLoan}
                    onClose={() => setSelectedLoan(null)}
                />
            )}

            {/* Approval Request Modal */}
            {approveConfirmLoan && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-[2rem] border border-border-default shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-500/20">
                                <Check className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-text-primary">Approve Cancellation</h3>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-text-muted text-emerald-500">This action will cancel the loan forever</p>
                            </div>
                        </div>

                        <div className="bg-muted rounded-xl p-4 border border-border-divider mb-6 space-y-3">
                            <div>
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-2 mb-1">Loan Information</p>
                                <p className="text-sm font-bold text-text-primary mb-1">
                                    ID: <span className="text-primary-600">{approveConfirmLoan.loan_id}</span>
                                </p>
                                <p className="text-sm font-bold text-text-primary">
                                    Customer: <span>{approveConfirmLoan.customer?.full_name || 'N/A'}</span>
                                </p>
                            </div>
                            <div className="bg-amber-500/5 p-3 rounded-lg border border-amber-500/20">
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest pl-1 mb-1">Staff's Reason</p>
                                <p className="text-xs font-medium text-amber-600 italic">"{approveConfirmLoan.cancellation_reason_staff}"</p>
                            </div>
                        </div>

                        <form onSubmit={handleApproveCancel} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-2 block">
                                    Manager Notes (Optional)
                                </label>
                                <textarea
                                    rows={3}
                                    className="w-full bg-muted border border-border-divider rounded-2xl p-4 text-sm font-bold text-text-primary focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all custom-scrollbar placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
                                    placeholder="Add optional notes for the audit trail..."
                                    value={managerReason}
                                    onChange={(e) => setManagerReason(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setApproveConfirmLoan(null);
                                        setManagerReason('');
                                    }}
                                    disabled={approving}
                                    className="flex-1 px-6 py-3.5 bg-muted border border-border-divider text-text-primary font-black rounded-2xl hover:bg-hover transition-all disabled:opacity-50 text-[10px] uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={approving}
                                    className="flex-1 px-6 py-3.5 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    {approving ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>Confirm Cancellation</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
