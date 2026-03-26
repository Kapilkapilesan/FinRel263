'use client';

import React, { useState, useEffect } from 'react';
import {
    ShieldCheck,
    CheckCircle2,
    XCircle,
    Clock,
    User,
    ArrowRight,
    AlertCircle,
    Diff,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { customerEditRequestService } from '@/services/customer-edit-request.service';
import { authService } from '@/services/auth.service';
import BMSLoader from '@/components/common/BMSLoader';

export default function CustomerEditRequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [rejectionModal, setRejectionModal] = useState<{
        isOpen: boolean;
        requestId: number | null;
        reason: string;
    }>({
        isOpen: false,
        requestId: null,
        reason: ''
    });
    const [approvalModal, setApprovalModal] = useState<{
        isOpen: boolean;
        requestId: number | null;
    }>({
        isOpen: false,
        requestId: null
    });



    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const response = await customerEditRequestService.getPendingRequests();
            setRequests(response.data);
        } catch (error) {
            console.error("Failed to load requests", error);
            toast.error("Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = (id: number) => {
        setApprovalModal({ isOpen: true, requestId: id });
    };

    const confirmApprove = async () => {
        if (!approvalModal.requestId) return;

        const id = approvalModal.requestId;
        setProcessingId(id);
        try {
            await customerEditRequestService.approveRequest(id);
            toast.success("Customer profile updated successfully");
            setApprovalModal({ isOpen: false, requestId: null });
            loadRequests();
        } catch (error: any) {
            toast.error(error.message || "Failed to approve");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async () => {
        if (!rejectionModal.requestId || !rejectionModal.reason.trim()) return;

        setProcessingId(rejectionModal.requestId);
        try {
            await customerEditRequestService.rejectRequest(rejectionModal.requestId, rejectionModal.reason);
            toast.success("Request rejected");
            setRejectionModal({ isOpen: false, requestId: null, reason: '' });
            loadRequests();
        } catch (error: any) {
            toast.error(error.message || "Failed to reject");
        } finally {
            setProcessingId(null);
        }
    };

    const openRejectionModal = (requestId: number) => {
        setRejectionModal({
            isOpen: true,
            requestId,
            reason: ''
        });
    };

    // Helper to find changed fields
    const getChangedFields = (oldData: any, newData: any) => {
        const changes: any[] = [];
        const ignoreFields = ['updated_at', 'created_at', 'id', 'branch', 'center', 'group', 'loans'];

        Object.keys(newData).forEach(key => {
            if (ignoreFields.includes(key)) return;

            let oldVal = oldData[key];
            let newVal = newData[key];

            // Fix timezone discrepancy for old data containing ISO datetime instead of simple YYYY-MM-DD
            if (key === 'date_of_birth' && typeof oldVal === 'string' && oldVal.includes('T')) {
                const d = new Date(oldVal);
                if (!isNaN(d.getTime())) {
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    oldVal = `${year}-${month}-${day}`;
                }
            }

            if (oldVal !== newVal) {
                changes.push({
                    field: key.replace(/_/g, ' ').toUpperCase(),
                    oldValue: oldVal,
                    newValue: newVal
                });
            }
        });
        return changes;
    };

    return (
        <div className="min-h-screen bg-app-background transition-colors duration-200 p-6">
            <main className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-text-primary tracking-tight flex items-center gap-3">
                            <ShieldCheck className="w-8 h-8 text-primary-600" />
                            Profile Edit Approvals
                        </h1>
                        <p className="text-text-muted mt-2 font-medium">
                            Review and approve customer detail corrections for active accounts
                        </p>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <BMSLoader message="Loading requests..." size="xsmall" />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border-default">
                        <CheckCircle2 className="w-16 h-16 text-success-500/20 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-text-primary">All Caught Up!</h3>
                        <p className="text-text-muted mt-2">No pending customer edit requests at this time.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {requests.map((request) => {
                            const changes = getChangedFields(request.old_data, request.new_data);
                            return (
                                <div
                                    key={request.id}
                                    className="bg-card rounded-2xl p-6 shadow-sm border border-border-default hover:shadow-md transition-all"
                                >
                                    <div className="flex flex-col lg:flex-row gap-8">
                                        {/* Left Side: Customer & Requester Info */}
                                        <div className="lg:w-1/3 space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-primary-50 dark:bg-primary-950/30 rounded-xl flex items-center justify-center text-primary-600">
                                                    <User size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-text-primary">
                                                        {request.customer?.full_name}
                                                    </h3>
                                                    <p className="text-sm text-text-muted font-mono tracking-tighter">
                                                        {request.customer?.customer_code}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="p-4 bg-muted-bg rounded-xl space-y-2">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-text-muted font-bold uppercase">Requested By</span>
                                                    <span className="text-text-primary font-bold">{request.requester?.user_name}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-text-muted font-bold uppercase">Date</span>
                                                    <span className="text-text-secondary">{new Date(request.created_at).toLocaleString()}</span>
                                                </div>
                                            </div>

                                            <div className="flex gap-3 pt-4">
                                                <button
                                                    onClick={() => handleApprove(request.id)}
                                                    disabled={!!processingId}
                                                    className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-primary-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle2 size={18} />
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => openRejectionModal(request.id)}
                                                    disabled={!!processingId}
                                                    className="flex-1 py-3 bg-danger-50 dark:bg-danger-950/20 text-danger-600 hover:bg-danger-100 dark:hover:bg-danger-900/40 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                                                >
                                                    <XCircle size={18} />
                                                    Reject
                                                </button>
                                            </div>
                                        </div>

                                        {/* Right Side: Diff Table */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-4 text-xs font-black text-text-muted uppercase tracking-widest">
                                                <Diff size={14} />
                                                Changes Highlight ({changes.length})
                                            </div>

                                            <div className="bg-app-background rounded-2xl overflow-hidden border border-border-default">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="bg-table-header text-[10px] font-black uppercase text-text-muted tracking-wider">
                                                            <th className="px-4 py-3 text-left">Property</th>
                                                            <th className="px-4 py-3 text-left">Previous State</th>
                                                            <th className="px-4 py-3 text-left">Proposed State</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border-divider">
                                                        {changes.map((change, idx) => (
                                                            <tr key={idx} className="group hover:bg-table-row-hover transition-colors">
                                                                <td className="px-4 py-3 font-bold text-text-muted text-xs">
                                                                    {change.field}
                                                                </td>
                                                                <td className="px-4 py-3 text-text-secondary line-through decoration-danger-400/50">
                                                                    {change.oldValue || <span className="italic text-text-muted">empty</span>}
                                                                </td>
                                                                <td className="px-4 py-3 text-primary-600 dark:text-primary-400 font-semibold bg-primary-50/30 dark:bg-primary-950/10">
                                                                    {change.newValue}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Rejection Modal */}
            {rejectionModal.isOpen && (
                <div className="fixed inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4 animate-in fade-in duration-200">
                    <div className="bg-card rounded-3xl max-w-md w-full shadow-2xl overflow-hidden scale-in-95 animate-in duration-200 border border-border-default">
                        <div className="p-6 border-b border-border-default flex items-center gap-3">
                            <XCircle className="text-danger-500" />
                            <h2 className="text-xl font-bold text-text-primary">Reject Request</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-text-secondary">Please provide a reason why you are rejecting these profile changes.</p>
                            <textarea
                                value={rejectionModal.reason}
                                onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
                                className="w-full p-4 bg-muted-bg border border-border-default rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none min-h-[120px] transition-all text-text-primary"
                                placeholder="Example: Incorrect NIC format, Wrong family count..."
                                autoFocus
                            />
                        </div>
                        <div className="p-6 bg-muted-bg/50 border-t border-border-default flex justify-end gap-3">
                            <button
                                onClick={() => setRejectionModal({ isOpen: false, requestId: null, reason: '' })}
                                className="px-6 py-2 bg-card border border-border-default rounded-xl text-sm font-bold text-text-secondary hover:text-text-primary transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectionModal.reason.trim() || !!processingId}
                                className="px-8 py-2 bg-danger-600 hover:bg-danger-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-danger-500/20 active:scale-95 transition-all"
                            >
                                {processingId ? 'Processing...' : 'Confirm Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Approval Modal */}
            {approvalModal.isOpen && (
                <div className="fixed inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4 animate-in fade-in duration-200">
                    <div className="bg-card rounded-3xl max-w-md w-full shadow-2xl overflow-hidden scale-in-95 animate-in duration-200 border border-border-default">
                        <div className="p-8 text-center space-y-4">
                            <div className="w-20 h-20 bg-primary-50 dark:bg-primary-950/30 rounded-full flex items-center justify-center text-primary-600 mx-auto mb-2 animate-bounce">
                                <ShieldCheck size={40} />
                            </div>
                            <h2 className="text-2xl font-black text-text-primary">Approve Changes?</h2>
                            <p className="text-text-secondary font-medium leading-relaxed">
                                Are you sure you want to approve these profile corrections? The customer's information will be updated immediately.
                            </p>
                        </div>

                        <div className="p-6 bg-muted-bg/50 border-t border-border-default flex flex-col gap-3">
                            <button
                                onClick={confirmApprove}
                                disabled={!!processingId}
                                className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black text-base shadow-xl shadow-primary-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                {processingId ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <CheckCircle2 size={20} />
                                        Confirm & Apply Changes
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setApprovalModal({ isOpen: false, requestId: null })}
                                className="w-full py-3 text-text-muted hover:text-text-primary font-bold transition-colors"
                            >
                                Take me back
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
