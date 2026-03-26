'use client';

import React, { useState, useEffect } from 'react';
import {
    Receipt,
    FileText,
    XCircle,
    Plus,
    Search,
    User,
    DollarSign,
    CheckCircle,
    Building2,
    Landmark,
    X,
    Printer,
    ChevronLeft,
    ChevronRight,
    RotateCcw,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { investmentService } from '@/services/investment.service';
import { receiptService } from '@/services/receipt.service';
import { financeService } from '@/services/finance.service';
import { staffIouService } from '@/services/staffIou.service';
import { toast } from 'react-toastify';
import BMSLoader from '@/components/common/BMSLoader';
import { colors } from '@/themes/colors';
import { ReceiptPrintModal } from './ReceiptPrintModal';

const ReceiptCreationCancellationPage: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedType, setSelectedType] = useState<'INVESTMENT' | 'BRANCH_ACTIVITY' | 'OTHER_BRANCH_COLLECTION' | 'STAFF_IOU' | null>(null);
    const [pendingInvestments, setPendingInvestments] = useState<any[]>([]);
    const [loadingInvestments, setLoadingInvestments] = useState(false);
    const [pendingBranchActivities, setPendingBranchActivities] = useState<any[]>([]);
    const [loadingBranchActivities, setLoadingBranchActivities] = useState(false);
    const [pendingOtherCollections, setPendingOtherCollections] = useState<any[]>([]);
    const [loadingOtherCollections, setLoadingOtherCollections] = useState(false);
    const [pendingStaffIOUs, setPendingStaffIOUs] = useState<any[]>([]);
    const [loadingStaffIOUs, setLoadingStaffIOUs] = useState(false);
    const [receipts, setReceipts] = useState<any[]>([]);
    const [loadingReceipts, setLoadingReceipts] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
    const [filterType, setFilterType] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [cancelReason, setCancelReason] = useState("");
    const [isCancelling, setIsCancelling] = useState(false);
    const [selectedInv, setSelectedInv] = useState<any>(null);
    const [receiptId, setReceiptId] = useState("");
    const [isIssuing, setIsIssuing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [terminalId] = useState(() => Math.random().toString(36).substr(2, 6).toUpperCase());
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [printingReceipt, setPrintingReceipt] = useState<any>(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [totalReceipts, setTotalReceipts] = useState(0);
    const perPage = 10;

    const fetchReceipts = async (page = 1, type?: string | null) => {
        try {
            setLoadingReceipts(true);
            const params: any = {
                page: page,
                per_page: perPage
            };
            // If type is provided or filterType is set, use it
            const activeType = type !== undefined ? type : filterType;
            if (activeType) {
                params.receipt_type = activeType;
            }
            if (filterStatus) {
                params.status = filterStatus;
            }
            const response = await receiptService.getReceipts(params);

            // Handle Laravel pagination response
            if (response.data && response.data.data) {
                setReceipts(response.data.data);
                setCurrentPage(response.data.current_page);
                setLastPage(response.data.last_page);
                setTotalReceipts(response.data.total);
            } else {
                setReceipts([]);
                setTotalReceipts(0);
            }
        } catch (error) {
            toast.error("Failed to load receipts");
        } finally {
            setLoadingReceipts(false);
        }
    };

    const fetchPendingInvestments = async () => {
        try {
            setLoadingInvestments(true);
            const all = await investmentService.getInvestments();
            const pending = all.filter((inv: any) => inv.status === 'APPROVED_AWAITING_PAYMENT');
            setPendingInvestments(pending);
        } catch (error) {
            toast.error("Failed to load authorized investments");
        } finally {
            setLoadingInvestments(false);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
        fetchReceipts(1);
    }, [filterType, filterStatus]);

    useEffect(() => {
        if (showCreateModal) {
            if (selectedType === 'INVESTMENT') fetchPendingInvestments();
            else if (selectedType === 'BRANCH_ACTIVITY') fetchPendingBranchActivities();
            else if (selectedType === 'OTHER_BRANCH_COLLECTION') fetchPendingOtherCollections();
            else if (selectedType === 'STAFF_IOU') fetchPendingStaffIOUs();
        }
    }, [showCreateModal, selectedType]);

    const fetchPendingBranchActivities = async () => {
        try {
            setLoadingBranchActivities(true);
            const data = await financeService.getBranchRequests(undefined, 'Approved,Paid', 'Branch Activity', true);

            // Filter: Inflows ready at Approved, Outflows only ready at Paid (OTP confirmed)
            const filteredData = (data || []).filter((item: any) => {
                if (item.type === 'outflow') return item.status === 'Paid';
                return item.status === 'Approved';
            });

            setPendingBranchActivities(filteredData);

            // If there's a specific ID in the URL, auto-select it
            const targetId = searchParams.get('id');
            const targetType = searchParams.get('type');
            if (targetId && targetType === 'BRANCH_ACTIVITY' && data) {
                const target = data.find((item: any) => item.id.toString() === targetId);
                // Even for auto-select, ensure it's in the filtered list (meaning it's paid if outflow)
                if (target && filteredData.some(f => f.id === target.id)) {
                    setSelectedInv(target);
                    // Generate a manual receipt ID placeholder
                    setReceiptId(`RCP-BR-${Date.now().toString().slice(-6)}`);
                }
            }
        } catch (error) {
            toast.error("Failed to load branch activities");
        } finally {
            setLoadingBranchActivities(false);
        }
    };

    const fetchPendingOtherCollections = async () => {
        try {
            setLoadingOtherCollections(true);
            const data = await financeService.getOtherBranchCollections({ status: 'Approved', without_receipt: true });
            setPendingOtherCollections(data || []);
        } catch (error) {
            toast.error("Failed to load branch collections");
        } finally {
            setLoadingOtherCollections(false);
        }
    };

    const fetchPendingStaffIOUs = async () => {
        try {
            setLoadingStaffIOUs(true);
            // Fetch only those that are approved AND disbursed (passed OTP)
            const data = await staffIouService.getPendingPayouts(false, true);
            setPendingStaffIOUs(data || []);

            // If there's a specific ID in the URL, auto-select it
            const targetId = searchParams.get('id');
            if (targetId && data) {
                const target = data.find((item: any) => item.id.toString() === targetId);
                if (target) {
                    setSelectedInv(target);
                    // Generate a manual receipt ID placeholder
                    setReceiptId(`RCP-IOU-${Date.now().toString().slice(-6)}`);
                }
            }
        } catch (error) {
            toast.error("Failed to load staff IOUs");
        } finally {
            setLoadingStaffIOUs(false);
        }
    };

    // Handle auto-opening from URL params (e.g., from disbursement redirect)
    useEffect(() => {
        const typeParam = searchParams.get('type');
        if (typeParam === 'STAFF_IOU') {
            setSelectedType('STAFF_IOU');
            setShowCreateModal(true);
        } else if (typeParam === 'BRANCH_ACTIVITY') {
            setSelectedType('BRANCH_ACTIVITY');
            setShowCreateModal(true);
        }
    }, [searchParams]);

    const handleIssueReceipt = async () => {
        console.log("Issuing receipt for investment:", selectedInv?.id);
        if (!receiptId.trim()) {
            toast.error("Manual Receipt Number is required");
            return;
        }
        try {
            setIsIssuing(true);
            let payload: any = { receipt_id: receiptId };

            if (selectedType === 'INVESTMENT') {
                payload = {
                    ...payload,
                    investment_id: selectedInv.id,
                    receipt_type: 'Investment',
                    customer_id: selectedInv.customer_id,
                    current_due_amount: selectedInv.amount,
                    center_id: selectedInv.customer?.center_id || null,
                    group_id: selectedInv.customer?.grp_id || null,
                    branch_id: selectedInv.branch_id || null,
                };
            } else if (selectedType === 'BRANCH_ACTIVITY') {
                payload = {
                    ...payload,
                    branch_expense_id: selectedInv.id,
                    receipt_type: 'BranchActivity',
                    current_due_amount: selectedInv.amount,
                    branch_id: selectedInv.branch_id || null,
                };
            } else if (selectedType === 'OTHER_BRANCH_COLLECTION') {
                payload = {
                    ...payload,
                    branch_expense_id: selectedInv.id,
                    receipt_type: 'OtherBranchCollection',
                    current_due_amount: selectedInv.amount,
                    branch_id: selectedInv.branch_id || null,
                };
            } else if (selectedType === 'STAFF_IOU') {
                payload = {
                    ...payload,
                    staff_iou_request_id: selectedInv.id,
                    receipt_type: 'StaffIOU',
                    current_due_amount: selectedInv.amount,
                    branch_id: selectedInv.branch_id || null,
                };
            }

            await receiptService.issueReceipt(payload);
            toast.success("Receipt Issued Successfully!");
            setShowCreateModal(false);
            fetchReceipts(currentPage);
            resetForm();
        } catch (error: any) {
            toast.error(error.message || "Issuance failed");
        } finally {
            setIsIssuing(false);
        }
    };

    const resetForm = () => {
        setSelectedType(null);
        setSelectedInv(null);
        setReceiptId("");
        setSearchTerm("");
    };

    const handleRequestCancel = (receipt: any) => {
        setSelectedReceipt(receipt);
        setShowCancelModal(true);
    };

    const handlePrint = (receipt: any) => {
        setPrintingReceipt(receipt);
        setIsPrintModalOpen(true);
    };

    const handleReprint = async (receipt: any) => {
        try {
            await receiptService.reprintReceipt(receipt.id);
            // After successful tracking, open for printing
            setPrintingReceipt(receipt);
            setIsPrintModalOpen(true);
            // Refresh to show updated counts
            fetchReceipts(currentPage);
        } catch (error: any) {
            toast.error(error.message || "Failed to reprint");
        }
    };

    const submitCancelRequest = async () => {
        if (!cancelReason.trim()) {
            toast.error("Reason for cancellation is required");
            return;
        }
        try {
            setIsCancelling(true);
            await receiptService.requestCancellation(selectedReceipt.id, cancelReason);
            toast.success("Cancellation requested successfully");
            setShowCancelModal(false);
            setCancelReason("");
            fetchReceipts(currentPage);
        } catch (error: any) {
            toast.error(error.message || "Failed to request cancellation");
        } finally {
            setIsCancelling(false);
        }
    };

    const filteredItems = (() => {
        const search = searchTerm.toLowerCase();
        if (selectedType === 'INVESTMENT') {
            return pendingInvestments.filter(inv =>
                inv.customer?.full_name?.toLowerCase().includes(search) ||
                inv.transaction_id?.toLowerCase().includes(search)
            );
        } else if (selectedType === 'BRANCH_ACTIVITY') {
            return pendingBranchActivities.filter(item =>
                item.description?.toLowerCase().includes(search)
            );
        } else if (selectedType === 'OTHER_BRANCH_COLLECTION') {
            return pendingOtherCollections.filter(item =>
                item.description?.toLowerCase().includes(search)
            );
        } else if (selectedType === 'STAFF_IOU') {
            return pendingStaffIOUs.filter(item =>
                item.user?.name?.toLowerCase().includes(search) ||
                item.reason?.toLowerCase().includes(search)
            );
        }
        return [];
    })();
    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-text-primary">Receipt Creation & Cancellation</h1>
                    <p className="text-sm text-text-muted">Create and manage receipt creation and cancellation processes</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-primary-500/20 hover:bg-primary-500 transition-all active:scale-95"
                >
                    <Plus size={18} />
                    Issue New Receipt
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card rounded-2xl border border-border-default p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Receipt size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <p className="text-xs text-text-muted font-medium">Total Receipts</p>
                            <p className="text-xl font-bold text-text-primary">{totalReceipts}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-card rounded-2xl border border-border-default p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                            <FileText size={20} className="text-primary-500" />
                        </div>
                        <div>
                            <p className="text-xs text-text-muted font-medium">Active</p>
                            <p className="text-xl font-bold text-text-primary">{receipts.filter(r => r.status === 'active').length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-card rounded-2xl border border-border-default p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                            <XCircle size={20} className="text-sky-500" />
                        </div>
                        <div>
                            <p className="text-xs text-text-muted font-medium">Cancelled</p>
                            <p className="text-xl font-bold text-text-primary">{receipts.filter(r => r.status === 'cancelled').length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Type Filters */}
            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={() => setFilterType(null)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${filterType === null
                        ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/20'
                        : 'bg-card text-text-muted border-border-default hover:border-primary-500/50 hover:text-primary-600'
                        }`}
                >
                    All Receipts
                </button>
                {[
                    { label: 'BRANCH ACTIVITY', value: 'BranchActivity' },
                    { label: 'LOAN', value: 'Loan' },
                    { label: 'INVESTMENT', value: 'Investment' },
                    { label: 'BRANCH COLLECTION', value: 'OtherBranchCollection' },
                    { label: 'IOU', value: 'StaffIOU' }
                ].map((type) => (
                    <button
                        key={type.value}
                        onClick={() => setFilterType(type.value)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${filterType === type.value
                            ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/20'
                            : 'bg-card text-text-muted border-border-default hover:border-primary-500/50 hover:text-primary-600'
                            }`}
                    >
                        {type.label}
                    </button>
                ))}
            </div>

            {/* Status Filters */}
            <div className="flex flex-wrap items-center gap-2 -mt-2">
                <button
                    onClick={() => setFilterStatus(null)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${filterStatus === null
                        ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/20'
                        : 'bg-card text-text-muted border-border-default hover:border-primary-500/50 hover:text-primary-600'
                        }`}
                >
                    All Statuses
                </button>
                {[
                    { label: 'Active', value: 'active' },
                    { label: 'Cancelled', value: 'cancelled' },
                    { label: 'Pending Cancellation', value: 'cancellation_pending' },
                    { label: 'Settled', value: 'settled' }
                ].map((status) => (
                    <button
                        key={status.value}
                        onClick={() => setFilterStatus(status.value)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${filterStatus === status.value
                            ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/20'
                            : 'bg-card text-text-muted border-border-default hover:border-primary-500/50 hover:text-primary-600'
                            }`}
                    >
                        {status.label}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-card rounded-2xl border border-border-default overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                        <tr className="border-b border-border-default bg-table-header">
                            <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">#</th>
                            <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Receipt No</th>
                            <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                                {filterType === 'StaffIOU' || filterType === 'BranchActivity' || filterType === 'OtherBranchCollection' ? 'Staff' : 'Customer'}
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Type</th>
                            <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Branch</th>
                            <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loadingReceipts ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-10 text-center"><BMSLoader size="small" /></td>
                            </tr>
                        ) : receipts.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <Receipt size={40} className="text-text-muted opacity-40" />
                                        <p className="text-text-muted text-sm">No receipts found</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            receipts.map((r, idx) => (
                                <tr key={r.id} className="border-b border-border-default hover:bg-muted-bg/10 transition-colors">
                                    <td className="px-6 py-4 text-xs font-bold text-text-muted">{idx + 1}</td>
                                    <td className="px-6 py-4 text-sm font-black text-text-primary tracking-tight">{r.receipt_id}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {(r.receipt_type === 'StaffIOU' || r.receipt_type === 'BranchActivity' || r.receipt_type === 'OtherBranchCollection') ? (
                                                <>
                                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 text-[10px] font-bold">
                                                        {(r.receipt_type === 'StaffIOU' ? (r.staff_iou_request?.user?.full_name || r.staff_iou_request?.user?.name) : (r.branch_expense?.requested_by_user?.full_name || r.branch_expense?.requested_by_user?.name || 'S'))?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-text-primary">
                                                            {r.receipt_type === 'StaffIOU' ? (r.staff_iou_request?.user?.full_name || r.staff_iou_request?.user?.name) : (r.branch_expense?.requested_by_user?.full_name || r.branch_expense?.requested_by_user?.name || 'N/A')}
                                                        </p>
                                                        <p className="text-[9px] text-text-muted font-medium">
                                                            NIC: {r.receipt_type === 'StaffIOU' ? r.staff_iou_request?.user?.staff?.nic : r.branch_expense?.requested_by_user?.staff?.nic || 'N/A'}
                                                        </p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-500 text-[10px] font-bold">
                                                        {r.customer?.full_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-text-primary">{r.customer?.full_name}</p>
                                                        <p className="text-[9px] text-text-muted font-medium">{r.customer?.customer_code || 'NO NIC'}</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-text-muted">{new Date(r.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-black text-primary-600 tracking-tight">
                                            LKR {Number(r.current_due_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-muted-bg text-[9px] font-black uppercase rounded-md border border-border-default">
                                            {r.receipt_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 font-bold text-xs text-text-primary">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            {r.center?.branch?.branch_name || r.branch?.branch_name || 'Head Office'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${r.status === 'active' ? 'bg-primary-500/10 text-primary-600' :
                                            r.status === 'cancelled' ? 'bg-sky-500/10 text-sky-500' :
                                                'bg-yellow-500/10 text-yellow-500'
                                            }`}>
                                            {r.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            {r.status === 'active' && (
                                                <button
                                                    onClick={() => handleRequestCancel(r)}
                                                    className="p-2 hover:bg-sky-500/10 text-sky-500 rounded-lg transition-colors flex-shrink-0"
                                                    title="Request Cancellation"
                                                >
                                                    <XCircle size={16} />
                                                </button>
                                            )}
                                            {r.copy_count >= 1 ? (
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-md text-[9px] font-black uppercase">
                                                        Printed
                                                    </span>
                                                    {r.status === 'active' && (
                                                        <button
                                                            onClick={() => handleReprint(r)}
                                                            className="flex items-center gap-1 text-[9px] font-bold text-primary-600 hover:text-primary-700 transition-colors"
                                                            title="Reprint Receipt"
                                                        >
                                                            <RotateCcw size={10} />
                                                            Reprint {r.reprint_count > 0 && `(${r.reprint_count})`}
                                                        </button>
                                                    )}
                                                </div>
                                            ) : r.status !== 'cancelled' && (
                                                <button
                                                    onClick={() => handlePrint(r)}
                                                    className="p-2 hover:bg-primary-500/10 text-primary-500 rounded-lg transition-colors flex-shrink-0"
                                                    title="Print Document"
                                                >
                                                    <Printer size={16} />
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

            {/* Pagination Controls */}
            {lastPage > 1 && (
                <div className="flex items-center justify-between px-2 py-4">
                    <div className="text-sm text-text-muted font-medium">
                        Showing <span className="text-text-primary font-bold">{(currentPage - 1) * perPage + 1}</span> to <span className="text-text-primary font-bold">{Math.min(currentPage * perPage, totalReceipts)}</span> of <span className="text-text-primary font-bold">{totalReceipts}</span> receipts
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fetchReceipts(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-2 rounded-xl bg-card border border-border-default hover:border-primary-500/50 text-text-muted hover:text-primary-600 transition-all disabled:opacity-30 disabled:hover:border-border-default disabled:hover:text-text-muted"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                                // Simple pagination logic for 5 pages around current
                                let pageNum = 1;
                                if (lastPage <= 5) pageNum = i + 1;
                                else if (currentPage <= 3) pageNum = i + 1;
                                else if (currentPage >= lastPage - 2) pageNum = lastPage - 4 + i;
                                else pageNum = currentPage - 2 + i;

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => fetchReceipts(pageNum)}
                                        className={`w-10 h-10 rounded-xl font-bold text-sm transition-all border ${currentPage === pageNum
                                            ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/20'
                                            : 'bg-card text-text-muted border-border-default hover:border-primary-500/50 hover:text-primary-600'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => fetchReceipts(currentPage + 1)}
                            disabled={currentPage === lastPage}
                            className="p-2 rounded-xl bg-card border border-border-default hover:border-primary-500/50 text-text-muted hover:text-primary-600 transition-all disabled:opacity-30 disabled:hover:border-border-default disabled:hover:text-text-muted"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Create Receipt Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-card w-full max-w-2xl rounded-[2rem] border border-border-default shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-border-default flex justify-between items-center bg-muted-bg/30">
                            <div>
                                <h3 className="text-xl font-black text-text-primary tracking-tight">Generate Receipt</h3>
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-0.5">Terminal ID: {terminalId}</p>
                            </div>
                            <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="p-2 hover:bg-hover rounded-xl transition-colors">
                                <X size={20} className="text-text-muted" />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            {!selectedType ? (
                                <div className="space-y-6">
                                    <p className="text-sm font-bold text-text-muted uppercase tracking-widest">Select Collection Domain</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setSelectedType('INVESTMENT')}
                                            className="group p-6 bg-card border border-border-default rounded-3xl hover:border-primary-500/50 hover:bg-primary-500/5 transition-all text-left space-y-3"
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500 group-hover:scale-110 transition-transform">
                                                <Landmark size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-text-primary">Investment Principal</h4>
                                                <p className="text-xs text-text-muted font-medium">New fund collection for authorized investment assets.</p>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setSelectedType('STAFF_IOU')}
                                            className="group p-6 bg-card border border-border-default rounded-3xl hover:border-primary-500/50 hover:bg-primary-500/5 transition-all text-left space-y-3"
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500 group-hover:scale-110 transition-transform">
                                                <User size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-text-primary">Staff IOU</h4>
                                                <p className="text-xs text-text-muted font-medium">Issue receipts for staff fund requests.</p>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setSelectedType('BRANCH_ACTIVITY')}
                                            className="group p-6 bg-card border border-border-default rounded-3xl hover:border-primary-500/50 hover:bg-primary-500/5 transition-all text-left space-y-3"
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500 group-hover:scale-110 transition-transform">
                                                <Building2 size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-text-primary">Branch Activity</h4>
                                                <p className="text-xs text-text-muted font-medium">General branch inflows & outflows.</p>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setSelectedType('OTHER_BRANCH_COLLECTION')}
                                            className="group p-6 bg-card border border-border-default rounded-3xl hover:border-primary-500/50 hover:bg-primary-500/5 transition-all text-left space-y-3"
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500 group-hover:scale-110 transition-transform">
                                                <FileText size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-text-primary">Branch Collection</h4>
                                                <p className="text-xs text-text-muted font-medium">Collections for external branches.</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            ) : !selectedInv ? (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-bold text-text-muted uppercase tracking-widest">Select Record</p>
                                        <button onClick={() => setSelectedType(null)} className="text-[10px] font-black text-primary-500 uppercase hover:underline">Change Type</button>
                                    </div>

                                    <div className="relative">
                                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                                        <input
                                            type="text"
                                            placeholder="Search by customer name or ID..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-12 pr-6 py-4 bg-app-background border border-border-default rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 font-bold"
                                        />
                                    </div>

                                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                        {(selectedType === 'INVESTMENT' ? loadingInvestments : selectedType === 'BRANCH_ACTIVITY' ? loadingBranchActivities : selectedType === 'OTHER_BRANCH_COLLECTION' ? loadingOtherCollections : loadingStaffIOUs) ? (
                                            <div className="py-10 flex justify-center"><BMSLoader size="xsmall" /></div>
                                        ) : filteredItems.length === 0 ? (
                                            <div className="py-10 text-center border-2 border-dashed border-border-default rounded-3xl">
                                                <p className="text-text-muted text-sm font-bold">No authorized records awaiting payment.</p>
                                            </div>
                                        ) : (
                                            filteredItems.map(item => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => {
                                                        setSelectedInv(item);
                                                        setReceiptId(`RCP-${selectedType?.substring(0, 3)}-${Date.now().toString().slice(-6)}`);
                                                    }}
                                                    className="w-full p-5 bg-card border border-border-default rounded-2xl hover:border-primary-500/50 hover:bg-primary-500/5 transition-all text-left flex justify-between items-center"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-500">
                                                            <User size={18} />
                                                        </div>
                                                        <div>
                                                            <h5 className="font-black text-text-primary text-sm">
                                                                {selectedType === 'INVESTMENT' ? item.customer?.full_name : selectedType === 'STAFF_IOU' ? item.user?.name : item.description || 'N/A'}
                                                            </h5>
                                                            <p className="text-[10px] text-text-muted font-bold tracking-tight">
                                                                {selectedType === 'INVESTMENT' ? `${item.product?.name} • ${item.transaction_id}` : selectedType === 'STAFF_IOU' ? item.reason : `ID: ${item.id}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-black text-text-primary">LKR {Number(item.amount).toLocaleString()}</p>
                                                        <p className="text-[9px] text-primary-500 font-black uppercase">Authorized</p>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-bold text-text-muted uppercase tracking-widest">Payment Validation</p>
                                        <button onClick={() => setSelectedInv(null)} className="text-[10px] font-black text-primary-500 uppercase hover:underline">Select Different</button>
                                    </div>

                                    <div className="bg-primary-500/5 p-6 rounded-3xl border border-primary-500/10 space-y-4">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-text-muted">
                                            <span>Subject</span>
                                            <span className="text-text-primary">
                                                {selectedType === 'INVESTMENT' ? selectedInv.customer?.full_name : selectedType === 'STAFF_IOU' ? selectedInv.user?.name : selectedInv.description || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-text-muted">
                                            <span>Type/Details</span>
                                            <span className="text-text-primary">
                                                {selectedType === 'INVESTMENT' ? selectedInv.product?.name : selectedType === 'STAFF_IOU' ? selectedInv.reason : `ID: ${selectedInv.id}`}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center pt-4 border-t border-primary-500/10">
                                            <span className="text-sm font-black text-primary-600 uppercase">Collection Amount</span>
                                            <span className="text-2xl font-black text-primary-600">LKR {Number(selectedInv.amount).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Manual Receipt No (From Bank/Book)</label>
                                        <div className="relative">
                                            <Receipt size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted" />
                                            <input
                                                type="text"
                                                value={receiptId}
                                                onChange={(e) => setReceiptId(e.target.value)}
                                                placeholder="Enter receipt serial..."
                                                className="w-full pl-14 pr-6 py-5 bg-card border-2 border-border-default rounded-2xl focus:outline-none focus:border-primary-500 transition-all font-black text-xl tracking-widest"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={resetForm}
                                            className="flex-1 py-5 bg-muted-bg text-text-muted rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-hover transition-all"
                                        >
                                            Reset Terminal
                                        </button>
                                        <button
                                            onClick={handleIssueReceipt}
                                            disabled={isIssuing}
                                            className="flex-[2] py-5 bg-primary-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary-500/20 hover:bg-primary-500 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {isIssuing ? "Processing Ledger..." : "Authorize Inflow"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Cancellation Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-card w-full max-w-lg rounded-[2rem] border border-border-default shadow-2xl overflow-hidden">
                        <div className="px-8 py-6 border-b border-border-default flex justify-between items-center bg-sky-500/5">
                            <div>
                                <h3 className="text-xl font-black text-text-primary tracking-tight">Request Cancellation</h3>
                                <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mt-0.5">Receipt: {selectedReceipt?.receipt_id}</p>
                            </div>
                            <button onClick={() => setShowCancelModal(false)} className="p-2 hover:bg-hover rounded-xl transition-colors">
                                <X size={20} className="text-text-muted" />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Reason for Cancellation</label>
                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="Explain why this receipt needs to be cancelled..."
                                    className="w-full p-5 bg-app-background border-2 border-border-default rounded-2xl focus:outline-none focus:border-sky-500 transition-all font-medium text-sm min-h-[120px]"
                                />
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowCancelModal(false)}
                                    className="flex-1 py-4 bg-muted-bg text-text-muted rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-hover transition-all"
                                >
                                    Abort
                                </button>
                                <button
                                    onClick={submitCancelRequest}
                                    disabled={isCancelling}
                                    className="flex-[2] py-4 bg-sky-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-sky-500/20 hover:bg-sky-600 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isCancelling ? "Submitting..." : "Confirm Request"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ReceiptPrintModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                receipt={printingReceipt}
                onPrinted={() => fetchReceipts(currentPage)}
            />
        </div>
    );
};

export default ReceiptCreationCancellationPage;
