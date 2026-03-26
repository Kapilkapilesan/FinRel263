'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    UserPlus,
    ShieldCheck,
    Clock,
    CheckCircle,
    XCircle,
    Plus,
    X,
    Building2,
    Search,
    Calendar,
    FileText,
    ChevronDown,
    Eye,
    AlertCircle,
    Loader2,
    Check,
    Ban,
} from 'lucide-react';
import { branchService } from '@/services/branch.service';
import { staffService } from '@/services/staff.service';
import { tempCashierService, TempCashierRequestData, TempCashierStats } from '@/services/tempCashier.service';
import { authService } from '@/services/auth.service';
import { toast } from 'react-toastify';
import { ActionConfirmModal } from '../common/ActionConfirmModal';

// Types
interface BranchOption {
    id: number;
    branch_id: string;
    branch_name: string;
    location: string;
}

interface CashierOption {
    id: number | string;
    name: string;
    staffId?: string;
    role?: string;
    branch?: string;
    branchId?: string | number;
}

type TempCashierTab = 'request-cashier' | 'accept-cashier';

// === Searchable Select Component ===
interface SearchableSelectProps {
    label: string;
    subLabel?: string;
    icon: React.ReactNode;
    placeholder: string;
    searchPlaceholder?: string;
    options: { value: string; label: string; sublabel?: string }[];
    value: string;
    onChange: (value: string) => void;
    loading?: boolean;
    disabled?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
    label,
    subLabel,
    icon,
    placeholder,
    searchPlaceholder = 'Search...',
    options,
    value,
    onChange,
    loading = false,
    disabled = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find((o) => o.value === value);

    const filtered = options.filter(
        (o) =>
            o.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.sublabel && o.sublabel.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <span className="text-text-muted">{icon}</span>
                <div>
                    <label className="text-sm font-semibold text-text-primary">{label}</label>
                    {subLabel && <p className="text-xs text-text-muted">{subLabel}</p>}
                </div>
            </div>
            <div className="relative" ref={containerRef}>
                <button
                    type="button"
                    onClick={() => { if (!disabled) setIsOpen(!isOpen); }}
                    disabled={disabled}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-sm
                        ${isOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-border-default'}
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400'}
                        bg-card text-text-primary`}
                >
                    <span className={selectedOption ? 'text-text-primary' : 'text-text-muted'}>
                        {loading ? 'Loading...' : selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronDown size={16} className={`text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <div className="absolute z-50 mt-2 w-full bg-card border border-border-default rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-3 border-b border-border-default">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={searchPlaceholder}
                                    className="w-full pl-9 pr-3 py-2 text-sm bg-app-background border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto custom-scrollbar">
                            {filtered.length === 0 ? (
                                <div className="p-4 text-center text-text-muted text-sm">No results found</div>
                            ) : (
                                filtered.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                            setSearchTerm('');
                                        }}
                                        className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-hover
                                            ${option.value === value ? 'bg-blue-500/10 text-blue-500 font-medium' : 'text-text-primary'}`}
                                    >
                                        <div>{option.label}</div>
                                        {option.sublabel && (
                                            <div className="text-xs text-text-muted mt-0.5">{option.sublabel}</div>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// === Assign Temp Cashier Modal ===
interface AssignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
}

const AssignTempCashierModal: React.FC<AssignModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [branches, setBranches] = useState<BranchOption[]>([]);
    const [cashiers, setCashiers] = useState<CashierOption[]>([]);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [loadingCashiers, setLoadingCashiers] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [targetBranchId, setTargetBranchId] = useState('');
    const [selectedCashierId, setSelectedCashierId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [notes, setNotes] = useState('');

    const [currentUser, setCurrentUser] = useState<any>(null);
    const isAdmin = currentUser && (authService.hasRole('super_admin') || authService.hasRole('admin'));
    const userHasNoBranch = currentUser && !(currentUser.branch_id || currentUser.branch?.id);

    // Fetch branches and current user on mount
    useEffect(() => {
        if (isOpen) {
            fetchBranches();
            const user = authService.getCurrentUser();
            setCurrentUser(user);
            const branchId = user?.branch_id || user?.branch?.id;
            if (branchId) {
                setTargetBranchId(String(branchId));
            }
        }
    }, [isOpen]);

    // Fetch cashiers when branch selection changes (to filter them)
    useEffect(() => {
        if (selectedBranchId) {
            fetchCashiers(selectedBranchId);
        } else {
            setCashiers([]); // Clear cashiers if no branch selected
        }
    }, [selectedBranchId]);

    const fetchBranches = async () => {
        setLoadingBranches(true);
        try {
            const data = await branchService.getBranchesDropdown();
            setBranches(
                data.map((b: any) => ({
                    id: b.id,
                    branch_id: b.branch_id,
                    branch_name: b.branch_name,
                    location: b.location || '',
                }))
            );
        } catch (err) {
            console.error('Error fetching branches:', err);
            toast.error('Failed to load branches');
        } finally {
            setLoadingBranches(false);
        }
    };

    const fetchCashiers = async (branchId?: string) => {
        if (!branchId) return; // Don't fetch if no branchId provided
        setLoadingCashiers(true);
        try {
            const params: any = { role: 'cashier', per_page: 1000, ignore_hierarchy: 1 };
            params.branch_id = branchId;

            const data = await staffService.getUsers('staff', params);
            setCashiers(
                data.map((u: any) => ({
                    id: u.id,
                    name: u.name || u.userName || 'Unknown',
                    staffId: u.staffId || u.userName,
                    role: u.role || 'Cashier',
                    branch: u.branch || '',
                    branchId: u.branchId || '',
                }))
            );
        } catch (err) {
            console.error('Error fetching cashiers:', err);
            toast.error('Failed to load cashiers');
        } finally {
            setLoadingCashiers(false);
        }
    };

    const handleCashierChange = (cashierId: string) => {
        setSelectedCashierId(cashierId);
        const cashier = cashiers.find(c => String(c.id) === cashierId);
        if (cashier && cashier.branchId) {
            setSelectedBranchId(String(cashier.branchId));
        }
    };

    const resetForm = () => {
        const branchId = currentUser?.branch_id || currentUser?.branch?.id;
        setSelectedBranchId('');
        setTargetBranchId(branchId ? String(branchId) : '');
        setSelectedCashierId('');
        setStartDate('');
        setEndDate('');
        setStartTime('');
        setEndTime('');
        setNotes('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!selectedBranchId || !selectedCashierId || !startDate || !endDate || !startTime || !endTime || (!targetBranchId && (isAdmin || userHasNoBranch))) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (new Date(endDate) < new Date(startDate)) {
            toast.error('End date cannot be before start date');
            return;
        }

        setSubmitting(true);

        try {
            await tempCashierService.create({
                cashier_user_id: parseInt(selectedCashierId),
                from_branch_id: parseInt(selectedBranchId),
                to_branch_id: targetBranchId ? parseInt(targetBranchId) : undefined,
                start_date: startDate,
                end_date: endDate,
                start_time: startTime,
                end_time: endTime,
                notes: notes || undefined,
            });

            toast.success('Temporary cashier request submitted successfully!');
            onSubmit();
            handleClose();
        } catch (err: any) {
            toast.error(err.message || 'Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const branchOptions = branches.map((b) => ({
        value: String(b.id),
        label: b.branch_name,
        sublabel: b.location || b.branch_id,
    }));

    const cashierOptions = cashiers.map((c) => ({
        value: String(c.id),
        label: c.name,
        sublabel: `${c.role}${c.branch ? ' • ' + c.branch : ''}`,
    }));

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg mx-4 bg-card border border-border-default rounded-2xl shadow-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border-default">
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">Assign Temporary Cashier</h2>
                        <p className="text-xs text-text-muted mt-0.5">Assign a cashier from your branch or another branch temporarily</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg hover:bg-hover transition-colors text-text-muted hover:text-text-primary"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
                    <div className="flex flex-col gap-5">
                        {/* Target Branch (Only for Admins or if user has no branch) */}
                        {(isAdmin || userHasNoBranch) && (
                            <SearchableSelect
                                label="Target Branch (Requesting Branch)"
                                subLabel="Branch that will receive the temporary cashier"
                                icon={<Building2 size={16} className="text-blue-500" />}
                                placeholder="Select target branch"
                                searchPlaceholder="Search branches..."
                                options={branchOptions}
                                value={targetBranchId}
                                onChange={setTargetBranchId}
                                loading={loadingBranches}
                            />
                        )}

                        {/* Select Branch */}
                        <SearchableSelect
                            label="Select Branch"
                            subLabel="Select the branch from which to assign a cashier"
                            icon={<Building2 size={16} />}
                            placeholder="Select a branch"
                            searchPlaceholder="Search branches..."
                            options={branchOptions}
                            value={selectedBranchId}
                            onChange={(id) => {
                                setSelectedBranchId(id);
                                setSelectedCashierId(''); // Reset cashier when branch changes
                            }}
                            loading={loadingBranches}
                        />

                        {/* Select Cashier */}
                        <SearchableSelect
                            label="Select Cashier"
                            subLabel="Choose a cashier from the selected branch"
                            icon={<UserPlus size={16} />}
                            placeholder="Select a cashier"
                            searchPlaceholder="Search cashiers..."
                            options={cashierOptions}
                            value={selectedCashierId}
                            onChange={(id) => {
                                setSelectedCashierId(id);
                            }}
                            loading={loadingCashiers}
                            disabled={!selectedBranchId && !loadingCashiers && cashiers.length === 0}
                        />

                        {/* Date Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-text-muted" />
                                    <label className="text-sm font-semibold text-text-primary">Start Date</label>
                                </div>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-border-default bg-card text-text-primary text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-text-muted" />
                                    <label className="text-sm font-semibold text-text-primary">End Date</label>
                                </div>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    min={startDate}
                                    className="w-full px-4 py-3 rounded-xl border border-border-default bg-card text-text-primary text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Time Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-text-muted" />
                                    <label className="text-sm font-semibold text-text-primary">Start Time</label>
                                </div>
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-border-default bg-card text-text-primary text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-text-muted" />
                                    <label className="text-sm font-semibold text-text-primary">End Time</label>
                                </div>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-border-default bg-card text-text-primary text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Reason */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <FileText size={16} className="text-text-muted" />
                                <label className="text-sm font-semibold text-text-primary">Reason</label>
                            </div>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Enter the reason for this temporary assignment..."
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-border-default bg-card text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                                required
                            />
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-default">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-5 py-2.5 rounded-xl border border-border-default text-text-primary text-sm font-medium hover:bg-hover transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={submitting || !selectedBranchId || !selectedCashierId || !startDate || !endDate || !startTime || !endTime || !notes}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-600/20"
                    >
                        {submitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            'Submit Request'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// === View Details Modal ===
interface ViewDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: TempCashierRequestData | null;
}

const ViewDetailsModal: React.FC<ViewDetailsModalProps> = ({ isOpen, onClose, request }) => {
    if (!isOpen || !request) return null;

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    const formatTime = (timeStr: string) => {
        try {
            const [h, m] = timeStr.split(':');
            const hr = parseInt(h);
            const ampm = hr >= 12 ? 'PM' : 'AM';
            const hr12 = hr % 12 || 12;
            return `${hr12}:${m} ${ampm}`;
        } catch {
            return timeStr;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved': return 'bg-emerald-500/10 text-emerald-500';
            case 'Pending': return 'bg-amber-500/10 text-amber-500';
            case 'Rejected': return 'bg-rose-500/10 text-rose-500';
            case 'Cancelled': return 'bg-gray-500/10 text-gray-400';
            case 'Expired': return 'bg-gray-500/10 text-gray-400';
            default: return 'bg-gray-500/10 text-gray-400';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md mx-4 bg-card border border-border-default rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-5 border-b border-border-default">
                    <h2 className="text-lg font-bold text-text-primary">Request Details</h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-hover transition-colors text-text-muted hover:text-text-primary">
                        <X size={18} />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-text-muted font-medium">Request ID</p>
                            <p className="text-sm font-semibold text-text-primary mt-1">{request.request_id}</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-muted font-medium">Status</p>
                            <span className={`inline-block mt-1 px-2.5 py-1 text-xs font-bold rounded-full ${getStatusColor(request.status)}`}>
                                {request.status}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-text-muted font-medium">Cashier</p>
                            <p className="text-sm text-text-primary mt-1">{request.cashier?.full_name || request.cashier?.name || request.cashier_name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-muted font-medium">Cashier ID</p>
                            <p className="text-sm text-text-primary mt-1">{(request.cashier?.staff_id || request.cashier?.user_name || request.cashier_staff_id) ?? '-'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-text-muted font-medium">From Branch</p>
                            <p className="text-sm text-text-primary mt-1">{request.from_branch_name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-muted font-medium">To Branch</p>
                            <p className="text-sm text-text-primary mt-1">{request.to_branch_name}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-text-muted font-medium">Period</p>
                            <p className="text-sm text-text-primary mt-1">{formatDate(request.start_date)} – {formatDate(request.end_date)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-muted font-medium">Time</p>
                            <p className="text-sm text-text-primary mt-1">{formatTime(request.start_time)} – {formatTime(request.end_time)}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs text-text-muted font-medium">Requested By</p>
                        <p className="text-sm text-text-primary mt-1">{request.requested_by_name}</p>
                    </div>

                    {request.notes && (
                        <div>
                            <p className="text-xs text-text-muted font-medium">Notes</p>
                            <p className="text-sm text-text-primary mt-1 bg-app-background rounded-lg p-3 border border-border-default">{request.notes}</p>
                        </div>
                    )}

                    {request.rejection_reason && (
                        <div>
                            <p className="text-xs text-text-muted font-medium">Rejection Reason</p>
                            <p className="text-sm text-rose-400 mt-1 bg-rose-500/5 rounded-lg p-3 border border-rose-500/20">{request.rejection_reason}</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end px-6 py-4 border-t border-border-default">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-border-default text-text-primary text-sm font-medium hover:bg-hover transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// === Reject Reason Modal ===
interface RejectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => void;
    submitting: boolean;
}

const RejectReasonModal: React.FC<RejectModalProps> = ({ isOpen, onClose, onSubmit, submitting }) => {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-sm mx-4 bg-card border border-border-default rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-5 border-b border-border-default">
                    <h2 className="text-lg font-bold text-text-primary">Reject Request</h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-hover transition-colors text-text-muted hover:text-text-primary">
                        <X size={18} />
                    </button>
                </div>
                <div className="px-6 py-5">
                    <label className="text-sm font-semibold text-text-primary">Reason for Rejection</label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Enter reason for rejection..."
                        rows={3}
                        className="w-full mt-2 px-4 py-3 rounded-xl border border-border-default bg-card text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all resize-none"
                    />
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-default">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-border-default text-text-primary text-sm font-medium hover:bg-hover transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={() => onSubmit(reason)}
                        disabled={submitting}
                        className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
                        Reject
                    </button>
                </div>
            </div>
        </div>
    );
};


// === Main Component ===
const TempCashierPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TempCashierTab>('request-cashier');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<TempCashierRequestData | null>(null);
    const [rejectTargetId, setRejectTargetId] = useState<number | null>(null);
    const [approveModal, setApproveModal] = useState<{ isOpen: boolean; id: number | null }>({
        isOpen: false,
        id: null
    });

    // My requests (Request tab)
    const [myRequests, setMyRequests] = useState<TempCashierRequestData[]>([]);
    const [loadingMyRequests, setLoadingMyRequests] = useState(false);
    const [mySearchTerm, setMySearchTerm] = useState('');

    // Incoming requests (Accept tab)
    const [incomingRequests, setIncomingRequests] = useState<TempCashierRequestData[]>([]);
    const [loadingIncoming, setLoadingIncoming] = useState(false);
    const [incomingSearchTerm, setIncomingSearchTerm] = useState('');

    // Stats
    const [stats, setStats] = useState<TempCashierStats | null>(null);

    // Action states
    const [approvingId, setApprovingId] = useState<number | null>(null);
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [cancellingId, setCancellingId] = useState<number | null>(null);

    const tabs: { id: TempCashierTab; label: string; icon: React.ReactNode }[] = [
        { id: 'request-cashier', label: 'Request Cashier', icon: <UserPlus size={16} /> },
        { id: 'accept-cashier', label: 'Accept Cashier', icon: <ShieldCheck size={16} /> },
    ];

    // Fetch data
    const fetchMyRequests = useCallback(async () => {
        setLoadingMyRequests(true);
        try {
            const data = await tempCashierService.getMyRequests(mySearchTerm);
            setMyRequests(data);
        } catch (err) {
            console.error('Error fetching my requests:', err);
        } finally {
            setLoadingMyRequests(false);
        }
    }, [mySearchTerm]);

    const fetchIncomingRequests = useCallback(async () => {
        setLoadingIncoming(true);
        try {
            const data = await tempCashierService.getIncomingRequests(incomingSearchTerm);
            setIncomingRequests(data);
        } catch (err) {
            console.error('Error fetching incoming requests:', err);
        } finally {
            setLoadingIncoming(false);
        }
    }, [incomingSearchTerm]);

    const fetchStats = useCallback(async () => {
        try {
            const data = await tempCashierService.getStats();
            setStats(data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    }, []);

    // Load data on mount and tab change
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        if (activeTab === 'request-cashier') {
            fetchMyRequests();
        } else {
            fetchIncomingRequests();
        }
    }, [activeTab, fetchMyRequests, fetchIncomingRequests]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeTab === 'request-cashier') {
                fetchMyRequests();
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [mySearchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeTab === 'accept-cashier') {
                fetchIncomingRequests();
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [incomingSearchTerm]);

    const handleRequestCreated = () => {
        fetchMyRequests();
        fetchStats();
    };

    const handleViewDetails = (request: TempCashierRequestData) => {
        setSelectedRequest(request);
        setShowViewModal(true);
    };

    const handleApprove = (id: number) => {
        setApproveModal({ isOpen: true, id });
    };

    const confirmApprove = async (note?: string) => {
        if (!approveModal.id) return;
        const id = approveModal.id;
        setApprovingId(id);
        try {
            await tempCashierService.approve(id, note);
            toast.success('Request approved successfully!');
            setApproveModal({ isOpen: false, id: null });
            fetchIncomingRequests();
            fetchMyRequests();
            fetchStats();
        } catch (err: any) {
            toast.error(err.message || 'Failed to approve request');
        } finally {
            setApprovingId(null);
        }
    };

    const handleRejectClick = (id: number) => {
        setRejectTargetId(id);
        setShowRejectModal(true);
    };

    const handleRejectSubmit = async (reason: string) => {
        if (!rejectTargetId) return;
        setRejectingId(rejectTargetId);
        try {
            await tempCashierService.reject(rejectTargetId, reason);
            toast.success('Request rejected');
            setShowRejectModal(false);
            setRejectTargetId(null);
            fetchIncomingRequests();
            fetchMyRequests();
            fetchStats();
        } catch (err: any) {
            toast.error(err.message || 'Failed to reject request');
        } finally {
            setRejectingId(null);
        }
    };

    const handleCancel = async (id: number) => {
        setCancellingId(id);
        try {
            await tempCashierService.cancel(id);
            toast.info('Request cancelled');
            fetchMyRequests();
            fetchStats();
        } catch (err: any) {
            toast.error(err.message || 'Failed to cancel request');
        } finally {
            setCancellingId(null);
        }
    };

    const formatDuration = (req: TempCashierRequestData) => {
        const formatDate = (d: string) => {
            try {
                return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
            } catch {
                return d;
            }
        };
        const formatTime = (t: string) => {
            try {
                const [h, m] = t.split(':');
                const hr = parseInt(h);
                const ampm = hr >= 12 ? 'PM' : 'AM';
                const hr12 = hr % 12 || 12;
                return `${hr12}:${m} ${ampm}`;
            } catch {
                return t;
            }
        };
        return `${formatDate(req.start_date)} ${formatTime(req.start_time)} - ${formatTime(req.end_time)}`;
    };

    const formatCashier = (req: TempCashierRequestData) => {
        const name = req.cashier?.full_name || req.cashier?.name || req.cashier_name;
        const id = req.cashier?.staff_id || req.cashier?.user_name || req.cashier_staff_id;
        
        if (id && id !== '-' && id !== name) {
            return `${id} - ${name}`;
        }
        return name || id || '-';
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            'Approved': 'bg-emerald-500/10 text-emerald-500',
            'Pending': 'bg-amber-500/10 text-amber-500',
            'Rejected': 'bg-rose-500/10 text-rose-500',
            'Cancelled': 'bg-gray-500/10 text-gray-400',
            'Expired': 'bg-gray-500/10 text-gray-400',
        };
        return (
            <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full ${colors[status] || colors['Cancelled']}`}>
                {status}
            </span>
        );
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'request-cashier':
                return (
                    <div className="flex flex-col gap-6">
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-card rounded-2xl border border-border-default p-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <UserPlus size={20} className="text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-text-muted font-medium">Total Requests</p>
                                        <p className="text-xl font-bold text-text-primary">{stats?.my_requests.total ?? 0}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-card rounded-2xl border border-border-default p-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                        <Clock size={20} className="text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-text-muted font-medium">Pending</p>
                                        <p className="text-xl font-bold text-text-primary">{stats?.my_requests.pending ?? 0}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-card rounded-2xl border border-border-default p-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                        <CheckCircle size={20} className="text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-text-muted font-medium">Approved</p>
                                        <p className="text-xl font-bold text-text-primary">{stats?.my_requests.approved ?? 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Toolbar */}
                        <div className="flex items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    type="text"
                                    value={mySearchTerm}
                                    onChange={(e) => setMySearchTerm(e.target.value)}
                                    placeholder="Search requests..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-default bg-card text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                            </div>
                            <button
                                onClick={() => setShowAssignModal(true)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                            >
                                <Plus size={16} />
                                Assign Temp Cashier
                            </button>
                        </div>

                        {/* Table */}
                        <div className="bg-card rounded-2xl border border-border-default overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border-default bg-table-header">
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Request ID</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Cashier</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">From Branch</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">To Branch</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-center">Duration</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Reason</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-center">Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingMyRequests ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-16 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Loader2 size={32} className="text-blue-500 animate-spin" />
                                                    <p className="text-text-muted text-sm">Loading requests...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : myRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-16 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <UserPlus size={40} className="text-text-muted opacity-40" />
                                                    <p className="text-text-muted text-sm">
                                                        {mySearchTerm ? 'No matching requests found' : 'No cashier requests yet. Click "Assign Temp Cashier" to create one.'}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        myRequests.map((req) => (
                                            <tr key={req.id} className="border-b border-border-default hover:bg-hover transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium text-text-primary">{req.request_id}</td>
                                                <td className="px-6 py-4 text-sm text-text-primary">{formatCashier(req)}</td>
                                                <td className="px-6 py-4 text-sm text-text-secondary">{req.from_branch_name}</td>
                                                <td className="px-6 py-4 text-sm text-text-secondary">{req.to_branch_name}</td>
                                                <td className="px-6 py-4 text-sm text-text-secondary text-center">{formatDuration(req)}</td>
                                                <td className="px-6 py-4 text-sm text-text-secondary">
                                                    <div className="max-w-[150px] truncate" title={req.notes || undefined}>
                                                        {req.notes || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">{getStatusBadge(req.status)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleViewDetails(req)}
                                                            className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-500 transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        {(req.status === 'Pending' || req.status === 'Approved') && (
                                                            <button
                                                                onClick={() => handleCancel(req.id)}
                                                                disabled={cancellingId === req.id}
                                                                className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors disabled:opacity-50"
                                                                title="Cancel"
                                                            >
                                                                {cancellingId === req.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );

            case 'accept-cashier':
                return (
                    <div className="flex flex-col gap-6">
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-card rounded-2xl border border-border-default p-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                        <ShieldCheck size={20} className="text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-text-muted font-medium">Pending Acceptance</p>
                                        <p className="text-xl font-bold text-text-primary">{stats?.incoming_requests.pending ?? 0}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-card rounded-2xl border border-border-default p-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                        <CheckCircle size={20} className="text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-text-muted font-medium">Approved</p>
                                        <p className="text-xl font-bold text-text-primary">{stats?.incoming_requests.approved ?? 0}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-card rounded-2xl border border-border-default p-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                                        <XCircle size={20} className="text-rose-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-text-muted font-medium">Rejected</p>
                                        <p className="text-xl font-bold text-text-primary">{stats?.incoming_requests.rejected ?? 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                                type="text"
                                value={incomingSearchTerm}
                                onChange={(e) => setIncomingSearchTerm(e.target.value)}
                                placeholder="Search pending requests..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-default bg-card text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                        </div>

                        {/* Table */}
                        <div className="bg-card rounded-2xl border border-border-default overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border-default bg-table-header">
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Request ID</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Cashier</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">From Branch</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Requested By</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-center">Duration</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Reason</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-center">Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingIncoming ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-16 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Loader2 size={32} className="text-blue-500 animate-spin" />
                                                    <p className="text-text-muted text-sm">Loading incoming requests...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : incomingRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-16 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <ShieldCheck size={40} className="text-text-muted opacity-40" />
                                                    <p className="text-text-muted text-sm">No incoming cashier requests</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        incomingRequests.map((req) => (
                                            <tr key={req.id} className="border-b border-border-default hover:bg-hover transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium text-text-primary">{req.request_id}</td>
                                                <td className="px-6 py-4 text-sm text-text-primary">{formatCashier(req)}</td>
                                                <td className="px-6 py-4 text-sm text-text-secondary">{req.from_branch_name}</td>
                                                <td className="px-6 py-4 text-sm text-text-secondary">{req.requested_by_name}</td>
                                                <td className="px-6 py-4 text-sm text-text-secondary text-center">{formatDuration(req)}</td>
                                                <td className="px-6 py-4 text-sm text-text-secondary">
                                                    <div className="max-w-[150px] truncate" title={req.notes || undefined}>
                                                        {req.notes || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">{getStatusBadge(req.status)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center gap-2">
                                                        {req.status === 'Pending' ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleApprove(req.id)}
                                                                    disabled={approvingId === req.id}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
                                                                    title="Approve"
                                                                >
                                                                    {approvingId === req.id ? (
                                                                        <Loader2 size={14} className="animate-spin" />
                                                                    ) : (
                                                                        <Check size={14} />
                                                                    )}
                                                                    Accept
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRejectClick(req.id)}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/10 text-rose-500 text-xs font-medium hover:bg-rose-600/20 transition-colors border border-rose-500/20"
                                                                    title="Reject"
                                                                >
                                                                    <Ban size={14} />
                                                                    Reject
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleViewDetails(req)}
                                                                className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-500 transition-colors"
                                                                title="View Details"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-text-primary">Temp Cashier</h1>
                <p className="text-sm text-text-muted">Manage temporary cashier assignments across branches</p>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex bg-card p-1 rounded-xl border border-border-default">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20'
                                : 'text-text-muted hover:text-text-primary hover:bg-hover'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                            {/* Badge for pending incoming requests */}
                            {tab.id === 'accept-cashier' && (stats?.incoming_requests.pending ?? 0) > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                                    {stats?.incoming_requests.pending}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            {renderTabContent()}

            {/* Modals */}
            <AssignTempCashierModal
                isOpen={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                onSubmit={handleRequestCreated}
            />

            <ViewDetailsModal
                isOpen={showViewModal}
                onClose={() => { setShowViewModal(false); setSelectedRequest(null); }}
                request={selectedRequest}
            />

            <RejectReasonModal
                isOpen={showRejectModal}
                onClose={() => { setShowRejectModal(false); setRejectTargetId(null); }}
                onSubmit={handleRejectSubmit}
                submitting={rejectingId !== null}
            />

            <ActionConfirmModal
                isOpen={approveModal.isOpen}
                onClose={() => setApproveModal({ isOpen: false, id: null })}
                onConfirm={confirmApprove}
                title="Approve Temp Cashier"
                message="Are you sure you want to approve this temporary cashier assignment? This will grant the user cashier permissions for the specified branch and period."
                confirmLabel="Approve"
                variant="success"
                showNoteInput={true}
            />
        </div>
    );
};

export default TempCashierPage;
