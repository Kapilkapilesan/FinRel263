import React from 'react';
import { X, CheckCircle2, ChevronLeft, Printer, Download, User, Calendar, Wallet } from 'lucide-react';
import { colors } from '@/themes/colors';

interface SalaryReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    data: {
        month: string;
        baseSalary: number;
        allowances: number;
        allowances_detail: { label: string; amount: number }[];
        deductions: number;
        deductions_detail: { label: string; amount: number }[];
        paymentMethod: string;
        employeeIds: string[];
    };
    employeeDetails: any[];
}

export const SalaryReviewModal: React.FC<SalaryReviewModalProps> = ({ isOpen, onClose, onConfirm, data, employeeDetails }) => {
    if (!isOpen) return null;

    const netPayable = data.baseSalary + data.allowances - data.deductions;
    const totalBatch = netPayable * data.employeeIds.length;
    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const recipientText = data.employeeIds.length === 1
        ? employeeDetails[0]?.name || 'Staff Member'
        : `${data.employeeIds.length} Staff Members`;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-lg max-h-[95vh] rounded-[2.5rem] shadow-2xl border border-border-default/50 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 flex flex-col">
                {/* Status Header */}
                <div className="bg-muted-bg/50 p-6 text-center relative border-b border-border-default/50 shrink-0">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500/10 border-4 border-card shadow-xl mb-4">
                        <CheckCircle2 className="w-8 h-8 text-primary-500" />
                    </div>
                    <h2 className="text-2xl font-[900] text-text-primary tracking-tight leading-none mb-1">Review Payment</h2>
                    <p className="text-[11px] font-medium text-text-muted">Salary has been recorded and is awaiting disbursement.</p>
                </div>

                {/* Receipt Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Main Receipt Card */}
                    <div className="bg-card rounded-3xl border border-border-default/50 p-6 shadow-sm space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl bg-primary-500/5"></div>

                        <div className="flex justify-between items-start">
                            <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">Payment Receipt</h3>
                            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-500/20">PENDING APPROVAL</span>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2 text-text-muted font-bold uppercase tracking-widest text-[10px]">
                                    <User className="w-3.5 h-3.5" /> PAID TO
                                </div>
                                <span className="font-black text-text-primary truncate ml-4 tracking-tight uppercase leading-none">{recipientText}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2 text-text-muted font-bold uppercase tracking-widest text-[10px]">
                                    <Calendar className="w-3.5 h-3.5" /> PERIOD
                                </div>
                                <span className="font-bold text-text-primary">{data.month}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2 text-text-muted font-bold uppercase tracking-widest text-[10px]">
                                    <Wallet className="w-3.5 h-3.5" /> METHOD
                                </div>
                                <span className="font-bold text-text-primary">{data.paymentMethod}</span>
                            </div>
                        </div>

                        <div className="h-px bg-border-default/30"></div>

                        {/* Financial Breakdown */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[11px] font-bold text-text-muted uppercase tracking-wider">
                                    <span>Earnings Breakdown</span>
                                    <span>Amount</span>
                                </div>
                                <div className="space-y-1.5 pt-1">
                                    <div className="flex justify-between text-xs font-medium text-text-primary">
                                        <span>Base Salary</span>
                                        <span className="font-mono font-bold">Rs. {data.baseSalary.toLocaleString()}</span>
                                    </div>
                                    {data.allowances_detail.map((allowance, idx) => (
                                        <div key={idx} className="flex justify-between text-xs font-medium text-text-muted">
                                            <span>{allowance.label || 'Other Allowance'}</span>
                                            <span className="text-primary-500 font-mono font-bold">+ {allowance.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <div className="flex justify-between text-[11px] font-bold text-text-muted uppercase tracking-wider">
                                    <span>Deductions Breakdown</span>
                                    <span>Amount</span>
                                </div>
                                <div className="space-y-1.5 pt-1">
                                    {data.deductions_detail.map((deduction, idx) => (
                                        <div key={idx} className="flex justify-between text-xs font-medium text-text-muted">
                                            <span>{deduction.label || 'Other Deduction'}</span>
                                            <span className="text-danger-500 font-mono font-bold">- {deduction.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="h-px bg-border-default/30"></div>

                            <div className="p-5 rounded-2xl border border-primary-500/20 bg-primary-500/10 transition-all flex justify-between items-center group">
                                <div>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-0.5">Total Paid</p>
                                    <p className="text-[10px] text-text-muted/60 font-bold uppercase tracking-tight">Net salary per employee</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black font-mono text-primary-500">Rs. {netPayable.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex gap-4 p-6 border-t border-border-default/50 bg-card shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-muted-bg/50 hover:bg-hover text-text-muted hover:text-text-primary rounded-2xl text-sm font-bold transition-all border border-border-default/50 shadow-sm active:scale-95"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Edit
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-[1.5] py-4 bg-primary-600 hover:bg-primary-700 text-white dark:text-card rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-primary-500/20"
                    >
                        Process Batch
                    </button>
                </div>
            </div>
        </div>
    );
};
