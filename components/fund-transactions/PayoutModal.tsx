'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, AlertCircle, CheckCircle2, Landmark, WalletMinimal, ExternalLink, Info, FileText, Download, UserCheck, Loader2, Eye } from 'lucide-react';
import { DocumentPreviewModal } from '../common/DocumentPreviewModal';
import { colors } from '@/themes/colors';
import { API_BASE_URL, getHeaders } from '@/services/api.config';

interface PayoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientName: string;
    amount: number;
    approvedAmount?: number;
    bankDetails?: {
        bankName: string;
        accountNumber: string;
        branch?: string;
        holderName?: string;
    };
    documents?: any[];
    onConfirm: (refNo: string, remark: string, payoutMethod: string, manualRefNo?: string) => void;
    isProcessing?: boolean;
}

export function PayoutModal({ isOpen, onClose, recipientName, amount, approvedAmount, bankDetails, documents, onConfirm, isProcessing = false }: PayoutModalProps) {
    const [step, setStep] = useState(1);
    const [payoutMethod, setPayoutMethod] = useState<'BANK' | 'CASH' | 'CHEQUE'>('BANK');
    const [refNo, setRefNo] = useState('');
    const [manualRefNo, setManualRefNo] = useState('');
    const [remark, setRemark] = useState('');
    const [previewDoc, setPreviewDoc] = useState<{
        url: string;
        type: string;
        details?: {
            title: string;
            items: { label: string; value: string }[]
        }
    } | null>(null);

    if (!isOpen) return null;

    const handleNext = () => {
        if (payoutMethod === 'BANK') {
            window.open('https://www.seylanbank.lk/corporate/login', '_blank');
        }
        setStep(2);
    };

    const handleConfirm = () => {
        onConfirm(refNo, remark, payoutMethod, manualRefNo);
        setStep(1);
        setRefNo('');
        setManualRefNo('');
        setRemark('');
    };

    const bankBookDoc = documents?.find(doc =>
        doc.type?.toLowerCase().includes('bank') ||
        doc.type?.toLowerCase().includes('book') ||
        doc.type?.toLowerCase().includes('passbook')
    );

    const SecureImage = ({ src, alt, className }: { src: string; alt: string; className: string }) => {
        const [imageUrl, setImageUrl] = useState<string>('');
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(false);

        useEffect(() => {
            const fetchImage = async () => {
                try {
                    setLoading(true);
                    const response = await fetch(src, {
                        headers: getHeaders()
                    });
                    if (!response.ok) throw new Error('Failed to load image');
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    setImageUrl(url);
                    setError(false);
                } catch (err) {
                    console.error('SecureImage error:', err);
                    setError(true);
                } finally {
                    setLoading(false);
                }
            };

            fetchImage();

            return () => {
                if (imageUrl) URL.revokeObjectURL(imageUrl);
            };
        }, [src]);

        if (loading) {
            return (
                <div className="w-full h-full flex flex-col items-center justify-center bg-muted-bg animate-pulse gap-2">
                    <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                    <p className="text-[8px] font-black text-primary-500 uppercase tracking-widest">Securing Artifact...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-muted-bg text-center p-4">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Scan Preview Unavailable</p>
                </div>
            );
        }

        return <img src={imageUrl} alt={alt} className={className} />;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-card rounded-[2.5rem] shadow-[0_20px_70px_-20px_rgba(0,0,0,0.3)] max-w-[1200px] w-full overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-500 border border-border-default/50 flex flex-col md:flex-row">

                {/* Left Side: Customer Bank Profile & Documents */}
                <div className="md:w-8/12 bg-muted-bg/30 p-8 border-b md:border-b-0 md:border-r border-border-default/50 flex flex-col gap-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 rounded-xl bg-primary-600/10 text-primary-600">
                                <Landmark className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-black text-text-primary uppercase tracking-widest">Institutional Bank Profile</h3>
                        </div>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider leading-relaxed">
                            Vetted financial credentials for protocol-level capital allocation.
                        </p>
                    </div>

                    <div className="flex-1">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-card p-5 rounded-2xl border border-border-default shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                {!bankDetails && (
                                    <div className="absolute inset-0 bg-card/60 backdrop-blur-sm z-10 flex items-center justify-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                                            <p className="text-[8px] font-black text-primary-500 uppercase tracking-widest">Fetching Secure Profile...</p>
                                        </div>
                                    </div>
                                )}
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">Target Registry</p>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[8px] font-black text-primary-500 uppercase tracking-widest block mb-1">Account Holder</label>
                                        <div className="flex items-center gap-2">
                                            <UserCheck className="w-3.5 h-3.5 text-text-muted" />
                                            <p className="text-xs font-black text-text-primary uppercase">{bankDetails?.holderName || recipientName}</p>
                                        </div>
                                    </div>
                                    <div className="h-px bg-border-default/50 w-full" />
                                    <div>
                                        <label className="text-[8px] font-black text-primary-500 uppercase tracking-widest block mb-1">Financial Institution</label>
                                        <p className="text-sm font-black text-text-primary uppercase leading-tight">{bankDetails?.bankName || 'NOT-SPECIFIED'}</p>
                                        {bankDetails?.branch && (
                                            <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mt-0.5">{bankDetails.branch} Branch</p>
                                        )}
                                    </div>
                                    <div className="h-px bg-border-default/50 w-full" />
                                    <div>
                                        <label className="text-[8px] font-black text-primary-500 uppercase tracking-widest block mb-1">Account Registry</label>
                                        <code className="text-[13px] font-black text-text-primary tracking-[0.1em] select-all bg-muted-bg px-2 py-1 rounded-lg border border-border-default block w-fit">
                                            {bankDetails?.accountNumber || 'PENDING-FETCH'}
                                        </code>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card p-5 rounded-2xl border border-border-default shadow-sm group">
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-4">Verification Artifacts</p>
                                {bankBookDoc ? (
                                    <div className="space-y-4">
                                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border-default bg-muted-bg group-hover:shadow-md transition-shadow">
                                            <SecureImage
                                                src={`${API_BASE_URL}/media/loan-documents/${bankBookDoc.id}`}
                                                alt="Bank Passbook"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                <button
                                                    onClick={() => setPreviewDoc({
                                                        url: `${API_BASE_URL}/media/loan-documents/${bankBookDoc.id}`,
                                                        type: bankBookDoc.type || 'Bank Passbook',
                                                        details: {
                                                            title: 'Bank Artifact Details',
                                                            items: [
                                                                { label: 'Account Holder', value: bankDetails?.holderName || recipientName },
                                                                { label: 'Bank Institution', value: bankDetails?.bankName || 'NOT PROVIDED' },
                                                                { label: 'Branch Office', value: bankDetails?.branch || 'NOT PROVIDED' },
                                                                { label: 'Account number', value: bankDetails?.accountNumber || 'NOT PROVIDED' }
                                                            ]
                                                        }
                                                    })}
                                                    className="p-3 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-all border border-white/30"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-muted-bg/50 rounded-xl border border-border-default">
                                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-border-default text-primary-600 shadow-sm shrink-0">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-1 flex-col truncate">
                                                <p className="text-[10px] font-black text-text-primary uppercase truncate">{bankBookDoc.type || 'Bank Passbook'}</p>
                                                <p className="text-[8px] font-bold text-text-muted uppercase tracking-wider">
                                                    {(bankBookDoc.file_size / 1024 / 1024).toFixed(2)} MB • JPG Artifact
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-10 px-4 bg-muted-bg/50 rounded-xl border border-dashed border-border-default text-center">
                                        <AlertCircle className="w-6 h-6 text-text-muted/20 mx-auto mb-3" />
                                        <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest leading-relaxed">
                                            Physical bank book artifact not found in system registry.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto hidden md:block">
                        <div className="flex items-center gap-2 text-[8px] font-black text-text-muted/40 uppercase tracking-[0.4em]">
                            <div className="w-1 h-1 rounded-full bg-emerald-500" />
                            Security Integrity Verified
                        </div>
                    </div>
                </div>

                {/* Right Side: The Form */}
                <div className="flex-1 flex flex-col relative overflow-hidden">
                    {/* Precision Tool Header */}
                    <div className="p-6 pb-2 flex items-center justify-between bg-card">
                        <div className="flex items-center gap-4">
                            <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl transition-transform"
                                style={{
                                    background: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[700]})`,
                                    boxShadow: `0 8px 16px ${colors.primary[600]}25`
                                }}
                            >
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-text-primary tracking-tight uppercase leading-none mb-2">Capital Settlement</h3>
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1.5">
                                        <div className={`h-1 rounded-full transition-all duration-500 shadow-sm ${step === 1 ? 'bg-primary-600 w-12' : 'bg-border-default w-4'}`} />
                                        <div className={`h-1 rounded-full transition-all duration-500 shadow-sm ${step === 2 ? 'bg-primary-600 w-12' : 'bg-border-default w-4'}`} />
                                    </div>
                                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest pt-0.5">Protocol Stage 0{step} / 02</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 hover:bg-muted-bg rounded-2xl transition-all group border border-transparent hover:border-border-default"
                        >
                            <X className="w-5 h-5 text-text-muted group-hover:text-text-primary" />
                        </button>
                    </div>

                    <div className="p-8 flex-1 overflow-y-auto">
                        {step === 1 ? (
                            <div className="space-y-6">
                                <div className="bg-primary-500/[0.03] dark:bg-primary-400/[0.03] rounded-3xl p-7 border border-primary-500/10 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 text-primary-600 group-hover:scale-110 transition-transform duration-700">
                                        <WalletMinimal className="w-32 h-32" />
                                    </div>
                                    <div className="relative z-10 space-y-7">
                                        <div>
                                            <p className="text-[9px] font-black text-primary-500 uppercase tracking-[0.2em] mb-2.5">Authorized Recipient</p>
                                            <h4 className="text-2xl font-black text-text-primary uppercase tracking-tight leading-none truncate">{recipientName}</h4>
                                        </div>
                                        <div className="h-px bg-primary-500/10 w-full" />
                                        <div>
                                            <p className="text-[9px] font-black text-primary-500 uppercase tracking-[0.2em] mb-2.5">Capital Allocation</p>
                                            <div className="flex items-baseline gap-2.5">
                                                <span className="text-4xl font-black text-text-primary tracking-tighter tabular-nums leading-none">
                                                    {amount.toLocaleString()}
                                                </span>
                                                {approvedAmount !== undefined && approvedAmount !== amount && (
                                                    <span className="text-lg font-black text-text-muted/40 line-through tracking-tighter tabular-nums">
                                                        {approvedAmount.toLocaleString()}
                                                    </span>
                                                )}
                                                <span className="text-[10px] font-black text-white uppercase tracking-widest bg-primary-600 px-2 py-1 rounded-lg shadow-lg shadow-primary-600/20">LKR TOTAL</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] ml-1.5 block">
                                        Settlement Pathway Selection
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { id: 'BANK', label: 'Bank Transfer', icon: Landmark },
                                            { id: 'CASH', label: 'Cash Handover', icon: WalletMinimal },
                                            { id: 'CHEQUE', label: 'Bank Cheque', icon: FileText }
                                        ].map((m) => (
                                            <button
                                                key={m.id}
                                                onClick={() => setPayoutMethod(m.id as any)}
                                                className={`px-4 py-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${payoutMethod === m.id
                                                    ? 'border-primary-600 bg-primary-500/5 text-primary-600 shadow-md scale-[1.02]'
                                                    : 'border-border-default bg-card text-text-muted hover:border-text-secondary'
                                                    }`}
                                            >
                                                <m.icon className="w-6 h-6" />
                                                <span className="text-[9px] font-black uppercase tracking-widest leading-none text-center">{m.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleNext}
                                    disabled={isProcessing}
                                    className="relative overflow-hidden w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-muted-bg disabled:text-text-muted/40 text-white rounded-[1.25rem] font-black text-[11px] uppercase tracking-[0.25em] flex items-center justify-center gap-3 transition-all shadow-xl shadow-primary-600/25 active:scale-[0.98] group"
                                >
                                    {isProcessing ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span className="relative z-10">Proceed to {payoutMethod === 'BANK' ? 'Portal' : 'Settlement'}</span>
                                            <ExternalLink className="w-4 h-4 relative z-10 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in slide-in-from-right-10 duration-500">
                                <div className="bg-primary-500/[0.04] dark:bg-primary-400/[0.04] rounded-3xl p-7 border border-primary-500/10">
                                    <div className="flex justify-between items-start mb-6 border-b border-primary-500/10 pb-6">
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black text-primary-500 uppercase tracking-[0.2em]">Pathway: {payoutMethod}</p>
                                            <p className="text-base font-black text-text-primary uppercase tracking-tight leading-none">{recipientName}</p>
                                        </div>
                                        <div className="text-right space-y-2">
                                            <p className="text-[9px] font-black text-primary-500 uppercase tracking-[0.2em]">Settlement Value</p>
                                            <div className="flex items-baseline gap-2 justify-end">
                                                <p className="text-2xl font-black text-primary-600 tracking-tighter tabular-nums leading-none">{amount.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {(payoutMethod === 'BANK' && bankDetails) && (
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.15em] ml-1">Bank Institution</p>
                                                <div className="flex items-center gap-2.5 px-4 py-2.5 bg-card rounded-2xl border border-border-default shadow-sm ring-1 ring-black/[0.02]">
                                                    <Landmark className="w-4 h-4 text-primary-500" />
                                                    <p className="text-[10px] font-black text-text-primary uppercase tracking-tight">{bankDetails.bankName}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.15em] ml-1">Account Number</p>
                                                <div className="bg-card px-4 py-2.5 rounded-2xl border border-border-default shadow-sm ring-1 ring-black/[0.02] text-center">
                                                    <p className="text-[11px] font-black text-text-primary font-mono tracking-widest select-all uppercase">
                                                        {bankDetails.accountNumber}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {payoutMethod === 'CASH' && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4 bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20">
                                                <div className="p-2.5 rounded-full bg-emerald-500/20 text-emerald-600">
                                                    <WalletMinimal className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Protocol-Ready for Handover</p>
                                                    <p className="text-[9px] font-bold text-emerald-600/70 uppercase">Cashier will issue printed voucher for finality.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-5">
                                    {payoutMethod === 'BANK' && (
                                        <div className="space-y-2.5">
                                            <label className="flex items-center gap-2.5 text-[9px] font-black text-primary-600 uppercase tracking-[0.2em] ml-1.5">
                                                <Info className="w-4 h-4" />
                                                Terminal Reference Token
                                            </label>
                                            <input
                                                type="text"
                                                value={refNo}
                                                onChange={(e) => setRefNo(e.target.value)}
                                                placeholder="EX: SEB-TRS-PROTOCOL-998"
                                                className="w-full px-5 py-4 bg-muted-bg border-border-default border-2 rounded-[1.25rem] focus:border-primary-500 focus:bg-card outline-none transition-all font-black text-[13px] text-text-primary uppercase tracking-widest placeholder:text-text-muted/20 shadow-inner"
                                            />
                                        </div>
                                    )}

                                    {payoutMethod === 'CASH' && (
                                        <div className="space-y-2.5">
                                            <label className="flex items-center gap-2.5 text-[9px] font-black text-primary-600 uppercase tracking-[0.2em] ml-1.5">
                                                <FileText className="w-4 h-4" />
                                                Manual / Paper Voucher Reference
                                            </label>
                                            <input
                                                type="text"
                                                value={manualRefNo}
                                                onChange={(e) => setManualRefNo(e.target.value)}
                                                placeholder="Enter Paper Ref if Any..."
                                                className="w-full px-5 py-4 bg-muted-bg border-border-default border-2 rounded-[1.25rem] focus:border-primary-500 focus:bg-card outline-none transition-all font-black text-[13px] text-text-primary uppercase tracking-widest placeholder:text-text-muted/20 shadow-inner"
                                            />
                                        </div>
                                    )}

                                    {payoutMethod === 'CHEQUE' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2.5">
                                                <label className="text-[9px] font-black text-primary-600 uppercase tracking-[0.2em] ml-1.5">Cheque Number</label>
                                                <input
                                                    type="text"
                                                    value={manualRefNo}
                                                    onChange={(e) => setManualRefNo(e.target.value)}
                                                    placeholder="EX: 123456"
                                                    className="w-full px-5 py-4 bg-muted-bg border-border-default border-2 rounded-[1.25rem] focus:border-primary-500 focus:bg-card outline-none transition-all font-black text-[13px] text-text-primary uppercase tracking-widest placeholder:text-text-muted/20 shadow-inner"
                                                />
                                            </div>
                                            <div className="space-y-2.5">
                                                <label className="text-[9px] font-black text-primary-600 uppercase tracking-[0.2em] ml-1.5">Cheque Ref (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={refNo}
                                                    onChange={(e) => setRefNo(e.target.value)}
                                                    placeholder="EX: PNB-CHEQUE-TOKEN"
                                                    className="w-full px-5 py-4 bg-muted-bg border-border-default border-2 rounded-[1.25rem] focus:border-primary-500 focus:bg-card outline-none transition-all font-black text-[13px] text-text-primary uppercase tracking-widest placeholder:text-text-muted/20 shadow-inner"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2.5">
                                        <label className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] ml-1.5 block">
                                            Audit Registry Commentary
                                        </label>
                                        <textarea
                                            value={remark}
                                            onChange={(e) => setRemark(e.target.value)}
                                            placeholder="Enter institutional remarks for technical audit..."
                                            rows={2}
                                            className="w-full px-5 py-4 bg-muted-bg border-border-default border-2 rounded-[1.25rem] focus:border-primary-500 focus:bg-card outline-none transition-all font-bold text-xs text-text-secondary resize-none placeholder:text-text-muted/20 shadow-inner"
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-1">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="flex-1 py-4 bg-muted-bg hover:bg-hover text-text-muted hover:text-text-primary rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest transition-all active:scale-[0.95] border border-border-default"
                                    >
                                        Return Back
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        disabled={(payoutMethod === 'BANK' && !refNo) || isProcessing}
                                        className="flex-[2] relative overflow-hidden py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-muted-bg disabled:text-text-muted/30 text-white rounded-[1.25rem] font-black text-[11px] uppercase tracking-[0.25em] transition-all shadow-xl shadow-primary-600/25 active:scale-[0.98] flex items-center justify-center gap-3 group"
                                    >
                                        {isProcessing ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <span className="relative z-10 transition-transform group-hover:scale-105">Finalize Settlement</span>
                                                <CheckCircle2 className="w-4 h-4 relative z-10 text-primary-200" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="px-8 py-5 bg-muted-bg/30 border-t border-border-default/50 text-center flex items-center justify-center gap-8">
                        <p className="text-[8px] font-black text-text-muted/40 uppercase tracking-[0.5em] flex items-center gap-3">
                            <span className="w-8 h-[1px] bg-border-default/30" />
                            Core Protocol Operational Finality v4.9.2
                            <span className="w-8 h-[1px] bg-border-default/30" />
                        </p>
                    </div>
                </div>
            </div>

            {previewDoc && (
                <DocumentPreviewModal
                    url={previewDoc.url}
                    type={previewDoc.type}
                    onClose={() => setPreviewDoc(null)}
                    isSecure={true}
                    details={previewDoc.details}
                />
            )}
        </div>
    );
}
