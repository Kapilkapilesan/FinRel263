'use client'

import React from 'react';
import { AlertTriangle, X, ShieldCheck, CheckCircle, Info } from 'lucide-react';
import { colors } from '@/themes/colors';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    variant = 'warning'
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: ShieldCheck,
            gradient: `linear-gradient(135deg, ${colors.primary[500]}, ${colors.primary[600]})`,
            textColor: 'text-primary-600',
            buttonBg: 'bg-primary-600 hover:bg-primary-700',
            shadow: `0 20px 40px ${colors.primary[500]}40`
        },
        warning: {
            icon: ShieldCheck,
            gradient: `linear-gradient(135deg, ${colors.primary[500]}, ${colors.primary[600]})`,
            textColor: 'text-primary-600',
            buttonBg: 'bg-primary-600 hover:bg-primary-700',
            shadow: `0 20px 40px ${colors.primary[500]}40`
        },
        info: {
            icon: ShieldCheck,
            gradient: `linear-gradient(135deg, ${colors.primary[500]}, ${colors.primary[600]})`,
            textColor: 'text-primary-600',
            buttonBg: 'bg-primary-600 hover:bg-primary-700',
            shadow: `0 20px 40px ${colors.primary[500]}40`
        }
    };

    const styles = variantStyles[variant];
    const Icon = styles.icon;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg bg-card/70 backdrop-blur-2xl rounded-[3rem] border border-border-default shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] dark:shadow-black/50 overflow-hidden animate-in zoom-in-95 duration-500">
                {/* Close Button */}
                <button
                    onClick={onCancel}
                    className="absolute top-8 right-8 p-3 rounded-2xl hover:bg-hover transition-all text-text-muted hover:text-text-primary z-10"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="p-12">
                    <div className="flex flex-col items-center text-center mb-10">
                        <div
                            className="w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl transform rotate-3 transition-transform hover:rotate-0 duration-500"
                            style={{
                                background: styles.gradient,
                                boxShadow: styles.shadow
                            }}
                        >
                            <Icon className="w-12 h-12 text-white" />
                        </div>

                        <h2 className={`text-3xl font-black ${styles.textColor} tracking-tight mb-3 uppercase`}>
                            {title}
                        </h2>
                        <div className="text-[10px] font-black uppercase tracking-[0.25em] text-text-muted max-w-[80%] mx-auto">
                            {message}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-8 py-5 bg-card border border-border-default text-text-muted font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-hover transition-all hover:text-text-primary shadow-sm active:scale-95"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-[1.5] relative group overflow-hidden px-8 py-5 rounded-2xl transition-all active:scale-95 shadow-xl text-white ${styles.buttonBg} shadow-primary-500/20`}
                        >
                            <div className="relative flex items-center justify-center gap-3">
                                <CheckCircle className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                                <span className="text-white font-black uppercase text-[10px] tracking-widest">
                                    {confirmText}
                                </span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
