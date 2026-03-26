'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { X, Printer } from 'lucide-react';
import { numberToWords } from '@/utils/numberToWords';
import { receiptService } from '@/services/receipt.service';
import { toast } from 'react-toastify';

interface ReceiptPrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    receipt: any;
    onPrinted?: () => void;
}

export function ReceiptPrintModal({ isOpen, onClose, receipt, onPrinted }: ReceiptPrintModalProps) {
    if (!isOpen || !receipt) return null;

    const printTime = new Date();
    const formattedDate = printTime.toLocaleDateString('en-GB');
    const formattedTime = printTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    const handlePrint = async () => {
        try {
            await receiptService.markPrinted(receipt.id);
            window.print();
            if (onPrinted) onPrinted();
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Failed to mark as printed");
        }
    };

    const amount = Number(receipt.current_due_amount || 0);
    const rupees = Math.floor(amount);
    const cents = Math.round((amount - rupees) * 100);
    const centsInWords = cents === 0 ? 'zero cents' : `${numberToWords(cents).toLowerCase()} cents`;
    const amountInWords = `(**${numberToWords(rupees).toLowerCase()} rupees and ${centsInWords} only**)`;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: auto;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #printable-receipt-container, #printable-receipt-container * {
                        visibility: visible;
                    }
                    #printable-receipt-container {
                        position: absolute;
                        left: 50% !important;
                        top: 20px !important;
                        transform: translateX(-50%) !important;
                        width: 550px !important;
                        background: white !important;
                        margin: 0 !important;
                        padding: 30px !important;
                        border: 1px solid #eee !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="bg-card w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-border-default">
                {/* Modal Header */}
                <div className="px-8 py-5 border-b border-border-divider flex justify-between items-center bg-muted-bg/50 backdrop-blur-xl no-print">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-500/10 rounded-xl">
                            <Printer className="w-5 h-5 text-primary-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-text-primary tracking-tight">Receipt Preview</h3>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-none mt-1">Ready for printing</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-hover rounded-full transition-all text-text-secondary group">
                        <X className="w-5 h-5 transition-transform group-hover:rotate-90" />
                    </button>
                </div>

                {/* Scrollable Document Area */}
                <div className="flex-1 overflow-y-auto p-10 bg-app-background custom-scrollbar flex justify-center items-start">
                    <div
                        id="printable-receipt-container"
                        className="bg-white w-[550px] p-10 shadow-xl relative text-[#1a1a1a] border border-gray-100"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                        {/* Watermark Logo */}
                        <img
                            src="/bms_logo.png"
                            className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] opacity-[0.04] pointer-events-none select-none z-0"
                            alt=""
                        />

                        <div className="relative z-10 w-full">
                            {/* Header Logo */}
                            <div className="text-center mb-6">
                                <img src="/bms_logo.png" className="w-[320px] mx-auto" alt="BMS LOGO" />
                            </div>

                            <div className="border-t-[1px] border-dashed border-gray-400 my-5"></div>

                            {/* Info Section */}
                            <div className="space-y-2 text-[13px] leading-relaxed">
                                <div className="flex">
                                    <div className="w-32 text-gray-600">Receipt No</div>
                                    <div className="w-5">:</div>
                                    <div className="font-bold">{receipt.receipt_id}</div>
                                </div>
                                <div className="flex">
                                    <div className="w-32 text-gray-600">Receipt Date</div>
                                    <div className="w-5">:</div>
                                    <div className="font-bold">{formattedDate}</div>
                                </div>
                                <div className="flex">
                                    <div className="w-32 text-gray-600">Receipt Time</div>
                                    <div className="w-5">:</div>
                                    <div className="font-bold">{formattedTime}</div>
                                </div>
                                <div className="flex">
                                    <div className="w-32 text-gray-600">Branch Name</div>
                                    <div className="w-5">:</div>
                                    <div className="font-bold uppercase">{receipt.center?.branch?.branch_name || receipt.branch?.branch_name || 'Head Office'}</div>
                                </div>
                                <div className="flex">
                                    <div className="w-32 text-gray-600">Payment Type</div>
                                    <div className="w-5">:</div>
                                    <div className="font-bold uppercase">{receipt.receipt_type === 'Investment' ? 'RENTAL / INVESTMENT' : receipt.receipt_type}</div>
                                </div>
                                <div className="flex">
                                    <div className="w-32 text-gray-600">Contract No</div>
                                    <div className="w-5">:</div>
                                    <div className="font-bold uppercase">{receipt.loan?.contract_number || receipt.investment?.transaction_id || 'N/A'}</div>
                                </div>
                            </div>

                            <div className="mt-8 mb-8 text-center px-4">
                                <p className="text-[15px] font-medium">Received a sum of Rs {amount.toLocaleString()}</p>
                                <p className="text-[13px] font-bold mt-1 text-blue-600 italic">{amountInWords}</p>
                            </div>

                            <div className="flex text-[14px] items-start">
                                <div className="w-32 text-gray-600">From</div>
                                <div className="w-5">:</div>
                                <div className="flex-1 font-bold uppercase leading-snug">
                                    {receipt.customer?.full_name ? (
                                        <>
                                            {receipt.customer.full_name}<br />
                                            {receipt.customer?.address_line_1 && <span>{receipt.customer.address_line_1}, </span>}
                                            {receipt.customer?.address_line_2 && <span>{receipt.customer.address_line_2}<br /></span>}
                                            {receipt.customer?.city && <span>{receipt.customer.city}</span>}
                                        </>
                                    ) : (
                                        <span>{receipt.branch?.branch_name || receipt.staff?.branch?.branch_name || 'HEAD OFFICE'}</span>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 space-y-2 text-[13px]">
                                <div className="flex">
                                    <div className="w-32 text-gray-600">Paid Amount</div>
                                    <div className="w-5">:</div>
                                    <div className="font-black text-[15px]">{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                </div>
                                <div className="flex">
                                    <div className="w-32 text-gray-600">Payment Method</div>
                                    <div className="w-5">:</div>
                                    <div className="font-bold">Cash</div>
                                </div>

                                <div className="pt-8 flex">
                                    <div className="w-32 text-gray-600">Cashier</div>
                                    <div className="w-5">:</div>
                                    <div className="font-bold uppercase">{receipt.staff?.full_name || receipt.staff?.name || 'Authorized Member'}</div>
                                </div>
                            </div>

                            <div className="pt-8">
                                <div className="border-t-[1px] border-dashed border-gray-400 mb-8"></div>

                                <div className="flex justify-between items-end text-[10px] text-gray-500 leading-relaxed gap-4">
                                    <div className="flex-1 min-w-0">
                                        City Office: No 06, 1st Floor Main Street Chankanai, Jaffna.<br />
                                        Tel : 021 222 35 56<br />
                                        website: www.bmscapital.lk<br />
                                        email: info@bmscapital.lk
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-[24px] font-serif text-gray-800 font-bold opacity-80 block leading-tight">
                                            {receipt.receipt_id}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 text-center">
                                    <p className="text-[8.5px] font-medium text-gray-400 max-w-[480px] mx-auto leading-tight italic">
                                        BMS Capital Solutions (pvt) ltd, On this day has been incorporated as a Private Company With Limited Liability
                                        having complied with the requirements of the Companies Act No 7 of 2007.
                                        Given under my hand at Colombo, on this Twenty Fifth day of November Two Thousand Twenty Four.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-card border-t border-border-divider flex gap-4 no-print">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 bg-muted-bg text-text-secondary rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-hover transition-all"
                    >
                        Close Preview
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-[2] py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary-500/20 hover:bg-primary-500 transition-all flex items-center justify-center gap-3"
                    >
                        <Printer size={18} />
                        Trigger Official Print
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
