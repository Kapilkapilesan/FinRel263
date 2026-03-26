'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Search, Send, Clock } from 'lucide-react';
import { Loan } from '@/types/loan.types';
import { loanService } from '@/services/loan.service';
import { toast } from 'react-toastify';
import BMSLoader from '@/components/common/BMSLoader';
import { colors } from '@/themes/colors';
import { formatCurrency } from '@/utils/loan.utils';
import { ActionConfirmModal } from '@/components/common/ActionConfirmModal';
import { Pagination } from '@/components/common/Pagination';
import { useLoansList } from '@/hooks/useLoans';
import { useQueryClient } from '@tanstack/react-query';

export default function DisbursementQueuePage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; loanId: number | null }>({
        isOpen: false,
        loanId: null
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const filters = React.useMemo(() => ({
        status: 'activated',
        search: searchTerm,
        page: currentPage,
        per_page: itemsPerPage
    }), [searchTerm, currentPage, itemsPerPage]);

    const { data: response, isLoading: loading } = useLoansList(filters);
    const loans = response?.data || [];
    const totalItems = response?.meta?.total || 0;

    const handleRequestTransfer = async () => {
        if (!confirmModal.loanId) return;

        setProcessingId(confirmModal.loanId);
        try {
            await loanService.requestDisbursement(confirmModal.loanId);
            toast.success('Payout requested successfully');
            queryClient.invalidateQueries({ queryKey: ['loans'] });
        } catch (error: any) {
            toast.error(error.message || 'Failed to Dispayment');
        } finally {
            setProcessingId(null);
            setConfirmModal({ isOpen: false, loanId: null });
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-text-primary tracking-tight">Disbursement Request</h1>
                    <p className="text-sm text-text-muted mt-1 font-medium">Managers: Signal readiness for fund transfer to Head Office</p>
                </div>
            </div>

            <div className="bg-card rounded-2xl border border-border-default p-4 shadow-sm">
                <div className="relative w-full max-w-md">
                    <Search className="w-4 h-4 text-text-muted opacity-50 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by contract no, customer name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-input border border-border-input rounded-xl outline-none focus:ring-2 transition-all text-sm text-text-primary"
                        style={{ '--tw-ring-color': `${colors.primary[500]}20` } as any}
                    />
                </div>
            </div>

            {loading ? (
                <div className="bg-card rounded-2xl border border-border-default min-h-[400px] flex items-center justify-center">
                    <BMSLoader message="Loading request queue..." />
                </div>
            ) : loans.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border-default min-h-[400px] flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <Clock className="w-8 h-8 text-text-muted opacity-20" />
                    </div>
                    <h3 className="text-lg font-bold text-text-primary">All Clear</h3>
                    <p className="text-sm text-text-muted max-w-xs mx-auto">No activated loans are currently awaiting Dispayment.</p>
                </div>
            ) : (
                <div className="bg-card rounded-2xl border border-border-default overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-muted/50 border-b border-border-divider">
                                <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Contract / ID</th>
                                <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Customer</th>
                                <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Activated At</th>
                                <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Amount</th>
                                <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-divider font-medium">
                            {loans.map((loan) => (
                                <tr key={loan.id} className="hover:bg-hover transition-all">
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-black text-text-primary">{loan.contract_number}</div>
                                        <div className="text-[10px] text-text-muted uppercase mt-0.5 tracking-tighter">ID: {loan.loan_id}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-bold text-text-primary">{loan.customer?.full_name}</div>
                                        <div className="text-[10px] text-text-muted mt-0.5 tracking-tighter">{loan.customer?.customer_code}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs text-text-secondary">
                                            {loan.activation_date ? new Date(loan.activation_date).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-black text-text-primary">{formatCurrency(loan.approved_amount)}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end">
                                            <button
                                                onClick={() => setConfirmModal({ isOpen: true, loanId: loan.id })}
                                                disabled={processingId === loan.id}
                                                className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl hover:bg-primary-700 transition-all shadow-sm disabled:opacity-50 font-bold text-[10px] uppercase tracking-widest"
                                                style={{ backgroundColor: colors.primary[600] }}
                                            >
                                                {processingId === loan.id ? (
                                                    <span className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />
                                                ) : (
                                                    <Send className="w-4 h-4" />
                                                )}
                                                <span>Dispayment</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    <Pagination
                        currentPage={currentPage}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={(newSize) => {
                            setItemsPerPage(newSize);
                            setCurrentPage(1);
                        }}
                        itemName="loans"
                    />
                </div>
            )}
            <ActionConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, loanId: null })}
                onConfirm={handleRequestTransfer}
                title="Dispayment"
                message="Are you sure you want to request fund transfer for this loan? This will send it to the final payout queue."
                confirmLabel="Dispayment"
                variant="primary"
            />
        </div>
    );
}
