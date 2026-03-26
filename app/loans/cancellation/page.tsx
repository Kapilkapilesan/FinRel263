'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { RotateCcw, RefreshCw, AlertCircle, Trash2, Check, X, Search, Filter } from 'lucide-react';
import { Loan } from '@/types/loan.types';
import { loanService } from '@/services/loan.service';
import { LoanTable } from '@/components/loan/list/LoanTable';
import { LoanDetailModal } from '@/components/loan/list/LoanDetailModal';
import { toast } from 'react-toastify';
import BMSLoader from '@/components/common/BMSLoader';
import { colors } from '@/themes/colors';

export default function LoanCancellationPage() {
    const [activeTab, setActiveTab] = useState<'request' | 'summary'>('request');
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
    const [cancelConfirmLoan, setCancelConfirmLoan] = useState<Loan | null>(null);
    const [cancelling, setCancelling] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStage, setSelectedStage] = useState('all_statuses');

    const fetchLoans = useCallback(async () => {
        try {
            setLoading(true);
            const statusToFetch = activeTab === 'summary' ? 'cancelled' : selectedStage;
            
            const response = await loanService.getLoans({
                status: statusToFetch,
                search: searchTerm,
                per_page: 50
            });
            
            // Only show cancellable loans in request tab (exclude already cancelled/pending cancellation)
            let fetchedLoans = response.data;
            if (activeTab === 'request') {
                fetchedLoans = fetchedLoans.filter(l => 
                    l.status !== 'cancelled' && 
                    l.status !== 'cancellation_pending' && 
                    l.status !== 'Completed' && 
                    l.status !== 'Defaulted' && 
                    l.status !== 'sent_back' && 
                    l.status !== 'rejected' &&
                    l.status !== 'Active'
                );
            }
            
            setLoans(fetchedLoans);
        } catch (error) {
            toast.error('Failed to load loans');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [activeTab, selectedStage, searchTerm]);

    const handleRequestCancel = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cancelConfirmLoan || !cancelReason.trim()) return;
        
        try {
            setCancelling(true);
            await loanService.requestCancellation(cancelConfirmLoan.id, cancelReason);
            toast.success('Cancellation request submitted successfully.');
            setCancelConfirmLoan(null);
            setCancelReason('');
            fetchLoans(); 
        } catch (error: any) {
            toast.error(error.message || 'Failed to request cancellation');
        } finally {
            setCancelling(false);
        }
    }, [cancelConfirmLoan, cancelReason, fetchLoans]);

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchLoans();
        }, 300);
        return () => clearTimeout(handler);
    }, [fetchLoans]);

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-text-primary tracking-tight flex items-center gap-3 uppercase">
                        Loan Cancellation
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-primary-500/10 text-primary-500 text-sm font-black border border-primary-500/20 shadow-inner">
                            {loans.length}
                        </span>
                    </h1>
                    <p className="text-text-muted font-bold mt-2 uppercase tracking-widest text-[10px] opacity-60">
                        Initiate cancellation for ongoing loans before final execution.
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('request')}
                        className={`px-6 py-3 font-black rounded-2xl transition-all shadow-sm active:scale-95 text-[10px] uppercase tracking-widest ${
                            activeTab === 'request'
                                ? 'bg-primary-600 text-white border-transparent'
                                : 'bg-card border border-border-divider text-text-secondary hover:bg-hover'
                        }`}
                    >
                        Active Loans
                    </button>
                    <button
                        onClick={() => setActiveTab('summary')}
                        className={`px-6 py-3 font-black rounded-2xl transition-all shadow-sm active:scale-95 text-[10px] uppercase tracking-widest ${
                            activeTab === 'summary'
                                ? 'bg-primary-600 text-white border-transparent'
                                : 'bg-card border border-border-divider text-text-secondary hover:bg-hover'
                        }`}
                    >
                        Cancellation Summary
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-3xl p-6 border border-border-default shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                <div className="col-span-1 md:col-span-5 relative">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 block">Search Loans</label>
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

                {activeTab === 'request' && (
                    <div className="col-span-1 md:col-span-4 relative">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 block">Filter by Stage</label>
                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <select
                                value={selectedStage}
                                onChange={(e) => setSelectedStage(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-muted border border-border-divider rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm font-bold text-text-primary appearance-none cursor-pointer"
                            >
                                <option value="all_statuses">All Active Stages</option>
                                <option value="Pending">Before approval loan (Pending)</option>
                                <option value="approved">Before activate loan (Approved)</option>
                                <option value="activated">Before Diss payment (Activated)</option>
                                <option value="awaiting_transfer">Before Fund Truncation (Awaiting Transfer)</option>
                            </select>
                        </div>
                    </div>
                )}

                <div className={`col-span-1 ${activeTab === 'request' ? 'md:col-span-3' : 'md:col-span-7'} flex justify-end`}>
                    <button
                        onClick={fetchLoans}
                        className="flex w-full md:w-auto items-center justify-center gap-3 px-8 py-3 bg-muted border border-border-divider text-text-primary font-black rounded-2xl hover:bg-hover transition-all shadow-sm active:scale-95 text-[10px] uppercase tracking-widest h-[46px]"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''} text-primary-500`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-card rounded-[2.5rem] border border-border-default/50 shadow-2xl overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                        <BMSLoader message="Fetching loans..." size="xsmall" />
                    </div>
                ) : loans.length > 0 ? (
                    <div className="divide-y divide-border-divider">
                        <div className="bg-table-header px-6 py-4">
                            <div className="grid grid-cols-12 gap-4 text-[10px] font-black text-text-muted uppercase tracking-widest">
                                <div className="col-span-2">Contract ID</div>
                                <div className="col-span-3">Customer Info</div>
                                <div className="col-span-3">Loan Details</div>
                                <div className="col-span-2">Current Stage</div>
                                <div className="col-span-2 text-right">Actions</div>
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
                                </div>
                                <div className="col-span-3">
                                    <p className="text-sm font-bold text-text-primary">{loan.product?.product_name || 'N/A'}</p>
                                    {activeTab === 'summary' && loan.cancellation_reason_staff && (
                                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest truncate mt-0.5" title={loan.cancellation_reason_staff}>
                                            Reason: {loan.cancellation_reason_staff}
                                        </p>
                                    )}
                                </div>
                                <div className="col-span-2">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                        loan.status === 'cancelled' ? 'bg-red-500/10 text-red-600 border border-red-500/20' : 'bg-primary-500/10 text-primary-600 border border-primary-500/20'
                                    }`}>
                                        {loan.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="col-span-2 flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => setSelectedLoan(loan)}
                                        className="px-4 py-2 rounded-xl bg-muted hover:bg-primary-500/10 transition-all border border-border-divider text-primary-600 text-[10px] font-black uppercase tracking-widest"
                                    >
                                        View
                                    </button>
                                    {activeTab === 'request' && (
                                        <button
                                            onClick={() => setCancelConfirmLoan(loan)}
                                            className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 transition-all border border-amber-500/20 text-amber-600 text-[10px] font-black uppercase tracking-widest"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-[400px]">
                        <div className="flex flex-col items-center animate-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-primary-500/10 rounded-[2rem] flex items-center justify-center text-primary-500 border border-primary-500/20 mb-8 shadow-2xl shadow-primary-500/10">
                                <AlertCircle className="w-12 h-12" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-2xl font-black text-text-primary uppercase tracking-tight">No Loans Found</h3>
                                <p className="text-text-muted font-bold uppercase tracking-[0.2em] text-[10px] opacity-60">
                                    {activeTab === 'summary' ? "There are no cancelled loans matching your criteria." : "There are no loans available to cancel."}
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

            {/* Cancellation Request Modal */}
            {cancelConfirmLoan && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-[2rem] border border-border-default shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-500/20">
                                <RotateCcw className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-text-primary">Cancel Loan</h3>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-text-muted text-amber-500">Requires Manager Approval</p>
                            </div>
                        </div>

                        <div className="bg-muted rounded-xl p-4 border border-border-divider mb-6">
                            <p className="text-sm font-bold text-text-primary mb-2">
                                Loan ID: <span className="text-primary-600">{cancelConfirmLoan.loan_id}</span>
                            </p>
                            <p className="text-sm font-bold text-text-primary">
                                Customer: <span>{cancelConfirmLoan.customer?.full_name || 'N/A'}</span>
                            </p>
                        </div>

                        <form onSubmit={handleRequestCancel} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-2 block">
                                    Reason for Cancellation <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    className="w-full bg-muted border border-border-divider rounded-2xl p-4 text-sm font-bold text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all custom-scrollbar placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
                                    placeholder="Provide a detailed reason..."
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCancelConfirmLoan(null);
                                        setCancelReason('');
                                    }}
                                    disabled={cancelling}
                                    className="flex-1 px-6 py-3.5 bg-muted border border-border-divider text-text-primary font-black rounded-2xl hover:bg-hover transition-all disabled:opacity-50 text-[10px] uppercase tracking-widest"
                                >
                                    Go Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={cancelling || !cancelReason.trim()}
                                    className="flex-1 px-6 py-3.5 bg-amber-500 text-white font-black rounded-2xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    {cancelling ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>Submit Request</>
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
