'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, FileText, Send, AlertCircle, Loader2 } from 'lucide-react';
import { colors } from '@/themes/colors';

interface ReprintRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
    investmentTitle: string;
    investmentId: string;
}

export function ReprintRequestModal({
    isOpen,
    onClose,
    onConfirm,
    investmentTitle,
    investmentId
}: ReprintRequestModalProps) {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) {
            setError('Please provide a legitimate reason for this reprint request.');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            await onConfirm(reason.trim());
            setReason('');
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to submit request. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 lg:p-8">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-500"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative w-full max-w-lg bg-card/70 backdrop-blur-2xl rounded-[2.5rem] border border-border-default shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] dark:shadow-black/50 overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 p-2.5 rounded-2xl hover:bg-hover transition-all z-10 text-text-muted hover:text-text-primary"
                >
                    <X className="w-5 h-5" />
                </button>

                <form onSubmit={handleSubmit} className="p-10 md:p-12">
                    <div className="flex flex-col items-center text-center mb-10">
                        <div
                            className="w-20 h-20 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl rotate-3 transform transition-transform hover:rotate-0 duration-500"
                            style={{
                                background: `linear-gradient(135deg, ${colors.warning[500]}, ${colors.warning[600] || '#d97706'})`,
                                boxShadow: `0 20px 40px ${colors.warning[500]}40`
                            }}
                        >
                            <Lock className="w-10 h-10 text-white" />
                        </div>

                        <h2 className="text-3xl font-black text-text-primary tracking-tight mb-2">
                            Security <span className="theme-text-primary">Unlock</span> Request
                        </h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-text-muted">
                            {investmentTitle} • {investmentId}
                        </p>
                    </div>

                    <div className="space-y-8">
                        <div className="relative group">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1 mb-3 block">
                                Authorization Reason
                            </label>
                            <div className="relative">
                                <div className="absolute top-5 left-6 text-amber-500/50 group-focus-within:text-amber-500 transition-colors">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <textarea
                                    value={reason}
                                    onChange={(e) => {
                                        setReason(e.target.value);
                                        if (error) setError(null);
                                    }}
                                    placeholder="Explain why this portfolio needs to be reprinted..."
                                    className="w-full min-h-[160px] pl-16 pr-8 py-5 bg-input border border-border-default rounded-[2rem] outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/30 transition-all text-text-primary font-bold placeholder:text-text-muted/50 text-sm resize-none shadow-inner"
                                />
                            </div>
                            {error && (
                                <div className="flex items-center gap-3 mt-4 px-5 py-3 bg-red-50 text-red-500 rounded-2xl border border-red-100 animate-in slide-in-from-top-2">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-wider">{error}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="order-2 sm:order-1 flex-1 px-8 py-5 bg-card border border-border-default text-text-muted hover:bg-hover hover:text-text-primary font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all shadow-sm active:scale-95"
                            >
                                Cancel 
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="order-1 sm:order-2 flex-[1.5] relative group overflow-hidden px-8 py-5 rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-xl"
                                style={{
                                    background: `linear-gradient(135deg, ${colors.primary[500]}, ${colors.primary[600]})`,
                                    boxShadow: `0 15px 30px ${colors.primary[500]}30`
                                }}
                            >
                                <div className="relative flex items-center justify-center gap-3">
                                    {isSubmitting ? (
                                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4 text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    )}
                                    <span className="text-white font-black uppercase text-[10px] tracking-widest">
                                        {isSubmitting ? 'Verifying...' : ' Request'}
                                    </span>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="mt-10 pt-8 border-t border-border-divider flex items-start gap-5">
                        <div
                            className="p-3 rounded-2xl flex-shrink-0 bg-warning-500/10 border border-warning-200/20"
                        >
                            <AlertCircle className="w-5 h-5" style={{ color: colors.warning[500] }} />
                        </div>
                        <p className="text-[9px] font-bold text-text-muted leading-relaxed uppercase tracking-[0.1em]">
                            Reprinting is a <span className="text-amber-600 font-black">Controlled Action</span>. All requests are logged with your user signature and require physical verification by authorized management.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
