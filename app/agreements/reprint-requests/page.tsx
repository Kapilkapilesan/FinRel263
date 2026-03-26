"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    Eye,
    RefreshCw,
    User,
    Calendar,
    DollarSign,
    ChevronLeft,
    ChevronRight,
    Search,
    AlertTriangle,
    TrendingUp,
    ShieldCheck,
    X,
    Loader2
} from "lucide-react";
import { toast } from "react-toastify";
import { loanAgreementService, LoanAgreement, LoanWithAgreement } from "@/services/loanAgreement.service";
import { investmentAgreementService, InvestmentWithAgreement } from "@/services/investmentAgreement.service";
import { authService } from "@/services/auth.service";
import { colors } from "@/themes/colors";

type RequestType = 'loan' | 'investment';
type ActionType = 'approve' | 'reject';

export default function ReprintRequestsPage() {
    const [activeTab, setActiveTab] = useState<RequestType>('loan');
    const [loanRequests, setLoanRequests] = useState<(LoanAgreement & { loan: LoanWithAgreement })[]>([]);
    const [investmentRequests, setInvestmentRequests] = useState<InvestmentWithAgreement[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Action Modal State
    const [actionModal, setActionModal] = useState<{
        isOpen: boolean;
        type: ActionType;
        requestId: number | null;
        data: any;
    }>({
        isOpen: false,
        type: 'approve',
        requestId: null,
        data: null
    });

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            if (activeTab === 'loan') {
                const response = await loanAgreementService.getPendingReprints({
                    page: currentPage,
                    per_page: 15
                });
                setLoanRequests(response.data);
                setTotalPages(response.meta.last_page);
                setTotal(response.meta.total);
            } else {
                const response = await investmentAgreementService.getPendingReprints({
                    page: currentPage,
                    per_page: 15
                });
                setInvestmentRequests(response.data);
                setTotalPages(response.meta.last_page);
                setTotal(response.meta.total);
            }
        } catch (error: any) {
            toast.error(error.message || `Failed to load ${activeTab} reprint requests`);
        } finally {
            setLoading(false);
        }
    }, [currentPage, activeTab]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const openActionModal = (type: ActionType, req: any) => {
        const id = activeTab === 'loan' ? req.loan_id : req.id;
        setActionModal({
            isOpen: true,
            type,
            requestId: id,
            data: req
        });
    };

    const handleConfirmAction = async () => {
        const { type, requestId } = actionModal;
        if (!requestId) return;

        try {
            setActionLoading(requestId);
            if (type === 'approve') {
                if (activeTab === 'loan') {
                    await loanAgreementService.approveReprint(requestId);
                } else {
                    await investmentAgreementService.approveReprint(requestId);
                }
                toast.success("Reprint Authorization Granted");
            } else {
                if (activeTab === 'loan') {
                    await loanAgreementService.rejectReprint(requestId);
                } else {
                    await investmentAgreementService.rejectReprint(requestId);
                }
                toast.warning("Reprint Request Denied");
            }

            setActionModal(prev => ({ ...prev, isOpen: false }));
            fetchRequests();
            if (showDetailModal) setShowDetailModal(false);
        } catch (error: any) {
            toast.error(error.message || `Failed to ${type} request`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleViewDetail = (request: any) => {
        setSelectedRequest(request);
        setShowDetailModal(true);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ShieldCheck className="w-7 h-7 text-primary-600" />
                        Reprint Approvals
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        High-security authorization portal for document duplication
                    </p>
                </div>
                <button
                    onClick={fetchRequests}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl transition-all shadow-sm"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => { setActiveTab('loan'); setCurrentPage(1); }}
                    className={`px-6 py-3 text-sm font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'loan' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Loan Ledger
                    </div>
                </button>
                <button
                    onClick={() => { setActiveTab('investment'); setCurrentPage(1); }}
                    className={`px-6 py-3 text-sm font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'investment' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Investment Assets
                    </div>
                </button>
            </div>

            {/* Content Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Reference</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Customer</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Requested By</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Date/Time</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Reason</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-4 opacity-20" />
                                        <p className="font-black uppercase text-[10px] tracking-widest text-gray-400">Verifying Pending Actions...</p>
                                    </td>
                                </tr>
                            ) : (activeTab === 'loan' ? loanRequests : investmentRequests).length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2 opacity-30">
                                            <ShieldCheck className="w-12 h-12 text-primary-600" />
                                            <p className="font-black uppercase text-[10px] tracking-widest">All Requests are Cleared</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                (activeTab === 'loan' ? loanRequests : (investmentRequests as any)).map((req: any) => {
                                    const refNumber = activeTab === 'loan' ? req.loan?.contract_number : req.transaction_id;
                                    const customer = activeTab === 'loan' ? req.loan?.customer : req.customer;
                                    const requestedBy = activeTab === 'loan' ? req.reprint_requested_by_user?.full_name : req.created_by?.name;
                                    const requestedAt = activeTab === 'loan' ? req.reprint_requested_at : req.time_stamp;
                                    const reason = req.reprint_reason;
                                    const id = activeTab === 'loan' ? (req.loan_id || req.id) : req.id;

                                    return (
                                        <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900 dark:text-white">{refNumber}</div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase">{activeTab === 'loan' ? 'Loan Contract' : req.product.name}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900 dark:text-white">{customer?.full_name}</div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase">{customer?.customer_code}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{requestedBy || 'Staff'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                                                    {requestedAt ? new Date(requestedAt).toLocaleString() : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-xs">
                                                <div className="text-xs text-gray-500 font-medium italic truncate" title={reason || ''}>
                                                    "{reason || 'No reason specified'}"
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleViewDetail(req)}
                                                        className="p-2.5 bg-gray-50 dark:bg-gray-700/50 hover:bg-primary-50 text-gray-400 hover:text-primary-600 rounded-xl transition-all"
                                                        title="Quick View"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => openActionModal('approve', req)}
                                                        disabled={actionLoading === id}
                                                        className="p-2.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl transition-all disabled:opacity-50"
                                                        title="Grant Authorization"
                                                    >
                                                        {actionLoading === id && actionModal.type === 'approve' ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                                    </button>
                                                    <button
                                                        onClick={() => openActionModal('reject', req)}
                                                        disabled={actionLoading === id}
                                                        className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all disabled:opacity-50"
                                                        title="Reject Request"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Showing Page {currentPage} of {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 transition-all shadow-sm"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 transition-all shadow-sm"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Confirmation Modal (The "Popup") */}
            {actionModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="relative w-full max-w-lg bg-white/70 backdrop-blur-2xl rounded-[3rem] border border-white/40 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-500">
                        {/* Close Button */}
                        <button
                            onClick={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
                            className="absolute top-8 right-8 p-3 rounded-2xl hover:bg-black/5 transition-all text-gray-400 hover:text-gray-900 z-10"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="p-12">
                            <div className="flex flex-col items-center text-center mb-10">
                                <div
                                    className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl transform rotate-3 transition-transform hover:rotate-0 duration-500`}
                                    style={{
                                        background: actionModal.type === 'approve'
                                            ? `linear-gradient(135deg, ${colors.primary[500]}, ${colors.primary[600]})`
                                            : `linear-gradient(135deg, ${colors.danger[500]}, ${colors.danger[600] || '#dc2626'})`,
                                        boxShadow: `0 20px 40px ${actionModal.type === 'approve' ? colors.primary[500] : colors.danger[500]}40`
                                    }}
                                >
                                    {actionModal.type === 'approve' ? <ShieldCheck className="w-12 h-12 text-white" /> : <XCircle className="w-12 h-12 text-white" />}
                                </div>

                                <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-3">
                                    Confirm <span className={actionModal.type === 'approve' ? "text-primary-600" : "text-red-600"}>{actionModal.type === 'approve' ? 'Approval' : 'Rejection'}</span>
                                </h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                                    {activeTab.toUpperCase()} Ledger Reprint Authorization
                                </p>
                            </div>

                            <div className="bg-gray-50/50 dark:bg-gray-900/30 rounded-[2rem] p-6 mb-10 border border-gray-100 dark:border-gray-800">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Document Ref</span>
                                        <span className="font-bold text-gray-900 dark:text-white">
                                            {activeTab === 'loan' ? actionModal.data?.loan?.contract_number : actionModal.data?.transaction_id}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</span>
                                        <span className="font-bold text-gray-900 dark:text-white">
                                            {activeTab === 'loan' ? actionModal.data?.loan?.customer?.full_name : actionModal.data?.customer?.full_name}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
                                    className="flex-1 px-8 py-5 bg-white border border-gray-200 text-gray-400 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-gray-50 transition-all hover:text-gray-600"
                                >
                                    Abeyance
                                </button>
                                <button
                                    onClick={handleConfirmAction}
                                    disabled={actionLoading !== null}
                                    className="flex-[1.5] relative group overflow-hidden px-8 py-5 rounded-2xl transition-all active:scale-95 shadow-xl"
                                    style={{
                                        background: actionModal.type === 'approve'
                                            ? `linear-gradient(135deg, ${colors.primary[500]}, ${colors.primary[600]})`
                                            : `linear-gradient(135deg, ${colors.danger[500]}, ${colors.danger[600] || '#dc2626'})`,
                                        boxShadow: `0 15px 30px ${actionModal.type === 'approve' ? colors.primary[500] : colors.danger[500]}20`
                                    }}
                                >
                                    <div className="relative flex items-center justify-center gap-3">
                                        {actionLoading !== null ? (
                                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                                        ) : (
                                            <CheckCircle className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                                        )}
                                        <span className="text-white font-black uppercase text-[10px] tracking-widest">
                                            Confirm {actionModal.type === 'approve' ? 'Auth' : 'Denial'}
                                        </span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedRequest && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-2xl w-full max-w-lg border border-white/20 animate-in zoom-in-95 duration-300 overflow-hidden">
                        <div className="p-10 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Security Audit</h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Verification Dossier</p>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all">
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>
                        <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-[2.5rem] p-8">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-4 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> Justification
                                </h3>
                                <p className="text-sm font-semibold italic text-gray-700 dark:text-gray-200 indent-4 leading-relaxed">
                                    "{selectedRequest.reprint_reason || 'Manual override requested by system operator.'}"
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6 bg-gray-50/50 dark:bg-gray-900/50 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800">
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Agreement Ref</p>
                                    <p className="font-bold text-gray-900 dark:text-white">
                                        {activeTab === 'loan' ? selectedRequest?.loan?.contract_number : selectedRequest?.transaction_id}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Customer</p>
                                    <p className="font-bold text-gray-900 dark:text-white">
                                        {activeTab === 'loan' ? selectedRequest?.loan?.customer?.full_name : selectedRequest?.customer?.full_name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Staff Signature</p>
                                    <p className="font-bold text-gray-900 dark:text-white">
                                        {activeTab === 'loan' ? selectedRequest?.reprint_requested_by_user?.full_name : selectedRequest?.created_by?.name || 'Authorized Staff'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Journaled</p>
                                    <p className="font-bold text-gray-900 dark:text-white">
                                        {new Date(activeTab === 'loan' ? selectedRequest.reprint_requested_at : selectedRequest.time_stamp).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-10 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-all font-bold"
                            >
                                Close Audit
                            </button>
                            <button
                                onClick={() => openActionModal('reject', selectedRequest)}
                                className="px-8 py-5 bg-white border border-red-100 text-red-500 font-black uppercase text-[10px] tracking-widest rounded-3xl hover:bg-red-50 transition-all shadow-sm shadow-red-500/5"
                            >
                                Deny Request
                            </button>
                            <button
                                onClick={() => openActionModal('approve', selectedRequest)}
                                className="px-10 py-5 bg-primary-600 hover:bg-primary-700 text-white font-black uppercase text-[10px] tracking-widest rounded-3xl shadow-xl shadow-primary-500/20 transition-all active:scale-95"
                            >
                                Grant Authorization
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
