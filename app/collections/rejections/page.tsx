'use client'

import React, { useState, useEffect } from 'react';
import { RotateCcw, AlertCircle, CheckCircle2, X, Search, Filter, ArrowRight, User, Hash, Calendar, DollarSign, History } from 'lucide-react';
import { collectionService } from '../../../services/collection.service';
import { toast } from 'react-toastify';
import { ActionConfirmModal } from '../../../components/common/ActionConfirmModal';
import BMSLoader from '../../../components/common/BMSLoader';
import { colors } from '@/themes/colors';

export default function RejectionRequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        id: number | null;
        type: 'approve' | 'reject' | null;
    }>({
        isOpen: false,
        id: null,
        type: null
    });

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const data = await collectionService.getPendingCancellations();
            setRequests(data);
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch requests');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmAction = async () => {
        if (!confirmModal.id || !confirmModal.type) return;

        try {
            if (confirmModal.type === 'approve') {
                await collectionService.approveReceiptCancellation(confirmModal.id);
                toast.success('Cancellation approved successfully');
            } else {
                await collectionService.rejectReceiptCancellation(confirmModal.id);
                toast.success('Cancellation request rejected');
            }
            fetchRequests();
        } catch (error: any) {
            toast.error(error.message || 'Action failed');
        }
    };

    const filteredRequests = requests.filter(req =>
        req.receipt_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.customer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.loan?.contract_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.requested_by?.staff?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.requested_by?.staff?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.requested_by?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen p-4 lg:p-8 bg-app-background transition-colors">
            {/* Header section */}
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
                                style={{ backgroundColor: colors.primary[600], boxShadow: `0 10px 15px -3px ${colors.primary[600]}33` }}
                            >
                                <RotateCcw size={20} />
                            </div>
                            <h1 className="text-2xl font-black text-text-primary tracking-tight">Cancellation Requests</h1>
                        </div>
                        <p className="text-sm font-medium text-text-secondary uppercase tracking-widest">
                            Review and process receipt voiding requests
                        </p>
                    </div>
                </div>

                {/* Stats / Quick Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-card p-6 rounded-2xl border border-border-default shadow-sm flex items-center gap-4 transition-colors">
                        <div className="w-12 h-12 bg-warning-50/10 rounded-xl flex items-center justify-center text-warning-600">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Total Pending</p>
                            <p className="text-2xl font-black text-text-primary tracking-tighter">{requests.length}</p>
                        </div>
                    </div>
                    <div className="bg-card p-6 rounded-2xl border border-border-default shadow-sm flex items-center gap-4 transition-colors">
                        <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center text-primary-600">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Approved Today</p>
                            <p className="text-2xl font-black text-text-primary tracking-tighter">0</p>
                        </div>
                    </div>
                    <div className="bg-card p-6 rounded-2xl border border-border-default shadow-sm flex items-center gap-4 transition-colors">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${colors.primary[50]}`, color: colors.primary[600] }}
                        >
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Impact Value</p>
                            <p className="text-2xl font-black text-text-primary tracking-tighter">LKR 0</p>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-card p-4 rounded-2xl border border-border-default shadow-sm flex flex-col md:flex-row gap-4 items-center transition-colors">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                        <input
                            type="text"
                            placeholder="Search by Receipt ID, Customer or Contract..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-muted-bg border border-border-divider rounded-xl text-sm transition-all font-medium placeholder:text-text-muted focus:ring-4 focus:ring-primary-500/10 focus:bg-card focus:border-primary-500/30 text-text-primary outline-none"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-card border border-border-default rounded-xl text-[10px] font-black uppercase tracking-widest text-text-secondary hover:bg-hover transition-all">
                            <Filter size={14} />
                            Filter
                        </button>
                        <button
                            onClick={fetchRequests}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
                            style={{
                                backgroundColor: colors.primary[600],
                                boxShadow: `0 10px 15px -3px ${colors.primary[600]}33`
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primary[700]}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary[600]}
                        >
                            <RotateCcw size={14} className={isLoading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Requests Table */}
                <div className="bg-card rounded-3xl border border-border-default shadow-xl overflow-hidden min-h-[400px] transition-colors">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-4">
                            <BMSLoader message="Syncing Requests..." size="xsmall" />
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 opacity-30">
                            <div className="w-24 h-24 bg-muted-bg rounded-full flex items-center justify-center mb-6">
                                <CheckCircle2 size={48} className="text-text-muted" />
                            </div>
                            <p className="text-sm font-black text-text-muted uppercase tracking-[0.3em]">All Clear: No Pending Requests</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-table-header border-b border-border-divider">
                                        <th className="px-6 py-5 text-[10px] font-black text-text-muted uppercase tracking-widest">Transaction Info</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-text-muted uppercase tracking-widest">Customer Details</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-text-muted uppercase tracking-widest">Amount & Date</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-text-muted uppercase tracking-widest">Cancellation Reason</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-text-muted uppercase tracking-widest">Cancelled By</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-text-muted uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredRequests.map((request) => (
                                        <tr
                                            key={request.id}
                                            className="transition-colors group hover:bg-table-row-hover border-b border-border-divider last:border-0"
                                        >
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-card border border-border-default rounded-xl flex items-center justify-center text-text-muted group-hover:scale-110 transition-transform">
                                                        <Hash size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-text-primary tracking-tight">#{request.receipt_id}</p>
                                                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{request.loan?.contract_no}</p>

                                                        {/* Always show print count */}
                                                        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                                                            <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 rounded text-[9px] font-black uppercase tracking-wider border border-slate-200 dark:border-slate-500/20">
                                                                <History size={9} />
                                                                <span>Printed {(request.copy_count || 0) + (request.reprint_count || 0)}x</span>
                                                            </div>
                                                            {request.reprint_count > 0 && (
                                                                <div className="flex items-center gap-1 px-2 py-0.5 bg-red-50 dark:bg-red-500/10 text-red-600 rounded text-[9px] font-black uppercase tracking-wider animate-pulse border border-red-200 dark:border-red-500/20">
                                                                    ⚠ Reprinted {request.reprint_count}x
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary-500/10 text-primary-600"
                                                    >
                                                        <User size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-text-primary tracking-tight">{request.customer?.full_name}</p>
                                                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{request.customer?.phone}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign size={14} className="text-primary-500" />
                                                        <span className="text-sm font-black text-primary-600 tracking-tight">LKR {request.current_due_amount?.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                                        <Calendar size={12} />
                                                        {new Date(request.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="max-w-xs">
                                                    <div className="bg-warning-500/5 rounded-xl p-3 border border-warning-500/10">
                                                        <p className="text-xs font-medium text-warning-700 dark:text-warning-300 italic leading-relaxed">
                                                            "{request.cancellation_reason}"
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                                                        <User size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-text-primary tracking-tight">
                                                            {request.requested_by?.staff?.full_name || request.requested_by?.staff?.first_name || request.requested_by?.name || 'N/A'}
                                                        </p>
                                                        <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider">
                                                            {request.requested_by?.staff?.staff_id || 'Field Officer'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setConfirmModal({ isOpen: true, id: request.id, type: 'reject' })}
                                                        className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/10 active:scale-95"
                                                        title="Reject Request"
                                                    >
                                                        <X size={14} />
                                                        Reject
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmModal({ isOpen: true, id: request.id, type: 'approve' })}
                                                        className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/10 active:scale-95"
                                                    >
                                                        <CheckCircle2 size={14} />
                                                        Approve
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <ActionConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, id: null, type: null })}
                onConfirm={handleConfirmAction}
                title={confirmModal.type === 'approve' ? 'Approve Cancellation' : 'Reject Request'}
                message={confirmModal.type === 'approve'
                    ? 'Are you sure you want to approve this receipt cancellation? This action will reverse all associated balances.'
                    : 'Are you sure you want to reject this cancellation request? The receipt will remain active.'}
                confirmLabel={confirmModal.type === 'approve' ? 'Yes, Approve' : 'Yes, Reject'}
                variant={confirmModal.type === 'approve' ? 'primary' : 'danger'}
            />
        </div>
    );
}
