"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    FileText,
    Search,
    Eye,
    Printer,
    Lock,
    Unlock,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    RefreshCw,
    Download,
    ChevronLeft,
    ChevronRight,
    Filter,
    User,
    Calendar,
    TrendingUp,
    ShieldCheck,
    X,
    Loader2
} from "lucide-react";
import { toast } from "react-toastify";
import { investmentAgreementService, InvestmentWithAgreement } from "@/services/investmentAgreement.service";
import { documentPrintLogService } from "@/services/documentPrintLog.service";
import { authService } from "@/services/auth.service";
import { InvestmentAgreementDocument } from "@/components/investment/InvestmentAgreementDocument";
import { ReprintRequestModal } from "@/components/investment/ReprintRequestModal";
import { Pagination } from "@/components/common/Pagination";
import { colors } from "@/themes/colors";

type PrintStatus = 'all' | 'printed' | 'not_printed' | 'pending_reprint';
type ActionType = 'approve' | 'reject';

export default function InvestmentAgreementPage() {
    const [investments, setInvestments] = useState<InvestmentWithAgreement[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [printStatus, setPrintStatus] = useState<PrintStatus>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [perPage, setPerPage] = useState(15);
    const [selectedInvestment, setSelectedInvestment] = useState<InvestmentWithAgreement | null>(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showReprintModal, setShowReprintModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    // Action Modal State for Approval/Rejection
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

    const fetchInvestments = useCallback(async () => {
        try {
            setLoading(true);
            const response = await investmentAgreementService.getInvestments({
                search,
                print_status: printStatus,
                page: currentPage,
                per_page: perPage
            });
            setInvestments(response.data);
            setTotalPages(response.meta.last_page);
            setTotal(response.meta.total);
        } catch (error: any) {
            toast.error(error.message || "Failed to load investment agreements");
        } finally {
            setLoading(false);
        }
    }, [search, printStatus, currentPage, perPage]);

    useEffect(() => {
        fetchInvestments();
    }, [fetchInvestments]);

    const handleView = async (investment: InvestmentWithAgreement) => {
        try {
            const response = await investmentAgreementService.getInvestment(investment.id);
            setSelectedInvestment(response.data);
            setShowViewModal(true);
        } catch (error: any) {
            toast.error(error.message || "Failed to load investment details");
        }
    };

    const handlePrintRequest = async (investment: InvestmentWithAgreement) => {
        try {
            // Check if locked and needs reprint request first
            if (investment.print_count > 0 && !investment.is_reprint_authorized) {
                setSelectedInvestment(investment);
                setShowReprintModal(true);
                return;
            }

            // Immediately set basic data from list so preview isn't empty while loading full details
            setSelectedInvestment(investment);
            setShowPreviewModal(true);

            // Fetch FULL details to ensure witnesses and other nested data are present
            setActionLoading(investment.id);
            const response = await investmentAgreementService.getInvestment(investment.id);
            if (response && response.data) {
                setSelectedInvestment(response.data);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to load document details");
        } finally {
            setActionLoading(null);
        }
    };

    const handleConfirmPrint = async () => {
        if (!selectedInvestment) return;
        handlePrintPreview();
        try {
            setActionLoading(selectedInvestment.id);
            await investmentAgreementService.markPrinted(selectedInvestment.id);

            // Record in global print logs
            await documentPrintLogService.recordLog({
                document_type: 'investment_agreement',
                document_id: selectedInvestment.transaction_id,
                action: 'print',
                status: 'success',
                print_count: (selectedInvestment.print_count || 0) + 1,
                metadata: {
                    investment_id: selectedInvestment.id,
                    transaction_id: selectedInvestment.transaction_id,
                    customer_name: selectedInvestment.customer.full_name
                }
            });

            toast.success("Agreement print recorded successfully");
            setShowPreviewModal(false);
            fetchInvestments();
        } catch (error: any) {
            toast.error(error.message || "Failed to record print status");
        } finally {
            setActionLoading(null);
            setSelectedInvestment(null);
        }
    };

    const handleReprintConfirm = async (reason: string) => {
        if (!selectedInvestment) return;
        await investmentAgreementService.requestReprint(selectedInvestment.id, reason);
        toast.success("Reprint request submitted for approval");
        fetchInvestments();
    };

    const openActionModal = (type: ActionType, inv: any) => {
        setActionModal({
            isOpen: true,
            type,
            requestId: inv.id,
            data: inv
        });
    };

    const handleConfirmAction = async () => {
        const { type, requestId } = actionModal;
        if (!requestId) return;
        try {
            setActionLoading(requestId);
            if (type === 'approve') {
                await investmentAgreementService.approveReprint(requestId);
                toast.success("Reprint authorized");
            } else {
                await investmentAgreementService.rejectReprint(requestId);
                toast.warning("Reprint request rejected");
            }
            setActionModal(prev => ({ ...prev, isOpen: false }));
            fetchInvestments();
        } catch (error: any) {
            toast.error(error.message || `Failed to ${type} request`);
        } finally {
            setActionLoading(null);
        }
    };

    const handlePrintPreview = () => {
        const printContent = document.getElementById('investment-print-container');
        if (!printContent) return;
        const printWindow = window.open('', '_blank', 'width=1000,height=800');
        if (!printWindow) return;
        printWindow.document.write(`
            <html>
                <head>
                    <title>Agreement - ${selectedInvestment?.transaction_id}</title>
                    <style>
                        @page { size: A4; margin: 0; }
                        @media print {
                            body { background: white !important; margin: 0 !important; padding: 0 !important; }
                        }
                        body { font-family: 'Times New Roman', serif; }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                    <script>
                        window.onload = () => {
                            setTimeout(() => {
                                window.print();
                                window.close();
                            }, 1000);
                        };
                    <\/script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const getStatusBadge = (investment: InvestmentWithAgreement) => {
        if (investment.print_count === 0) return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"><FileText className="w-3 h-3" />Not Printed</span>;
        if (investment.reprint_requested && !investment.is_reprint_authorized) return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700"><Clock className="w-3 h-3" />Reprint Pending</span>;
        if (investment.is_reprint_authorized) return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700"><Unlock className="w-3 h-3" />Auth Granted</span>;
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"><Lock className="w-3 h-3" />Printed ({investment.print_count}x)</span>;
    };

    const getPrintButtonState = (investment: InvestmentWithAgreement) => {
        if (investment.print_count === 0) return { text: "Print", icon: <Printer className="w-4 h-4" />, variant: "primary" };
        if (investment.reprint_requested && !investment.is_reprint_authorized) return { text: "Pending", icon: <Clock className="w-4 h-4" />, variant: "disabled" };
        if (investment.is_reprint_authorized) return { text: "Reprint", icon: <RefreshCw className="w-4 h-4" />, variant: "success" };
        return { text: "Request Reprint", icon: <Lock className="w-4 h-4" />, variant: "warning" };
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <TrendingUp className="w-7 h-7 text-primary-600" />
                        Investment Agreements
                    </h1>
                    <p className="text-sm text-text-secondary mt-1">Print portfolio agreements for activated investments</p>
                </div>
                <button
                    onClick={fetchInvestments}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-muted-bg border border-transparent hover:bg-hover text-text-primary rounded-xl transition-all shadow-sm"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-2xl shadow-sm border border-border-default p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search by ID, Name or Customer Code..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-12 pr-4 py-3 bg-input border border-border-default rounded-xl text-text-primary focus:ring-2 focus:ring-primary-500 transition-all font-medium placeholder-text-muted"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={printStatus}
                            onChange={(e) => { setPrintStatus(e.target.value as PrintStatus); setCurrentPage(1); }}
                            className="px-4 py-3 bg-input border border-border-default rounded-xl text-text-primary focus:ring-2 focus:ring-primary-500 font-medium"
                        >
                            <option value="all">All Status</option>
                            <option value="not_printed">Ready to Print</option>
                            <option value="printed">Already Printed</option>
                            <option value="pending_reprint">Awaiting Auth</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-card rounded-2xl shadow-sm border border-border-default overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-table-header border-b border-border-default">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Transaction</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Customer</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Investment</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-text-secondary">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-divider">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-text-muted">
                                        <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-4 opacity-50" />
                                        <p className="font-black uppercase text-[10px] tracking-widest">Scanning Portfolio...</p>
                                    </td>
                                </tr>
                            ) : investments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-text-muted">
                                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p className="font-black uppercase text-[10px] tracking-widest">No Active Investments Found</p>
                                    </td>
                                </tr>
                            ) : (
                                investments.map((inv) => {
                                    const btn = getPrintButtonState(inv);
                                    const id = inv.id;
                                    return (
                                        <tr key={inv.id} className="hover:bg-table-row-hover transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-text-primary">{inv.transaction_id}</div>
                                                <div className="text-[10px] text-text-muted font-bold uppercase">{inv.product.name}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-text-primary">{inv.customer.full_name}</div>
                                                <div className="text-[10px] text-text-muted font-bold uppercase">{inv.customer.customer_code}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-primary-600">Rs. {Number(inv.amount).toLocaleString()}</div>
                                                <div className="text-[10px] text-text-muted font-bold uppercase">{inv.policy_term} Months @ {inv.interest}%</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(inv)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleView(inv)} className="p-2.5 bg-muted-bg hover:bg-primary-50 text-text-muted hover:text-primary-600 rounded-xl transition-all" title="Quick View"><Eye className="w-5 h-5" /></button>

                                                    {inv.reprint_requested && !inv.is_reprint_authorized && authService.hasPermission('loan_agreements.approve_reprint') && (
                                                        <>
                                                            <button onClick={() => openActionModal('approve', inv)} disabled={actionLoading === id} className="p-2.5 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-xl transition-all dark:bg-primary-900/30 dark:hover:bg-primary-900/50 dark:text-primary-400"><CheckCircle className="w-5 h-5" /></button>
                                                            <button onClick={() => openActionModal('reject', inv)} disabled={actionLoading === id} className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400"><XCircle className="w-5 h-5" /></button>
                                                        </>
                                                    )}

                                                    <button
                                                        onClick={() => handlePrintRequest(inv)}
                                                        disabled={actionLoading === id || btn.variant === 'disabled'}
                                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm ${btn.variant === 'primary' ? 'bg-primary-600 hover:bg-primary-700 text-white' : btn.variant === 'success' ? 'bg-primary-600 hover:bg-primary-700 text-white' : btn.variant === 'warning' ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-muted-bg text-text-muted cursor-not-allowed border-border-default border'}`}
                                                    >
                                                        {actionLoading === id ? <RefreshCw className="w-4 h-4 animate-spin" /> : btn.icon}
                                                        {btn.text}
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
                <Pagination
                    currentPage={currentPage}
                    totalItems={total}
                    itemsPerPage={perPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(newPerPage) => {
                        setPerPage(newPerPage);
                        setCurrentPage(1);
                    }}
                    itemName="agreements"
                />
            </div>

            {/* Action Popup (Themed) */}
            {actionModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="relative w-full max-w-lg bg-white/70 backdrop-blur-2xl rounded-[3rem] border border-white/40 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
                        <button onClick={() => setActionModal(prev => ({ ...prev, isOpen: false }))} className="absolute top-8 right-8 p-3 rounded-2xl hover:bg-black/5 text-gray-400 hover:text-gray-900 z-10"><X className="w-6 h-6" /></button>
                        <div className="p-12 text-center">
                            <div className="w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-8 mx-auto shadow-2xl" style={{ background: actionModal.type === 'approve' ? `linear-gradient(135deg, ${colors.primary[500]}, ${colors.primary[600]})` : `linear-gradient(135deg, ${colors.danger[500]}, #dc2626)` }}>
                                {actionModal.type === 'approve' ? <ShieldCheck className="w-12 h-12 text-white" /> : <XCircle className="w-12 h-12 text-white" />}
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-3">Confirm {actionModal.type === 'approve' ? 'Approval' : 'Rejection'}</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-10">Investment Ledger Reprint Authorization</p>
                            <div className="bg-gray-50/50 rounded-[2rem] p-6 mb-10 border border-gray-100">
                                <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-3">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Document Ref</span>
                                    <span className="font-bold text-gray-900">{actionModal.data?.transaction_id}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</span>
                                    <span className="font-bold text-gray-900">{actionModal.data?.customer?.full_name}</span>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={() => setActionModal(prev => ({ ...prev, isOpen: false }))} className="flex-1 px-8 py-5 bg-white border border-gray-200 text-gray-400 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-gray-50">Abeyance</button>
                                <button onClick={handleConfirmAction} disabled={actionLoading !== null} className="flex-[1.5] px-8 py-5 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95" style={{ background: actionModal.type === 'approve' ? `linear-gradient(135deg, ${colors.primary[500]}, ${colors.primary[600]})` : `linear-gradient(135deg, ${colors.danger[500]}, #dc2626)` }}>
                                    {actionLoading !== null ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Confirm ${actionModal.type === 'approve' ? 'Auth' : 'Denial'}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showViewModal && selectedInvestment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Portfolio Summary</h2>
                            <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-gray-100 rounded-2xl transition-all"><XCircle className="w-6 h-6 text-gray-400" /></button>
                        </div>
                        <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction ID</p><p className="text-lg font-bold text-gray-900">{selectedInvestment.transaction_id}</p></div>
                                <div className="space-y-1"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Product</p><p className="text-lg font-bold text-gray-900">{selectedInvestment.product.name}</p></div>
                                <div className="space-y-1"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</p><p className="text-lg font-bold text-gray-900">{selectedInvestment.customer.full_name}</p></div>
                                <div className="space-y-1"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Principal Amount</p><p className="text-xl font-black text-primary-600">Rs. {Number(selectedInvestment.amount).toLocaleString()}</p></div>
                            </div>
                            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                <h3 className="text-xs font-black uppercase tracking-widest text-[#2b5797] mb-6 flex items-center gap-2"><Printer className="w-4 h-4" /> Usage Tracking</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm"><span className="text-[10px] font-bold text-gray-500 uppercase">Documents Issued</span><span className="text-sm font-black">{selectedInvestment.print_count} Copies</span></div>
                                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm"><span className="text-[10px] font-bold text-gray-500 uppercase">Verification Status</span>{getStatusBadge(selectedInvestment)}</div>
                                    {selectedInvestment.reprint_requested && <div className="p-4 bg-amber-50 rounded-2xl"><p className="text-[10px] font-black text-amber-600 uppercase mb-2">Request Reason</p><p className="text-xs font-medium italic">"{selectedInvestment.reprint_reason}"</p></div>}
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setShowViewModal(false)} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600">Dismiss</button>
                            <button onClick={() => { setShowViewModal(false); handlePrintRequest(selectedInvestment); }} className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-primary-500/20">Generate Document</button>
                        </div>
                    </div>
                </div>
            )}

            <ReprintRequestModal isOpen={showReprintModal} onClose={() => setShowReprintModal(false)} onConfirm={handleReprintConfirm} investmentTitle={selectedInvestment?.product.name || ''} investmentId={selectedInvestment?.transaction_id || ''} />

            {showPreviewModal && selectedInvestment && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary-50 rounded-2xl">
                                    <Printer className="w-6 h-6 text-primary-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Agreement Preview</h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Verify Ledger Details</p>
                                </div>
                            </div>
                            <button onClick={() => setShowPreviewModal(false)} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all">
                                <XCircle className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 bg-gray-100 flex justify-center custom-scrollbar">
                            <div className="shadow-2xl bg-white" id="investment-print-container">
                                <InvestmentAgreementDocument
                                    investment={selectedInvestment as any}
                                    witnesses={selectedInvestment.witnesses as any}
                                />
                            </div>
                        </div>

                        <div className="p-8 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                                <ShieldCheck className="w-4 h-4 text-primary-600" />
                                <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Document verification complete</span>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setShowPreviewModal(false)} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Cancel</button>
                                <button
                                    onClick={handleConfirmPrint}
                                    className="px-10 py-4 bg-primary-600 hover:bg-primary-700 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-primary-500/20 transition-all active:scale-95"
                                >
                                    Confirm & Initiate Print
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
