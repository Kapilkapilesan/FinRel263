'use client';

import React, { useState, useEffect } from 'react';
import {
    FileText,
    XCircle,
    ClipboardList,
    RotateCcw,
    Clock,
    CheckCircle,
    Search,
    X,
    Check,
    AlertTriangle,
    ShieldCheck,
    DollarSign,
} from 'lucide-react';
import { financeService } from '@/services/finance.service';
import { receiptService } from '@/services/receipt.service';
import { toast } from 'react-toastify';
import { BranchExpense } from '@/types/finance.types';
import { format } from 'date-fns';

import { staffIouService, StaffIouRequest } from '@/services/staffIou.service';

type BranchActivityRequestTab = 'branch-request' | 'receipt-cancel-request' | 'staff-request-iou';

// ─── Custom Confirmation Modal ───
interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    icon: React.ReactNode;
    confirmLabel: string;
    confirmColor: 'primary' | 'blue';
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen, title, message, icon, confirmLabel, confirmColor, onConfirm, onCancel, loading
}) => {
    if (!isOpen) return null;

    const colorMap = {
        primary: {
            bg: 'bg-primary-600',
            hover: 'hover:bg-primary-700',
            iconBg: 'bg-primary-500/10',
            shadow: 'shadow-primary-600/20',
        },
        blue: {
            bg: 'bg-blue-600',
            hover: 'hover:bg-blue-700',
            iconBg: 'bg-blue-500/10',
            shadow: 'shadow-blue-600/20',
        },
    };

    const c = colorMap[confirmColor];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-card border border-border-default rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 flex flex-col items-center text-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl ${c.iconBg} flex items-center justify-center`}>
                        {icon}
                    </div>
                    <div className="flex flex-col gap-1">
                        <h3 className="text-lg font-black text-text-primary">{title}</h3>
                        <p className="text-sm text-text-muted">{message}</p>
                    </div>
                </div>
                <div className="px-6 pb-6 flex items-center gap-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-border-default text-text-muted font-bold text-sm hover:bg-hover transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex-1 px-4 py-2.5 rounded-xl ${c.bg} ${c.hover} text-white font-bold text-sm transition-all shadow-lg ${c.shadow} disabled:opacity-50`}
                    >
                        {loading ? 'Processing...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Custom Rejection Reason Modal ───
interface RejectModalProps {
    isOpen: boolean;
    onConfirm: (reason: string) => void;
    onCancel: () => void;
    loading?: boolean;
}

const RejectModal: React.FC<RejectModalProps> = ({ isOpen, onConfirm, onCancel, loading }) => {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!reason.trim()) {
            toast.error('Rejection reason is required');
            return;
        }
        onConfirm(reason);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-card border border-border-default rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 flex flex-col items-center text-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                        <AlertTriangle size={28} className="text-blue-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <h3 className="text-lg font-black text-text-primary">Reject Request</h3>
                        <p className="text-sm text-text-muted">Please provide a reason for rejecting this request.</p>
                    </div>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Enter rejection reason..."
                        rows={3}
                        autoFocus
                        className="w-full px-4 py-3 rounded-xl border border-border-default bg-app-background text-text-primary text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none placeholder:text-text-muted/50 transition-all"
                    />
                </div>
                <div className="px-6 pb-6 flex items-center gap-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-border-default text-text-muted font-bold text-sm hover:bg-hover transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !reason.trim()}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                    >
                        {loading ? 'Rejecting...' : 'Confirm Rejection'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const BranchActivityRequestPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<BranchActivityRequestTab>('branch-request');
    const [requests, setRequests] = useState<BranchExpense[]>([]);
    const [iouRequests, setIouRequests] = useState<StaffIouRequest[]>([]);
    const [receiptCancelRequests, setReceiptCancelRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
    const [approveModal, setApproveModal] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });
    const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const data = await financeService.getPendingBranchRequests();
            setRequests(data);
        } catch (err: any) {
            toast.error(err.message || 'Failed to fetch requests');
        } finally {
            setLoading(false);
        }
    };

    const fetchIouRequests = async () => {
        try {
            setLoading(true);
            const data = await staffIouService.getPendingApprovals();
            setIouRequests(data);
        } catch (err: any) {
            toast.error(err.message || 'Failed to fetch IOU requests');
        } finally {
            setLoading(false);
        }
    };

    const fetchReceiptCancelRequests = async () => {
        try {
            setLoading(true);
            const response = await receiptService.getPendingCancellations();
            setReceiptCancelRequests(response.data || []);
        } catch (err: any) {
            toast.error(err.message || 'Failed to fetch cancellation requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'branch-request') {
            fetchRequests();
        } else if (activeTab === 'staff-request-iou') {
            fetchIouRequests();
        } else if (activeTab === 'receipt-cancel-request') {
            fetchReceiptCancelRequests();
        }
    }, [activeTab]);

    const handleApprove = async () => {
        if (!approveModal.id) return;

        try {
            setProcessingId(approveModal.id);
            if (activeTab === 'staff-request-iou') {
                await staffIouService.approveRequest(approveModal.id);
                toast.success('IOU Request approved successfully');
                fetchIouRequests();
            } else if (activeTab === 'receipt-cancel-request') {
                await receiptService.approveCancellation(approveModal.id);
                toast.success('Receipt cancellation approved');
                fetchReceiptCancelRequests();
            } else {
                await financeService.approveBranchRequest(approveModal.id);
                toast.success('Request approved successfully');
                fetchRequests();
            }
            setApproveModal({ isOpen: false, id: null });
        } catch (err: any) {
            toast.error(err.message || 'Failed to approve request');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (reason: string) => {
        if (!rejectModal.id) return;

        try {
            setProcessingId(rejectModal.id);
            if (activeTab === 'staff-request-iou') {
                await staffIouService.rejectRequest(rejectModal.id, reason);
                toast.success('IOU Request rejected successfully');
                fetchIouRequests();
            } else if (activeTab === 'receipt-cancel-request') {
                await receiptService.rejectCancellation(rejectModal.id);
                toast.success('Receipt cancellation rejected');
                fetchReceiptCancelRequests();
            } else {
                await financeService.rejectBranchRequest(rejectModal.id, reason);
                toast.success('Request rejected successfully');
                fetchRequests();
            }
            setRejectModal({ isOpen: false, id: null });
        } catch (err: any) {
            toast.error(err.message || 'Failed to reject request');
        } finally {
            setProcessingId(null);
        }
    };

    const filteredRequests = requests.filter(req => {
        const matchesSearch =
            (req.request_id?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (req.branch?.branch_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (req.expense_type.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesSearch;
    });

    const stats = {
        total: activeTab === 'staff-request-iou' ? iouRequests.length : activeTab === 'receipt-cancel-request' ? receiptCancelRequests.length : requests.length,
        pending: activeTab === 'staff-request-iou' ? iouRequests.length : activeTab === 'receipt-cancel-request' ? receiptCancelRequests.length : requests.filter(r => r.status === 'Pending').length,
    };

    const tabs: { id: BranchActivityRequestTab; label: string; icon: React.ReactNode }[] = [
        { id: 'branch-request', label: 'Branch Requests', icon: <ClipboardList size={16} /> },
        { id: 'receipt-cancel-request', label: 'Receipt Cancel Request', icon: <XCircle size={16} /> },
        { id: 'staff-request-iou', label: 'Staff Request IOU', icon: <DollarSign size={16} /> },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'branch-request':
                return (
                    <div className="flex flex-col gap-6">
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-card rounded-2xl border border-border-default p-5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <ClipboardList size={20} className="text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Total Requests</p>
                                        <p className="text-xl font-black text-text-primary">{stats.total}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-card rounded-2xl border border-border-default p-5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                        <Clock size={20} className="text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Pending Approval</p>
                                        <p className="text-xl font-black text-text-primary">{stats.pending}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-card rounded-2xl border border-border-default p-5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                                        <CheckCircle size={20} className="text-primary-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Approved Today</p>
                                        <p className="text-xl font-black text-text-primary">0</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-card rounded-2xl border border-border-default overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-border-default bg-app-background/50 flex justify-between items-center">
                                <h3 className="font-bold text-text-primary">Branch Activity Requests</h3>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                        <input
                                            type="text"
                                            placeholder="Search requests..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9 pr-3 py-1.5 text-xs bg-card border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-primary-500"
                                        />
                                    </div>
                                </div>
                            </div>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border-default bg-table-header">
                                        <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Request ID</th>
                                        <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Branch</th>
                                        <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Requested By</th>
                                        <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-16 text-center text-text-muted text-xs">
                                                Loading requests...
                                            </td>
                                        </tr>
                                    ) : filteredRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-16 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center">
                                                        <ClipboardList size={32} className="text-text-muted/40" />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <p className="text-text-primary font-bold">No active requests</p>
                                                        <p className="text-text-muted text-xs">All branch activity requests have been processed.</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRequests.map((request) => (
                                            <tr key={request.id} className="border-b border-border-default hover:bg-hover transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-text-primary">{request.request_id || `REQ-${request.id}`}</span>
                                                        <span className="text-[10px] text-text-muted font-medium">{request.expense_type}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-text-primary">{request.branch?.branch_name}</td>
                                                <td className="px-6 py-4 text-xs text-text-primary">
                                                    {request.requested_by_user?.user_name || request.transaction?.user_name || 'System'}
                                                </td>
                                                <td className="px-6 py-4 text-xs font-bold text-blue-500 uppercase">{request.type}</td>
                                                <td className="px-6 py-4 text-xs font-black text-text-primary">
                                                    LKR {Number(request.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-text-muted">
                                                    {format(new Date(request.date), 'dd MMM yyyy')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                                                        {request.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => setRejectModal({ isOpen: true, id: request.id })}
                                                            disabled={processingId === request.id}
                                                            className="px-4 py-1.5 rounded-lg border border-blue-500/30 text-blue-500 text-[10px] font-bold uppercase hover:bg-blue-500 hover:text-white transition-all disabled:opacity-50"
                                                        >
                                                            Reject
                                                        </button>
                                                        <button
                                                            onClick={() => setApproveModal({ isOpen: true, id: request.id })}
                                                            disabled={processingId === request.id}
                                                            className="px-4 py-1.5 rounded-lg bg-primary-600 text-white text-[10px] font-bold uppercase hover:bg-primary-700 transition-all shadow-lg shadow-primary-900/20 disabled:opacity-50"
                                                        >
                                                            Approve
                                                        </button>
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

            case 'receipt-cancel-request':
                return (
                    <div className="flex flex-col gap-6">
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-card rounded-2xl border border-border-default p-5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <XCircle size={20} className="text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Total Requests</p>
                                        <p className="text-xl font-black text-text-primary">{receiptCancelRequests.length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-card rounded-2xl border border-border-default overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-border-default bg-app-background/50 flex justify-between items-center">
                                <h3 className="font-bold text-text-primary">Receipt Cancellation Requests</h3>
                            </div>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border-default bg-table-header">
                                        <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Receipt No</th>
                                        <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Customer</th>
                                        <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Reason</th>
                                        <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={5} className="px-6 py-10 text-center text-xs">Loading...</td></tr>
                                    ) : receiptCancelRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-16 text-center text-text-muted">
                                                No cancellation requests found.
                                            </td>
                                        </tr>
                                    ) : (
                                        receiptCancelRequests.map((r) => (
                                            <tr key={r.id} className="border-b border-border-default hover:bg-hover transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-text-primary">{r.receipt_id}</span>
                                                        {r.reprint_count > 0 && (
                                                            <span className="mt-1 px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[9px] font-black uppercase w-fit animate-pulse border border-red-200">
                                                                Reprinted {r.reprint_count}x
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-text-primary">{r.customer?.full_name || 'N/A'}</span>
                                                        <span className="text-[10px] text-text-muted">{r.customer?.nic}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-black text-primary-600">
                                                    LKR {Number(r.current_due_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-text-muted italic max-w-[250px] truncate">
                                                    "{r.cancellation_reason || 'No reason provided'}"
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => setRejectModal({ isOpen: true, id: r.id })}
                                                            className="px-4 py-1.5 rounded-lg border border-blue-500/30 text-blue-500 text-[10px] font-bold uppercase hover:bg-blue-500 hover:text-white transition-all"
                                                        >
                                                            Reject
                                                        </button>
                                                        <button
                                                            onClick={() => setApproveModal({ isOpen: true, id: r.id })}
                                                            className="px-4 py-1.5 rounded-lg bg-primary-600 text-white text-[10px] font-bold uppercase hover:bg-primary-700 transition-all shadow-lg shadow-primary-900/20"
                                                        >
                                                            Approve
                                                        </button>
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

            case 'staff-request-iou':
                const filteredIous = iouRequests.filter(req =>
                    req.request_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    req.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    req.user?.user_name?.toLowerCase().includes(searchQuery.toLowerCase())
                );

                return (
                    <div className="flex flex-col gap-6">
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-card rounded-2xl border border-border-default p-5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <DollarSign size={20} className="text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Total IOU Requests</p>
                                        <p className="text-xl font-black text-text-primary">{iouRequests.length}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-card rounded-2xl border border-border-default p-5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                        <Clock size={20} className="text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Pending Approval</p>
                                        <p className="text-xl font-black text-text-primary">{iouRequests.filter(r => r.status === 'Pending').length}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-card rounded-2xl border border-border-default p-5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                                        <CheckCircle size={20} className="text-primary-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Approved/Disbursed</p>
                                        <p className="text-xl font-black text-text-primary">0</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-card rounded-2xl border border-border-default overflow-hidden">
                            <div className="px-6 py-4 border-b border-border-default bg-app-background/50 flex justify-between items-center">
                                <h3 className="font-bold text-text-primary">Staff IOU Requests</h3>
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                    <input
                                        type="text"
                                        placeholder="Search by ID, employee..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 pr-3 py-1.5 text-xs bg-card border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-primary-500"
                                    />
                                </div>
                            </div>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border-default bg-table-header">
                                        <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Request ID</th>
                                        <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Employee Details</th>
                                        <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Reason</th>
                                        <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">Amount</th>
                                        <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={7} className="text-center py-10">Loading...</td></tr>
                                    ) : filteredIous.length === 0 ? (
                                        <tr><td colSpan={7} className="text-center py-10 text-text-muted">No pending IOU requests</td></tr>
                                    ) : (
                                        filteredIous.map((req) => (
                                            <tr key={req.id} className="border-b border-border-default hover:bg-hover transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-text-primary">{req.request_id}</span>
                                                        <span className="text-[10px] text-text-muted">{format(new Date(req.created_at), 'yyyy-MM-dd')}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-text-primary">{req.user?.name || req.user?.user_name}</span>
                                                        <span className="text-[10px] text-text-muted">{req.user?.user_name} • {req.branch?.branch_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${req.request_type === 'fixed_category' ? 'bg-amber-500/10 text-amber-500' : req.request_type === 'reimbursement' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary-500/10 text-primary-500'}`}>
                                                        {req.request_type === 'reimbursement' ? 'Reimbursement' : req.request_type === 'fixed_category' ? 'Fixed Category' : 'IOU Request'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-text-muted">
                                                    {req.category ? `[${req.category.name}] ` : ''}
                                                    {req.reason}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                                                        {req.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-xs font-black text-text-primary">
                                                    LKR {Number(req.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => setRejectModal({ isOpen: true, id: req.id })}
                                                            className="px-4 py-1.5 rounded-lg border border-blue-500/30 text-blue-500 text-[10px] font-bold uppercase hover:bg-blue-500 hover:text-white transition-all"
                                                        >
                                                            Reject
                                                        </button>
                                                        <button
                                                            onClick={() => setApproveModal({ isOpen: true, id: req.id })}
                                                            className="px-4 py-1.5 rounded-lg bg-primary-600 text-white text-[10px] font-bold uppercase hover:bg-primary-700 transition-all shadow-lg shadow-primary-900/20"
                                                        >
                                                            Approve
                                                        </button>
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
                <h1 className="text-2xl font-black text-text-primary tracking-tight">Branch Approvals</h1>
                <p className="text-sm text-text-muted font-medium">Manage branch requests and receipt cancellation requests</p>
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
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            {renderTabContent()}

            {/* Approve Confirmation Modal */}
            <ConfirmModal
                isOpen={approveModal.isOpen}
                title="Approve Request"
                message="Are you sure you want to approve this branch activity request? This action cannot be undone."
                icon={<ShieldCheck size={28} className="text-primary-500" />}
                confirmLabel="Approve Request"
                confirmColor="primary"
                onConfirm={handleApprove}
                onCancel={() => setApproveModal({ isOpen: false, id: null })}
                loading={processingId !== null}
            />

            {/* Reject Reason Modal */}
            <RejectModal
                isOpen={rejectModal.isOpen}
                onConfirm={handleReject}
                onCancel={() => setRejectModal({ isOpen: false, id: null })}
                loading={processingId !== null}
            />
        </div>
    );
};

export default BranchActivityRequestPage;
