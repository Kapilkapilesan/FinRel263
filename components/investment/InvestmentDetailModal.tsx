'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TrendingUp, User, X, Calendar, Download, RefreshCcw, AlertTriangle, ArrowRight, Calculator, DollarSign, Clock, Info, Lock, Landmark } from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { toast } from 'react-toastify';
import { Investment } from '../../types/investment.types';
import { colors } from '@/themes/colors';
import { DocumentPreviewModal } from './DocumentPreviewModal';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    investment: Investment | null;
}

export function InvestmentDetailModal({ isOpen, onClose, investment }: Props) {
    const [mounted, setMounted] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [returnPreview, setReturnPreview] = useState<any>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showRenewConfirm, setShowRenewConfirm] = useState(false);
    const [showReturnConfirm, setShowReturnConfirm] = useState(false);
    const [breakReason, setBreakReason] = useState('');
    const [payoutMethod, setPayoutMethod] = useState<'BANK' | 'CASH' | 'CHEQUE'>('BANK');
    const [reprintReason, setReprintReason] = useState('');
    const [showReprintRequest, setShowReprintRequest] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setIsPreviewing(false);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !investment || !mounted) return null;

    const handlePreviewReturn = async () => {
        setIsLoadingPreview(true);
        setIsPreviewing(true);
        try {
            const data = await import('../../services/investment.service').then(m => m.investmentService.previewReturn(investment.id));
            setReturnPreview(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to calculate return preview');
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const handleConfirmReturn = async () => {
        setIsSubmitting(true);
        try {
            await import('../../services/investment.service').then(m =>
                m.investmentService.initiatePayout(
                    investment.id, 
                    returnPreview.status === 'MATURITY' ? 'MATURITY' : 'EARLY_BREAK', 
                    payoutMethod,
                    breakReason
                )
            );
            toast.success('Return request initiated successfully! It now requires approval.');
            onClose();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
            setShowReturnConfirm(false);
        }
    };

    const handleRenew = async () => {
        setIsSubmitting(true);
        try {
            await import('../../services/investment.service').then(m => m.investmentService.renewInvestment(investment.id));
            toast.success('Investment renewed successfully!');
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Renewal failed');
        } finally {
            setIsSubmitting(false);
            setShowRenewConfirm(false);
        }
    };

    const handleDownload = async () => {
        if (investment.print_count > 0 && !investment.is_reprint_authorized) {
            setShowReprintRequest(true);
            return;
        }

        try {
            const service = await import('../../services/investment.service').then(m => m.investmentService);

            // Increment print count in database
            await service.downloadReceipt(investment.id);

            // Open print preview
            setIsPreviewModalOpen(true);

            // Update local state if needed
            investment.print_count += 1;
            investment.is_reprint_authorized = false;
        } catch (error: any) {
            toast.error(error.message || 'Print failed');
        }
    };

    const handleRequestReprint = async () => {
        if (!reprintReason.trim()) {
            toast.error('Please provide a reason for reprint');
            return;
        }
        setIsSubmitting(true);
        try {
            const service = await import('../../services/investment.service').then(m => m.investmentService);
            await service.requestReprint(investment.id, reprintReason);
            toast.success('Reprint request submitted to management');
            setShowReprintRequest(false);
        } catch (error: any) {
            toast.error(error.message || 'Request failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[9999] overflow-y-auto flex items-start justify-center p-4 sm:p-10 md:p-16">
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <div
                className={`bg-card shadow-2xl relative animate-in fade-in zoom-in duration-300 w-full overflow-hidden z-10 rounded-[2rem]
                    ${isPreviewing ? 'max-w-xl' : 'max-w-5xl'}
                `}
            >
                {isPreviewing ? (
                    /* Preview Return View */
                    <div className="p-8 space-y-6">
                        <div className="flex items-center justify-between border-b border-border-default pb-4">
                            <h2 className="text-xl font-black text-text-primary flex items-center gap-2">
                                <Calculator className="w-6 h-6 text-red-600" />
                                Return Settlement Preview
                            </h2>
                            <button onClick={() => setIsPreviewing(false)} className="p-2 hover:bg-hover rounded-full transition-colors">
                                <X className="w-5 h-5 text-text-muted" />
                            </button>
                        </div>

                        {isLoadingPreview ? (
                            <div className="py-12 text-center">
                                <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="font-bold text-text-muted">Calculating yields from snapshot...</p>
                            </div>
                        ) : returnPreview && (
                            <div className="space-y-6">
                                <div className={`p-6 rounded-2xl border flex flex-col items-center ${returnPreview.is_early_break
                                    ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20'
                                    : 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20'
                                    }`}>
                                    <p className={`text-xs font-black uppercase tracking-widest mb-1 ${returnPreview.is_early_break ? 'text-red-400' : 'text-blue-400'
                                        }`}>Total Payout Amount</p>
                                    <div className="flex items-end gap-2">
                                        <span className={`text-sm font-bold mb-1 ${returnPreview.is_early_break ? 'text-red-300' : 'text-blue-300'
                                            }`}>LKR</span>
                                        <span className={`text-4xl font-black ${returnPreview.is_early_break ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                                            }`}>
                                            {Number(returnPreview.total_payout).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <span className={`mt-2 px-3 py-1 text-white text-[10px] font-black rounded-full uppercase ${returnPreview.is_early_break ? 'bg-red-600' : 'bg-blue-600'
                                        }`}>
                                        {returnPreview.badge}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-muted-bg rounded-xl border border-border-default">
                                        <p className="text-[10px] font-black text-text-muted uppercase mb-1">Principal Invested</p>
                                        <p className="text-base font-black text-text-primary">LKR {Number(returnPreview.principal).toLocaleString()}</p>
                                    </div>
                                    <div className="p-4 bg-muted-bg rounded-xl border border-border-default">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-[10px] font-black text-text-muted uppercase truncate mr-2">Interest Payable Today</p>
                                            <span className="text-[10px] font-bold text-text-muted bg-border-default/50 px-1.5 rounded">{returnPreview.interest_rate_used}%</span>
                                        </div>
                                        <p className={`text-base font-black ${returnPreview.interest_payable_today > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-text-primary'}`}>
                                            LKR {Number(returnPreview.interest_payable_today || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>

                                    {returnPreview.payout_type === 'MONTHLY' && returnPreview.is_early_break && (
                                        <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900/20 col-span-1 md:col-span-2">
                                            <div className="flex justify-between items-center mb-3">
                                                <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase">Clawback Calculation</p>
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-100 dark:bg-red-900/20 rounded text-[9px] font-bold text-red-700 dark:text-red-300 uppercase">
                                                    <AlertTriangle className="w-3 h-3" /> Penalty Applied
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[11px] font-medium text-text-secondary">
                                                    <span>Interest Already Paid (at {returnPreview.normal_rate}% normal rate)</span>
                                                    <span>LKR {Number(returnPreview.interest_already_paid).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                </div>
                                                <div className="flex justify-between text-[11px] font-medium text-blue-600 dark:text-blue-400">
                                                    <span>Allowed Interest (at {returnPreview.break_rate}% break rate)</span>
                                                    <span>- LKR {Number(returnPreview.allowed_interest).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                </div>
                                                <div className="pt-2 border-t border-red-200 dark:border-red-900/20 flex justify-between text-sm font-black text-red-700 dark:text-red-400 uppercase">
                                                    <span>Overpaid Interest (Penalty)</span>
                                                    <span>LKR {Number(returnPreview.overpaid_interest).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-900/20 space-y-1">
                                                <div className="flex justify-between text-xs font-bold text-text-secondary">
                                                    <span>Principal</span>
                                                    <span>LKR {Number(returnPreview.principal).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-xs font-bold text-red-600 dark:text-red-400">
                                                    <span>Less: Penalty Recovered</span>
                                                    <span>- LKR {Number(returnPreview.overpaid_interest).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                </div>
                                                <div className="flex justify-between text-sm font-black text-text-primary pt-1 border-t border-red-200 dark:border-red-900/20">
                                                    <span>Capital Returned</span>
                                                    <span>LKR {Number(returnPreview.capital_returned).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {returnPreview.notice && (
                                    <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/20 flex gap-3">
                                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0" />
                                        <p className="text-[11px] text-amber-800 dark:text-amber-400 font-bold leading-relaxed uppercase tracking-tight">
                                            {returnPreview.notice}
                                        </p>
                                    </div>
                                )}

                                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/20 flex gap-3">
                                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-500 shrink-0" />
                                    <p className="text-[11px] text-blue-800 dark:text-blue-400 font-medium leading-relaxed">
                                        <strong>Bank Correctness Notice:</strong> This calculation uses the immutable snapshot created at the time of investment.
                                        Total term stayed: <b>{returnPreview.stayed_months} Months</b>.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 block">
                                        Payout Method Selection
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { id: 'BANK', label: 'Bank Transfer', icon: Landmark },
                                            { id: 'CASH', label: 'Cash / Voucher', icon: DollarSign },
                                            { id: 'CHEQUE', label: 'Bank Cheque', icon: Calculator }
                                        ].map((m) => (
                                            <button
                                                key={m.id}
                                                onClick={() => setPayoutMethod(m.id as any)}
                                                className={`px-3 py-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${payoutMethod === m.id
                                                    ? 'border-red-600 bg-red-500/5 text-red-600 shadow-md scale-[1.02]'
                                                    : 'border-border-default bg-muted-bg text-text-muted hover:border-text-secondary'
                                                    }`}
                                            >
                                                <m.icon className="w-5 h-5" />
                                                <span className="text-[8px] font-black uppercase tracking-widest text-center">{m.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Reason for Settlement / Remarks</label>
                                    <textarea
                                        className="w-full p-4 bg-muted-bg border border-border-default rounded-2xl outline-none focus:ring-2 focus:ring-red-500 transition-all font-medium text-sm text-text-primary placeholder:text-text-muted/50"
                                        placeholder="Enter any institutional remarks or reasons..."
                                        rows={2}
                                        value={breakReason}
                                        onChange={(e) => setBreakReason(e.target.value)}
                                    />
                                </div>

                                <div className="flex gap-4 pt-4 text-center">
                                    <button onClick={() => setIsPreviewing(false)} className="flex-1 py-4 bg-muted-bg text-text-muted rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-hover hover:text-text-primary transition-all">
                                        Back
                                    </button>
                                    <button
                                        onClick={() => setShowReturnConfirm(true)}
                                        disabled={isSubmitting}
                                        className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? 'Processing...' : 'Request Payout'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Main Detail View */
                    <div className="flex flex-col">
                        <div
                            className="p-3 sm:p-4 text-white relative flex-shrink-0"
                            style={{
                                background: `linear-gradient(135deg, ${colors.indigo[600]}, ${colors.primary[500]}, ${colors.primary[600]})`
                            }}
                        >
                            <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                                <TrendingUp className="w-16 h-16" />
                            </div>

                            <div className="flex justify-between items-center relative z-10 w-full gap-4">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-1">
                                    <div className="flex flex-col space-y-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-[0.2em] border border-white/10 text-white">
                                                {investment.snapshot_product_code}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border border-white/40 bg-white/10 text-white">
                                                {investment.status}
                                            </span>
                                        </div>
                                        <h2 className="text-lg sm:text-xl font-black tracking-tighter leading-none">{investment.snapshot_product_name}</h2>
                                        <p className="text-white/80 flex items-center gap-1 font-bold text-[10px] mt-0.5">
                                            <User className="w-3 h-3" />
                                            {investment.customer?.full_name} <span className="text-white/40">•</span> <span className="opacity-60">{investment.customer?.customer_code}</span>
                                        </p>
                                    </div>

                                    <div className="hidden sm:block w-px h-10 bg-white/20 mx-2"></div>

                                    <div className="bg-white/10 backdrop-blur-2xl border border-white/20 px-3 py-2 rounded-2xl shadow-xl flex-shrink-0">
                                        <p className="text-[7px] sm:text-[8px] text-white/60 font-black uppercase tracking-widest mb-0.5">Principal Invested</p>
                                        <div className="flex items-baseline gap-1 text-white">
                                            <span className="text-[10px] font-bold opacity-60">LKR</span>
                                            <span className="text-lg sm:text-xl font-black tracking-tighter leading-none">{Number(investment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all group active:scale-95 flex-shrink-0 ml-auto self-start"
                                >
                                    <X className="w-4 h-4 transition-all group-hover:rotate-90" />
                                </button>
                            </div>
                        </div>

                        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="p-4 bg-muted-bg rounded-2xl border border-border-default shadow-sm">
                                        <p className="text-[10px] font-black text-text-muted uppercase mb-2 flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" /> Policy Term
                                        </p>
                                        <p className="text-lg font-black text-text-primary">{investment.snapshot_policy_term} <span className="text-xs font-bold text-text-muted">Months</span></p>
                                    </div>
                                    <div className="p-4 bg-muted-bg rounded-2xl border border-border-default shadow-sm">
                                        <p className="text-[10px] font-black text-text-muted uppercase mb-2 flex items-center gap-1.5">
                                            <DollarSign className="w-3.5 h-3.5" /> Payout Type
                                        </p>
                                        <p className="text-lg font-black text-text-primary capitalize">{investment.snapshot_payout_type.toLowerCase()}</p>
                                    </div>
                                    <div className="p-4 bg-muted-bg rounded-2xl border border-border-default shadow-sm">
                                        <p className="text-[10px] font-black text-text-muted uppercase mb-1.5">Active Rate</p>
                                        <p className="text-xl font-black text-blue-600 dark:text-blue-400">
                                            {investment.snapshot_payout_type === 'MONTHLY' ? investment.snapshot_interest_rate_monthly : investment.snapshot_interest_rate_maturity}%
                                        </p>
                                    </div>
                                    <div className="p-4 bg-muted-bg rounded-2xl border border-border-default shadow-sm">
                                        <p className="text-[10px] font-black text-text-muted uppercase mb-1.5">Neg. Rate</p>
                                        <p className="text-xl font-black text-blue-600 dark:text-blue-400">+{investment.snapshot_negotiation_rate}%</p>
                                    </div>
                                </div>

                                <div className="bg-card rounded-[2rem] border border-border-default overflow-hidden shadow-lg shadow-black/5">
                                    <div className="bg-muted-bg/50 px-6 py-4 border-b border-border-default flex items-center justify-between">
                                        <h3 className="font-black text-text-primary flex items-center gap-2 text-xs">
                                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            Yield Calculation Engine
                                        </h3>
                                        <div className="text-[8px] font-black bg-blue-600 text-white px-2.5 py-1 rounded-full uppercase tracking-widest">Live Rules</div>
                                    </div>
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest border-b border-border-default/50 pb-2">Interest Parameters</p>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center text-xs font-bold text-text-muted">
                                                        <span>Normal Rate (Monthly)</span>
                                                        <span className="text-text-primary font-black">{investment.snapshot_interest_rate_monthly}%</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs font-bold text-text-muted">
                                                        <span>Normal Rate (Maturity)</span>
                                                        <span className="text-text-primary font-black">{investment.snapshot_interest_rate_maturity}%</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs font-bold text-blue-600 dark:text-blue-400 pt-2 border-t border-dashed border-border-default">
                                                        <span>Negotiation Surcharge</span>
                                                        <span className="font-black">+{investment.snapshot_negotiation_rate}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <p className="text-[9px] font-black text-red-400 uppercase tracking-widest border-b border-red-100 dark:border-red-900/20 pb-2">Early Break Penalty</p>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center text-xs font-bold text-text-muted">
                                                        <span>Penalty Rate (Monthly)</span>
                                                        <span className="text-red-500 font-black">{investment.snapshot_early_break_rate_monthly}%</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs font-bold text-text-muted">
                                                        <span>Penalty Rate (Maturity)</span>
                                                        <span className="text-red-500 font-black">{investment.snapshot_early_break_rate_maturity}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Nominees */}
                                <div className="space-y-4">
                                    <h3 className="font-black text-text-primary flex items-center gap-2 text-xs">
                                        <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        Nominee Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {investment.nominees?.map((n, i) => (
                                            <div key={i} className="p-4 bg-card border border-border-default rounded-2xl shadow-sm">
                                                <p className="font-black text-text-primary text-sm">{n.name}</p>
                                                <div className="flex items-center justify-between mt-1">
                                                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{n.id_type === 'BC' ? 'BC' : 'NIC'}: {n.nic}</span>
                                                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-full text-[8px] font-black uppercase tracking-wider">{n.relationship}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Bank Details */}
                                {investment.bank_details && (
                                    <div className="space-y-4">
                                        <h3 className="font-black text-text-primary flex items-center gap-2 text-xs">
                                            <Landmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                            Disbursement Bank Details
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-4 bg-emerald-50/30 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl shadow-sm">
                                                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase mb-2">Financial Institution</p>
                                                <p className="font-black text-text-primary text-sm uppercase">{investment.bank_details.bank_name}</p>
                                                <p className="text-[9px] font-bold text-text-muted mt-1 uppercase">Branch: {investment.bank_details.branch || 'NOT-PROVIDED'}</p>
                                            </div>
                                            <div className="p-4 bg-emerald-50/30 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl shadow-sm">
                                                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase mb-2">Account Registry</p>
                                                <p className="font-black text-text-primary text-sm uppercase">{investment.bank_details.account_number}</p>
                                                <p className="text-[9px] font-bold text-text-muted mt-1 uppercase">Holder: {investment.bank_details.holder_name || investment.customer?.full_name}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-8">
                                <div
                                    className="rounded-[2rem] p-6 text-white space-y-6 shadow-xl relative overflow-hidden"
                                    style={{
                                        background: `linear-gradient(135deg, ${colors.indigo[950]}, ${colors.indigo[900]})`
                                    }}
                                >
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-300 flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5" /> Timeline
                                    </h3>

                                    <div className="space-y-6 relative">
                                        <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-white/10"></div>

                                        <div className="relative pl-8">
                                            <div className="absolute left-0 top-1 w-5 h-5 bg-blue-500 rounded-full border-4 border-[#1e1b4b] flex items-center justify-center">
                                                <div className="w-1 h-1 bg-white rounded-full"></div>
                                            </div>
                                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Start Date</p>
                                            <p className="text-base font-black">{new Date(investment.start_date).toLocaleDateString('en-GB')}</p>
                                        </div>

                                        <div className="relative pl-8">
                                            <div className="absolute left-0 top-1 w-5 h-5 bg-white/20 rounded-full border-4 border-[#1e1b4b] flex items-center justify-center">
                                                <div className="w-1 h-1 bg-white rounded-full opacity-40"></div>
                                            </div>
                                            <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1.5">Current Progress</p>
                                            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full"
                                                    style={{
                                                        width: `${Math.min(100, Math.max(0,
                                                            ((new Date().getTime() - new Date(investment.start_date).getTime()) /
                                                                (new Date(investment.maturity_date).getTime() - new Date(investment.start_date).getTime())) * 100
                                                        ))}%`
                                                    }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="relative pl-8">
                                            <div className="absolute left-0 top-1 w-5 h-5 bg-rose-500 rounded-full border-4 border-[#1e1b4b] flex items-center justify-center">
                                                <div className="w-1 h-1 bg-white rounded-full"></div>
                                            </div>
                                            <p className="text-[9px] font-black text-rose-300 uppercase tracking-widest mb-0.5">Maturity Date</p>
                                            <p className="text-base font-black">{new Date(investment.maturity_date).toLocaleDateString('en-GB')}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[9px] font-black text-text-muted uppercase tracking-widest">Security Audit</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-bold bg-muted-bg/50 p-3 rounded-xl border border-border-default">
                                            <span className="text-text-muted uppercase">TX ID</span>
                                            <span className="text-text-primary font-mono">{investment.transaction_id}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold bg-muted-bg/50 p-3 rounded-xl border border-border-default">
                                            <span className="text-text-muted uppercase">Timestamp</span>
                                            <span className="text-text-primary">{new Date(investment.created_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-muted-bg border-t border-border-default flex flex-col sm:flex-row justify-end gap-3">
                            <button onClick={onClose} className="px-6 py-3 bg-card border border-border-default text-text-muted rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-hover hover:text-text-primary transition-all">
                                Close Window
                            </button>
                            {(investment.status === 'ACTIVE' || investment.status === 'MATURED') && (
                                <button
                                    onClick={() => setShowRenewConfirm(true)}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    <RefreshCcw className="w-3.5 h-3.5" /> Renew
                                </button>
                            )}
                            {investment.status === 'ACTIVE' && (
                                <button
                                    onClick={handlePreviewReturn}
                                    className="px-6 py-3 bg-red-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-red-700 transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    <ArrowRight className="w-3.5 h-3.5 rotate-[-45deg]" /> Return
                                </button>
                            )}
                            {investment.status === 'ACTIVE' && (
                                <button
                                    onClick={handleDownload}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    {(investment.print_count > 0 && !investment.is_reprint_authorized) ? (
                                        <>
                                            <Lock className="w-3.5 h-3.5" /> Request Reprint
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-3.5 h-3.5" /> Print Document
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Confirmation Dialogs */}
            <ConfirmDialog
                isOpen={showRenewConfirm}
                title="Renew Investment"
                message="Are you sure you want to renew this investment?"
                onConfirm={handleRenew}
                onCancel={() => setShowRenewConfirm(false)}
                variant="info"
                confirmText="Renew Now"
            />

            <ConfirmDialog
                isOpen={showReturnConfirm}
                title="Confirm Settlement"
                message="Are you sure you want to initiate this settlement?"
                onConfirm={handleConfirmReturn}
                onCancel={() => setShowReturnConfirm(false)}
                variant="danger"
                confirmText="Settle Now"
            />

            <ConfirmDialog
                isOpen={showReprintRequest}
                title="Reprint Authorization Required"
                message={
                    <div className="space-y-4">
                        <p>This certificate has already been printed. You must request authorization from management to print it again.</p>
                        <textarea
                            className="w-full p-3 border rounded-xl"
                            placeholder="Reason for reprint..."
                            value={reprintReason}
                            onChange={(e) => setReprintReason(e.target.value)}
                        />
                    </div>
                }
                onConfirm={handleRequestReprint}
                onCancel={() => setShowReprintRequest(false)}
                variant="warning"
                confirmText="Submit Request"
            />

            <DocumentPreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                investment={investment}
            />
        </div>
    );

    return createPortal(modalContent, document.body);
}
