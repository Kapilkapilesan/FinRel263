"use client";

import React, { useEffect, useState } from 'react';
import { staffLoanService, StaffLoan } from '../../../services/staffLoan.service';
import { authService } from '../../../services/auth.service';
import { toast } from 'react-toastify';
import {
    CheckCircle2,
    XCircle,
    Search,
    Filter,
    AlertCircle,
    User,
    Building,
    Phone,
    CreditCard,
    MapPin,
    Briefcase,
    X,
    ShieldCheck,
    Landmark,
    Target,
    Zap,
    Hash,
    Users,
    Activity,
    ArrowUpRight,
    Check
} from 'lucide-react';
import BMSLoader from '../../../components/common/BMSLoader';
import { colors } from '@/themes/colors';

export default function StaffLoanApprovalPage() {
    const [loading, setLoading] = useState(true);
    const [loans, setLoans] = useState<StaffLoan[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Permission checks
    const canApproveLoans = authService.hasPermission('staffloans.approve');
    const canViewAllLoans = authService.hasPermission('staffloans.view_all');

    // Redirect if no approval permission
    useEffect(() => {
        if (!canApproveLoans && !canViewAllLoans) {
            window.location.href = '/dashboard';
            return;
        }
    }, [canApproveLoans, canViewAllLoans]);

    // Action Modal State
    const [selectedLoan, setSelectedLoan] = useState<StaffLoan | null>(null);
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [processing, setProcessing] = useState(false);

    // Staff Details Modal State
    const [viewStaff, setViewStaff] = useState<StaffLoan['staff'] | null>(null);

    useEffect(() => {
        fetchLoans();
    }, []);

    const fetchLoans = async () => {
        setLoading(true);
        try {
            const response = await staffLoanService.getAll();
            if (response.status === 'success') {
                setLoans(response.data.data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch loans");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (loan: StaffLoan, type: 'approve' | 'reject') => {
        setSelectedLoan(loan);
        setActionType(type);
        setRejectionReason('');
    };

    const confirmAction = async () => {
        if (!selectedLoan || !actionType) return;

        if (actionType === 'reject' && !rejectionReason.trim()) {
            toast.error("Please provide a reason for rejection");
            return;
        }

        setProcessing(true);
        try {
            const response = await staffLoanService.updateStatus(
                selectedLoan.id,
                actionType === 'approve' ? 'approved' : 'rejected',
                rejectionReason
            );

            if (response.status === 'success') {
                toast.success(`Loan ${actionType === 'approve' ? 'Approved' : 'Rejected'} Successfully`);
                fetchLoans(); // Refresh list
                setSelectedLoan(null);
                setActionType(null);
            } else {
                toast.error(response.message || "Action failed");
            }
        } catch (error: any) {
            toast.error(error.message || "Action failed");
        } finally {
            setProcessing(false);
        }
    };

    const filteredLoans = loans.filter(loan => {
        const matchesStatus = filterStatus === 'all' || loan.status === filterStatus;
        const matchesSearch =
            loan.staff?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            loan.staff_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            loan.staff?.branch?.branch_name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary-50 text-primary-600 border border-primary-100/50 dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100/50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">
                        <XCircle className="w-3.5 h-3.5" /> Rejected
                    </span>
                );
            case 'disbursed':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary-50 text-primary-600 border border-primary-100/50 dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-500/20">
                        <ShieldCheck className="w-3.5 h-3.5" /> Disbursed
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                        <Activity className="w-3.5 h-3.5" /> Pending
                    </span>
                );
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-app-background">
            {/* Ambient Lighting */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] rounded-full opacity-[0.05] blur-[100px]"
                    style={{ background: `radial-gradient(circle, ${colors.primary[500]}, transparent)` }}
                />
            </div>

            <div className="relative z-10 p-6 max-w-[1500px] mx-auto space-y-6 animate-in fade-in duration-500">
                {/* Institutional Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/90 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-border-default relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full" style={{ background: `linear-gradient(to bottom, ${colors.primary[600]}, ${colors.primary[900]})` }} />

                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0"
                            style={{ background: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[900]})` }}>
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-text-primary tracking-tight uppercase leading-none mb-1">
                                Verification protocol
                            </h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest flex items-center gap-1.5">
                                    <Landmark className="w-3.5 h-3.5 text-primary-500" />
                                    Staff Loan Authorization Board
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group/search">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted transition-colors" />
                            <input
                                type="text"
                                placeholder="Filter Registry..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-6 py-3.5 bg-input border border-border-default rounded-xl text-[10px] font-black uppercase tracking-widest text-text-primary outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 shadow-sm w-64 transition-all"
                            />
                        </div>

                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="pl-10 pr-10 py-3.5 bg-input border border-border-default rounded-xl text-[10px] font-black uppercase tracking-widest text-text-primary outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 shadow-sm appearance-none cursor-pointer hover:bg-hover transition-all"
                            >
                                <option value="all">Global Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="disbursed">Disbursed</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Registry Terminal */}
                <div className="bg-card/70 backdrop-blur-xl rounded-[2rem] border border-border-default shadow-xl overflow-hidden relative min-h-[500px]">
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-20 z-20">
                            <BMSLoader message="Accessing Portfolio..." size="small" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto overflow-y-auto max-h-[75vh] no-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-table-header sticky top-0 z-30 backdrop-blur-md">
                                    <tr className="border-b border-border-default">
                                        <th className="pl-8 pr-4 py-6 text-[9px] font-black text-text-muted uppercase tracking-widest">Applicant Profile</th>
                                        <th className="px-4 py-6 text-[9px] font-black text-text-muted uppercase tracking-widest">Capital Assessment</th>
                                        <th className="px-4 py-6 text-[9px] font-black text-text-muted uppercase tracking-widest">Personnel Witness</th>
                                        <th className="px-4 py-6 text-[9px] font-black text-text-muted uppercase tracking-widest">Protocol Status</th>
                                        <th className="px-8 py-6 text-right text-[9px] font-black text-text-muted uppercase tracking-widest">Decision Board</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-divider">
                                    {filteredLoans.map((loan) => (
                                        <tr key={loan.id} className="group hover:bg-hover transition-colors">
                                            <td className="pl-8 pr-4 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        onClick={() => setViewStaff(loan.staff || null)}
                                                        className="w-10 h-10 rounded-xl bg-input flex items-center justify-center group-hover:scale-105 transition-transform border border-border-default cursor-pointer"
                                                    >
                                                        <span className="text-xs font-black text-text-muted group-hover:text-primary-500 uppercase">{loan.staff?.full_name?.charAt(0)}</span>
                                                    </div>
                                                    <div>
                                                        <p
                                                            onClick={() => setViewStaff(loan.staff || null)}
                                                            className="text-[13px] font-black text-text-primary uppercase tracking-tight cursor-pointer hover:text-primary-600 transition-colors flex items-center gap-2"
                                                        >
                                                            {loan.staff?.full_name}
                                                            <User size={12} className="opacity-30 group-hover:opacity-100 transition-opacity" />
                                                        </p>
                                                        <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                                                            <Hash className="w-2.5 h-2.5" /> {loan.staff_id} • {loan.staff?.branch?.branch_name || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-6">
                                                <p className="text-[14px] font-black text-text-primary tabular-nums tracking-tighter">{formatCurrency(Number(loan.amount))}</p>
                                                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest truncate max-w-[200px]" title={loan.purpose}>
                                                    {loan.loan_duration}M • {loan.purpose}
                                                </p>
                                            </td>
                                            <td className="px-4 py-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-input flex items-center justify-center text-[9px] font-black text-text-muted">W</div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-text-secondary uppercase">{loan.witness?.full_name || 'NOT ASSIGNED'}</p>
                                                        <p className="text-[8px] font-bold text-text-muted uppercase">{loan.witness_staff_id || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-6">
                                                {getStatusBadge(loan.status)}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                {loan.status === 'pending' && (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleAction(loan, 'approve')}
                                                            className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg text-[9px] font-black uppercase hover:bg-primary-100 transition-all active:scale-95 border border-primary-100/50"
                                                        >
                                                            <Check size={12} strokeWidth={3} /> Verify
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(loan, 'reject')}
                                                            className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase hover:bg-rose-100 transition-all active:scale-95 border border-rose-100/50"
                                                        >
                                                            <X size={12} strokeWidth={3} /> Abort
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredLoans.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={5} className="py-32 text-center opacity-30">
                                                <Landmark size={32} className="mx-auto mb-3" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Historical Authorization Void</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Decision Modal */}
            {selectedLoan && actionType && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-card rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-border-default animate-in zoom-in-95 duration-200">
                        <div className={`p-8 ${actionType === 'approve' ? 'bg-primary-50/50' : 'bg-rose-50/50'}`}>
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl ${actionType === 'approve' ? 'bg-primary-600' : 'bg-rose-600'
                                    }`}>
                                    {actionType === 'approve' ? <ShieldCheck size={28} /> : <AlertCircle size={28} />}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-text-primary uppercase tracking-tight leading-none mb-1">
                                        {actionType === 'approve' ? 'Verify Entry' : 'Abort Protocol'}
                                    </h3>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Personnel Authorization Protocol</p>
                                </div>
                            </div>

                            <div className="bg-card/80 rounded-2xl p-6 border border-border-default shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Staff Target:</p>
                                    <p className="text-sm font-black text-text-primary uppercase tracking-tight">{selectedLoan.staff?.full_name}</p>
                                </div>
                                <div className="h-px bg-border-divider" />
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Protocol Value:</p>
                                    <p className="text-lg font-black text-text-primary tabular-nums">{formatCurrency(Number(selectedLoan.amount))}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            {(actionType === 'reject' || actionType === 'approve') && (
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">
                                        {actionType === 'approve' ? 'Administrative Remarks (Optional)' : 'Protocol Failure Rationale *'}
                                    </label>
                                    <textarea
                                        className={`w-full px-5 py-4 bg-input border border-border-default rounded-2xl text-[13px] font-semibold text-text-primary outline-none focus:ring-4 resize-none transition-all shadow-inner ${actionType === 'approve' ? 'focus:ring-primary-500/5 focus:border-primary-500/50' : 'focus:ring-rose-500/5 focus:border-rose-500/50'
                                            }`}
                                        rows={4}
                                        placeholder={actionType === 'approve' ? "Add and optional note or protocol remarks..." : "Document rationale codes..."}
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            )}

                            {actionType === 'approve' && (
                                <div className="bg-primary-50/50 p-4 rounded-xl border border-primary-100/50 flex items-start gap-4">
                                    <Zap className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                                    <p className="text-[10px] font-bold text-text-secondary leading-relaxed uppercase">
                                        AUTHORIZING THIS REQUEST WILL COMMIT THE CAPITAL PORTFOLIO FOR SETTLEMENT.
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button
                                    onClick={() => { setSelectedLoan(null); setActionType(null); }}
                                    className="flex-1 px-8 py-4 bg-input text-text-muted rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all hover:bg-hover hover:text-text-primary active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmAction}
                                    disabled={processing}
                                    className={`flex-[1.5] px-8 py-4 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 ${actionType === 'approve' ? 'bg-primary-600 hover:bg-primary-700' : 'bg-rose-600 hover:bg-rose-700'
                                        }`}
                                >
                                    {processing ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <ArrowUpRight size={16} />
                                            {actionType === 'approve' ? 'Finalize Auth' : 'Confirm Abort'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Personnel Intelligence Modal */}
            {viewStaff && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-card rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-border-default animate-in zoom-in-95 duration-200">
                        <div className="relative bg-gradient-to-br from-primary-600 to-primary-900 p-8 pt-12 pb-10 text-center text-white">
                            <button
                                onClick={() => setViewStaff(null)}
                                className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all transform hover:rotate-90 active:scale-90"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="w-24 h-24 mx-auto bg-white/10 backdrop-blur-md rounded-[1.5rem] p-1.5 shadow-2xl mb-6 ring-4 ring-white/10">
                                <div className="w-full h-full bg-white/20 rounded-2xl flex items-center justify-center overflow-hidden">
                                    <User className="w-12 h-12 text-white/50" />
                                </div>
                            </div>

                            <h3 className="text-2xl font-black tracking-tight uppercase mb-1">{viewStaff.full_name}</h3>
                            <div className="flex items-center justify-center gap-2 mt-1 opacity-70">
                                <span className="text-[10px] font-black tracking-[0.2em] bg-white/20 px-3 py-1 rounded-lg uppercase">{viewStaff.staff_id}</span>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-input border border-border-default rounded-2xl shadow-sm">
                                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Building size={10} /> Sector</p>
                                    <p className="text-[11px] font-black text-text-primary uppercase">{viewStaff.branch?.branch_name || 'PRIMARY'}</p>
                                </div>
                                <div className="p-4 bg-input border border-border-default rounded-2xl shadow-sm">
                                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Briefcase size={10} /> Designation</p>
                                    <p className="text-[11px] font-black text-text-primary uppercase truncate">
                                        {viewStaff.user?.roles?.[0]?.name?.replace(/_/g, ' ') || 'OFFICER'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { icon: CreditCard, label: 'NIC Identifier', value: viewStaff.nic, color: 'primary' },
                                    { icon: Phone, label: 'Comms Link', value: viewStaff.contact_no, color: 'primary' },
                                    { icon: MapPin, label: 'Tactical Location', value: viewStaff.address, color: 'primary' }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 hover:bg-hover rounded-2xl transition-all border border-transparent hover:border-border-default group">
                                        <div className={`w-10 h-10 rounded-xl bg-input flex items-center justify-center text-text-muted group-hover:bg-card group-hover:shadow-md transition-all`}>
                                            <item.icon size={18} />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">{item.label}</p>
                                            <p className="text-[12px] font-bold text-text-secondary truncate">{item.value || 'N/A'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-8 border-t border-border-divider bg-input/30 flex justify-end">
                            <button
                                onClick={() => setViewStaff(null)}
                                className="px-10 py-4 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all active:scale-95"
                            >
                                Dismiss Info
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
