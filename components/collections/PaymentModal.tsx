
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { colors } from '@/themes/colors';
import { ScheduledPayment } from '../../services/collection.types';

interface PaymentModalProps {
    isOpen: boolean;
    customer: ScheduledPayment | null;
    onClose: () => void;
    onProcessPayment: (amount: string, type: 'full' | 'partial', method: string, remarks: string) => void;
    isProcessing?: boolean;
}

export function PaymentModal({ isOpen, customer, onClose, onProcessPayment, isProcessing = false }: PaymentModalProps) {
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [remarks, setRemarks] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (customer && isOpen) {
            setPaymentAmount(String(customer.totalPayable ?? 0));
            setPaymentType('full');
            setPaymentMethod('cash');
            setRemarks('');
            setError(null);
        }
    }, [customer, isOpen]);

    if (!isOpen || !customer) return null;

    const handleProcess = () => {
        const amount = parseFloat(paymentAmount);

        if (isNaN(amount) || amount <= 0) {
            setError('Please enter a valid amount greater than 0.');
            return;
        }

        if (amount > (customer.outstanding ?? 0)) {
            setError(`Amount cannot exceed the total outstanding balance of LKR ${(customer.outstanding ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
            return;
        }

        setError(null);
        onProcessPayment(paymentAmount, paymentType, paymentMethod, remarks);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full shadow-xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Collect Payment</h2>
                            <p className="text-xs text-gray-500 uppercase tracking-tighter">{customer.customer}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    {/* Breakdown Section */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden shrink-0">
                        <div className="bg-primary-700 px-4 py-2 flex justify-between items-center">
                            <h3 className="text-[10px] font-bold text-white uppercase tracking-widest">Payment Breakdown</h3>
                            <span className="text-[10px] font-mono text-primary-100">Contract: {customer.contractNo}</span>
                        </div>

                        <div className="p-0">
                            <table className="w-full text-xs">
                                <thead className="bg-gray-100/50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-semibold text-gray-500">Date/Type</th>
                                        <th className="px-4 py-2 text-right font-semibold text-gray-500">Rental</th>
                                        <th className="px-4 py-2 text-right font-semibold text-gray-500">Penalty</th>
                                        <th className="px-4 py-2 text-right font-semibold text-gray-500">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {(customer.breakdown ?? []).map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-100/30">
                                            <td className="px-4 py-2">
                                                <div className="font-medium text-gray-900">{new Date(item.date).toLocaleDateString('en-GB')}</div>
                                                <div className="text-[9px] text-gray-500 uppercase tracking-tighter">{item.type}</div>
                                            </td>
                                            <td className="px-4 py-2 text-right font-mono text-gray-600">
                                                {(item.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-2 text-right font-mono text-rose-600">
                                                {(item.penalty ?? 0) > 0 ? (item.penalty ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                            </td>
                                            <td className="px-4 py-2 text-right font-bold text-gray-900">
                                                {((item.amount ?? 0) + (item.penalty ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-blue-50/50">
                                    {customer.suspense_balance > 0 && (
                                        <tr className="border-t border-gray-200">
                                            <td colSpan={3} className="px-4 py-1.5 text-right text-[10px] font-semibold text-emerald-600 italic">Less: Suspense Balance (Advance)</td>
                                            <td className="px-4 py-1.5 text-right font-bold text-emerald-600">-{(customer.suspense_balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    )}
                                    <tr className="border-t-2" style={{ borderColor: colors.primary[100] }}>
                                        <td colSpan={3} className="px-4 py-3 text-right text-xs font-black text-gray-900 uppercase">Grand Total Payable</td>
                                        <td className="px-4 py-3 text-right font-black text-base" style={{ color: colors.primary[600] }}>LKR {(customer.totalPayable ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Input Section */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">Payment Type</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="paymentType"
                                        value="full"
                                        checked={paymentType === 'full'}
                                        onChange={(e) => setPaymentType(e.target.value as 'full')}
                                        className="focus:ring-2 focus:ring-offset-2"
                                        style={{ color: colors.primary[600], borderColor: colors.primary[600], '--tw-ring-color': colors.primary[500] } as any}
                                    />
                                    <span className="text-sm text-gray-700">Full Payment</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="paymentType"
                                        value="partial"
                                        checked={paymentType === 'partial'}
                                        onChange={(e) => setPaymentType(e.target.value as 'partial')}
                                        className="focus:ring-2 focus:ring-offset-2"
                                        style={{ color: colors.primary[600], borderColor: colors.primary[600], '--tw-ring-color': colors.primary[500] } as any}
                                    />
                                    <span className="text-sm text-gray-700">Partial Payment</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">Payment Amount (LKR) *</label>
                            <input
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm font-bold"
                                placeholder="Enter amount"
                                style={{ '--tw-ring-color': `${colors.primary[500]}1A`, borderColor: colors.primary[500] } as any}
                            />
                            {error && (
                                <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">Payment Method *</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                                style={{ '--tw-ring-color': `${colors.primary[500]}1A`, borderColor: colors.primary[500] } as any}
                            >
                                <option value="cash">Cash</option>
                                <option value="bank">Bank Transfer</option>
                                <option value="cheque">Cheque</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">Remarks</label>
                            <textarea
                                rows={2}
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none text-sm"
                                placeholder="Enter any remarks..."
                                style={{ '--tw-ring-color': `${colors.primary[500]}1A`, borderColor: colors.primary[500] } as any}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 flex gap-3 justify-end bg-gray-50 shrink-0 rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors font-medium text-sm text-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleProcess}
                        disabled={isProcessing}
                        className="px-6 py-2 text-white rounded-lg font-bold text-sm shadow-sm transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                        style={{ backgroundColor: colors.primary[600] }}
                        onMouseEnter={(e) => {
                            if (!isProcessing) {
                                e.currentTarget.style.backgroundColor = colors.primary[700];
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isProcessing) {
                                e.currentTarget.style.backgroundColor = colors.primary[600];
                            }
                        }}
                    >
                        {isProcessing ? (
                            <>
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Securing Ledger...</span>
                            </>
                        ) : (
                            'Process Payment'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
