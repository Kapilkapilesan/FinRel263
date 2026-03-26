'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Eraser, AlertCircle } from 'lucide-react';
import { LeaveRequestFormData, LeaveRequest } from '@/types/leave.types';
import { toast } from 'react-toastify';
import { colors } from '@/themes/colors';
import Holidays from 'date-holidays';

interface LeaveRequestModalProps {
    onClose: () => void;
    onSubmit: (data: LeaveRequestFormData) => Promise<void>;
    initialData?: LeaveRequest;
    isViewOnly?: boolean;
}

interface ValidationErrors {
    dates?: string;
    reason?: string;
    leaveType?: string;
}

export const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({ onClose, onSubmit, initialData, isViewOnly }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDates, setSelectedDates] = useState<string[]>(initialData?.leaveDates || []);
    const [formData, setFormData] = useState<Partial<LeaveRequestFormData>>({
        leaveType: initialData?.leaveType || 'Annual Leave',
        dayType: initialData?.dayType || 'Full Day',
        reason: initialData?.reason || ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [touched, setTouched] = useState<{ reason?: boolean; dates?: boolean }>({});

    // Initialize Sri Lankan holidays using date-holidays library
    const hd = useMemo(() => {
        const holidays = new Holidays('LK'); // LK = Sri Lanka
        return holidays;
    }, []);

    // Get holidays for current year and next year
    const sriLankanHolidays = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const thisYearHolidays = hd.getHolidays(currentYear) || [];
        const nextYearHolidays = hd.getHolidays(currentYear + 1) || [];
        return [...thisYearHolidays, ...nextYearHolidays];
    }, [hd]);

    // Helpers
    const isWeekend = (date: Date) => {
        const day = date.getDay();
        return day === 0 || day === 6; // Sunday or Saturday
    };

    const getHoliday = (date: Date) => {
        const dateStr = formatDate(date);
        return sriLankanHolidays.find(h => h.date.startsWith(dateStr));
    };

    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Real-time validation
    const validate = (): ValidationErrors => {
        const newErrors: ValidationErrors = {};

        if (selectedDates.length === 0) {
            newErrors.dates = 'Please select at least one date';
        }

        if (!formData.reason || formData.reason.trim().length < 3) {
            newErrors.reason = 'Reason must be at least 3 characters';
        }

        if (formData.leaveType === 'Annual Leave' && selectedDates.length > 0) {
            const sorted = [...selectedDates].sort();
            const firstDate = new Date(sorted[0]);
            firstDate.setHours(0, 0, 0, 0);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Calculate difference in full calendar days
            const diffInTime = firstDate.getTime() - today.getTime();
            const diffInDays = Math.floor(diffInTime / (1000 * 60 * 60 * 24));

            if (diffInDays < 2) {
                newErrors.dates = 'Annual leave must be requested at least 2 days in advance (Earliest allowed: ' +
                    new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ')';
            }
        }

        return newErrors;
    };

    // Run validation whenever form data changes
    useEffect(() => {
        const newErrors = validate();
        setErrors(newErrors);
    }, [selectedDates, formData.reason, formData.leaveType]);

    const toggleDate = (date: Date) => {
        if (isViewOnly) return;
        const holiday = getHoliday(date);
        if (isWeekend(date)) {
            toast.warn("Weekends cannot be selected");
            return;
        }
        if (holiday) {
            toast.warn(`${holiday.name} is a public holiday`);
            return;
        }
        if (date < new Date(new Date().setHours(0, 0, 0, 0))) {
            toast.warn("Cannot select past dates");
            return;
        }

        const dateStr = formatDate(date);
        setSelectedDates(prev =>
            prev.includes(dateStr)
                ? prev.filter(d => d !== dateStr)
                : [...prev, dateStr]
        );
        setTouched(prev => ({ ...prev, dates: true }));
    };

    const handleBulkSelect = (type: 'week' | '2weeks' | 'month') => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        let daysToSelect = 0;
        if (type === 'week') daysToSelect = 7;
        else if (type === '2weeks') daysToSelect = 14;
        else if (type === 'month') daysToSelect = 30;

        const newDates = new Set([...selectedDates]);
        for (let i = 0; i < daysToSelect; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            if (!isWeekend(d) && !getHoliday(d)) {
                newDates.add(formatDate(d));
            }
        }
        setSelectedDates(Array.from(newDates));
        setTouched(prev => ({ ...prev, dates: true }));
    };

    const clearSelection = () => {
        setSelectedDates([]);
        setTouched(prev => ({ ...prev, dates: true }));
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const lastDay = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();

        const days = [];
        for (let i = 0; i < (firstDay === 0 ? 0 : firstDay); i++) {
            days.push(null);
        }
        for (let i = 1; i <= lastDay; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFormData({ ...formData, reason: e.target.value });
        setTouched(prev => ({ ...prev, reason: true }));
    };

    const renderCalendar = () => {
        const days = getDaysInMonth(currentMonth);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        return (
            <div className="bg-input/40 rounded-2xl p-5 border border-border-divider">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="font-extrabold text-text-primary tracking-tight">
                        {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h4>
                    <div className="flex gap-1.5">
                        <button
                            type="button"
                            onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                            className="p-2 hover:bg-hover rounded-xl border border-border-divider shadow-sm transition-all"
                        >
                            <ChevronLeft className="w-4 h-4 text-text-muted" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                            className="p-2 hover:bg-hover rounded-xl border border-border-divider shadow-sm transition-all"
                        >
                            <ChevronRight className="w-4 h-4 text-text-muted" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center font-black">
                    {dayNames.map(d => (
                        <div key={d} className="text-[10px] font-black text-text-muted uppercase py-2 tracking-widest">{d}</div>
                    ))}
                    {days.map((day, i) => {
                        if (!day) return <div key={`empty-${i}`} className="h-9" />;

                        const isSelected = selectedDates.includes(formatDate(day));
                        const weekend = isWeekend(day);
                        const holiday = getHoliday(day);
                        const isToday = formatDate(day) === formatDate(new Date());
                        const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

                        // Disable Jan 11 and Jan 12 if leaveType is Annual Leave and today is Jan 11
                        let isRestricted = false;
                        if (formData.leaveType === 'Annual Leave') {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const checkDate = new Date(day);
                            checkDate.setHours(0, 0, 0, 0);
                            const diffDays = Math.floor((checkDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                            if (diffDays < 2 && diffDays >= 0) {
                                isRestricted = true;
                            }
                        }

                        return (
                            <button
                                key={day.getTime()}
                                type="button"
                                disabled={isViewOnly || weekend || isPast || !!holiday || isRestricted}
                                onClick={() => toggleDate(day)}
                                title={holiday ? holiday.name : weekend ? 'Weekend' : isRestricted ? 'Annual leave requires 2 days notice' : undefined}
                                className={`
                                    h-10 rounded-xl text-sm flex items-center justify-center transition-all relative group font-bold
                                    ${weekend ? 'bg-rose-500/5 text-rose-300 cursor-not-allowed opacity-40' :
                                        holiday ? 'bg-orange-500/5 text-orange-400 cursor-not-allowed border-dashed border border-orange-500/20' :
                                            isRestricted ? 'bg-input text-text-muted cursor-not-allowed opacity-40' :
                                                isPast ? 'text-text-muted cursor-not-allowed opacity-30 shadow-inner' :
                                                    isSelected ? 'text-white font-black shadow-lg scale-105 z-10' :
                                                        'hover:bg-white dark:hover:bg-gray-800 text-text-primary border border-transparent hover:border-border-divider hover:shadow-sm'}
                                    ${isToday && !isSelected ? 'border-2' : ''}
                                `}
                                style={{
                                    backgroundColor: isSelected ? colors.primary[600] : undefined,
                                    borderColor: (isToday && !isSelected) ? colors.primary[500] : undefined,
                                    color: (isToday && !isSelected) ? colors.primary[600] : undefined,
                                    boxShadow: isSelected ? `0 4px 6px -1px ${colors.primary[500]}33` : undefined
                                }}
                            >
                                {day.getDate()}
                                {holiday && (
                                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full border border-white dark:border-gray-800 shadow-sm" />
                                )}
                                {isToday && !isSelected && (
                                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary-500" />
                                )}
                                {holiday && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20">
                                        {holiday.name}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Mark all fields as touched
        setTouched({ reason: true, dates: true });

        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            const sortedDates = [...selectedDates].sort();
            await onSubmit({
                ...formData,
                leaveDates: sortedDates,
                startDate: sortedDates[0],
                endDate: sortedDates[sortedDates.length - 1],
                totalDays: sortedDates.length,
            } as LeaveRequestFormData);
            onClose();
        } catch (error) {
            console.error("Failed to submit leave request", error);
        } finally {
            setLoading(false);
        }
    };

    const isFormValid = Object.keys(errors).length === 0 && selectedDates.length > 0 && (formData.reason?.trim().length || 0) >= 3;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="bg-card rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300 border border-border-default">
                {/* Header */}
                <div
                    className="flex items-center justify-between p-8 border-b border-border-divider bg-table-header"
                >
                    <div>
                        <h3 className="text-2xl font-black text-text-primary flex items-center gap-4">
                            <span className="p-3 rounded-2xl text-white bg-primary-600 shadow-lg shadow-primary-500/20">
                                <CalendarIcon className="w-6 h-6" />
                            </span>
                            {isViewOnly ? 'View Leave Request' : initialData ? 'Edit Leave Request' : 'Request Leave'}
                        </h3>
                        <p className="text-sm text-text-muted mt-2 ml-16 font-medium italic">
                            {isViewOnly ? 'Reviewing the details of this leave request' : initialData ? 'Update your pending leave details' : 'Sri Lankan public holidays are automatically disabled'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-hover rounded-full transition-all text-text-muted">
                        <X className="w-7 h-7" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Left Column: Calendar & Fast Select */}
                        <div className="space-y-6">
                            <div className="flex flex-col gap-5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-black text-text-muted uppercase tracking-[0.2em] ml-1">Select Dates</label>
                                    {!isViewOnly && (
                                        <button
                                            type="button"
                                            onClick={clearSelection}
                                            className="text-[11px] font-black text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors uppercase tracking-widest"
                                        >
                                            <Eraser className="w-3 h-3" />
                                            Clear History
                                        </button>
                                    )}
                                </div>
                                {renderCalendar()}

                                {/* Real-time date validation error */}
                                {touched.dates && errors.dates && (
                                    <div className="flex items-center gap-2 text-rose-500 text-[11px] font-bold bg-rose-500/10 px-4 py-3 rounded-xl border border-rose-500/20 shadow-inner italic">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        {errors.dates}
                                    </div>
                                )}
                            </div>

                            {!isViewOnly && (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Quick Selection</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { id: 'week', label: '1 Week', icon: '📅' },
                                            { id: '2weeks', label: '2 Weeks', icon: '🗓️' },
                                            { id: 'month', label: '1 Month', icon: '🚀' }
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => handleBulkSelect(opt.id as any)}
                                                className="px-3 py-4 bg-input border border-border-input rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-secondary transition-all flex flex-col items-center gap-2 hover:border-primary-500/50 hover:bg-input/60 shadow-sm"
                                            >
                                                <span className="text-xl">{opt.icon}</span>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Settings & Reason */}
                        <div className="space-y-8">
                            {/* Selected Summary */}
                            <div
                                className="rounded-[1.5rem] p-6 text-white shadow-xl transition-all"
                                style={selectedDates.length > 0 ? { backgroundColor: colors.primary[600], boxShadow: `0 20px 25px -5px ${colors.primary[500]}33` } : { backgroundColor: colors.gray[400] }}
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs font-bold uppercase tracking-wider opacity-70">Selection Summary</span>
                                    <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                                        {formData.dayType}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black">{selectedDates.length}</span>
                                    <span className="text-lg font-bold opacity-80">{selectedDates.length === 1 ? 'Working Day' : 'Working Days'}</span>
                                </div>
                                <div className="mt-5 flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                                    {selectedDates.sort().map(d => {
                                        const [year, month, day] = d.split('-');
                                        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                                        const displayDate = `${day} ${monthNames[parseInt(month) - 1]}`;
                                        return (
                                            <span key={d} className="bg-white/10 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter whitespace-nowrap shadow-sm border border-white/5">
                                                {displayDate}
                                            </span>
                                        );
                                    })}
                                    {selectedDates.length === 0 && <span className="text-xs font-bold opacity-60 italic">Please select your leave dates from the calendar...</span>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Leave Category</label>
                                    <select
                                        disabled={isViewOnly}
                                        className="w-full px-5 py-4 border border-border-input rounded-2xl bg-input transition-all outline-none font-black text-xs uppercase tracking-widest text-text-primary focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 appearance-none cursor-pointer"
                                        value={formData.leaveType}
                                        onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                                    >
                                        <option>Annual Leave</option>
                                        <option>Sick Leave</option>
                                        <option>Casual Leave</option>
                                        <option>Maternity Leave</option>
                                        <option>Unpaid Leave</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Day Format</label>
                                    <div className={`grid grid-cols-2 gap-2 p-1.5 bg-input border border-border-divider rounded-[1.2rem] ${isViewOnly ? 'pointer-events-none opacity-80' : ''}`}>
                                        {['Full Day', 'Half Day'].map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => !isViewOnly && setFormData({ ...formData, dayType: type as any })}
                                                className={`py-2.5 px-4 rounded-[0.9rem] text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95`}
                                                style={formData.dayType === type ? { backgroundColor: 'var(--card-bg)', color: colors.primary[600], border: `1px solid var(--border-divider)` } : { color: 'var(--text-muted)' }}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Reason for Leave</label>
                                <textarea
                                    readOnly={isViewOnly}
                                    rows={4}
                                    className={`w-full px-5 py-4 border rounded-[1.5rem] bg-input outline-none resize-none text-[13px] font-medium transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 ${touched.reason && errors.reason
                                        ? 'border-rose-500/50 text-rose-600'
                                        : 'border-border-input text-text-primary'
                                        } ${isViewOnly ? 'opacity-80' : ''}`}
                                    placeholder="Briefly explain the nature of this request..."
                                    value={formData.reason}
                                    onChange={handleReasonChange}
                                ></textarea>

                                {/* Real-time reason validation error */}
                                {touched.reason && errors.reason && (
                                    <div className="flex items-center gap-2 text-rose-500 text-[11px] font-bold italic px-1">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        {errors.reason}
                                    </div>
                                )}

                                {/* Character counter */}
                                <div className="text-right text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60">
                                    {formData.reason?.length || 0} / 500 characters
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                {!isViewOnly && (
                    <div className="p-8 border-t border-border-divider bg-table-header flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-8 py-4.5 border border-border-input text-text-secondary rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-hover transition-all shadow-sm active:scale-95"
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !isFormValid}
                            className="flex-[2] px-8 py-4.5 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group flex items-center justify-center gap-3 active:scale-[0.98]"
                            style={{
                                backgroundColor: colors.primary[600],
                                boxShadow: isFormValid ? `0 20px 40px -10px ${colors.primary[600]}60` : 'none'
                            }}
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {initialData ? 'Update Request' : 'Submit Selection'}
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
