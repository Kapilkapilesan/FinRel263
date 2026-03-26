'use client';

import React, { useEffect, useState } from 'react';
import { collectionService } from '@/services/collection.service';
import { PaymentHistoryItem } from '@/services/collection.types';
import { authService } from '@/services/auth.service';
import { toast } from 'react-toastify';
import { Printer, RotateCcw, CheckCircle2, Trash2, AlertCircle, Clock, FileText } from 'lucide-react';
import { ReceiptPreviewModal } from '@/components/collections/ReceiptPreviewModal';
import { ScheduledPayment } from '@/services/collection.types';

interface Props {
    loanId: string;
}

export function LoanPaymentHistory({ loanId }: Props) {
    const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [requestingCancelId, setRequestingCancelId] = useState<number | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showReceiptPreview, setShowReceiptPreview] = useState(false);
    const [previewData, setPreviewData] = useState<{ customer: ScheduledPayment; receiptData: any } | null>(null);

    const isManager = authService.hasPermission('receipts.approvecancel');

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const data = await collectionService.getPaymentHistory(loanId);
            // Filter to show only unique receipts (Ledger might have multiple entries for one receipt, but we want the high-level history)
            const receiptHistory = data.filter(item => item.receipt);
            setHistory(receiptHistory);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load payment history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [loanId]);

    const handleRequestCancellation = async (receiptId: number) => {
        if (!cancelReason.trim()) {
            toast.warn("Please provide a reason for cancellation");
            return;
        }

        setIsProcessing(true);
        try {
            await collectionService.requestReceiptCancellation(receiptId, cancelReason);
            toast.success('Cancellation request sent to manager');
            setCancelReason('');
            setRequestingCancelId(null);
            fetchHistory();
        } catch (error: any) {
            toast.error(error.message || 'Failed to request cancellation');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApproveCancel = async (receiptId: number) => {
        if (!window.confirm('Are you sure you want to approve this cancellation? This will revert the loan balance and schedule.')) return;

        try {
            setIsProcessing(true);
            await collectionService.approveReceiptCancellation(receiptId);
            toast.success('Payment successfully cancelled and balance reverted');
            fetchHistory();
        } catch (error: any) {
            toast.error(error.message || 'Failed to approve cancellation');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleViewReceipt = (item: any) => {
        const scheduledPayment: ScheduledPayment = {
            id: loanId,
            customer: item.customer?.full_name || item.receipt?.customer?.full_name || 'N/A',
            customerId: item.customer?.id || item.receipt?.customer?.id,
            customerCode: item.customer?.customer_code || item.receipt?.customer?.customer_code || 'N/A',
            contractNo: item.receipt?.loan?.loan_id || 'N/A',
            dueAmount: 0,
            standardRental: item.rental_amount || 0,
            arrears: item.arrears || 0,
            suspense_balance: 0,
            group: item.receipt?.group?.group_name || 'N/A',
            center_name: item.receipt?.center?.center_name || 'N/A',
            outstanding: item.current_balance_amount || 0,
            rentel: item.rental_amount || 0,
            address: 'N/A',
            nic: item.customer?.customer_code || item.receipt?.customer?.customer_code || 'N/A',
            center_id: item.receipt?.center?.CSU_id || item.receipt?.center_id || 'N/A',
            totalPayable: item.total_due || 0,
        };

        const receiptData = {
            payment: item,
            receipt: item.receipt,
            loan: item.receipt?.loan,
            // For payment history, total_due represents the original amount due before this payment
            originalDueAmount: item.total_due || (item.rental_amount + item.arrears + (item.penalty_amount - item.penalty_paid)) || 0
        };

        setPreviewData({
            customer: scheduledPayment,
            receiptData: receiptData
        });
        setShowReceiptPreview(true);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4 bg-card rounded-[2rem] border border-border-divider shadow-sm">
                <div className="w-12 h-12 border-4 border-primary-500/10 border-t-primary-600 rounded-full animate-spin" />
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60">Synchronizing Ledger...</p>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="text-center py-24 bg-muted rounded-[2rem] border border-dashed border-border-divider">
                <FileText className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-20" />
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60">No payment records found for this portfolio.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="space-y-6">
                {history.map((item) => (
                    <div
                        key={item.id}
                        className={`relative bg-card rounded-2xl border transition-all duration-300 shadow-sm ${item.receipt?.status === 'cancelled'
                            ? 'border-border-divider opacity-60 grayscale-[0.5]'
                            : 'border-border-default hover:border-primary-500/30'
                            }`}
                    >
                        {/* Header Section */}
                        <div className="p-6 border-b border-border-divider">
                            <div className="flex flex-col lg:flex-row justify-between gap-6">
                                <div className="flex items-start gap-5">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${item.receipt?.status === 'cancelled' ? 'bg-muted text-text-muted' :
                                        item.receipt?.status === 'cancellation_pending' ? 'bg-amber-500/10 text-amber-600' :
                                            'bg-primary-500/10 text-primary-600'
                                        }`}>
                                        <RotateCcw className={item.receipt?.status === 'cancellation_pending' ? 'animate-spin-slow' : ''} size={28} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-4 flex-wrap">
                                            <span className="text-2xl font-black text-text-primary tracking-tighter uppercase">
                                                LKR {Number(item.last_payment_amount).toLocaleString()}
                                            </span>

                                            {item.receipt?.status === 'cancellation_pending' && (
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-amber-500/20">
                                                    <Clock size={10} />
                                                    Cancellation Pending
                                                </div>
                                            )}

                                            {item.receipt?.status === 'cancelled' && (
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-red-500/20">
                                                    <Trash2 size={10} />
                                                    Reversed / Void
                                                </div>
                                            )}

                                            {item.receipt?.status === 'active' && (
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-primary-500/10 text-primary-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-primary-500/20">
                                                    <CheckCircle2 size={10} />
                                                    Confirmed
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mt-2 opacity-60">
                                            <span>{new Date(item.last_payment_date).toLocaleDateString()}</span>
                                            <span className="opacity-30">•</span>
                                            <span className="text-primary-600">RCPT: {item.receipt?.receipt_id}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3">
                                    {item.receipt?.status === 'active' && (
                                        <>
                                            <button
                                                onClick={() => setRequestingCancelId(requestingCancelId === item.receipt?.id ? null : item.receipt?.id || null)}
                                                className="px-5 py-2.5 bg-muted border border-border-divider text-text-muted rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-hover active:scale-95 transition-all"
                                            >
                                                Request Void
                                            </button>
                                            <button
                                                onClick={() => handleViewReceipt(item)}
                                                className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-primary-500/20"
                                            >
                                                <Printer size={12} />
                                                View Receipt
                                            </button>
                                        </>
                                    )}

                                    {item.receipt?.status === 'cancellation_pending' && isManager && (
                                        <button
                                            disabled={isProcessing}
                                            onClick={() => item.receipt && handleApproveCancel(item.receipt.id)}
                                            className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all disabled:opacity-50"
                                        >
                                            {isProcessing ? 'Processing...' : 'Approve Void'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Inline Cancellation Form */}
                            {requestingCancelId === item.receipt?.id && (
                                <div className="mt-8 p-6 bg-red-500/5 rounded-2xl border border-red-500/20 animate-in zoom-in-95 duration-200">
                                    <div className="flex items-center gap-2 text-red-600 mb-4">
                                        <AlertCircle size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Reason for Cancellation</span>
                                    </div>
                                    <textarea
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        className="w-full h-24 p-5 bg-card border border-border-divider rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all resize-none"
                                        placeholder="Explain why this receipt must be voided (e.g., Error in amount, Customer return...)"
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-3 mt-4">
                                        <button
                                            onClick={() => setRequestingCancelId(null)}
                                            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            disabled={isProcessing || !cancelReason.trim()}
                                            onClick={() => item.receipt && handleRequestCancellation(item.receipt.id)}
                                            className="px-6 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-30"
                                        >
                                            {isProcessing ? 'Processing' : 'Submit for Reversal'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Financial Breakdown */}
                        <div className="grid grid-cols-2 divide-x divide-border-divider bg-muted py-1 px-4 transition-colors">
                            <div className="px-5 py-1">
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-1 opacity-60 italic">outstanding Balance</p>
                                <p className="text-sm font-black text-primary-600">LKR {Number(item.current_balance_amount).toLocaleString()}</p>
                            </div>
                            <div className="px-5 py-1">
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-1 opacity-60 italic">Arrears Status</p>
                                <p className={`text-sm font-black ${item.arrears > 0 ? 'text-red-500' : 'text-primary-600'}`}>
                                    {item.arrears > 0 ? `LKR ${Number(item.arrears).toLocaleString()}` : (item.receipt?.status === 'cancelled' ? 'VOIDED' : 'SETTLED')}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-4 bg-primary-500/5 p-5 rounded-2xl border border-primary-500/10 transition-colors">
                <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center text-primary-600 shrink-0 border border-primary-500/20">
                    <span className="font-black">!</span>
                </div>
                <p className="text-[10px] font-bold text-primary-600 dark:text-primary-400 leading-relaxed uppercase tracking-widest">
                    Voiding a receipt will automatically restore the loan outstanding balance and revert the repayment schedule to its prior state. Both the customer and field officer will be notified via SMS.
                </p>
            </div>

            {/* Receipt Preview Modal */}
            {previewData && (
                <ReceiptPreviewModal
                    isOpen={showReceiptPreview}
                    customer={previewData.customer}
                    paymentAmount={previewData.receiptData.payment.last_payment_amount.toString()}
                    receiptData={previewData.receiptData}
                    onClose={() => setShowReceiptPreview(false)}
                    onPrint={() => window.print()}
                />
            )}
        </div>
    );
}
