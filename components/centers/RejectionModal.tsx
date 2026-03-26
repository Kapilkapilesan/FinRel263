import React, { useState } from 'react';
import { X, AlertCircle, Send, Loader2 } from 'lucide-react';
import { colors } from '../../themes/colors';

interface RejectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
    centerName: string;
}

export function RejectionModal({ isOpen, onClose, onConfirm, centerName }: RejectionModalProps) {
    const [reason, setReason] = useState('Requirements not met. Please recreate with correct documents.');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) return;

        setIsSubmitting(true);
        try {
            await onConfirm(reason);
            onClose();
        } catch (error) {
            console.error('Rejection failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-border-default">
                {/* Header */}
                <div className="px-6 py-4 border-b border-border-divider flex items-center justify-between bg-card sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-text-primary leading-tight">Reject Center</h2>
                            <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">{centerName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-hover rounded-full transition-colors text-text-muted"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                                <Send size={12} className="opacity-50" />
                                Rejection Message
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Explain why this center is being rejected..."
                                className="w-full min-h-[120px] p-4 bg-input border border-border-default rounded-xl text-sm text-text-secondary focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 transition-all outline-none resize-none font-bold italic"
                                required
                                autoFocus
                            />
                            <p className="text-[10px] text-text-muted font-bold italic opacity-60">
                                * This message will be shown to the Field Officer for rectification.
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-table-header border-t border-border-divider flex items-center justify-end gap-3 transition-colors pb-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-text-secondary rounded-xl text-xs font-black hover:bg-hover border border-border-divider transition-all"
                        >
                            Back
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !reason.trim()}
                            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl text-xs font-black hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <X size={14} />
                            )}
                            Reject Center
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
