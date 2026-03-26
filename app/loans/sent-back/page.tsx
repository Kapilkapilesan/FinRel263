'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { Loan } from '@/types/loan.types';
import { loanService } from '@/services/loan.service';
import { LoanTable } from '@/components/loan/list/LoanTable';
import { LoanDetailModal } from '@/components/loan/list/LoanDetailModal';
import { toast } from 'react-toastify';
import BMSLoader from '@/components/common/BMSLoader';
import { useLoansList } from '@/hooks/useLoans';
import { useQueryClient } from '@tanstack/react-query';

export default function SentBackLoansPage() {
    const queryClient = useQueryClient();
    const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
    const [deleteConfirmLoan, setDeleteConfirmLoan] = useState<Loan | null>(null);
    const [deleting, setDeleting] = useState(false);

    const filters = React.useMemo(() => ({
        status: 'sent_back',
        per_page: 100
    }), []);

    const { data: response, isLoading: loading } = useLoansList(filters);
    const loans = response?.data || [];

    const handleDeleteLoan = useCallback(async (loan: Loan) => {
        try {
            setDeleting(true);
            await loanService.deleteLoan(loan.id);
            toast.success('Loan deleted successfully');
            setDeleteConfirmLoan(null);
            queryClient.invalidateQueries({ queryKey: ['loans'] });
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete loan');
        } finally {
            setDeleting(false);
        }
    }, [queryClient]);

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* Header section with specialized aesthetics */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-text-primary tracking-tight flex items-center gap-3 uppercase">
                        Sent Back Applications
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-primary-500/10 text-primary-500 text-sm font-black border border-primary-500/20 shadow-inner">
                            {loans.length}
                        </span>
                    </h1>
                    <p className="text-text-muted font-bold mt-2 uppercase tracking-widest text-[10px] opacity-60">Review and modify applications that were returned for correction.</p>
                </div>

                <button
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['loans'] })}
                    className="flex items-center gap-3 px-8 py-3.5 bg-card border border-border-divider text-text-primary font-black rounded-2xl hover:bg-hover transition-all shadow-sm active:scale-95 text-[10px] uppercase tracking-widest"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''} text-primary-500`} />
                    Refresh List
                </button>
            </div>

            {/* Warning banner for guidance */}
            {/* <div className="bg-amber-500/[0.03] backdrop-blur-3xl border border-amber-500/20 rounded-[2.5rem] p-8 flex items-start gap-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
                <div className="w-14 h-14 bg-card rounded-2xl flex items-center justify-center text-amber-500 shadow-xl shrink-0 border border-amber-500/20 group-hover:scale-110 transition-transform">
                    <AlertCircle className="w-7 h-7" />
                </div>
                <div className="space-y-2">
                    <h3 className="font-black text-amber-600 text-[10px] uppercase tracking-[0.3em]">Instructions for Modification</h3>
                    <p className="text-sm font-bold text-text-secondary leading-relaxed max-w-3xl">
                        Loans listed here have been reviewed by a Manager or Admin and require specific updates.
                        Click the view button to see the rejection reason, then click <span className="text-amber-600 underline underline-offset-4 decoration-2">Modify & Resubmit</span> to update the application details.
                    </p>
                </div>
            </div> */}

            {/* Dedicated List View */}
            <div className="bg-card rounded-[2.5rem] border border-border-default/50 shadow-2xl overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                        <BMSLoader message="Fetching corrections..." size="xsmall" />
                    </div>
                ) : loans.length > 0 ? (
                    <LoanTable
                        loans={loans}
                        onView={(loan) => setSelectedLoan(loan)}
                        onDelete={(loan) => setDeleteConfirmLoan(loan)}
                    />
                ) : (
                    <div className="flex items-center justify-center h-[400px]">
                        <div className="flex flex-col items-center animate-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center text-emerald-500 border border-emerald-500/20 mb-8 shadow-2xl shadow-emerald-500/10">
                                <AlertCircle className="w-12 h-12" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-2xl font-black text-text-primary uppercase tracking-tight">All Clear!</h3>
                                <p className="text-text-muted font-bold uppercase tracking-[0.2em] text-[10px] opacity-60">You don't have any loan applications that need modification.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {selectedLoan && (
                <LoanDetailModal
                    loan={selectedLoan}
                    onClose={() => setSelectedLoan(null)}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmLoan && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-[2rem] border border-border-default shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-600 border border-red-500/20">
                                <Trash2 className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-text-primary">Delete Loan</h3>
                                <p className="text-sm text-text-muted">This action cannot be undone</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="bg-muted rounded-xl p-4 border border-border-divider">
                                <p className="text-sm font-bold text-text-primary mb-2">
                                    Loan ID: <span className="text-primary-600">{deleteConfirmLoan.loan_id}</span>
                                </p>
                                <p className="text-sm font-bold text-text-primary">
                                    Customer: <span>{deleteConfirmLoan.customer?.full_name || 'N/A'}</span>
                                </p>
                                <p className="text-sm font-bold text-text-primary">
                                    Amount: <span className="text-primary-600">LKR {Number(deleteConfirmLoan.approved_amount).toLocaleString()}</span>
                                </p>
                            </div>
                            
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                                <p className="text-sm font-bold text-amber-600">
                                    ⚠️ This will permanently delete the loan application and all associated documents.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirmLoan(null)}
                                disabled={deleting}
                                className="flex-1 px-6 py-3 bg-muted border border-border-divider text-text-primary font-black rounded-2xl hover:bg-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[10px] uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteLoan(deleteConfirmLoan)}
                                disabled={deleting}
                                className="flex-1 px-6 py-3 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                {deleting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Delete Loan
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
