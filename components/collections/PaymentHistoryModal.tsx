'use client'

import React, { useState, useEffect } from 'react';
import { X, Printer, History as HistoryIcon, Calendar, DollarSign, AlertCircle, Trash2, CheckCircle2, RotateCcw } from 'lucide-react';
import { colors } from '@/themes/colors';
import { ScheduledPayment, PaymentHistoryItem } from '../../services/collection.types';
import { collectionService } from '../../services/collection.service';
import { authService } from '../../services/auth.service';
import { toast } from 'react-toastify';

import { ActionConfirmModal } from '../common/ActionConfirmModal';

interface PaymentHistoryModalProps {
    isOpen: boolean;
    customer: ScheduledPayment | null;
    onClose: () => void;
    onPrintReceipt: (payment: any) => void;
}

export function PaymentHistoryModal({ isOpen, customer, onClose, onPrintReceipt }: PaymentHistoryModalProps) {
    const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [requestingCancelId, setRequestingCancelId] = useState<number | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmLabel: string;
        variant: 'success' | 'danger' | 'warning';
        onConfirm: () => Promise<void>;
    }>({
        isOpen: false,
        title: '',
        message: '',
        confirmLabel: '',
        variant: 'success',
        onConfirm: async () => { }
    });

    useEffect(() => {
        if (isOpen && customer) {
            fetchHistory();
        }
    }, [isOpen, customer]);

    const fetchHistory = async () => {
        if (!customer) return;
        setIsLoading(true);
        try {
            const data = await collectionService.getPaymentHistory(customer.id);
            setHistory(data);
        } catch (error) {
            console.error('Failed to fetch payment history', error);
            toast.error('Failed to load payment history');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRequestCancellation = async (id: number) => {
        if (!cancelReason.trim()) {
            toast.warn("Please provide a reason for cancellation");
            return;
        }

        setIsProcessing(true);
        try {
            await collectionService.requestReceiptCancellation(id, cancelReason);
            toast.success("Cancellation request submitted");
            setCancelReason('');
            setRequestingCancelId(null);
            fetchHistory();
        } catch (err: any) {
            toast.error(err.message || "Failed to submit request");
        } finally {
            setIsProcessing(false);
        }
    };

    const isManagerOrAdmin = authService.hasPermission('receipts.approvecancel');

    if (!isOpen || !customer) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-card rounded-[2.5rem] shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden border border-border-default flex flex-col">
                    {/* Header */}
                    <div
                        className="px-8 py-6 border-b border-border-divider flex items-center justify-between rounded-t-[2.5rem]"
                        style={{ backgroundImage: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[500]}, ${colors.indigo[600]})` }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xl border border-white/20 shadow-2xl flex items-center justify-center">
                                <HistoryIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white tracking-tight leading-none uppercase mb-1.5">Payment Ledger</h2>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-90 text-white/90">
                                    <span>{customer.customer}</span>
                                    <span className="text-white/50">•</span>
                                    <span>{customer.contractNo}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all group active:scale-90 text-white"
                        >
                            <X className="w-5 h-5 transition-all group-hover:rotate-90" />
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4">
                                <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: colors.primary[600], borderTopColor: 'transparent' }}></div>
                                <p className="text-[10px] font-black uppercase tracking-widest animate-pulse" style={{ color: colors.primary[600] }}>Synchronizing Ledger...</p>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-6 opacity-30">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                                    <HistoryIcon size={40} className="text-gray-400" />
                                </div>
                                <p className="text-sm font-black text-gray-500 uppercase tracking-[0.2em]">Zero Transaction Found</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {history.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`relative bg-white rounded-2xl border transition-all duration-300 ${item.receipt?.status === 'cancelled'
                                            ? 'border-gray-200 opacity-75 grayscale-[0.5]'
                                            : 'border-gray-100 shadow-sm hover:shadow-md'
                                            }`}
                                        style={item.receipt?.status !== 'cancelled' ? { '--hover-border-color': colors.primary[300] } as any : {}}
                                        onMouseEnter={(e) => {
                                            if (item.receipt?.status !== 'cancelled') {
                                                e.currentTarget.style.borderColor = colors.primary[300];
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (item.receipt?.status !== 'cancelled') {
                                                e.currentTarget.style.borderColor = '';
                                            }
                                        }}
                                    >
                                        {/* Item Header */}
                                        <div className="p-3.5 border-b border-gray-50">
                                            <div className="flex flex-col lg:flex-row justify-between gap-4">
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 ${item.receipt?.status === 'cancelled' ? 'bg-gray-100 text-gray-400' : ''
                                                        }`} style={item.receipt?.status !== 'cancelled' ? { backgroundColor: `${colors.primary[600]}15`, color: colors.primary[600] } : {}}>
                                                        <DollarSign size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-xl font-black text-gray-900 tracking-tighter">
                                                                LKR {item.last_payment_amount.toLocaleString()}
                                                            </span>

                                                            {item.receipt?.status === 'cancellation_pending' && (
                                                                <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-wider rounded-md border border-amber-100 animate-pulse">
                                                                    <RotateCcw size={10} className="animate-spin-slow" />
                                                                    Cancellation Pending
                                                                </div>
                                                            )}

                                                            {item.receipt?.status === 'cancelled' && (
                                                                <div className="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-wider rounded-md border border-red-100">
                                                                    <Trash2 size={10} />
                                                                    Receipt Cancelled
                                                                </div>
                                                            )}

                                                            {item.receipt?.status === 'active' && (
                                                                <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-wider rounded-md border border-blue-100">
                                                                    <CheckCircle2 size={10} />
                                                                    Confirmed
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                                            <Calendar size={12} className="text-gray-300" />
                                                            {new Date(item.last_payment_date).toLocaleDateString(undefined, {
                                                                weekday: 'short',
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Top Actions */}
                                                <div className="flex flex-wrap gap-2 h-fit">
                                                    {item.receipt && item.receipt.status === 'active' && !isManagerOrAdmin && (
                                                        <>
                                                            <button
                                                                onClick={() => onPrintReceipt(item)}
                                                                className="px-4 py-2 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-lg active:scale-95"
                                                                style={{ backgroundColor: colors.primary[600], boxShadow: `0 10px 15px -3px ${colors.primary[600]}33` }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.backgroundColor = colors.primary[700];
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.backgroundColor = colors.primary[600];
                                                                }}
                                                            >
                                                                <Printer size={14} />
                                                                Print Receipt
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setRequestingCancelId(requestingCancelId === item.receipt?.id ? null : item.receipt?.id || null);
                                                                    setCancelReason('');
                                                                }}
                                                                className={`px-4 py-2 border rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${requestingCancelId === item.receipt?.id
                                                                    ? 'bg-red-50 border-red-200 text-red-600'
                                                                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                Request Cancel
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Manager Controls */}
                                                    {item.receipt && item.receipt.status === 'cancellation_pending' &&
                                                        authService.hasPermission('receipts.approvecancel') && (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setConfirmModal({
                                                                            isOpen: true,
                                                                            title: 'Approve Cancellation',
                                                                            message: 'This will permanently reverse these balances and restore the previous state. Are you sure?',
                                                                            confirmLabel: 'Approve & Reverse',
                                                                            variant: 'success',
                                                                            onConfirm: async () => {
                                                                                await collectionService.approveReceiptCancellation(item.receipt!.id);
                                                                                toast.success("Cancellation approved successfully");
                                                                                fetchHistory();
                                                                            }
                                                                        });
                                                                    }}
                                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/10"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setConfirmModal({
                                                                            isOpen: true,
                                                                            title: 'Reject Request',
                                                                            message: 'Dismiss this cancellation request and keep the receipt active?',
                                                                            confirmLabel: 'Reject Request',
                                                                            variant: 'danger',
                                                                            onConfirm: async () => {
                                                                                await collectionService.rejectReceiptCancellation(item.receipt!.id);
                                                                                toast.success("Request rejected");
                                                                                fetchHistory();
                                                                            }
                                                                        });
                                                                    }}
                                                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        )}
                                                </div>
                                            </div>

                                            {/* Cancellation Request Section */}
                                            {requestingCancelId === item.receipt?.id && (
                                                <div className="mt-4 p-4 bg-red-50/50 rounded-xl border border-red-100 animate-in zoom-in-95 duration-200">
                                                    <div className="flex items-center gap-2 text-red-600 mb-2">
                                                        <AlertCircle size={14} />
                                                        <span className="text-[10px] font-black uppercase tracking-wider">Reason for Cancellation</span>
                                                    </div>
                                                    <textarea
                                                        value={cancelReason}
                                                        onChange={(e) => setCancelReason(e.target.value)}
                                                        className="w-full h-20 p-3 bg-white border border-red-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300 transition-all placeholder:text-gray-300"
                                                        placeholder="Specify the reason why this transaction must be voided..."
                                                        autoFocus
                                                    />
                                                    <div className="flex justify-end gap-2 mt-3">
                                                        <button
                                                            onClick={() => setRequestingCancelId(null)}
                                                            className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600"
                                                        >
                                                            Discard
                                                        </button>
                                                        <button
                                                            disabled={isProcessing || !cancelReason.trim()}
                                                            onClick={() => handleRequestCancellation(item.receipt!.id)}
                                                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-30 shadow-lg shadow-red-500/10"
                                                        >
                                                            {isProcessing ? 'Processing' : 'Submit Reversal Request'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Breakdown Section */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-50 bg-gray-50/20 py-2.5 px-2">
                                            <div className="px-4 py-1.5">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 opacity-70">Capital Collected</p>
                                                <p className="text-sm font-bold text-gray-700">LKR {(item.last_payment_amount - item.interest_amount).toLocaleString()}</p>
                                            </div>
                                            <div className="px-4 py-1.5">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 opacity-70">Interest Share</p>
                                                <p className="text-sm font-bold text-gray-700">LKR {item.interest_amount.toLocaleString()}</p>
                                            </div>
                                            <div className="px-4 py-1.5">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 opacity-70">Loan Balance</p>
                                                <p className="text-sm font-black" style={{ color: colors.primary[600] }}>LKR {item.current_balance_amount.toLocaleString()}</p>
                                            </div>
                                            <div className="px-4 py-1.5">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 opacity-70">Arrears Impact</p>
                                                <p className={`text-sm font-black ${item.arrears > 0 ? 'text-red-500' : 'text-blue-600'}`}>
                                                    {item.arrears > 0 ? `LKR ${item.arrears.toLocaleString()}` : 'CLEARED'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-white rounded-b-[2.5rem]">
                        <button
                            onClick={onClose}
                            className="px-8 py-2.5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-gray-200 active:scale-95"
                        >
                            Close Ledger
                        </button>
                    </div>
                </div>
            </div>

            <ActionConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmLabel={confirmModal.confirmLabel}
                variant={confirmModal.variant}
            />
        </>
    );
}
