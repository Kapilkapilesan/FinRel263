'use client';

import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    DollarSign,
    CheckCircle2,
    XCircle,
    Clock,
    User,
    ChevronRight,
    Check,
    X,
    Users,
    FileText,
    Activity,
    ShieldCheck,
    Briefcase,
    ArrowUpRight,
    Sparkles,
    Landmark,
    Search
} from 'lucide-react';
import { toast } from 'react-toastify';
import { promotionService, salaryIncrementService, PromotionRequest, SalaryIncrementRequest } from '../../services/promotion.service';
import BMSLoader from '../../components/common/BMSLoader';
import { colors } from '@/themes/colors';

type TabType = 'promotion';

export default function PromotionApprovalPage() {
    const [activeTab, setActiveTab] = useState<TabType>('promotion');
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Promotion state
    const [promotionRequests, setPromotionRequests] = useState<PromotionRequest[]>([]);

    // Action Modal state
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<PromotionRequest | null>(null);
    const [feedbackReason, setFeedbackReason] = useState('');

    useEffect(() => {
        fetchAllCounts();
    }, []);

    const fetchAllCounts = async () => {
        try {
            setLoading(true);
            const promoData = await promotionService.getRequests(true);
            setPromotionRequests(promoData);
        } catch (error) {
            console.error('Error fetching promotion requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRequests = async () => {
        fetchAllCounts();
    };

    const openActionModal = (
        request: PromotionRequest,
        action: 'approve' | 'reject'
    ) => {
        setSelectedRequest(request);
        setActionType(action);
        setFeedbackReason('');
        setShowActionModal(true);
    };

    const handleAction = async () => {
        if (!selectedRequest || !actionType) return;

        if (actionType === 'reject' && feedbackReason.length < 5) {
            toast.error('Please provide a reason for rejection (at least 5 characters)');
            return;
        }

        try {
            setActionLoading(selectedRequest.id);

            if (actionType === 'approve') {
                await promotionService.approve(selectedRequest.id, feedbackReason || 'Approved');
                toast.success('Promotion request approved!');
            } else {
                await promotionService.reject(selectedRequest.id, feedbackReason);
                toast.success('Promotion request rejected.');
            }

            setShowActionModal(false);
            setSelectedRequest(null);
            setActionType(null);
            setFeedbackReason('');
            fetchRequests();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Action failed';
            toast.error(message);
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const filteredPromotionRequests = promotionRequests.filter(req =>
        req.staff_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.staff_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.requested_role_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen relative overflow-hidden p-6 bg-app-background">
            {/* Ambient Background branding */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] rounded-full opacity-[0.05] blur-[100px]"
                    style={{ background: `radial-gradient(circle, ${colors.primary[500]}, transparent)` }}
                />
            </div>

            <div className="relative z-10 max-w-[1500px] mx-auto space-y-8 animate-in fade-in duration-500">
                {/* Institutional Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/90 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-border-default relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full" style={{ background: `linear-gradient(to bottom, ${colors.primary[600]}, ${colors.indigo[900]})` }} />

                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0"
                            style={{ background: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.indigo[900]})` }}>
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-text-primary tracking-tight uppercase leading-none mb-1">
                                Verification Protocol
                            </h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest flex items-center gap-1.5">
                                    <Landmark className="w-3.5 h-3.5 text-primary-500" />
                                    Promotion & Compensation Approval
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Filter Registry..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-6 py-3.5 bg-input border border-border-default rounded-xl text-[10px] font-black uppercase tracking-widest text-text-primary outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 shadow-sm w-56 transition-all"
                        />
                    </div>
                </div>

                {/* Insight Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                        { label: 'Pending Promotions', value: promotionRequests.length, icon: Briefcase, color: colors.primary[500] }
                    ].map((stat, idx) => (
                        <div key={idx} className="group relative overflow-hidden bg-card/80 backdrop-blur-xl rounded-[1.5rem] p-6 border border-border-default shadow-lg hover:shadow-xl transition-all border-l-4"
                            style={{ borderLeftColor: stat.color }}>
                            <div className="relative z-10 flex items-center justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-widest">
                                        <stat.icon size={16} style={{ color: stat.color }} />
                                        {stat.label}
                                    </div>
                                    <div className="text-4xl font-black text-text-primary tracking-tighter">
                                        {stat.value}
                                        <span className="text-xs text-text-muted ml-3 font-bold uppercase tracking-normal">Active Req</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Registry Ledger */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 p-1 bg-muted-bg/50 rounded-2xl border border-border-default w-fit">
                        {[
                            { id: 'promotion', label: 'Promotion Path', icon: TrendingUp }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                    ? 'bg-card text-primary-600 shadow-md scale-[1.02]'
                                    : 'text-text-muted hover:text-text-primary'
                                    }`}
                            >
                                <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-primary-500' : 'text-text-muted/50'}`} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="bg-card/70 backdrop-blur-xl rounded-[2rem] border border-border-default shadow-xl shadow-black/5 dark:shadow-black/20 overflow-hidden relative">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24">
                                <BMSLoader message="Accessing Records..." size="xsmall" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-muted-bg/50">
                                        <tr className="border-b border-border-divider">
                                            <th className="pl-8 pr-4 py-6 text-[10px] font-black text-text-muted uppercase tracking-widest">Staff Asset</th>
                                            <th className="px-4 py-6 text-[10px] font-black text-text-muted uppercase tracking-widest">Levels</th>
                                            <th className="px-4 py-6 text-[10px] font-black text-text-muted uppercase tracking-widest">Target Path</th>
                                            <th className="px-4 py-6 text-[10px] font-black text-text-muted uppercase tracking-widest">Rationale</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-text-muted uppercase tracking-widest">Decision</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-divider">
                                        {filteredPromotionRequests.map((request) => (
                                            <tr key={request.id} className="group hover:bg-hover transition-colors">
                                                <td className="pl-8 pr-4 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-muted-bg flex items-center justify-center group-hover:scale-105 transition-transform">
                                                            <span className="text-xs font-black text-text-muted group-hover:text-primary-500 uppercase">{request.staff_name.charAt(0)}</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-text-primary uppercase tracking-tight">{request.staff_name}</p>
                                                            <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{request.staff_id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-6">
                                                    <span className="text-[10px] font-bold text-text-muted uppercase bg-muted-bg px-2 py-1 rounded-md border border-border-divider">
                                                        {(request as PromotionRequest).current_role_name}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-6">
                                                    <div className="flex items-center gap-2">
                                                        <ArrowUpRight className="w-3.5 h-3.5 text-primary-600" />
                                                        <span className="text-[11px] font-black uppercase text-primary-600">
                                                            {(request as PromotionRequest).requested_role_name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-6">
                                                    <p className="text-[11px] font-bold text-text-secondary max-w-xs line-clamp-1 leading-relaxed" title={request.reason}>
                                                        {request.reason}
                                                    </p>
                                                    <p className="text-[9px] font-black text-text-muted/50 uppercase tracking-widest mt-1">{formatDate(request.requested_at)}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => openActionModal(request, 'approve')}
                                                            className="flex items-center gap-1.5 px-4 py-2 bg-primary-500/10 text-primary-600 rounded-lg text-[9px] font-black uppercase hover:bg-primary-500/20 transition-all active:scale-95"
                                                        >
                                                            <Check size={12} strokeWidth={3} /> Verify
                                                        </button>
                                                        <button
                                                            onClick={() => openActionModal(request, 'reject')}
                                                            className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/10 text-rose-600 rounded-lg text-[9px] font-black uppercase hover:bg-rose-500/20 transition-all active:scale-95"
                                                        >
                                                            <X size={12} strokeWidth={3} /> Abort
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {(filteredPromotionRequests).length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-24 text-center opacity-30">
                                                    <Users size={32} className="mx-auto mb-3 text-text-muted opacity-20" />
                                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em]">Historical Log Terminal Information</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Modal */}
            {showActionModal && selectedRequest && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-card rounded-[1.5rem] shadow-2xl shadow-black/20 w-full max-w-md overflow-hidden flex flex-col border border-border-default animate-in zoom-in-95 duration-200">
                        <div className={`p-8 ${actionType === 'approve' ? 'bg-primary-500/5' : 'bg-rose-500/5'}`}>
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${actionType === 'approve' ? 'bg-primary-500' : 'bg-rose-500'}`}>
                                    {actionType === 'approve' ? <ShieldCheck size={20} /> : <XCircle size={20} />}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-text-primary uppercase tracking-tight leading-none">
                                        {actionType === 'approve' ? 'Authorize' : 'Decline'} Entry
                                    </h3>
                                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mt-1">Registry Action Protocol</p>
                                </div>
                            </div>

                            <div className="bg-muted-bg rounded-xl p-5 border border-border-divider space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Staff Name:</p>
                                    <p className="text-[10px] font-black text-text-primary uppercase">{selectedRequest.staff_name}</p>
                                </div>
                                <div className="h-px bg-border-divider" />
                                <div className="flex items-center justify-between">
                                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Entry Delta:</p>
                                    <p className={`text-[10px] font-black uppercase ${actionType === 'approve' ? 'text-primary-600' : 'text-rose-600'}`}>
                                        {(selectedRequest as PromotionRequest).requested_role_name}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="block text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">
                                    {actionType === 'approve' ? 'Approval Commentary (Opt)' : 'Rejection Protocol Reason *'}
                                </label>
                                <textarea
                                    value={feedbackReason}
                                    onChange={(e) => setFeedbackReason(e.target.value)}
                                    rows={3}
                                    placeholder="Document protocol commentary..."
                                    className="w-full px-5 py-4 border border-border-default rounded-xl bg-input text-xs font-bold text-text-primary outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 resize-none transition-all placeholder:text-text-muted/30"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowActionModal(false)}
                                    className="flex-1 px-6 py-4 bg-muted-bg text-text-muted rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-hover transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAction}
                                    disabled={actionLoading !== null}
                                    className={`flex-[1.5] px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 ${actionType === 'approve' ? 'bg-primary-600 hover:bg-primary-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                                >
                                    {actionLoading !== null ? 'EXECUTING...' : `CONFIRM ${actionType?.toUpperCase()}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
