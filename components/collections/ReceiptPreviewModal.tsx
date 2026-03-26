
import React, { useEffect, useState } from 'react';
import { X, Check, Printer, Download } from 'lucide-react';
import { colors } from '@/themes/colors';
import { ScheduledPayment } from '../../services/collection.types';
import { authService } from '../../services/auth.service';

interface ReceiptPreviewModalProps {
    isOpen: boolean;
    customer: ScheduledPayment | null;
    paymentAmount: string;
    receiptData?: any;
    onClose: () => void;
    onPrint: () => void;
}

export function ReceiptPreviewModal({ isOpen, customer, paymentAmount, receiptData, onClose, onPrint }: ReceiptPreviewModalProps) {
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const user = authService.getCurrentUser();
        setCurrentUser(user);
    }, []);

    if (!isOpen || !customer) return null;

    const receiptNo = receiptData?.receipt?.receipt_id || `RCT-${new Date().getTime()}`;
    const paymentDate = receiptData?.receipt?.created_at
        ? new Date(receiptData.receipt.created_at)
        : (receiptData?.payment?.last_payment_date ? new Date(receiptData.payment.last_payment_date) : new Date());

    // Format date and time
    const formattedDate = paymentDate.toLocaleDateString();
    const formattedTime = paymentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const balance = receiptData?.payment?.current_balance_amount ?? (customer.outstanding - parseFloat(paymentAmount));

    // Try to get center ID and NIC from receiptData or customer
    const rawCenterId = receiptData?.receipt?.center?.CSU_id ||
        receiptData?.loan?.center?.CSU_id ||
        customer.center_id ||
        'N/A';

    const rawNic = receiptData?.receipt?.customer?.customer_code ||
        receiptData?.loan?.customer?.customer_code ||
        customer.nic ||
        'N/A';

    const formatNIC = (val: string) => {
        if (!val || val === 'N/A') return 'N/A';
        // Mask NIC: Keep first 4 and last 4 chars, mask the middle with ****
        if (val.length < 9) return val;
        return val.substring(0, 4) + '****' + val.substring(val.length - 4);
    };

    const maskedNic = formatNIC(rawNic);

    // Financials Breakdown using Balance Sheet logic (+ is advance, - is debt)
    const preArrears = receiptData?.receipt?.arrears_snapshot !== undefined && receiptData?.receipt?.arrears_snapshot !== null
        ? parseFloat(receiptData.receipt.arrears_snapshot)
        : (receiptData?.originalArrears || 0);

    const todayOwed = receiptData?.receipt?.current_due !== undefined && receiptData?.receipt?.current_due !== null
        ? parseFloat(receiptData.receipt.current_due)
        : (receiptData?.originalDue || 0);

    const paidAmount = parseFloat(paymentAmount) || 0;

    // Simplified math: snapshot already includes today's target dues.
    // Result (Debt(+) / Advance(-)) = (Snapshot Balance) - (Paid Amount)
    const postPaymentArrearsBalance = preArrears - paidAmount;

    const rentalAmount = todayOwed || customer.standardRental || 0;

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 sm:p-8 animate-in fade-in duration-300">
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-receipt, #printable-receipt * {
                        visibility: visible;
                    }
                    #printable-receipt {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                        background: white;
                        color: black;
                    }
                    /* Ensure thermal printer width if needed, or just let it flow */
                    @page {
                        margin: 0;
                        size: auto;
                    }
                }
            `}</style>

            <div className="bg-card rounded-[2.5rem] max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[95vh] flex flex-col my-auto border border-border-default">
                {/* Header - Fixed */}
                <div className="px-6 py-4 border-b border-border-divider flex items-center justify-between bg-muted-bg/50 backdrop-blur-xl">
                    <h2 className="text-lg font-bold text-text-primary tracking-tight">Receipt Preview</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-hover rounded-full transition-all text-text-secondary hover:rotate-90 duration-300"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-app-background flex justify-center">
                    <div className="bg-white text-black p-4 shadow-sm max-w-[320px] w-full text-[12px] font-mono leading-tight" id="printable-receipt">
                        {/* Receipt Content - Styled for Thermal Printer */}

                        {/* Logo / Header Section */}
                        <div className="flex items-center gap-3 mb-4 border-b-2 border-dashed border-gray-300 pb-4">
                            <img src="/bms-logo.png" alt="BMS Logo" className="w-12 h-12 object-contain" />
                            <div className="text-left">
                                <h1 className="text-xl font-black mb-0 leading-none">FINCORE</h1>
                                <p className="text-[10px] uppercase font-bold text-gray-600">BMS Details</p>
                            </div>
                        </div>

                        <div className="text-center border-b-2 border-dashed border-gray-300 pb-2 mb-2">
                            <p className="font-bold uppercase text-[14px]">Original Receipt</p>
                        </div>

                        {/* Date & Time */}
                        <div className="flex justify-between mb-2">
                            <span>Date: {formattedDate}</span>
                            <span>Time: {formattedTime}</span>
                        </div>

                        {/* Receipt Details Table */}
                        <div className="space-y-1.5 border-b-2 border-dashed border-gray-300 pb-3 mb-3">
                            <div className="grid grid-cols-[100px_1fr]">
                                <span className="font-semibold">Receipt No:</span>
                                <span className="text-right">{receiptNo}</span>
                            </div>
                            <div className="grid grid-cols-[100px_1fr]">
                                <span className="font-semibold">CSU No:</span>
                                <span className="text-right">{rawCenterId}</span>
                            </div>
                            <div className="grid grid-cols-[100px_1fr]">
                                <span className="font-semibold">CSU Name:</span>
                                <span className="text-right truncate">{customer.center_name}</span>
                            </div>
                            <div className="grid grid-cols-[100px_1fr]">
                                <span className="font-semibold">Group No:</span>
                                <span className="text-right">
                                    {receiptData?.loan?.group?.group_name ||
                                        receiptData?.receipt?.allocations?.[0]?.group_name ||
                                        customer.group ||
                                        'N/A'}
                                </span>
                            </div>
                            <div className="grid grid-cols-[100px_1fr]">
                                <span className="font-semibold">Customer:</span>
                                <span className="text-right font-bold w-full break-words text-right">{customer.customer}</span>
                            </div>
                            <div className="grid grid-cols-[100px_1fr]">
                                <span className="font-semibold">NIC:</span>
                                <span className="text-right">{maskedNic}</span>
                            </div>
                            <div className="grid grid-cols-[100px_1fr]">
                                <span className="font-semibold">Contract No:</span>
                                <span className="text-right">{customer.contractNo}</span>
                            </div>
                        </div>

                        {/* Financials */}
                        <div className="space-y-1.5 border-b-2 border-dashed border-gray-300 pb-3 mb-3 font-bold">
                            <div className="grid grid-cols-[120px_1fr]">
                                <span>Paid Amount:</span>
                                <span className="text-right text-[14px]">
                                    {parseFloat(paymentAmount).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="grid grid-cols-[120px_1fr] font-normal">
                                <span>Rental Amount:</span>
                                <span className="text-right">
                                    {rentalAmount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="grid grid-cols-[120px_1fr] font-normal">
                                <span>Arrears:</span>
                                <span className="text-right">
                                    {Math.max(todayOwed - paidAmount, 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="grid grid-cols-[120px_1fr] font-normal">
                                <span>Full Balance:</span>
                                <span className="text-right">
                                    {balance.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                        {/* User & Footer */}
                        <div className="text-center space-y-3 mt-4">
                            <p className="text-left text-[10px]">
                                <span className="font-semibold">Print User:</span> {currentUser?.name || currentUser?.full_name || 'Staff'}
                            </p>

                            <div className="pt-2">
                                <p className="text-[10px] leading-tight text-gray-600 mb-2">
                                    This is an automatically generated invoice and does not need stamp of signature
                                </p>
                                <p className="text-[11px] font-bold">
                                    Any Clarification 021 222 35 56
                                </p>
                            </div>
                            <div className="pt-2">
                                <p className="text-[10px] text-gray-400">Powered by FINCORE</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions - Fixed */}
                <div className="p-6 bg-card border-t border-border-divider flex flex-col gap-3">
                    <button
                        onClick={onPrint}
                        className="w-full py-3 text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700"
                        style={{ boxShadow: `0 10px 15px -3px ${colors.primary[600]}33` }}
                    >
                        <Printer size={18} />
                        Print Receipt
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-3 text-text-secondary hover:bg-hover rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all"
                    >
                        Close Preview
                    </button>
                </div>
            </div>
        </div>
    );
}
