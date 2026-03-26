'use client';

import React, { useState, useEffect } from 'react';
import {
    FileText,
    Plus,
    Search,
    Clock,
    CheckCircle,
    XCircle,
    DollarSign,
    User,
    Calendar,
    ArrowRight,
    Loader2,
    ListChecks,
    DownloadCloud
} from 'lucide-react';
import { staffIouService, StaffIouRequest, StaffExpenseCategory } from '@/services/staffIou.service';
import { authService } from '@/services/auth.service';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const StaffRequestPage: React.FC = () => {
    const [requests, setRequests] = useState<StaffIouRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Form state
    type RequestTab = 'iou' | 'reimbursement' | 'fixed_category';
    const [requestType, setRequestType] = useState<RequestTab>('iou');
    const [categories, setCategories] = useState<StaffExpenseCategory[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');

    const fetchCategories = async () => {
        try {
            const data = await staffIouService.getCategories();
            setCategories(data);
        } catch (err: any) {
            console.error(err);
        }
    };

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const data = await staffIouService.getMyRequests();
            setRequests(data);
        } catch (err: any) {
            toast.error(err.message || 'Failed to fetch requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            fetchRequests();
            fetchCategories();

            // Fetch current profile to get latest details including branch and contact info
            try {
                const profile = await authService.getProfile();
                if (profile) {
                    setUser(profile);
                } else {
                    setUser(authService.getCurrentUser());
                }
            } catch (err) {
                console.error('Failed to fetch profile', err);
                setUser(authService.getCurrentUser());
            }
        };

        fetchInitialData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let finalAmount = amount;
        let finalCategoryId = null;

        if (requestType === 'fixed_category') {
            if (!selectedCategoryId) {
                toast.error('Please select a category');
                return;
            }
            const cat = categories.find(c => c.id === Number(selectedCategoryId));
            if (!cat) return;
            finalAmount = cat.fixed_amount.toString();
            finalCategoryId = cat.id;
        }

        if (!finalAmount || !reason) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            setIsSubmitting(true);
            await staffIouService.submitRequest({
                amount: parseFloat(finalAmount),
                reason,
                request_type: requestType,
                category_id: finalCategoryId
            });
            toast.success('Fund request submitted successfully');
            setAmount('');
            setReason('');
            setSelectedCategoryId('');
            setShowForm(false);
            fetchRequests();
        } catch (err: any) {
            toast.error(err.message || 'Failed to submit request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'Pending').length,
        disbursed: requests.filter(r => r.status === 'Paid').length,
    };

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500 shadow-inner">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-text-primary tracking-tight">STAFF REQUEST</h1>
                        <p className="text-sm text-text-muted font-medium">Create and track your fund requests</p>
                    </div>
                </div>

                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 transition-all shadow-lg shadow-primary-900/20 active:scale-95"
                    >
                        <Plus size={18} />
                        New Request
                    </button>
                )}
            </div>

            {/* Stats Overview */}
            {!showForm && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: 'Total Requests', value: stats.total, icon: <FileText className="text-blue-500" />, bg: 'bg-blue-500/10' },
                        { label: 'Pending', value: stats.pending, icon: <Clock className="text-sky-500" />, bg: 'bg-sky-500/10' },
                        { label: 'Disbursed', value: stats.disbursed, icon: <CheckCircle className="text-blue-500" />, bg: 'bg-blue-500/10' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-card rounded-3xl border border-border-default p-6 shadow-sm flex items-center gap-5 group hover:border-primary-500/50 transition-all">
                            <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner`}>
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">{stat.label}</p>
                                <p className="text-2xl font-black text-text-primary lh-none">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Request Form */}
            {showForm && (
                <div className="bg-card rounded-[2rem] border border-border-default p-8 shadow-2xl animate-in slide-in-from-top-4 duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />

                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                                <Plus size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-text-primary">Submit New Request</h2>
                        </div>
                        <button
                            onClick={() => setShowForm(false)}
                            className="p-2 rounded-lg hover:bg-hover text-text-muted transition-colors"
                        >
                            <XCircle size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                        {/* Tabs */}
                        <div className="flex flex-wrap items-center gap-4 bg-app-background/50 p-2 rounded-2xl border border-border-default">
                            <button
                                type="button"
                                onClick={() => setRequestType('iou')}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${requestType === 'iou' ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' : 'text-text-muted hover:bg-hover hover:text-text-primary'}`}
                            >
                                <DollarSign size={16} />
                                Cash Request (IOU)
                            </button>
                            <button
                                type="button"
                                onClick={() => setRequestType('reimbursement')}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${requestType === 'reimbursement' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-text-muted hover:bg-hover hover:text-text-primary'}`}
                            >
                                <DownloadCloud size={16} />
                                Staff Deposit / Reimbursement
                            </button>
                            <button
                                type="button"
                                onClick={() => setRequestType('fixed_category')}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${requestType === 'fixed_category' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-text-muted hover:bg-hover hover:text-text-primary'}`}
                            >
                                <ListChecks size={16} />
                                Fixed Category Payment
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left Col: Employee Details */}
                            <div className="bg-app-background/50 rounded-2xl p-6 border border-border-default flex flex-col gap-6">
                                <h3 className="text-xs font-black text-text-muted uppercase tracking-widest border-b border-border-default pb-3">Employee Details</h3>

                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-border-default/50 flex items-center justify-center text-text-primary border border-border-default">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-text-primary">{user?.full_name || user?.display_name || user?.name || user?.user_name || 'Loading...'}</p>
                                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-tighter">ID: {user?.user_name || user?.staff_id || '---'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[10px] font-bold text-text-muted uppercase">Branch</p>
                                        <p className="text-xs font-bold text-text-primary">{user?.branch?.branch_name || user?.branch?.name || user?.staff?.branch?.branch_name || 'Not Assigned'}</p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[10px] font-bold text-text-muted uppercase">Phone Number</p>
                                        <p className="text-xs font-bold text-text-primary">{user?.phone || user?.staff_detail?.phone || user?.staff?.phone || 'Not Available'}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1 mt-auto">
                                    <p className="text-[10px] font-bold text-text-muted uppercase">Request Date</p>
                                    <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                                        <Calendar size={14} className="text-primary-500" />
                                        {format(new Date(), 'MM/dd/yyyy')}
                                    </div>
                                </div>
                            </div>

                            {/* Right Col: Fields */}
                            <div className="flex flex-col gap-6">

                                {requestType === 'fixed_category' && (
                                    <div className="flex flex-col gap-2 group animate-in slide-in-from-top-2">
                                        <label className="text-xs font-black text-text-muted uppercase tracking-wider group-focus-within:text-indigo-500 transition-colors">Select Category *</label>
                                        <div className="relative">
                                            <ListChecks size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-indigo-500 transition-colors" />
                                            <select
                                                value={selectedCategoryId}
                                                onChange={(e) => setSelectedCategoryId(Number(e.target.value) || '')}
                                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-app-background border border-border-default text-text-primary text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none"
                                            >
                                                <option value="" disabled>Choose a fixed expense category...</option>
                                                {categories.map((cat) => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.name} (LKR {Number(cat.fixed_amount).toLocaleString()})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col gap-2 group">
                                    <label className={`text-xs font-black text-text-muted uppercase tracking-wider transition-colors ${requestType === 'fixed_category' ? 'group-focus-within:text-indigo-500' : requestType === 'reimbursement' ? 'group-focus-within:text-sky-500' : 'group-focus-within:text-primary-500'}`}>Amount (LKR) *</label>
                                    <div className="relative">
                                        <DollarSign size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors ${requestType === 'fixed_category' ? 'group-focus-within:text-indigo-500' : requestType === 'reimbursement' ? 'group-focus-within:text-sky-500' : 'group-focus-within:text-primary-500'}`} />
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={requestType === 'fixed_category' ? (selectedCategoryId ? categories.find(c => c.id === Number(selectedCategoryId))?.fixed_amount || '' : '') : amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            disabled={requestType === 'fixed_category'}
                                            placeholder="0.00"
                                            className={`w-full pl-12 pr-4 py-4 rounded-2xl bg-app-background border border-border-default text-text-primary text-lg font-black focus:outline-none transition-all placeholder:text-text-muted/20 ${requestType === 'fixed_category' ? 'opacity-70 cursor-not-allowed bg-muted/10 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10' : requestType === 'reimbursement' ? 'focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10' : 'focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10'}`}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 group">
                                    <label className={`text-xs font-black text-text-muted uppercase tracking-wider transition-colors ${requestType === 'fixed_category' ? 'group-focus-within:text-indigo-500' : requestType === 'reimbursement' ? 'group-focus-within:text-sky-500' : 'group-focus-within:text-primary-500'}`}>Reason / Purpose *</label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder={requestType === 'reimbursement' ? "Receipt details or short memo..." : "Describe why you need these funds..."}
                                        rows={4}
                                        className={`w-full px-4 py-4 rounded-2xl bg-app-background border border-border-default text-text-primary text-sm font-medium focus:outline-none transition-all placeholder:text-text-muted/20 resize-none ${requestType === 'fixed_category' ? 'focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10' : requestType === 'reimbursement' ? 'focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10' : 'focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10'}`}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end items-center gap-4 pt-4 border-t border-border-default">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-8 py-3 rounded-xl text-text-muted font-bold text-sm hover:bg-hover transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`px-10 py-3 rounded-xl text-white font-bold text-sm transition-all shadow-xl disabled:opacity-50 flex items-center gap-2 ${requestType === 'fixed_category' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-900/20' : requestType === 'reimbursement' ? 'bg-sky-600 hover:bg-sky-700 shadow-sky-900/20' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-900/20'}`}
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : null}
                                Submit {requestType === 'reimbursement' ? 'Deposit' : 'Request'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List Table */}
            {!showForm && (
                <div className="bg-card rounded-3xl border border-border-default shadow-xl overflow-hidden relative">
                    <div className="px-8 py-6 border-b border-border-default bg-app-background/30 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-black text-text-primary">Recent Requests</h3>
                            <p className="text-xs text-text-muted font-medium mt-0.5">View and track your submitted requests</p>
                        </div>
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                                type="text"
                                placeholder="Search by ID or reason..."
                                className="pl-10 pr-4 py-2 rounded-xl bg-card border border-border-default text-text-primary text-xs focus:outline-none focus:border-primary-500 transition-all w-64"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border-default bg-table-header">
                                    <th className="px-8 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Date</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">ID</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Employee Details</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Type</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Reason</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest text-right">Amount</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <Loader2 className="animate-spin text-primary-500" size={32} />
                                                <p className="text-text-muted text-xs font-bold uppercase animate-pulse">Fetching your requests...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : requests.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-40">
                                                <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center">
                                                    <FileText size={40} />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <p className="text-text-primary font-black text-lg lh-none">No Requests Found</p>
                                                    <p className="text-text-muted text-xs font-bold uppercase">You haven't submitted any fund requests yet</p>
                                                </div>
                                                <button
                                                    onClick={() => setShowForm(true)}
                                                    className="mt-2 flex items-center gap-2 text-primary-500 font-bold text-xs uppercase hover:underline"
                                                >
                                                    Create your first request <ArrowRight size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    requests.map((req) => (
                                        <tr key={req.id} className="border-b border-border-default hover:bg-hover active:bg-hover/50 transition-colors group cursor-default">
                                            <td className="px-8 py-5">
                                                <span className="text-xs font-black text-text-primary">{format(new Date(req.created_at), 'yyyy-MM-dd')}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-xs font-black text-text-primary group-hover:text-primary-500 transition-colors">{req.request_id}</span>
                                            </td>
                                            <td className="px-8 py-5 text-xs">
                                                <div className="flex flex-col">
                                                    <span className="text-text-primary font-black">{req.user?.name || req.user?.user_name}</span>
                                                    <span className="text-[10px] text-text-muted font-bold">{req.branch?.branch_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${req.request_type === 'fixed_category' ? 'bg-sky-500/10 text-sky-500' : req.request_type === 'reimbursement' ? 'bg-blue-500/10 text-blue-500' : 'bg-primary-500/10 text-primary-500'}`}>
                                                    {req.request_type === 'reimbursement' ? 'Reimbursement' : req.request_type === 'fixed_category' ? 'Fixed Category' : 'IOU Request'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-xs font-medium text-text-secondary line-clamp-1 max-w-[200px]">
                                                    {req.category ? `[${req.category.name}] ` : ''}
                                                    {req.reason}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-text-primary">LKR {Number(req.amount).toLocaleString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex justify-center">
                                                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg shadow-sm ${req.status === 'Paid' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                                        req.status === 'Approved' ? 'bg-primary-500/10 text-primary-500 border border-primary-500/20' :
                                                            req.status === 'Rejected' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                                                'bg-sky-500/10 text-sky-500 border border-sky-500/20'
                                                        }`}>
                                                        {req.status === 'Paid' ? 'DISBURSED' : req.status}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffRequestPage;
