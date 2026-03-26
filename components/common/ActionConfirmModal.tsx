import React from 'react';
import { X, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

interface ActionConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (note?: string) => Promise<void>;
    title: string;
    message: string;
    confirmLabel: string;
    variant?: 'success' | 'danger' | 'warning' | 'primary' | 'info';
    showNoteInput?: boolean;
    notePlaceholder?: string;
}

export function ActionConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel,
    variant = 'success',
    showNoteInput = false,
    notePlaceholder = "Add an optional note..."
}: ActionConfirmModalProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [note, setNote] = React.useState('');

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            await onConfirm(note);
            onClose();
        } catch (error) {
            console.error('Action failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const variantStyles = {
        success: {
            icon: <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
            bg: 'bg-emerald-500/10',
            button: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10',
        },
        danger: {
            icon: <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />,
            bg: 'bg-red-500/10',
            button: 'bg-red-600 hover:bg-red-700 shadow-red-500/10',
        },
        warning: {
            icon: <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
            bg: 'bg-amber-500/10',
            button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/10',
        },
        primary: {
            icon: <ShieldCheck className="w-8 h-8 text-white" />,
            bg: 'bg-primary-600 shadow-xl shadow-primary-500/30',
            button: 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/20',
        },
        info: {
            icon: <CheckCircle2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />,
            bg: 'bg-primary-500/10',
            button: 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/10',
        }
    };

    const style = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-[12px] p-4 animate-in fade-in duration-300">
            <div className="bg-card rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-border-default transition-colors">
                <div className="p-8 text-center">
                    <div className={`w-20 h-20 ${style.bg} rounded-3xl flex items-center justify-center mx-auto mb-6 transition-all duration-300`}>
                        {style.icon}
                    </div>
                    <h3 className="text-xl font-black text-text-primary mb-3">{title}</h3>
                    <p className="text-sm text-text-secondary font-medium leading-relaxed mb-8">
                        {message}
                    </p>

                    {showNoteInput && (
                        <div className="mb-8 text-left">
                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-wider mb-2">
                                Approval Note
                            </label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder={notePlaceholder}
                                className="w-full bg-app-background border border-border-default rounded-2xl p-4 text-sm text-text-primary focus:outline-none focus:border-primary-500 transition-all resize-none min-h-[100px]"
                                autoFocus
                            />
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-4 bg-muted-bg text-text-secondary rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-hover transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isSubmitting}
                            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 ${style.button} text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg disabled:opacity-50`}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : null}
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
