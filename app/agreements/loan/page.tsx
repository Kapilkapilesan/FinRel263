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
    ChevronDown,
    ChevronUp,
    Filter,
    User,
    Calendar,
    DollarSign,
    Building2
} from "lucide-react";
import { toast } from "react-toastify";
import { loanAgreementService, LoanWithAgreement } from "@/services/loanAgreement.service";
import { documentPrintLogService } from "@/services/documentPrintLog.service";
import { authService } from "@/services/auth.service";
import LoanAgreementPrintDocument from "@/components/loan/LoanAgreementPrintDocument";
import { Pagination } from "@/components/common/Pagination";

type PrintStatus = 'all' | 'printed' | 'not_printed' | 'pending_reprint';

export default function LoanAgreementPage() {
    const [loans, setLoans] = useState<LoanWithAgreement[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [printStatus, setPrintStatus] = useState<PrintStatus>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [perPage, setPerPage] = useState(15);
    const [selectedLoan, setSelectedLoan] = useState<LoanWithAgreement | null>(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showReprintModal, setShowReprintModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [reprintReason, setReprintReason] = useState("");
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [printSection, setPrintSection] = useState<"acknowledgement" | "agreement" | "all">("all");
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

    const fetchLoans = useCallback(async () => {
        try {
            setLoading(true);
            const response = await loanAgreementService.getLoans({
                search,
                print_status: printStatus,
                page: currentPage,
                per_page: perPage
            });
            setLoans(response.data);
            setTotalPages(response.meta.last_page);
            setTotal(response.meta.total);
        } catch (error: any) {
            toast.error(error.message || "Failed to load loan agreements");
        } finally {
            setLoading(false);
        }
    }, [search, printStatus, currentPage, perPage]);

    useEffect(() => {
        fetchLoans();
    }, [fetchLoans]);

    const handleView = async (loan: LoanWithAgreement) => {
        try {
            const response = await loanAgreementService.getLoan(loan.id);
            setSelectedLoan(response.data);
            setShowViewModal(true);
        } catch (error: any) {
            toast.error(error.message || "Failed to load loan details");
        }
    };

    const handlePrintRequest = async (loan: LoanWithAgreement) => {
        // Check if locked and needs reprint request
        if (loan.agreement?.is_locked && !loan.agreement?.reprint_approved) {
            setSelectedLoan(loan);
            setShowReprintModal(true);
            return;
        }

        // Show preview first
        setSelectedLoan(loan);
        setPrintSection("all");
        setShowPreviewModal(true);
    };

    const handleConfirmPrint = async (section: "acknowledgement" | "agreement") => {
        if (!selectedLoan) return;

        // Set the section so the document re-renders with only that section,
        // then wait a tick for React to paint before grabbing the DOM for print.
        setPrintSection(section);
        setTimeout(() => handlePrintPreview(), 150);

        try {
            setActionLoading(selectedLoan.id);
            await loanAgreementService.markPrinted(selectedLoan.id, section);

            // Record in global print logs
            await documentPrintLogService.recordLog({
                document_type: 'loan_agreement',
                document_id: selectedLoan.contract_number,
                action: 'print',
                status: 'success',
                print_count: (selectedLoan.agreement?.print_count || 0) + 1,
                metadata: {
                    loan_id: selectedLoan.id,
                    contract_number: selectedLoan.contract_number,
                    customer_name: selectedLoan.customer.full_name,
                    section
                }
            });

            const label = section === 'acknowledgement' ? 'Acknowledgement' : 'Agreement';
            toast.success(`${label} printed and recorded successfully`);
            setShowPreviewModal(false);
            setPrintSection("all");
            fetchLoans(); // Refresh to show updated print status
        } catch (error: any) {
            toast.error(error.message || "Failed to record print status");
        } finally {
            setActionLoading(null);
            setSelectedLoan(null);
        }
    };

    const handleRequestReprint = async () => {
        if (!selectedLoan || !reprintReason.trim()) {
            toast.error("Please provide a reason for the reprint request");
            return;
        }

        try {
            setActionLoading(selectedLoan.id);
            // Pass the printSection (which should be 'acknowledgement' or 'agreement')
            await loanAgreementService.requestReprint(selectedLoan.id, reprintReason, printSection);
            toast.success("Reprint request submitted. Awaiting manager approval.");
            setShowReprintModal(false);
            setReprintReason("");
            setSelectedLoan(null);
            setPrintSection("all");
            fetchLoans();
        } catch (error: any) {
            toast.error(error.message || "Failed to submit reprint request");
        } finally {
            setActionLoading(null);
        }
    };

    const handleApprove = async (id: number) => {
        if (!confirm("Are you sure you want to approve this reprint request?")) return;
        try {
            setActionLoading(id);
            await loanAgreementService.approveReprint(id);
            toast.success("Reprint request approved");
            fetchLoans();
        } catch (error: any) {
            toast.error(error.message || "Failed to approve request");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id: number) => {
        if (!confirm("Are you sure you want to reject this reprint request?")) return;
        try {
            setActionLoading(id);
            await loanAgreementService.rejectReprint(id);
            toast.success("Reprint request rejected");
            fetchLoans();
        } catch (error: any) {
            toast.error(error.message || "Failed to reject request");
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (loan: LoanWithAgreement) => {
        const agreement = loan.agreement;

        const renderSectionBadge = (isPrinted: boolean, reprintRequested: boolean, reprintApproved: boolean, label: string) => {
            if (!isPrinted) {
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 uppercase border border-gray-200">
                        {label}: Not Printed
                    </span>
                );
            }
            if (reprintRequested && !reprintApproved) {
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase border border-amber-200">
                        {label}: Pending
                    </span>
                );
            }
            if (reprintApproved) {
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase border border-green-200">
                        {label}: Reprint
                    </span>
                );
            }
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase border border-blue-200">
                    {label}: Printed
                </span>
            );
        };

        return (
            <div className="flex flex-col gap-1.5 min-w-[140px]">
                {renderSectionBadge(
                    !!agreement?.acknowledgement_printed,
                    !!agreement?.acknowledgement_reprint_requested,
                    !!agreement?.reprint_approved && !!agreement?.acknowledgement_reprint_requested,
                    "Ack"
                )}
                {renderSectionBadge(
                    !!agreement?.agreement_printed,
                    !!agreement?.agreement_reprint_requested,
                    !!agreement?.reprint_approved && !!agreement?.agreement_reprint_requested,
                    "Agr"
                )}
            </div>
        );
    };

    const getSectionPrintState = (loan: LoanWithAgreement, section: 'acknowledgement' | 'agreement') => {
        const agreement = loan.agreement;
        const isPrinted = section === 'acknowledgement' ? agreement?.acknowledgement_printed : agreement?.agreement_printed;
        const reprintRequested = section === 'acknowledgement' ? agreement?.acknowledgement_reprint_requested : agreement?.agreement_reprint_requested;
        const reprintApproved = agreement?.reprint_approved && reprintRequested; // Use overall approval + this section's request

        if (!isPrinted) {
            return { text: section === 'acknowledgement' ? "Ack Print" : "Agr Print", icon: <Printer className="w-4 h-4" />, variant: "primary", action: 'print' };
        }
        if (reprintRequested && !reprintApproved) {
            return { text: "Pending", icon: <Clock className="w-4 h-4" />, variant: "disabled", action: 'none' };
        }
        if (reprintApproved) {
            return { text: section === 'acknowledgement' ? "Ack Reprint" : "Agr Reprint", icon: <RefreshCw className="w-4 h-4" />, variant: "success", action: 'print' };
        }
        return { text: section === 'acknowledgement' ? "Ack Request" : "Agr Request", icon: <Lock className="w-4 h-4" />, variant: "warning", action: 'reprint' };
    };

    const handleActionClick = (loan: LoanWithAgreement, section: 'acknowledgement' | 'agreement') => {
        const state = getSectionPrintState(loan, section);
        if (state.action === 'none') return;

        if (state.action === 'reprint') {
            setSelectedLoan(loan);
            setPrintSection(section);
            setShowReprintModal(true);
            return;
        }

        setSelectedLoan(loan);
        setPrintSection(section);
        setShowPreviewModal(true);
    };

    const handlePrintPreview = () => {
        const printContent = document.getElementById('loan-print-container');
        if (!printContent) return;

        const printWindow = window.open('', '_blank', 'width=1000,height=800');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Loan Agreement - ${selectedLoan?.contract_number}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Tamil:wght@400;700&display=swap" rel="stylesheet">
                    <style>
                        @page {
                            size: A4;
                            margin: 0;
                        }
                        @media print {
                            body { 
                                background: white !important; 
                                margin: 0 !important;
                                padding: 0 !important;
                            }
                            .print-page { 
                                margin: 0 !important; 
                                box-shadow: none !important; 
                                border: none !important;
                                page-break-after: always;
                            }
                            .print-page:last-child {
                                page-break-after: auto;
                            }
                        }
                        @media screen {
                            body { 
                                background: #e5e7eb; 
                                padding: 20px; 
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                gap: 30px;
                            }
                            .print-page {
                                box-shadow: 0 10px 25px rgba(0,0,0,0.15);
                                border: 1px solid #d1d5db;
                            }
                        }
                        body { font-family: 'Times New Roman', 'Noto Serif Tamil', serif; color: #000; }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                    <script>
                        window.onload = () => {
                            setTimeout(() => {
                                window.print();
                            }, 1500);
                        };
                    <\/script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary uppercase tracking-tight flex items-center gap-2">
                        <FileText className="w-7 h-7 text-primary-600" />
                        LOAN AGREEMENTS
                    </h1>
                    <p className="text-sm text-text-secondary mt-1 uppercase">
                        PRINT LOAN AGREEMENTS FOR APPROVED LOANS
                    </p>
                </div>
                <button
                    onClick={fetchLoans}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-muted-bg hover:bg-hover text-text-primary rounded-lg transition-colors border border-transparent text-xs font-bold uppercase"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    REFRESH
                </button>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-xl shadow-sm border border-border-default p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search by loan ID, contract number, or customer name..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2.5 border border-border-default rounded-lg bg-input text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-text-muted"
                        />
                    </div>

                    {/* Print Status Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-text-muted" />
                        <select
                            value={printStatus}
                            onChange={(e) => {
                                setPrintStatus(e.target.value as PrintStatus);
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2.5 border border-border-default rounded-lg bg-input text-text-primary focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="all">All Status</option>
                            <option value="not_printed">Not Printed</option>
                            <option value="printed">Printed</option>
                            <option value="pending_reprint">Pending Reprint</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-card rounded-xl shadow-sm border border-border-default overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-table-header border-b border-border-default">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                    Contract No.
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                    Agreement Date
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                    Print Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                    Printed By
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-border-divider">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <RefreshCw className="w-8 h-8 text-text-muted animate-spin" />
                                            <p className="text-text-secondary">Loading...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : loans.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <FileText className="w-12 h-12 text-border-default" />
                                            <p className="text-text-secondary">No approved loans found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                loans.map((loan) => (
                                    <tr key={loan.id} className="hover:bg-table-row-hover transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-text-primary">
                                                {loan.contract_number}
                                            </div>
                                            <div className="text-xs text-text-muted">ID: {loan.loan_id}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-text-primary uppercase text-sm">
                                                {loan.customer?.full_name || 'N/A'}
                                            </div>
                                            <div className="text-xs text-text-muted">
                                                {loan.customer?.customer_code}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-text-primary uppercase">
                                                LKR {Number(loan.approved_amount || loan.request_amount).toLocaleString()}
                                            </div>
                                            <div className="text-[10px] text-text-muted font-bold uppercase">
                                                {loan.terms} WEEKS
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-text-secondary">
                                            {loan.agreement_date ? new Date(loan.agreement_date).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {getStatusBadge(loan)}
                                        </td>
                                        <td className="px-4 py-3 text-text-secondary text-[10px] font-bold uppercase">
                                            {loan.agreement?.printed_by_user?.full_name || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleView(loan)}
                                                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors border border-transparent"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>

                                                {/* Approve/Reject for Managers */}
                                                {(loan.agreement?.acknowledgement_reprint_requested || loan.agreement?.agreement_reprint_requested) && 
                                                 !loan.agreement?.reprint_approved && 
                                                 authService.hasPermission('loan_agreements.approve_reprint') && (
                                                    <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 p-0.5">
                                                        <button
                                                            onClick={() => handleApprove(loan.id)}
                                                            className="p-1.5 text-green-600 hover:bg-green-100 rounded-md transition-colors"
                                                            title="Approve Reprint"
                                                        >
                                                            <CheckCircle className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(loan.id)}
                                                            className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                                                            title="Reject Reprint"
                                                        >
                                                            <XCircle className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="relative">
                                                    <button
                                                        onClick={() => setActiveDropdown(activeDropdown === loan.id ? null : loan.id)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold uppercase shadow-sm transition-all active:transform active:scale-95 tracking-widest"
                                                    >
                                                        <Printer className="w-4 h-4" />
                                                        ACTIONS
                                                        <ChevronDown className="w-4 h-4" />
                                                    </button>

                                                    {activeDropdown === loan.id && (
                                                        <>
                                                            <div
                                                                className="fixed inset-0 z-[10]"
                                                                onClick={() => setActiveDropdown(null)}
                                                            ></div>
                                                            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl z-[11] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                                                                <div className="p-2 space-y-1">
                                                                    <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Print Documents</div>
                                                                    
                                                                    {/* Actions */}
                                                                    {(() => {
                                                                        const ack = getSectionPrintState(loan, 'acknowledgement');
                                                                        const agr = getSectionPrintState(loan, 'agreement');

                                                                        const renderItem = (state: any, label: string, section: 'acknowledgement' | 'agreement') => (
                                                                            <button
                                                                                key={section}
                                                                                onClick={() => { handleActionClick(loan, section); setActiveDropdown(null); }}
                                                                                disabled={state.action === 'none'}
                                                                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-all ${state.action === 'none' ? 'text-gray-300 cursor-not-allowed bg-gray-50/50' : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'}`}
                                                                            >
                                                                                <div className={`p-2 rounded-lg border shadow-sm ${
                                                                                    state.variant === 'primary' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                                                                                    state.variant === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 
                                                                                    state.variant === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                                                                    'bg-gray-50 text-gray-400 border-gray-100'
                                                                                }`}>
                                                                                    {state.icon}
                                                                                </div>
                                                                                <div className="flex flex-col">
                                                                                    <span className="font-bold flex items-center gap-1.5">
                                                                                        {state.text}
                                                                                    </span>
                                                                                    <span className="text-[10px] text-gray-400 uppercase font-medium">{label}</span>
                                                                                </div>
                                                                            </button>
                                                                        );

                                                                        return (
                                                                            <>
                                                                                {renderItem(ack, "Acknowledgement", 'acknowledgement')}
                                                                                {renderItem(agr, "Loan Agreement", 'agreement')}

                                                                                {/* Full Document option removed as per request */}
                                                                            </>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
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

            {/* View Details Modal */}
            {showViewModal && selectedLoan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">
                                    LOAN AGREEMENT DETAILS
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowViewModal(false);
                                        setSelectedLoan(null);
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
                            {/* Loan Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 uppercase">Contract Number</p>
                                    <p className="font-semibold text-gray-900">{selectedLoan.contract_number}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 uppercase">Agreement Date</p>
                                    <p className="font-semibold text-gray-900">
                                        {selectedLoan.agreement_date ? new Date(selectedLoan.agreement_date).toLocaleDateString() : '-'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 uppercase">Loan Amount</p>
                                    <p className="font-semibold text-gray-900 uppercase">
                                        LKR {Number(selectedLoan.approved_amount || selectedLoan.request_amount).toLocaleString()}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 uppercase">Terms</p>
                                    <p className="font-semibold text-gray-900 uppercase">{selectedLoan.terms} WEEKS</p>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 uppercase text-sm tracking-tight">
                                    <User className="w-4 h-4 text-primary-600" />
                                    CUSTOMER DETAILS
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase">Full Name</p>
                                        <p className="font-bold text-gray-900 uppercase">{selectedLoan.customer?.full_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase">NIC</p>
                                        <p className="font-bold text-gray-900 uppercase">{selectedLoan.customer?.customer_code}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Joint Borrower */}
                            {selectedLoan.guardian_name && (
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h3 className="font-bold text-gray-900 mb-3 uppercase text-sm tracking-tight">JOINT BORROWER</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase">Full Name</p>
                                            <p className="font-bold text-gray-900 uppercase">{selectedLoan.guardian_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase">NIC</p>
                                            <p className="font-bold text-gray-900 uppercase">{selectedLoan.guardian_nic}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Print History */}
                            {selectedLoan.agreement && (
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 uppercase text-sm tracking-tight">
                                        <Printer className="w-4 h-4 text-primary-600" />
                                        PRINT HISTORY
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">Status</span>
                                            {getStatusBadge(selectedLoan)}
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Print Count</span>
                                            <span className="font-medium">{selectedLoan.agreement.print_count}x</span>
                                        </div>
                                        {selectedLoan.agreement.printed_at && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Last Printed</span>
                                                <span className="font-medium">
                                                    {new Date(selectedLoan.agreement.printed_at).toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                        {selectedLoan.agreement.printed_by_user && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Printed By</span>
                                                <span className="font-medium">{selectedLoan.agreement.printed_by_user.full_name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setShowViewModal(false);
                                        setSelectedLoan(null);
                                    }}
                                    className="px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors uppercase tracking-widest"
                                >
                                    CLOSE
                                </button>
                                 <button
                                    onClick={() => {
                                        setShowViewModal(false);
                                        handlePrintRequest(selectedLoan);
                                    }}
                                    disabled={!!selectedLoan.agreement?.is_locked && !selectedLoan.agreement?.reprint_approved}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold uppercase tracking-widest"
                                >
                                    <Download className="w-4 h-4" />
                                    DOWNLOAD AGREEMENT
                                </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reprint Request Modal */}
            {showReprintModal && selectedLoan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    <Lock className="w-5 h-5 text-amber-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Request Reprint: {printSection === 'acknowledgement' ? 'Acknowledgement' : printSection === 'agreement' ? 'Agreement' : 'Full Document'}
                                </h2>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="flex gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-amber-700">
                                        <p className="font-medium">This agreement has already been printed.</p>
                                        <p className="mt-1">To print again, you need manager approval. Please provide a reason for the reprint request.</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason for Reprint *
                                </label>
                                <textarea
                                    value={reprintReason}
                                    onChange={(e) => setReprintReason(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="Enter the reason for reprinting..."
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowReprintModal(false);
                                    setReprintReason("");
                                    setSelectedLoan(null);
                                }}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRequestReprint}
                                disabled={!reprintReason.trim() || actionLoading === selectedLoan.id}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {actionLoading === selectedLoan.id ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Clock className="w-4 h-4" />
                                )}
                                Submit Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Print Preview Modal */}
            {showPreviewModal && selectedLoan && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-hidden">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary-100 rounded-lg">
                                    <Printer className="w-5 h-5 text-primary-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">
                                        Document Preview
                                    </h2>
                                    <p className="text-xs text-gray-500">Verify details before downloading</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePrintPreview}
                                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-primary-600"
                                    title="Print Documents"
                                >
                                    <Printer className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPreviewModal(false);
                                        setSelectedLoan(null);
                                    }}
                                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    <XCircle className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body - Multi-Page Scrolling Preview */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-200">
                            <div className="flex flex-col gap-8 items-center max-w-[850px] mx-auto">
                                <LoanAgreementPrintDocument loan={selectedLoan} printSection={printSection} />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-gray-200 bg-gray-50">
                            {/* Section print status badges */}
                            <div className="flex items-center gap-6 mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-500 uppercase">Acknowledgement:</span>
                                    {selectedLoan.agreement?.acknowledgement_printed ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                            <CheckCircle className="w-3 h-3" /> Printed
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                            <FileText className="w-3 h-3" /> Not Printed
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-500 uppercase">Agreement:</span>
                                    {selectedLoan.agreement?.agreement_printed ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                            <CheckCircle className="w-3 h-3" /> Printed
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                            <FileText className="w-3 h-3" /> Not Printed
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-amber-600">
                                    <AlertTriangle className="w-5 h-5" />
                                    <span className="text-sm font-medium">Please check values carefully</span>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowPreviewModal(false);
                                            setSelectedLoan(null);
                                            setPrintSection("all");
                                        }}
                                        className="px-5 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium border border-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (printSection !== 'all') {
                                                handleConfirmPrint(printSection as 'acknowledgement' | 'agreement');
                                            }
                                        }}
                                        disabled={actionLoading === selectedLoan.id || printSection === 'all'}
                                        className="inline-flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all shadow-md active:transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                                    >
                                        {actionLoading === selectedLoan.id ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Printer className="w-4 h-4" />
                                        )}
                                        Confirm {printSection === 'acknowledgement' ? 'Acknowledgement' : 'Agreement'} Print
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
}
