'use client';

import React, { useState, useEffect } from 'react';
import {
    DollarSign,
    CheckCircle2,
    XCircle,
    Clock,
    User,
    ChevronRight,
    Check,
    X,
    FileText,
    Activity,
    ShieldCheck,
    Briefcase,
    ArrowUpRight,
    Sparkles,
    Search
} from 'lucide-react';
import { toast } from 'react-toastify';
import { salaryIncrementService, SalaryIncrementRequest } from '../../services/promotion.service';
import BMSLoader from '../../components/common/BMSLoader';
import { colors } from '@/themes/colors';
import { typography } from '@/themes/typography';

export default function SalaryIncrementApprovalPage() {
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [incrementRequests, setIncrementRequests] = useState<SalaryIncrementRequest[]>([]);
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<SalaryIncrementRequest | null>(null);
    const [feedbackReason, setFeedbackReason] = useState('');

    useEffect(() => {
        fetchIncrementRequests();
    }, []);

    const fetchIncrementRequests = async () => {
        try {
            setLoading(true);
            const requests = await salaryIncrementService.getRequests(true);
            setIncrementRequests(requests);
        } catch (error) {
            console.error('Error fetching increment requests:', error);
            toast.error('Failed to fetch increment requests');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (request: SalaryIncrementRequest, action: 'approve' | 'reject') => {
        setSelectedRequest(request);
        setActionType(action);
        setShowActionModal(true);
        setFeedbackReason('');
    };

    const confirmAction = async () => {
        if (!selectedRequest || !actionType) return;

        try {
            setActionLoading(selectedRequest.id);
            
            if (actionType === 'approve') {
                await salaryIncrementService.approve(selectedRequest.id, feedbackReason || 'Approved');
                toast.success('Salary increment request approved successfully!');
            } else {
                await salaryIncrementService.reject(selectedRequest.id, feedbackReason);
                toast.success('Salary increment request rejected successfully!');
            }

            setShowActionModal(false);
            setSelectedRequest(null);
            setFeedbackReason('');
            fetchIncrementRequests();
        } catch (error) {
            console.error(`Error ${actionType}ing request:`, error);
            toast.error(`Failed to ${actionType} salary increment request`);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Pending':
                return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${typography.weight.bold} uppercase tracking-wider bg-warning-50 text-warning-600 border border-warning-100 dark:bg-warning-500/10 dark:text-warning-400 dark:border-warning-500/20 ${typography.fontFamily}`}>
                        <Clock className="w-3 h-3" /> Pending
                    </span>
                );
            case 'Approved':
                return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${typography.weight.bold} uppercase tracking-wider bg-primary-50 text-primary-600 border border-primary-100 dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-500/20 ${typography.fontFamily}`}>
                        <CheckCircle2 className="w-3 h-3" /> Approved
                    </span>
                );
            case 'Rejected':
                return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${typography.weight.bold} uppercase tracking-wider bg-danger-50 text-danger-600 border border-danger-100 dark:bg-danger-500/10 dark:text-danger-400 dark:border-danger-500/20 ${typography.fontFamily}`}>
                        <XCircle className="w-3 h-3" /> Rejected
                    </span>
                );
            default:
                return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${typography.weight.bold} uppercase tracking-wider bg-muted-bg text-text-muted border border-border-default ${typography.fontFamily}`}>
                        {status}
                    </span>
                );
        }
    };

    const formatCurrency = (amount: number | null | undefined) => {
        if (amount === null || amount === undefined || isNaN(Number(amount))) {
            return 'LKR0';
        }
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Number(amount));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const filteredRequests = incrementRequests.filter(request =>
        request.staff_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.reason?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return <BMSLoader />;
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-app-background">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] rounded-full opacity-[0.07] blur-[100px]"
                    style={{ background: `radial-gradient(circle, ${colors.primary[500]}, transparent)` }}
                />
            </div>

            <div className="relative z-10 p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/90 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-border-default relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full" style={{ background: `linear-gradient(to bottom, ${colors.primary[500]}, ${colors.primary[700]})` }} />

                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0"
                            style={{ background: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[700]})` }}>
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className={`${typography.size['2xl']} ${typography.weight.bold} text-text-primary tracking-tight uppercase mb-1 ${typography.fontFamily}`}>
                                Salary Increment Approval
                            </h1>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] text-text-muted ${typography.weight.bold} uppercase tracking-widest flex items-center gap-1.5 ${typography.fontFamily}`}>
                                    <Activity className="w-3 h-3 text-primary-500" />
                                    Compensation Review Protocol
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search requests..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`pl-12 pr-6 py-3 bg-input border border-border-default rounded-xl ${typography.size.sm} ${typography.weight.semibold} text-text-primary outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 transition-all w-64 ${typography.fontFamily}`}
                            />
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-card/95 backdrop-blur-xl rounded-2xl border border-border-default shadow-lg p-6 relative overflow-hidden hover:shadow-xl transition-shadow">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Clock size={40} className="text-warning-500" />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-warning-50 flex items-center justify-center border border-warning-100">
                                <Clock className="w-6 h-6 text-warning-600" />
                            </div>
                            <div>
                                <p className={`${typography.size['2xl']} ${typography.weight.bold} text-text-primary ${typography.fontFamily}`}>
                                    {incrementRequests.filter(r => r.status === 'Pending').length}
                                </p>
                                <p className={`text-[10px] ${typography.weight.bold} text-text-muted uppercase tracking-widest ${typography.fontFamily}`}>Pending Requests</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card/95 backdrop-blur-xl rounded-2xl border border-border-default shadow-lg p-6 relative overflow-hidden hover:shadow-xl transition-shadow">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <CheckCircle2 size={40} className="text-primary-500" />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center border border-primary-100">
                                <CheckCircle2 className="w-6 h-6 text-primary-600" />
                            </div>
                            <div>
                                <p className={`${typography.size['2xl']} ${typography.weight.bold} text-text-primary ${typography.fontFamily}`}>
                                    {incrementRequests.filter(r => r.status === 'Approved').length}
                                </p>
                                <p className={`text-[10px] ${typography.weight.bold} text-text-muted uppercase tracking-widest ${typography.fontFamily}`}>Approved Today</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card/95 backdrop-blur-xl rounded-2xl border border-border-default shadow-lg p-6 relative overflow-hidden hover:shadow-xl transition-shadow">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <DollarSign size={40} className="text-primary-500" />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center border border-primary-100">
                                <DollarSign className="w-6 h-6 text-primary-600" />
                            </div>
                            <div>
                                <p className={`${typography.size['2xl']} ${typography.weight.bold} text-text-primary ${typography.fontFamily}`}>
                                    {formatCurrency(
                                        incrementRequests
                                            .filter(r => r.status === 'Pending')
                                            .reduce((sum, r) => sum + (Number(r.requested_amount) || 0), 0)
                                    )}
                                </p>
                                <p className={`text-[10px] ${typography.weight.bold} text-text-muted uppercase tracking-widest ${typography.fontFamily}`}>Total Pending Amount</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Requests Table */}
                <div className="bg-card/95 backdrop-blur-xl rounded-[2rem] border border-border-default shadow-xl overflow-hidden hover:shadow-2xl transition-shadow">
                    <div className="px-8 py-8 border-b border-border-divider bg-gradient-to-r from-primary-50/50 to-transparent">
                        <h3 className={`${typography.size.xl} ${typography.weight.bold} text-text-primary uppercase tracking-tight ${typography.fontFamily}`}>
                            Pending Increment Requests
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted-bg/50 border-b border-border-default">
                                <tr>
                                    <th className={`px-8 py-4 text-left text-[10px] ${typography.weight.bold} text-text-muted uppercase tracking-widest ${typography.fontFamily}`}>Staff Member</th>
                                    <th className={`px-8 py-4 text-left text-[10px] ${typography.weight.bold} text-text-muted uppercase tracking-widest ${typography.fontFamily}`}>Current Salary</th>
                                    <th className={`px-8 py-4 text-left text-[10px] ${typography.weight.bold} text-text-muted uppercase tracking-widest ${typography.fontFamily}`}>Requested Amount</th>
                                    <th className={`px-8 py-4 text-left text-[10px] ${typography.weight.bold} text-text-muted uppercase tracking-widest ${typography.fontFamily}`}>New Salary</th>
                                    <th className={`px-8 py-4 text-left text-[10px] ${typography.weight.bold} text-text-muted uppercase tracking-widest ${typography.fontFamily}`}>Requested Date</th>
                                    <th className={`px-8 py-4 text-left text-[10px] ${typography.weight.bold} text-text-muted uppercase tracking-widest ${typography.fontFamily}`}>Status</th>
                                    <th className={`px-8 py-4 text-center text-[10px] ${typography.weight.bold} text-text-muted uppercase tracking-widest ${typography.fontFamily}`}>Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-default">
                                {filteredRequests.map((request) => (
                                    <tr key={request.id} className="hover:bg-hover/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-muted-bg flex items-center justify-center border border-border-default">
                                                    <User className="w-5 h-5 text-text-muted" />
                                                </div>
                                                <div>
                                                    <p className={`${typography.size.sm} ${typography.weight.bold} text-text-primary ${typography.fontFamily}`}>{request.staff_name}</p>
                                                    <p className={`text-[10px] text-text-muted ${typography.fontFamily}`}>{request.role_display || 'Staff Member'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className={`${typography.size.sm} ${typography.weight.bold} text-text-primary ${typography.fontFamily}`}>
                                                {formatCurrency(Number(request.current_salary))}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className={`${typography.size.sm} ${typography.weight.bold} text-primary-600 ${typography.fontFamily}`}>
                                                +{formatCurrency(Number(request.requested_amount))}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className={`${typography.size.sm} ${typography.weight.bold} text-primary-700 ${typography.fontFamily}`}>
                                                {formatCurrency((Number(request.current_salary) || 0) + (Number(request.requested_amount) || 0))}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className={`${typography.size.sm} ${typography.weight.bold} text-text-primary ${typography.fontFamily}`}>
                                                {formatDate(request.requested_at)}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6">
                                            {getStatusBadge(request.status)}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-center gap-2">
                                                {request.status === 'Pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleAction(request, 'approve')}
                                                            disabled={actionLoading === request.id}
                                                            className={`px-4 py-2 bg-primary-600 text-white rounded-xl text-xs ${typography.weight.bold} uppercase tracking-widest hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2 ${typography.fontFamily}`}
                                                        >
                                                            {actionLoading === request.id ? (
                                                                <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <Check className="w-3 h-3" />
                                                                    Approve
                                                                </>
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(request, 'reject')}
                                                            disabled={actionLoading === request.id}
                                                            className={`px-4 py-2 bg-danger-600 text-white rounded-xl text-xs ${typography.weight.bold} uppercase tracking-widest hover:bg-danger-700 transition-colors disabled:opacity-50 flex items-center gap-2 ${typography.fontFamily}`}
                                                        >
                                                            {actionLoading === request.id ? (
                                                                <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <X className="w-3 h-3" />
                                                                    Reject
                                                                </>
                                                            )}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredRequests.length === 0 && (
                        <div className="py-20 text-center">
                            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p className={`text-[10px] ${typography.weight.bold} uppercase tracking-[0.4em] text-text-muted ${typography.fontFamily}`}>No Increment Requests Found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Modal */}
            {showActionModal && selectedRequest && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-card rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-border-default animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-border-default">
                            <h3 className={`${typography.size.xl} ${typography.weight.bold} text-text-primary tracking-tight uppercase leading-none mb-2 ${typography.fontFamily}`}>
                                {actionType === 'approve' ? 'Approve' : 'Reject'} Increment Request
                            </h3>
                            <p className={`text-[10px] ${typography.weight.bold} text-text-muted uppercase tracking-widest ${typography.fontFamily}`}>
                                {selectedRequest.staff_name} - {formatCurrency(selectedRequest.requested_amount)}
                            </p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className={`block text-[10px] ${typography.weight.bold} text-text-muted uppercase tracking-widest ml-1 ${typography.fontFamily}`}>
                                    Feedback Reason
                                </label>
                                <textarea
                                    value={feedbackReason}
                                    onChange={(e) => setFeedbackReason(e.target.value)}
                                    rows={4}
                                    placeholder="Provide feedback for this decision..."
                                    className={`w-full px-6 py-5 bg-input border border-border-default rounded-2xl text-[13px] ${typography.weight.semibold} text-text-primary outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 transition-all resize-none shadow-sm placeholder:text-text-muted ${typography.fontFamily}`}
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowActionModal(false)}
                                    className={`flex-1 px-6 py-3 bg-input border border-border-default text-text-primary rounded-xl text-[11px] ${typography.weight.bold} uppercase tracking-widest hover:bg-hover transition-all ${typography.fontFamily}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmAction}
                                    disabled={actionLoading === selectedRequest.id || !feedbackReason.trim()}
                                    className={`flex-1 px-6 py-3 rounded-xl text-[11px] ${typography.weight.bold} uppercase tracking-widest text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${typography.fontFamily}`}
                                    style={{
                                        background: actionType === 'approve'
                                            ? `linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[700]})`
                                            : `linear-gradient(135deg, ${colors.rose[600]}, ${colors.rose[700]})`
                                    }}
                                >
                                    {actionLoading === selectedRequest.id ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            {actionType === 'approve' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                            {actionType === 'approve' ? 'Approve' : 'Reject'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
