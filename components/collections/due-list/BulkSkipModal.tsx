import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Calendar, Loader2, Check, CheckSquare, Square, ChevronDown } from 'lucide-react';
import { dueListService } from '@/services/dueList.service';

interface BulkSkipModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (centerId: string, dates: string[], reason: string) => Promise<void>;
    centers: any[];
}

export function BulkSkipModal({ isOpen, onClose, onConfirm, centers }: BulkSkipModalProps) {
    const [centerId, setCenterId] = useState('');
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [availableDates, setAvailableDates] = useState<{ date: string, count: number, day_name: string }[]>([]);
    const [isLoadingDates, setIsLoadingDates] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCenterId('');
            setSelectedDates([]);
            setReason('');
            setAvailableDates([]);
        }
    }, [isOpen]);

    useEffect(() => {
        const fetchDates = async () => {
            if (!centerId) {
                setAvailableDates([]);
                return;
            }
            setIsLoadingDates(true);
            try {
                // Fetch for next 30 days
                const today = new Date();
                const nextMonth = new Date();
                nextMonth.setDate(today.getDate() + 30);

                const data = await dueListService.getPendingDueDates(
                    centerId,
                    today.toISOString().split('T')[0],
                    nextMonth.toISOString().split('T')[0]
                );
                setAvailableDates(data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoadingDates(false);
            }
        };
        fetchDates();
    }, [centerId]);

    const toggleDate = (date: string) => {
        setSelectedDates(prev =>
            prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
        );
    };

    const isAllSelected = availableDates.length > 0 && selectedDates.length === availableDates.length;

    const toggleAll = () => {
        if (isAllSelected) {
            setSelectedDates([]);
        } else {
            setSelectedDates(availableDates.map(d => d.date));
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!centerId || selectedDates.length === 0 || !reason) return;

        setIsSubmitting(true);
        try {
            await onConfirm(centerId, selectedDates, reason);
            onClose();
        } catch (error) {
            // Error is handled by parent, but we catch here to stop loading state if needed
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with Blur */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all flex flex-col max-h-[90vh] border border-border-default">

                {/* Header */}
                <div className="px-6 py-5 border-b border-border-default flex items-center justify-between bg-card z-10">
                    <div>
                        <h3 className="text-xl font-bold text-text-primary">Bulk Skip Due Dates</h3>
                        <p className="text-sm text-text-muted mt-1">Manage bulk schedule adjustments</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-text-muted hover:bg-muted-bg hover:text-text-primary transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
                    <form id="bulk-skip-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* Info Alert */}
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-sm text-amber-600">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />
                            <div className="leading-relaxed">
                                <span className="font-semibold block mb-1 text-amber-500">Impact Warning</span>
                                <span className="text-text-secondary">Selected dates will be skipped for <strong className="font-bold text-text-primary">ALL</strong> loans in the center.
                                    Due dates shift automatically to their next cycle (e.g. Weekly +1 week).</span>
                            </div>
                        </div>

                        {/* Center Selection */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-text-primary">
                                Target Center <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={centerId}
                                    onChange={(e) => {
                                        setCenterId(e.target.value);
                                        setSelectedDates([]);
                                    }}
                                    className="w-full appearance-none rounded-xl border border-border-default bg-input px-4 py-3 text-sm text-text-primary focus:bg-card focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                    required
                                >
                                    <option value="">Select a Center...</option>
                                    {centers.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.center_name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 w-5 h-5 text-text-muted pointer-events-none" />
                            </div>
                        </div>

                        {/* Date Checklist */}
                        {centerId && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex justify-between items-center px-1">
                                    <label className="block text-sm font-semibold text-text-primary">
                                        Select Dates to Skip <span className="text-red-500">*</span>
                                    </label>
                                    {availableDates.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={toggleAll}
                                            className="text-xs text-indigo-500 hover:text-indigo-400 font-semibold px-2 py-1 rounded hover:bg-indigo-500/10 transition-colors"
                                        >
                                            {isAllSelected ? 'Deselect All' : 'Select All'}
                                        </button>
                                    )}
                                </div>

                                <div className="border border-border-default rounded-xl overflow-hidden bg-card max-h-64 overflow-y-auto">
                                    {isLoadingDates ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-text-muted gap-2">
                                            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                                            <span className="text-sm">Fetching schedules...</span>
                                        </div>
                                    ) : availableDates.length === 0 ? (
                                        <div className="text-center py-8 text-text-muted text-sm bg-muted-bg/50">
                                            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            No upcoming due dates found.
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-border-divider">
                                            {availableDates.map((item) => {
                                                const isSelected = selectedDates.includes(item.date);
                                                return (
                                                    <div
                                                        key={item.date}
                                                        className={`flex items-center p-3.5 hover:bg-muted-bg cursor-pointer transition-colors group ${isSelected ? 'bg-indigo-500/10 hover:bg-indigo-500/20' : ''}`}
                                                        onClick={() => toggleDate(item.date)}
                                                    >
                                                        <div className={`mr-4 transition-transform ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}>
                                                            {isSelected ? (
                                                                <div className="bg-indigo-600 text-white rounded shadow-sm p-0.5">
                                                                    <Check size={14} strokeWidth={3} />
                                                                </div>
                                                            ) : (
                                                                <div className="w-5 h-5 border-2 border-border-default rounded bg-card group-hover:border-text-muted/60" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center mb-0.5">
                                                                <span className={`font-semibold text-sm ${isSelected ? 'text-indigo-500' : 'text-text-primary'}`}>
                                                                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                </span>
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${isSelected ? 'bg-indigo-500/20 text-indigo-500' : 'bg-muted-bg text-text-muted'}`}>
                                                                    {item.day_name.slice(0, 3)}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-text-muted flex items-center gap-1.5">
                                                                <span className="font-medium text-text-secondary">{item.count}</span> loans due this day
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Reason */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-text-primary">
                                Reason for Skipping <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full rounded-xl border border-border-default bg-input px-4 py-3 text-sm text-text-primary focus:bg-card focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none resize-none"
                                rows={3}
                                placeholder="E.g., Public Holiday, Center Closure..."
                                required
                            />
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border-default bg-muted-bg/50 flex justify-end gap-3 flex-shrink-0 z-10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-semibold text-text-secondary bg-card border border-border-default rounded-xl hover:bg-muted-bg hover:border-border-default/80 transition-all shadow-sm"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="bulk-skip-form"
                        className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all flex items-center gap-2"
                        disabled={isSubmitting || !centerId || selectedDates.length === 0 || !reason}
                    >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isSubmitting ? 'Processing...' : selectedDates.length > 0 ? `Skip ${selectedDates.length} Date${selectedDates.length > 1 ? 's' : ''}` : 'Confirm Bulk Skip'}
                    </button>
                </div>
            </div>
        </div>
    );
}
