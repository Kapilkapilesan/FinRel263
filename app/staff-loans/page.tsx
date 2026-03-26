"use client";

import React, { useEffect, useState } from 'react';
import { staffLoanService, StaffLoan } from '../../services/staffLoan.service';
import { authService } from '../../services/auth.service';
import { toast } from 'react-toastify';
import {
    CheckCircle2,
    XCircle,
    Search,
    Filter,
    AlertCircle,
    DollarSign,
    Banknote,
    Eye,
    Clock,
    TrendingUp,
    ShieldCheck,
    Calendar,
    ArrowUpRight,
    Users,
    Activity,
    Landmark,
    Briefcase,
    Zap,
    Target,
    Sparkles,
    Check,
    X,
    Hash,
    UserPlus
} from 'lucide-react';
import { colors } from '@/themes/colors';
import BMSLoader from '../../components/common/BMSLoader';

export default function StaffLoanListPage() {
    const [loading, setLoading] = useState(true);
    const [loans, setLoans] = useState<StaffLoan[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Permission checks
    const canViewLoans = authService.hasPermission('staffloans.view');
    const canApproveLoans = authService.hasPermission('staffloans.approve');
    const canCreateLoans = authService.hasPermission('staffloans.create');
    const canDisburseLoans = authService.hasPermission('staffloans.disburse');
    const canViewAllLoans = authService.hasPermission('staffloans.view_all');

    // Action Modal State
    const [selectedLoan, setSelectedLoan] = useState<StaffLoan | null>(null);
    const [actionType, setActionType] = useState<'approve' | 'reject' | 'view' | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [processing, setProcessing] = useState(false);

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

    const handleAction = (loan: StaffLoan, type: 'approve' | 'reject' | 'view') => {
        setSelectedLoan(loan);
        setActionType(type);
        setRejectionReason('');
    };

    const confirmAction = async () => {
        if (!selectedLoan || !actionType) return;

        if (actionType === 'view') {
            setSelectedLoan(null);
            setActionType(null);
            return;
        }

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
                const messages: Record<string, string> = {
                    approve: 'Loan Approved Successfully',
                    reject: 'Loan Rejected'
                };
                toast.success(messages[actionType]);
                fetchLoans();
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
                        <Banknote className="w-3.5 h-3.5" /> Disbursed
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                        <Clock className="w-3.5 h-3.5" /> Pending
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

    // Stats
    const pendingCount = loans.filter(l => l.status === 'pending').length;
    const approvedCount = loans.filter(l => l.status === 'approved').length;
    const disbursedCount = loans.filter(l => l.status === 'disbursed').length;
    const totalAmount = loans.reduce((sum, l) => sum + Number(l.amount), 0);

    return (
        <div className="min-h-screen relative overflow-hidden bg-app-background">
            {/* Ambient Background branding */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-40 transition-opacity">
                <div
                    className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] rounded-full opacity-[0.2] blur-[120px]"
                    style={{ background: `radial-gradient(circle, ${colors.primary[500]}, transparent)` }}
                />
                <div
                    className="absolute bottom-[10%] right-[5%] w-[30%] h-[30%] rounded-full opacity-[0.15] blur-[120px]"
                    style={{ background: `radial-gradient(circle, ${colors.primary[500]}, transparent)` }}
                />
            </div>

            <div className="relative z-10 p-6 max-w-[1500px] mx-auto space-y-6 animate-in fade-in duration-700">
                {/* Institutional Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/90 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-border-default relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full" style={{ background: `linear-gradient(to bottom, ${colors.primary[600]}, ${colors.primary[900]})` }} />

                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0"
                            style={{ background: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[900]})` }}>
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-text-primary tracking-tight uppercase leading-none mb-1">
                                Staff Asset Management
                            </h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest flex items-center gap-1.5">
                                    <Target className="w-3.5 h-3.5 text-primary-500" />
                                    Internal Lending Protocol
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group/search flex-1 md:flex-none">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within/search:text-primary-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Filter Registry..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 pr-6 py-3.5 bg-input border border-border-default rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-primary outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 shadow-sm w-full md:w-80 transition-all"
                            />
                        </div>

                        <div className="relative flex-1 md:flex-none">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="pl-12 pr-12 py-3.5 bg-input border border-border-default rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-primary outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 shadow-sm appearance-none cursor-pointer hover:bg-hover transition-all w-full md:w-auto"
                            >
                                <option value="all">Global Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="disbursed">Disbursed</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted opacity-50">
                                <Sparkles size={12} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Insight Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Pending Verification', value: pendingCount, icon: AlertCircle, color: colors.warning[500], bg: colors.warning[50] },
                        { label: 'Authorized Logs', value: approvedCount, icon: CheckCircle2, color: colors.primary[500], bg: colors.primary[50] },
                        { label: 'Settled Portfolios', value: disbursedCount, icon: Banknote, color: colors.primary[500], bg: colors.primary[50] },
                        { label: 'Asset Valuation', value: formatCurrency(totalAmount), icon: DollarSign, color: colors.primary[500], bg: colors.primary[50], wide: true }
                    ].map((stat, idx) => (
                        <div key={idx} className="group relative overflow-hidden bg-card/90 backdrop-blur-xl rounded-[1.5rem] p-6 border border-border-default shadow-lg hover:shadow-xl transition-all border-l-4"
                            style={{ borderLeftColor: stat.color }}>
                            <div className="relative z-10 space-y-2">
                                <div className="flex items-center gap-2 text-[9px] font-black text-text-muted uppercase tracking-widest">
                                    <stat.icon size={14} style={{ color: stat.color }} />
                                    {stat.label}
                                </div>
                                <div className={`text-2xl font-black text-text-primary tracking-tight ${stat.wide ? 'truncate' : ''}`}>
                                    {stat.value}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Institutional Registry Ledger */}
                <div className="bg-card/70 backdrop-blur-xl rounded-[2rem] border border-border-default shadow-xl overflow-hidden relative min-h-[500px]">
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-20 z-20">
                            <BMSLoader message="Accessing Secure Records..." size="small" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto overflow-y-auto max-h-[70vh] no-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-table-header sticky top-0 z-30 backdrop-blur-xl">
                                    <tr className="border-b border-border-divider">
                                        <th className="pl-8 pr-4 py-6 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-r border-border-divider/10">Applicant Asset</th>
                                        <th className="px-5 py-6 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-r border-border-divider/10">Service Class</th>
                                        <th className="px-5 py-6 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-r border-border-divider/10">Capital Detail</th>
                                        <th className="px-5 py-6 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-r border-border-divider/10">Protocol Witness</th>
                                        <th className="px-5 py-6 text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Entry Date</th>
                                        <th className="px-5 py-6 text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Status</th>
                                        <th className="px-8 py-6 text-right text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Terminal Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-divider">
                                    {filteredLoans.map((loan) => (
                                        <tr key={loan.id} className="group hover:bg-hover transition-colors">
                                            <td className="pl-8 pr-4 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-input flex items-center justify-center group-hover:scale-105 transition-transform border border-border-default">
                                                        <span className="text-xs font-black text-text-muted group-hover:text-primary-500 uppercase">{loan.staff?.full_name?.charAt(0)}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-black text-text-primary uppercase tracking-tight">{loan.staff?.full_name}</p>
                                                        <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                                                            <Hash className="w-2.5 h-2.5" /> {loan.staff_id} • {loan.staff?.branch?.branch_name || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-6">
                                                <div className="flex items-center gap-2">
                                                    <ShieldCheck className="w-3.5 h-3.5 text-primary-400" />
                                                    <div>
                                                        <p className="text-[11px] font-black text-text-secondary uppercase">{(loan as any).product?.product_name || 'GENERAL ASSET'}</p>
                                                        <p className="text-[8px] font-bold text-text-muted uppercase tracking-[0.2em]">{(loan as any).product?.product_code || 'FC-GEN'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-6 text-center lg:text-left">
                                                <p className="text-[14px] font-black text-text-primary tabular-nums tracking-tighter">{formatCurrency(Number(loan.amount))}</p>
                                                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">{loan.loan_duration} Months Protocol</p>
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
                                            <td className="px-5 py-6">
                                                <div className="flex items-center gap-2.5 text-text-muted group-hover:text-text-primary transition-colors">
                                                    <Calendar size={12} strokeWidth={2.5} className="opacity-40" />
                                                    <span className="text-[10px] font-black tabular-nums tracking-widest">{new Date(loan.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-6">
                                                {getStatusBadge(loan.status)}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2.5">
                                                    <button
                                                        onClick={() => handleAction(loan, 'view')}
                                                        className="p-2.5 bg-muted text-text-muted hover:bg-primary-500/10 hover:text-primary-600 rounded-xl transition-all active:scale-90 border border-border-divider/50 shadow-sm"
                                                        title="View Registry Entry"
                                                    >
                                                        <Eye className="w-4 h-4 transition-transform group-hover:scale-110" />
                                                    </button>
                                                    {loan.status === 'pending' && canApproveLoans && (
                                                        <>
                                                            <button
                                                                onClick={() => handleAction(loan, 'approve')}
                                                                className="p-2.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 hover:bg-primary-500/20 rounded-xl transition-all active:scale-90 border border-primary-500/20 shadow-sm"
                                                                title="Verify & Authorize"
                                                            >
                                                                <Check className="w-4 h-4" strokeWidth={3} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleAction(loan, 'reject')}
                                                                className="p-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-xl transition-all active:scale-90 border border-rose-500/20 shadow-sm"
                                                                title="Abort Request"
                                                            >
                                                                <X className="w-4 h-4" strokeWidth={3} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredLoans.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={7} className="py-32 text-center opacity-30">
                                                <Users size={32} className="mx-auto mb-3" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Empty Terminal Registry Log</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Modals */}
            {selectedLoan && actionType && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-card rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-border-default animate-in zoom-in-95 duration-200">
                        {actionType === 'view' ? (
                            <>
                                <div className="p-8 border-b border-border-divider flex items-center justify-between relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-500" />
                                    <div>
                                        <h3 className="text-2xl font-black text-text-primary tracking-tight uppercase leading-none mb-1">Entry Details</h3>
                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Protocol Identification Registry</p>
                                    </div>
                                    <button onClick={() => { setSelectedLoan(null); setActionType(null); }} className="w-10 h-10 bg-input rounded-xl flex items-center justify-center text-text-muted hover:text-rose-500 transition-all"><X size={20} /></button>
                                </div>
                                <div className="p-8 space-y-8 bg-app-background/20 overflow-y-auto no-scrollbar max-h-[60vh]">
                                    <div className="grid grid-cols-2 gap-8">
                                        {[
                                            { label: 'Asset Owner', value: selectedLoan.staff?.full_name, icon: UserPlus },
                                            { label: 'Identification', value: selectedLoan.staff_id, icon: Hash },
                                            { label: 'Authorized Sum', value: formatCurrency(Number(selectedLoan.amount)), icon: Landmark },
                                            { label: 'Mission Span', value: `${selectedLoan.loan_duration} Months`, icon: Calendar }
                                        ].map((item, i) => (
                                            <div key={i} className="space-y-1.5">
                                                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5"><item.icon size={12} /> {item.label}</p>
                                                <p className="text-sm font-black text-text-primary uppercase">{item.value}</p>
                                            </div>
                                        ))}
                                        <div className="col-span-2 space-y-1.5 pt-4 border-t border-border-default">
                                            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5"><Briefcase size={12} /> Mission Rationale</p>
                                            <p className="text-sm font-bold text-text-secondary leading-relaxed italic">"{selectedLoan.purpose}"</p>
                                        </div>
                                        <div className="col-span-2 grid grid-cols-2 gap-8 pt-4 border-t border-border-default">
                                            <div className="space-y-1.5">
                                                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Verified Witness</p>
                                                <p className="text-[11px] font-bold text-text-secondary uppercase">{selectedLoan.witness?.full_name || 'N/A'}</p>
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Current Status</p>
                                                <div>{getStatusBadge(selectedLoan.status)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 border-t border-border-divider bg-input/50 flex justify-end">
                                    <button
                                        onClick={() => { setSelectedLoan(null); setActionType(null); }}
                                        className="px-8 py-3.5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all"
                                    >
                                        close
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className={`p-8 ${actionType === 'approve' ? 'bg-primary-500/5 dark:bg-primary-500/10' : 'bg-rose-500/5 dark:bg-rose-500/10'}`}>
                                    <div className="flex items-center gap-5 mb-8">
                                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-2xl ${actionType === 'approve' ? 'bg-primary-600' : 'bg-rose-600'}`}>
                                            {actionType === 'approve' && <ShieldCheck size={32} />}
                                            {actionType === 'reject' && <AlertCircle size={32} />}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-text-primary tracking-tight leading-none mb-1.5 uppercase">
                                                {actionType === 'approve' ? 'Authorize Protocol' : 'Abort Protocol'}
                                            </h3>
                                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60">Registry Execution Environment</p>
                                        </div>
                                    </div>

                                    <div className="bg-card/40 backdrop-blur-md rounded-2xl p-6 border border-border-divider/50 shadow-sm space-y-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest italic opacity-50">Target Asset:</p>
                                            <p className="text-[13px] font-black text-text-primary uppercase tracking-tight">{selectedLoan.staff?.full_name}</p>
                                        </div>
                                        <div className="h-px bg-border-divider opacity-20" />
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest italic opacity-50">Protocol Valuation:</p>
                                            <p className={`text-lg font-black tracking-tighter ${actionType === 'reject' ? 'text-text-muted' : 'text-primary-500'}`}>
                                                {formatCurrency(Number(selectedLoan.amount))}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 space-y-8">
                                    {actionType === 'reject' && (
                                        <div className="space-y-3">
                                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Abort Rationale Registry *</label>
                                            <textarea
                                                className="w-full px-5 py-4 bg-input border border-border-default rounded-2xl text-[13px] font-semibold text-text-primary outline-none focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500/50 resize-none transition-all shadow-inner placeholder:text-text-muted"
                                                rows={4}
                                                placeholder="Document abort reason codes..."
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                            />
                                        </div>
                                    )}



                                    {!actionType || actionType === 'approve' && (
                                        <div className="bg-primary-50/10 p-4 rounded-xl border border-primary-500/30 flex items-start gap-4">
                                            <Activity className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                                            <p className="text-[11px] font-bold text-text-secondary leading-relaxed uppercase">Initiating verification will trigger a credit line elevation Protocol in the core ledger.</p>
                                        </div>
                                    )}

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => { setSelectedLoan(null); setActionType(null); }}
                                            className="flex-1 px-8 py-4 bg-muted text-text-muted rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all hover:bg-hover hover:text-text-primary active:scale-95 border border-border-divider"
                                        >
                                            Abort
                                        </button>
                                        <button
                                            onClick={confirmAction}
                                            disabled={processing}
                                            className={`flex-[1.8] px-8 py-4 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-primary-500/20 transition-all active:scale-[0.96] disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-3 ${actionType === 'approve' ? 'bg-primary-600 hover:bg-primary-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                                        >
                                            {processing ? (
                                                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <ArrowUpRight size={16} />
                                                    Execute Transaction
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
