'use client';

import React, { useState, useEffect } from 'react';
import {
    GitPullRequest,
    CheckCircle2,
    XCircle,
    Clock,
    User,
    Building,
    ArrowRight,
    Search,
    Filter
} from 'lucide-react';
import { toast } from 'react-toastify';
import { centerRequestService, CenterChangeRequest } from '@/services/center-request.service';
import { authService } from '@/services/auth.service';
import BMSLoader from '@/components/common/BMSLoader';
import { colors } from '@/themes/colors';

export default function CenterRequestsPage() {
    const [requests, setRequests] = useState<CenterChangeRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('PENDING');
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [remarksModal, setRemarksModal] = useState<{
        isOpen: boolean;
        type: 'approve' | 'reject';
        requestId: number | null;
        remarks: string;
    }>({
        isOpen: false,
        type: 'approve',
        requestId: null,
        remarks: ''
    });

    const canAction = authService.hasPermission('customers.approve_transfer');

    const loadRequests = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const data = await centerRequestService.getRequests(filterStatus);
            setRequests(data);
        } catch (error) {
            console.error("Failed to load requests", error);
            if (!isBackground) toast.error("Failed to load requests");
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            if (!processingId && !remarksModal.isOpen) {
                loadRequests(true);
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [filterStatus]);

    const handleAction = async () => {
        if (!remarksModal.requestId) return;

        setProcessingId(remarksModal.requestId);
        try {
            if (remarksModal.type === 'approve') {
                await centerRequestService.approveRequest(remarksModal.requestId, remarksModal.remarks);
                toast.success("Request approved successfully");
            } else {
                await centerRequestService.rejectRequest(remarksModal.requestId, remarksModal.remarks);
                toast.success("Request rejected");
            }
            loadRequests();
            setRemarksModal({ ...remarksModal, isOpen: false, remarks: '' });
        } catch (error: any) {
            toast.error(error.message || "Action failed");
        } finally {
            setProcessingId(null);
        }
    };

    const openActionModal = (requestId: number, type: 'approve' | 'reject') => {
        setRemarksModal({
            isOpen: true,
            type,
            requestId,
            remarks: ''
        });
    };

    return (
        <div className="min-h-screen bg-app-background transition-colors duration-200 font-sans">

            <main className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-text-primary tracking-tight">
                            Center Transfer Requests
                        </h1>
                        <p className="text-text-muted mt-2 font-medium">
                            Manage customer movement between centers
                        </p>
                    </div>

                    <div className="flex items-center gap-2 bg-card p-1 rounded-xl border border-border-default shadow-sm">
                        {['PENDING', 'APPROVED', 'REJECTED', ''].map((status) => (
                            <button
                                key={status || 'ALL'}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterStatus === status
                                    ? 'text-white shadow-md'
                                    : 'text-text-muted hover:bg-hover'
                                    }`}
                                style={filterStatus === status ? { backgroundColor: colors.primary[600] } : {}}
                            >
                                {status || 'ALL'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <BMSLoader message="Loading requests..." size="xsmall" />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border-default">
                        <GitPullRequest className="w-16 h-16 text-text-muted opacity-20 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-text-primary">No Requests Found</h3>
                        <p className="text-text-muted mt-2">There are no center transfer requests matching your filter.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {requests.map((request) => (
                            <div
                                key={request.id}
                                className="bg-card rounded-2xl p-4 shadow-sm border border-border-default hover:shadow-md transition-all relative overflow-hidden group"
                            >
                                {/* Status Indicator Strip */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${request.status === 'PENDING' ? 'bg-blue-500' :
                                    request.status === 'APPROVED' ? 'bg-green-500' : 'bg-red-500'
                                    }`} />

                                <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between pl-4">
                                    {/* Request Info */}
                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${request.status === 'PENDING' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                                request.status === 'APPROVED' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' :
                                                    'bg-red-100 text-red-600 dark:bg-red-900/30'
                                                }`}>
                                                {request.status}
                                            </span>
                                            <span className="text-sm text-text-muted flex items-center gap-1.5 font-medium">
                                                <Clock size={14} />
                                                {new Date(request.created_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div
                                                className="p-2 rounded-xl"
                                                style={{ backgroundColor: `${colors.primary[600]}15` }}
                                            >
                                                <User className="w-5 h-5" style={{ color: colors.primary[600] }} />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-text-primary">
                                                    {request.customer?.full_name}
                                                </h3>
                                                <p className="text-sm text-text-muted font-mono uppercase tracking-tighter">
                                                    {request.customer?.customer_code}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Transfer Path */}
                                        <div className="flex items-center justify-between gap-4 py-3 px-4 bg-input rounded-xl border border-border-divider max-w-2xl relative overflow-hidden">
                                            {request.current_center?.branch_id !== request.requested_center?.branch_id && (
                                                <div className="absolute top-0 right-0 left-0 bg-red-50 dark:bg-red-500/10 border-b border-red-100 dark:border-red-500/20 py-1 text-center">
                                                    <span className="text-[9px] text-red-600 dark:text-red-400 font-black tracking-widest uppercase">Cross-Branch Transfer Alert</span>
                                                </div>
                                            )}

                                            <div className={`flex-1 ${request.current_center?.branch_id !== request.requested_center?.branch_id ? 'mt-4' : ''}`}>
                                                <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-1">From</p>
                                                <div className="flex flex-col gap-0.5 text-sm font-bold text-text-primary">
                                                    <span className="flex items-center gap-2">
                                                        <Building size={14} className="text-text-muted opacity-50" />
                                                        {request.current_center?.center_name}
                                                    </span>
                                                    {request.current_center?.branch_name && (
                                                        <span className="text-xs text-text-muted font-medium pl-5 flex items-center gap-1">
                                                            {request.current_center.branch_name} Branch
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className={`flex flex-col items-center justify-center gap-1 px-4 ${request.current_center?.branch_id !== request.requested_center?.branch_id ? 'mt-4' : ''}`}>
                                                <div className="p-2 rounded-full bg-border-divider/50">
                                                    <ArrowRight size={16} className="text-text-muted" />
                                                </div>
                                            </div>

                                            <div className={`flex-1 text-right ${request.current_center?.branch_id !== request.requested_center?.branch_id ? 'mt-4' : ''}`}>
                                                <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-1">To</p>
                                                <div className="flex flex-col items-end gap-0.5 text-sm font-bold" style={{ color: colors.primary[600] }}>
                                                    {request.requested_center ? (
                                                        <>
                                                            <span className="flex items-center gap-2">
                                                                {request.requested_center.center_name}
                                                                <Building size={14} className="opacity-80" />
                                                            </span>
                                                            {request.requested_center.branch_name && (
                                                                <span className="text-xs font-medium pr-5 flex items-center justify-end gap-1" style={{ color: colors.primary[500] }}>
                                                                    {request.requested_center.branch_name} Branch
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-text-muted italic pr-5">Select Target Center</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            className="py-2 px-3 rounded-xl text-sm border-l-4 max-w-2xl"
                                            style={{
                                                backgroundColor: `${colors.primary[600]}10`,
                                                borderColor: colors.primary[400],
                                                color: colors.primary[700]
                                            }}
                                        >
                                            <span className="font-bold block mb-1" style={{ color: colors.primary[700] }}>Reason for request:</span>
                                            "{request.reason}"
                                        </div>
                                    </div>

                                    {/* Action Column */}
                                    <div className="flex flex-col gap-2 min-w-[200px]">
                                        <div className="text-right mb-1">
                                            <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Requested by</p>
                                            <p className="text-sm font-bold text-text-secondary">
                                                {request.requester?.user_name}
                                            </p>
                                        </div>

                                        {request.status === 'PENDING' && canAction ? (
                                            <>
                                                <button
                                                    onClick={() => openActionModal(request.id, 'approve')}
                                                    disabled={!!processingId}
                                                    style={{ backgroundColor: colors.primary[600] }}
                                                    className="w-full py-2 text-white rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 hover:opacity-90"
                                                >
                                                    <CheckCircle2 size={16} />
                                                    Approve Transfer
                                                </button>
                                                <button
                                                    onClick={() => openActionModal(request.id, 'reject')}
                                                    disabled={!!processingId}
                                                    className="w-full py-2 bg-card border border-border-default hover:border-red-500 dark:hover:border-red-500/50 hover:bg-red-50 dark:hover:bg-red-900/10 text-text-secondary hover:text-red-600 dark:hover:text-red-400 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                                                >
                                                    <XCircle size={16} />
                                                    Reject
                                                </button>
                                            </>
                                        ) : request.status !== 'PENDING' ? (
                                            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                                                <p className="text-xs text-gray-400 font-bold uppercase mb-1">
                                                    Processed by {request.approver?.user_name}
                                                </p>
                                                {request.remarks && (
                                                    <p className="text-xs text-gray-500 italic">"{request.remarks}"</p>
                                                )}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Action Dialog */}
            {remarksModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4 animate-in fade-in duration-200">
                    <div className="bg-card rounded-2xl max-w-lg w-full shadow-2xl border border-border-default overflow-hidden transform transition-all">
                        {/* Header */}
                        <div className="p-6 border-b border-border-divider flex items-center justify-between bg-card/50 backdrop-blur-xl">
                            <div>
                                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                    {remarksModal.type === 'approve' ? (
                                        <CheckCircle2 className="w-5 h-5" style={{ color: colors.primary[600] }} />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-600" />
                                    )}
                                    {remarksModal.type === 'approve' ? 'Approve Transfer' : 'Reject Request'}
                                </h2>
                                <p className="text-[10px] font-black text-text-muted mt-1 uppercase tracking-widest">
                                    {remarksModal.type === 'approve'
                                        ? 'Update customer records and finalize transfer'
                                        : 'Deny this transfer request'}
                                </p>
                            </div>
                            <button
                                onClick={() => setRemarksModal({ ...remarksModal, isOpen: false })}
                                className="p-2 hover:bg-hover rounded-xl transition-colors text-text-muted"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">
                            {remarksModal.type === 'approve' && (
                                <div className="bg-primary-50 dark:bg-primary-900/10 p-4 rounded-xl border border-primary-100 dark:border-primary-900/30 flex gap-3">
                                    <div className="p-2 rounded-lg h-fit" style={{ backgroundColor: `${colors.primary[600]}15` }}>
                                        <CheckCircle2 className="w-5 h-5" style={{ color: colors.primary[600] }} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-text-primary">Confirm Approval</h4>
                                        <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                                            This action will immediately transfer the customer to the new center. The customer's previous center assignment will be archived.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {remarksModal.type === 'reject' && (
                                <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30 flex gap-3">
                                    <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg h-fit">
                                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-text-primary">Reject Request</h4>
                                        <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                                            Please provide a reason for rejecting this transfer. This will be visible to the requester.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                    {remarksModal.type === 'approve' ? 'Remarks (Optional)' : 'Reason for Rejection *'}
                                </label>
                                <textarea
                                    value={remarksModal.remarks}
                                    onChange={(e) => setRemarksModal({ ...remarksModal, remarks: e.target.value })}
                                    className="w-full p-3 bg-input border border-border-input rounded-xl outline-none min-h-[100px] transition-all focus:ring-2 text-text-primary"
                                    style={{ '--tw-ring-color': colors.primary[500] } as any}
                                    placeholder={remarksModal.type === 'approve' ? "Add any notes..." : "Explain why this request is being rejected..."}
                                    autoFocus={remarksModal.type === 'reject'}
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-border-divider flex justify-end gap-3 bg-table-header">
                            <button
                                onClick={() => setRemarksModal({ ...remarksModal, isOpen: false })}
                                className="px-4 py-2 border border-border-input text-text-secondary font-bold hover:bg-hover rounded-xl transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAction}
                                disabled={processingId !== null || (remarksModal.type === 'reject' && !remarksModal.remarks.trim())}
                                className={`px-6 py-2 font-bold rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${remarksModal.type === 'approve'
                                    ? 'text-white'
                                    : 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20'
                                    }`}
                                style={remarksModal.type === 'approve' ? { backgroundColor: colors.primary[600] } : {}}
                            >
                                {processingId ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        {remarksModal.type === 'approve' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                                        {remarksModal.type === 'approve' ? 'Confirm Approval' : 'Reject Request'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
