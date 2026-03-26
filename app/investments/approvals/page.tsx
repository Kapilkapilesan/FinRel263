"use client";
import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Search, DollarSign, User, ShieldCheck, TrendingUp, Info, ShieldAlert, Landmark } from "lucide-react";
import { investmentService } from "@/services/investment.service";
import { toast } from "react-toastify";
import BMSLoader from "@/components/common/BMSLoader";
import { colors } from "@/themes/colors";
import { typography } from "@/themes/typography";
import { ActionConfirmModal } from "@/components/common/ActionConfirmModal";
import { InvestmentApprovalTable } from "@/components/investment/InvestmentApprovalTable";


export default function InvestmentApprovalsPage() {
    const [investments, setInvestments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState<'APPROVE' | 'REJECT' | null>(null);


    useEffect(() => {
        loadPendingInvestments();
    }, []);

    const loadPendingInvestments = async () => {
        try {
            setLoading(true);
            const all = await investmentService.getInvestments();
            const pending = all.filter((inv: any) => inv.status === 'PENDING_APPROVAL');
            setInvestments(pending);
        } catch (error) {
            toast.error("Failed to load pending investments");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (type: 'APPROVE' | 'REJECT') => {
        if (!selectedId) return;
        setModalAction(type);
        setIsModalOpen(true);
    };

    const confirmAction = async (note?: string) => {
        if (!selectedId || !modalAction) return;

        try {
            setIsProcessing(true);
            if (modalAction === 'APPROVE') {
                await investmentService.approveInvestment(selectedId, note);
                toast.success("Investment authorized successfully!");
            } else {
                await investmentService.rejectInvestment(selectedId, note);
                toast.success("Investment declined successfully");
            }
            setSelectedId(null);
            loadPendingInvestments();
        } catch (error: any) {
            toast.error(error.message || "Action failed");
        } finally {
            setIsProcessing(false);
            setIsModalOpen(false);
            setModalAction(null);
        }
    };


    const filtered = investments.filter(inv =>
        inv.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedInv = investments.find(inv => inv.id === selectedId);

    const dynamicStyles = `
        .theme-text-primary { color: ${colors.primary[600]}; }
        .theme-bg-primary-light { background-color: ${colors.primary[50]}; }
        .theme-bg-primary-soft { background-color: ${colors.primary[100]}; }
        .theme-border-primary-light { border-color: ${colors.primary[100]}; }
        .theme-focus-ring:focus { 
            --tw-ring-color: ${colors.primary[500]}1a; 
            box-shadow: 0 0 0 4px var(--tw-ring-color);
            border-color: ${colors.primary[300]};
        }
    `;

    return (
        <div className="min-h-screen relative overflow-hidden pb-12 bg-app-background">
            <style>{dynamicStyles}</style>

            {/* Ambient Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full opacity-10 blur-[120px]"
                    style={{ background: `radial-gradient(circle, ${colors.primary[400]}, transparent)` }}
                />
                <div
                    className="absolute top-[40%] -right-[10%] w-[30%] h-[30%] rounded-full opacity-10 blur-[100px]"
                    style={{ background: `radial-gradient(circle, ${colors.indigo[400]}, transparent)` }}
                />
            </div>

            <div className="max-w-7xl mx-auto space-y-6 relative z-10 px-6 pt-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/80 backdrop-blur-xl p-6 rounded-2xl border border-border-default shadow-xl shadow-black/5 dark:shadow-black/20">
                    <div className="flex items-center gap-6">
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:rotate-3 duration-500"
                            style={{
                                background: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[700]})`,
                                boxShadow: `0 10px 20px ${colors.primary[600]}30`
                            }}
                        >
                            <ShieldCheck className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-text-primary tracking-tight">
                                Investment <span className="theme-text-primary">Approvals</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-muted-bg px-4 py-2 rounded-xl border border-border-divider flex flex-col items-end">
                            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">In Queue</span>
                            <span className="text-xl font-black text-text-primary">{investments.length}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Panel: List */}
                    <div className="flex-[1.5] space-y-8">
                        {/* Search Bar */}
                        <div className="relative group">
                            <Search className="w-5 h-5 text-text-muted absolute left-5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:theme-text-primary" />
                            <input
                                type="text"
                                placeholder="Scan queue by customer, product or reference..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-14 pr-6 py-3.5 bg-input backdrop-blur-xl border-border-default border-[1.5px] rounded-2xl outline-none transition-all shadow-lg shadow-black/5 dark:shadow-black/20 text-text-primary font-bold theme-focus-ring text-sm uppercase placeholder:text-text-muted"
                            />
                        </div>

                        {/* Queue Container */}
                        <div className="bg-card/70 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border-default overflow-hidden min-h-[550px] flex flex-col">
                            <InvestmentApprovalTable 
                                records={filtered}
                                selectedId={selectedId}
                                onSelect={setSelectedId}
                                isLoading={loading}
                            />
                        </div>
                    </div>

                    {/* Right Panel: Approval Console */}
                    <div className="flex-1">
                        <div className={`sticky top-8 p-8 rounded-3xl border transition-all duration-500 shadow-2xl relative overflow-hidden ${selectedId ? 'bg-card border-border-default opacity-100 translate-y-0' : 'bg-card/40 border-border-divider opacity-50 translate-y-4 pointer-events-none'}`}>
                            {/* Decorative element */}
                            {selectedId && (
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                                    <ShieldCheck className="w-32 h-32 theme-text-primary" />
                                </div>
                            )}

                            <div className="relative z-10 space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                                        <Info className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-text-primary tracking-tight">Authorization Port</h2>
                                        <p className="text-[9px] font-bold text-text-muted uppercase tracking-[0.2em] mt-0.5">Asset Risk Assessment</p>
                                    </div>
                                </div>

                                {selectedId ? (
                                    <div className="space-y-4">
                                        <div className="bg-muted-bg/50 rounded-2xl p-4 border border-border-divider space-y-3">
                                            <div className="flex flex-col gap-1 border-b border-border-divider pb-2">
                                                <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Investment Summary</span>
                                                <span className="text-sm font-black text-text-primary uppercase">{selectedInv?.customer?.full_name}</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-black text-text-muted uppercase">Policy Term</span>
                                                    <div className="text-xs font-black text-text-secondary">{selectedInv?.snapshot_policy_term} Months</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-black text-text-muted uppercase">Payout Type</span>
                                                    <div className="text-xs font-black text-text-secondary">{selectedInv?.snapshot_payout_type}</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-black text-text-muted uppercase">Interest Rate</span>
                                                    <div className="text-xs font-black theme-text-primary">
                                                        {selectedInv?.snapshot_payout_type === 'MATURITY'
                                                            ? selectedInv?.snapshot_interest_rate_maturity
                                                            : selectedInv?.snapshot_interest_rate_monthly}% APR
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-black text-text-muted uppercase">Handled By</span>
                                                    <div className="text-xs font-black theme-text-primary uppercase tracking-tighter">
                                                        {selectedInv?.created_by?.full_name || selectedInv?.created_by?.name || selectedInv?.created_by?.user_name}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t border-border-divider mt-1">
                                                <span className="text-[9px] font-black text-text-muted uppercase">Total Principal</span>
                                                <div className="text-2xl font-black text-text-primary mt-1">LKR {Number(selectedInv?.amount).toLocaleString()}</div>
                                            </div>

                                            {selectedInv?.bank_details && (
                                                <div className="pt-2 border-t border-border-divider mt-1 space-y-2">
                                                    <span className="text-[9px] font-black theme-text-primary uppercase tracking-widest flex items-center gap-1.5">
                                                        <Landmark className="w-3 h-3" /> Disbursement Account
                                                    </span>
                                                    <div className="bg-muted-bg p-3 rounded-xl border border-border-divider">
                                                        <p className="text-[10px] font-black text-text-primary uppercase leading-tight">{selectedInv.bank_details.bank_name}</p>
                                                        <p className="text-[11px] font-mono font-bold text-primary-600 mt-0.5 tracking-wider">{selectedInv.bank_details.account_number}</p>
                                                        <p className="text-[8px] font-bold text-text-muted uppercase mt-1">Holder: {selectedInv.bank_details.holder_name}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <button
                                                onClick={() => handleAction('APPROVE')}
                                                disabled={isProcessing}
                                                className="w-full py-3 bg-primary-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary-500/20 hover:bg-primary-600 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                            >
                                                {isProcessing ? <Clock className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                                Authorize Approval
                                            </button>
                                            <button
                                                onClick={() => handleAction('REJECT')}
                                                disabled={isProcessing}
                                                className="w-full py-2.5 bg-card text-rose-500 border-2 border-rose-500/10 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-500/5 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-sm"
                                            >
                                                <XCircle className="w-3.5 h-3.5" />
                                                Decline Asset
                                            </button>
                                        </div>

                                        {/* <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                                            <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 animate-pulse" />
                                            <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase">
                                                Approving this investment will authorize the treasury to release the payment vouchers and notify the customer.
                                            </p>
                                        </div> */}
                                    </div>
                                ) : (
                                    <div className="text-center py-24 bg-muted-bg/50 rounded-2xl border border-dashed border-border-divider">
                                        <Clock className="w-10 h-10 text-border-divider mx-auto mb-4" />
                                        <p className="text-xs font-black text-text-muted uppercase tracking-widest px-8 leading-relaxed">
                                            Select an investment path from the queue to initiate authorization
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ActionConfirmModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={confirmAction}
                title={modalAction === 'APPROVE' ? "Verify Investment" : "Decline Investment"}
                message={modalAction === 'APPROVE'
                    ? `Are you sure you want to authorize this investment for ${selectedInv?.customer?.full_name}?`
                    : `Are you sure you want to decline this investment for ${selectedInv?.customer?.full_name}?`}
                confirmLabel={modalAction === 'APPROVE' ? "Authorize" : "Decline"}
                variant={modalAction === 'APPROVE' ? 'info' : 'danger'}
                showNoteInput={true}
                notePlaceholder={modalAction === 'APPROVE' ? "Add approval remarks..." : "Add rejection reason..."}
            />
        </div>
    );
}

