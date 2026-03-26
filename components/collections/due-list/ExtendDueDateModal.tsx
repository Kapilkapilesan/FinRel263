'use client'

import React, { useState } from 'react';
import { X, Calendar, AlertCircle } from 'lucide-react';
import { colors } from '@/themes/colors';
import { DuePayment } from './DueListTable';
import { dueListService } from '@/services/dueList.service';

interface ExtendDueDateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    payment: DuePayment | null;
    originalDate: string;
}

export function ExtendDueDateModal({
    isOpen,
    onClose,
    onSuccess,
    payment,
    originalDate,
}: ExtendDueDateModalProps) {
    const [newDate, setNewDate] = useState('');
    const [reason, setReason] = useState('');
    const [actionType, setActionType] = useState<'move' | 'skip'>('skip');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen || !payment) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!reason.trim()) {
            setError('Please provide a reason for the extension');
            return;
        }

        try {
            setIsLoading(true);
            await dueListService.extendDueDate(
                payment.id,
                originalDate,
                null, // No newDate for skip
                reason,
                'skip'
            );
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to skip due date');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative bg-card rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-border-default">
                {/* Header */}
                <div className="bg-muted-bg border-b border-border-default px-6 py-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-text-primary">Skip Due Date</h3>
                        <p className="text-xs text-text-muted mt-1">
                            {payment.customer} - {payment.contractNo}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted-bg rounded-full transition-colors text-text-muted hover:text-text-primary"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-card">
                    {/* Info Alert */}
                    <div className="border rounded-lg p-3 flex items-start gap-3 bg-rose-500/10 border-rose-500/20">
                        <Calendar className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
                        <div>
                            <p className="text-sm font-medium text-rose-500">
                                Skipping Due Date
                            </p>
                            <p className="text-sm text-text-secondary">
                                Payment for {new Date(originalDate).toLocaleDateString()} will be waived and moved to the end of the term.
                            </p>
                            <p className="text-xs text-rose-500 mt-1 font-medium">
                                No penalty will be applied. Loan term will extend by one cycle.
                            </p>
                        </div>
                    </div>

                    {/* Reason Input */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">
                            Reason for Skipping
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Please explain why the due date is being skipped..."
                            rows={3}
                            className="w-full px-3 py-2 border border-border-default bg-input text-text-primary rounded-lg focus:ring-2 outline-none transition-all resize-none placeholder:text-text-muted/40"
                            style={{ '--tw-ring-color': `${colors.primary[500]}1A` } as any}
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 text-rose-500 bg-rose-500/10 p-3 rounded-lg text-sm border border-rose-500/20">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-text-secondary bg-muted-bg hover:bg-muted-bg/80 border border-border-default rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-500/20"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                'Confirm Skip'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
