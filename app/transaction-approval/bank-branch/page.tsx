'use client';

import React, { useState, useEffect } from 'react';
import { 
    Building2, 
    CheckCircle, 
    XCircle, 
    Clock, 
    DollarSign, 
    FileText, 
    Search,
    Filter,
    ArrowRight,
    ShieldCheck,
    AlertCircle,
    User
} from 'lucide-react';
import { bankBranchService, BankBranchActivity } from '@/services/bankBranch.service';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { Pagination } from '@/components/common/Pagination';
import { ActionConfirmModal } from '@/components/common/ActionConfirmModal';
import { DocumentPreviewModal } from '@/components/common/DocumentPreviewModal';
import { API_BASE_URL } from '@/services/api.config';

const BankBranchApprovalPage: React.FC = () => {
    const [activities, setActivities] = useState<BankBranchActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [approvingId, setApprovingId] = useState<number | null>(null);
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('pending_approval');
    
    // Confirmation Modals
    const [approveModal, setApproveModal] = useState<{ isOpen: boolean; activity: BankBranchActivity | null }>({
        isOpen: false,
        activity: null
    });
    const [rejectionModal, setRejectionModal] = useState<{ isOpen: boolean; activity: BankBranchActivity | null }>({
        isOpen: false,
        activity: null
    });
    const [previewDoc, setPreviewDoc] = useState<{ url: string; type: string } | null>(null);

    const fetchPendingApprovals = async () => {
        setLoading(true);
        try {
            // We'll fetch activities that need approval
            const data = await bankBranchService.getActivities({
                status: filterStatus === 'pending_approval' ? undefined : filterStatus,
            });
            
            // Filter further if it's 'pending_approval' (status 'pending' or 'manager_approved')
            if (filterStatus === 'pending_approval') {
                setActivities(data.filter(a => a.status === 'pending' || a.status === 'manager_approved'));
            } else {
                setActivities(data);
            }
        } catch (err) {
            console.error('Error fetching approvals', err);
            toast.error('Failed to fetch pending approvals');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingApprovals();
    }, [filterStatus]);

    const handleApprove = async (note?: string) => {
        if (!approveModal.activity) return;
        
        setApprovingId(approveModal.activity.id);
        try {
            await bankBranchService.approveActivity(approveModal.activity.id, note);
            toast.success('Activity approved successfully');
            fetchPendingApprovals();
            setApproveModal({ isOpen: false, activity: null });
        } catch (err: any) {
            toast.error(err.message || 'Failed to approve activity');
        } finally {
            setApprovingId(null);
        }
    };

    const handleReject = async () => {
        if (!rejectionModal.activity || !rejectionReason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }

        setRejectingId(rejectionModal.activity.id);
        try {
            await bankBranchService.rejectActivity(rejectionModal.activity.id, rejectionReason);
            toast.success('Activity rejected');
            fetchPendingApprovals();
            setRejectionModal({ isOpen: false, activity: null });
            setRejectionReason('');
        } catch (err: any) {
            toast.error(err.message || 'Failed to reject activity');
        } finally {
            setRejectingId(null);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header section with Stats - Premium look */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500 shadow-inner">
                            <ShieldCheck size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-text-primary tracking-tight">Bank & Branch Approvals</h1>
                            <p className="text-sm text-text-muted font-medium">Review and authorize bank deposits and withdrawal requests</p>
                        </div>
                    </div>
                </div>

                <div className="flex bg-card p-1.5 rounded-2xl border border-border-default shadow-sm h-fit">
                    <button
                        onClick={() => setFilterStatus('pending_approval')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === 'pending_approval' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-text-muted hover:text-text-primary'}`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setFilterStatus('completed')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === 'completed' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-text-muted hover:text-text-primary'}`}
                    >
                        Completed
                    </button>
                    <button
                        onClick={() => setFilterStatus('rejected')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === 'rejected' ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20' : 'text-text-muted hover:text-text-primary'}`}
                    >
                        Rejected
                    </button>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-card rounded-[2.5rem] border border-border-default shadow-xl shadow-primary-500/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border-default bg-muted/5">
                                <th className="px-8 py-6 text-[10px] font-black uppercase text-text-muted tracking-[0.2em]">Transaction Info</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase text-text-muted tracking-[0.2em]">Branch & Requester</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase text-text-muted tracking-[0.2em]">Details</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase text-text-muted tracking-[0.2em] text-right">Amount (LKR)</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase text-text-muted tracking-[0.2em] text-center">Workflow</th>
                                <th className="px-8 py-6 text-right w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default/50">
                            {loading ? (
                                Array(4).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-8 py-8"><div className="h-16 bg-muted/10 rounded-3xl" /></td>
                                    </tr>
                                ))
                            ) : activities.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-6 opacity-40">
                                            <div className="w-20 h-20 rounded-[2rem] bg-muted/20 flex items-center justify-center text-text-muted">
                                                <Building2 size={40} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-black text-lg text-text-primary">No approval requests found</p>
                                                <p className="text-sm text-text-muted">All clear! No pending bank activities for your review.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                activities.map((activity) => (
                                    <tr key={activity.id} className="hover:bg-primary-500/[0.02] transition-colors group">
                                        <td className="px-8 py-8 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black text-text-primary uppercase">{format(new Date(activity.date), 'MMM dd, yyyy')}</span>
                                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${activity.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                        {activity.type}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-black text-text-muted tracking-tighter uppercase opacity-60">ID: #{activity.id}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-app-background border border-border-default flex items-center justify-center font-black text-primary-500 text-xs shadow-sm">
                                                    {activity.branch?.branch_name?.charAt(0) || 'B'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-text-primary uppercase tracking-tight">{activity.branch?.branch_name}</span>
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-text-muted uppercase">
                                                        <User size={10} />
                                                        {activity.creator?.staff?.full_name || activity.creator?.name || 'Unknown Staff'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="flex flex-col max-w-xs gap-1.5">
                                                <span className="text-xs text-text-secondary font-medium leading-relaxed line-clamp-2">{activity.description || 'No additional details provided'}</span>
                                                {activity.receipt_number && (
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/30 border border-border-default/50 w-fit">
                                                        <FileText size={10} className="text-text-muted" />
                                                        <span className="text-[9px] font-black text-text-muted uppercase tracking-wider">Ref: {activity.receipt_number}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-8 text-right whitespace-nowrap">
                                            <div className="flex flex-col items-end">
                                                <span className="text-lg font-black text-primary-500 tracking-tight">
                                                    LKR {Number(activity.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                                <span className="text-[10px] font-bold text-text-muted uppercase opacity-50">Total Amount</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8 text-center whitespace-nowrap">
                                            {activity.status === 'pending' ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase text-[9px] font-black tracking-widest px-3 py-1 rounded-full inline-block">Pending Manager</span>
                                                    <span className="text-[8px] font-black text-text-muted uppercase opacity-40">1st Level Approval</span>
                                                </div>
                                            ) : activity.status === 'manager_approved' ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase text-[9px] font-black tracking-widest px-3 py-1 rounded-full inline-block">Awaiting Head Office</span>
                                                    <span className="text-[8px] font-black text-text-muted uppercase opacity-40">2nd Level Approval Required</span>
                                                </div>
                                            ) : activity.status === 'waiting_document' ? (
                                                <span className="bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 uppercase text-[9px] font-black tracking-widest px-3 py-1 rounded-full inline-block">Approved (Waiting Doc)</span>
                                            ) : activity.status === 'completed' ? (
                                                <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase text-[9px] font-black tracking-widest px-3 py-1 rounded-full inline-block">Fully Authorized</span>
                                            ) : activity.status === 'rejected' ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="bg-rose-500/10 text-rose-500 border border-rose-500/20 uppercase text-[9px] font-black tracking-widest px-3 py-1 rounded-full inline-block">Rejected</span>
                                                    <span className="text-[8px] font-black text-rose-500 uppercase opacity-60 line-clamp-1 max-w-[100px]">{activity.rejection_reason}</span>
                                                </div>
                                            ) : (
                                                <span className="bg-muted text-text-muted border-none uppercase text-[9px] font-black tracking-widest px-3 py-1 rounded-full inline-block">{activity.status}</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-8 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {(activity.status === 'pending' || activity.status === 'manager_approved') && (
                                                    <>
                                                        <button 
                                                            onClick={() => setApproveModal({ isOpen: true, activity })}
                                                            className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-90"
                                                            title="Authorize Transaction"
                                                        >
                                                            <CheckCircle size={20} />
                                                        </button>
                                                        <button 
                                                            onClick={() => setRejectionModal({ isOpen: true, activity })}
                                                            className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-90"
                                                            title="Decline Request"
                                                        >
                                                            <XCircle size={20} />
                                                        </button>
                                                    </>
                                                )}
                                                {activity.document_path && (
                                                    <button 
                                                        onClick={() => setPreviewDoc({
                                                            url: `${API_BASE_URL.replace('/api', '')}/storage/${activity.document_path}`,
                                                            type: activity.type === 'deposit' ? 'Bank Deposit Receipt' : 'Bank Withdrawal Document'
                                                        })}
                                                        className="p-3 rounded-2xl bg-text-primary/5 text-text-primary hover:bg-text-primary hover:text-white transition-all shadow-sm active:scale-90"
                                                        title="View Attachment"
                                                    >
                                                        <FileText size={20} />
                                                    </button>
                                                )}
                                                <button className="p-3 rounded-2xl bg-muted/20 text-text-muted hover:bg-muted/40 transition-all">
                                                    <ArrowRight size={20} />
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

            {/* Approval Confirmation Modal */}
            <ActionConfirmModal
                isOpen={approveModal.isOpen}
                onClose={() => setApproveModal({ isOpen: false, activity: null })}
                onConfirm={handleApprove}
                title="Authorize Transaction"
                message={`Are you sure you want to authorize this ${approveModal.activity?.type} for LKR ${Number(approveModal.activity?.amount).toLocaleString()}? This action will move the transaction to the next workflow stage.`}
                confirmLabel="Authorize Now"
                variant="primary"
                showNoteInput={true}
                notePlaceholder="Enter your authorization note here (optional)..."
            />

            {/* Rejection Modal */}
            {rejectionModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRejectionModal({ isOpen: false, activity: null })} />
                    <div className="relative bg-card border border-border-default rounded-[2.5rem] shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-10 flex flex-col items-center text-center gap-8">
                            <div className="w-20 h-20 rounded-[2rem] bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-inner">
                                <AlertCircle size={40} />
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-text-primary tracking-tight">Decline Request</h3>
                                <p className="text-sm text-text-muted leading-relaxed px-4">
                                    Please provide a reason for declining this <span className="text-rose-500 font-bold">{rejectionModal.activity?.type}</span> request for <span className="font-black text-text-primary">LKR {Number(rejectionModal.activity?.amount).toLocaleString()}</span>
                                </p>
                            </div>

                            <div className="w-full">
                                <textarea
                                    className="w-full px-5 py-4 rounded-2xl border-2 border-border-default bg-app-background text-text-primary text-sm focus:outline-none focus:border-rose-500 transition-all min-h-[120px] resize-none font-medium shadow-inner"
                                    placeholder="Enter your reason here..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full">
                                <button
                                    onClick={() => setRejectionModal({ isOpen: false, activity: null })}
                                    className="px-6 py-4 rounded-2xl text-text-muted font-black text-xs uppercase tracking-widest hover:bg-hover transition-all active:scale-95"
                                >
                                    Go Back
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={rejectingId === rejectionModal.activity?.id || !rejectionReason.trim()}
                                    className="px-6 py-4 rounded-2xl bg-rose-600 text-white font-black text-xs uppercase tracking-widest hover:bg-rose-500 transition-all shadow-lg shadow-rose-900/40 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {rejectingId === rejectionModal.activity?.id ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <XCircle size={16} />
                                    )}
                                    Confirm Decline
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Preview Modal */}
            {previewDoc && (
                <DocumentPreviewModal 
                    url={previewDoc.url}
                    type={previewDoc.type}
                    onClose={() => setPreviewDoc(null)}
                />
            )}
        </div>
    );
};

export default BankBranchApprovalPage;
