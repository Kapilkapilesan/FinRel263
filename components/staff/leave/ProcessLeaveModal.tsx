'use client';

import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { colors } from '@/themes/colors';

interface ProcessLeaveModalProps {
    status: 'Approved' | 'Rejected';
    userName: string;
    onClose: () => void;
    onConfirm: (reason?: string) => Promise<void>;
}

export const ProcessLeaveModal: React.FC<ProcessLeaveModalProps> = ({
    status,
    userName,
    onClose,
    onConfirm
}) => {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (status === 'Rejected' && !reason.trim()) {
            return;
        }

        setIsSubmitting(true);
        try {
            await onConfirm(status === 'Rejected' ? reason : undefined);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isRejected = status === 'Rejected';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-card rounded-[2rem] max-w-md w-full shadow-2xl overflow-hidden border border-border-default animate-in zoom-in duration-300">
                <div
                    className="p-8 flex flex-col items-center text-center"
                    style={{ backgroundColor: isRejected ? `${colors.danger[500]}10` : `${colors.primary[500]}10` }}
                >
                    <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg border"
                        style={{
                            backgroundColor: isRejected ? `${colors.danger[500]}20` : `${colors.primary[500]}20`,
                            borderColor: isRejected ? `${colors.danger[500]}30` : `${colors.primary[500]}30`,
                            color: isRejected ? colors.danger[600] : colors.primary[600]
                        }}
                    >
                        {isRejected ? <XCircle className="w-10 h-10" /> : <CheckCircle className="w-10 h-10" />}
                    </div>
                    <h3 className="text-2xl font-black text-text-primary tracking-tight">
                        {isRejected ? 'Reject Leave Request' : 'Approve Leave Request'}
                    </h3>
                    <p className="text-text-muted mt-3 font-medium text-sm leading-relaxed px-2">
                        Are you sure you want to {status.toLowerCase()} the leave request for <span className="font-black text-text-primary underline decoration-primary-500/30">{userName}</span>?
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {isRejected && (
                        <div className="space-y-3 pb-2">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">
                                Rejection Reason <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={3}
                                placeholder="Please explain the reason for rejection..."
                                className="w-full px-5 py-4 bg-input border border-border-input rounded-2xl outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 text-text-primary text-sm font-medium resize-none transition-all placeholder:italic"
                                required
                            />
                        </div>
                    )}

                    {!isRejected && (
                        <div
                            className="flex items-start gap-4 p-5 border rounded-2xl text-xs font-bold leading-relaxed shadow-sm italic"
                            style={{ backgroundColor: `${colors.primary[500]}10`, borderColor: `${colors.primary[500]}20`, color: colors.primary[600] }}
                        >
                            <AlertCircle className="w-5 h-5 flex-shrink-0 opacity-80" />
                            <p>Important: Once approved, the employee's attendance dashboard for these specific dates will be automatically updated to "Leave".</p>
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 border border-border-divider text-text-secondary rounded-2xl hover:bg-hover font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || (isRejected && !reason.trim())}
                            className="flex-1 px-6 py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
                            style={{
                                backgroundColor: isRejected ? colors.danger[600] : colors.primary[600],
                                boxShadow: isRejected ? `0 15px 30px -5px ${colors.danger[600]}40` : `0 15px 30px -5px ${colors.primary[600]}40`
                            }}
                        >
                            {isSubmitting ? 'Processing...' : (isRejected ? 'Confirm Rejection' : 'Confirm Approval')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
