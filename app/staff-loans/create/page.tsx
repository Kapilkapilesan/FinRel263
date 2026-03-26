"use client";

import React, { useEffect, useState } from 'react';
import { staffLoanService } from '../../../services/staffLoan.service';
import { staffService } from '../../../services/staff.service';
import { toast } from 'react-toastify';
import { useTheme } from '../../../contexts/ThemeContext';
import {
    Users,
    FileText,
    Calendar,
    DollarSign,
    UserCheck,
    Clock,
    CheckCircle2,
    XCircle,
    ArrowUpRight,
    Landmark,
    ShieldCheck,
    PenTool,
    Target,
    Zap,
    Hash,
    Sparkles,
    Briefcase,
    Activity,
    ChevronRight
} from 'lucide-react';
import BMSLoader from '../../../components/common/BMSLoader';
import { SearchableSelect } from '../../../components/common/SearchableSelect';
import { colors } from '@/themes/colors';

export default function CreateStaffLoanPage() {
    const [loading, setLoading] = useState(true);
    const [staffDetails, setStaffDetails] = useState<any>(null);
    const [witnessCandidates, setWitnessCandidates] = useState<any[]>([]);
    const [loanProducts, setLoanProducts] = useState<any[]>([]);
    const [myLoans, setMyLoans] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        loan_product_id: '',
        purpose: '',
        loan_duration: '',
        amount: '',
        witness_staff_id: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const { isDarkMode } = useTheme();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [myDetails, witnesses, productsResponse, loansResponse] = await Promise.all([
                staffLoanService.getMyDetails().catch(e => ({ status: 'error', message: e.message })),
                staffService.getStaffDropdownList().catch(() => []),
                staffLoanService.getAvailableProducts().catch(() => ({ status: 'error', data: [] })),
                staffLoanService.getAll({ scope: 'mine' }).catch(() => ({ status: 'error', data: { data: [] } }))
            ]);

            if (myDetails.status === 'success') {
                setStaffDetails(myDetails.data);
            }

            const products = productsResponse.status === 'success' ? productsResponse.data : [];
            setLoanProducts(products);

            // Filter out logged-in user from witness candidates using myDetails.data directly
            const myStaffId = myDetails.status === 'success' ? myDetails.data?.staff_id : null;
            setWitnessCandidates(Array.isArray(witnesses) ? witnesses.filter((w: any) => w.staff_id !== myStaffId) : []);
            if (loansResponse.status === 'success') {
                setMyLoans(loansResponse.data.data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load details");
        } finally {
            setLoading(false);
        }
    };

    const handleProductChange = (productId: string) => {
        const product = loanProducts.find(p => p.id.toString() === productId);
        setFormData({
            ...formData,
            loan_product_id: productId,
            loan_duration: product ? product.loan_term.toString() : '',
            amount: ''
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const result = await staffLoanService.create({
                loan_product_id: parseInt(formData.loan_product_id),
                purpose: formData.purpose,
                loan_duration: parseInt(formData.loan_duration),
                amount: parseFloat(formData.amount),
                witness_staff_id: formData.witness_staff_id
            });

            if (result.status === 'success') {
                toast.success("Staff Loan Request Submitted Successfully");
                setFormData({ loan_product_id: '', purpose: '', loan_duration: '', amount: '', witness_staff_id: '' });
                const loansResponse = await staffLoanService.getAll({ scope: 'mine' });
                if (loansResponse.status === 'success') {
                    setMyLoans(loansResponse.data.data);
                }
            } else {
                toast.error(result.message || "Failed to submit request");
            }

        } catch (error: any) {
            toast.error(error.message || "Failed to submit request");
        } finally {
            setSubmitting(false);
        }
    };

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
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100/50 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20">
                        <ShieldCheck className="w-3.5 h-3.5" /> Disbursed
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

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-20 bg-app-background">
                <BMSLoader message="Loading Loan Details..." size="small" />
            </div>
        );
    }

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
                    <div className="absolute top-0 left-0 w-1.5 h-full" style={{ background: isDarkMode ? `linear-gradient(to bottom, ${colors.primary[600]}, ${colors.indigo[900]})` : colors.primary[500] }} />

                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0"
                            style={{ background: isDarkMode ? `linear-gradient(135deg, ${colors.primary[600]}, ${colors.indigo[900]})` : `linear-gradient(135deg, ${colors.primary[500]}, ${colors.primary[700]})` }}>
                            <PenTool className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-text-primary tracking-tight uppercase leading-none mb-1">
                                Staff Loan Application
                            </h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest flex items-center gap-1.5">
                                    <Landmark className="w-3.5 h-3.5 text-primary-500" />
                                    Financial Services
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* <div className="flex items-center gap-3">
                        <div className="px-6 py-3.5 bg-input border border-border-default rounded-xl flex items-center gap-3">
                            <Activity className="w-4 h-4 text-primary-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Active Profile Verified</span>
                        </div>
                    </div> */}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left: Applicant Overview */}
                    <div className="lg:col-span-12 xl:col-span-4 space-y-8">
                        <div className="bg-card/80 backdrop-blur-xl rounded-[2.5rem] border border-border-default shadow-xl overflow-hidden group">
                            <div className={`p-8 text-white relative ${isDarkMode ? 'bg-gradient-to-br from-primary-600 to-primary-900' : 'bg-gradient-to-br from-primary-600 to-primary-800'}`}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12 blur-2xl" />
                                <div className="relative z-10">
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60 mb-1">Staff Information</p>
                                    <h2 className="text-2xl font-black uppercase tracking-tight truncate">{staffDetails?.full_name}</h2>
                                    <div className="flex items-center gap-2 mt-4">
                                        <span className="px-3 py-1 bg-white/20 rounded-lg text-[10px] font-black tracking-widest uppercase">{staffDetails?.staff_id}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                {[
                                    { label: 'NIC Number', value: staffDetails?.nic, icon: ShieldCheck },
                                    { label: 'Branch', value: staffDetails?.branch, icon: Landmark },
                                    { label: 'Contact Number', value: staffDetails?.contact_no, icon: Sparkles },
                                    { label: 'Permanent Address', value: staffDetails?.address, icon: Hash, full: true }
                                ].map((detail, idx) => (
                                    <div key={idx} className={`space-y-1.5 ${detail.full ? 'border-t border-border-divider pt-4 mt-2' : ''}`}>
                                        <p className="text-[9px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                                            <detail.icon size={12} className="text-primary-500" /> {detail.label}
                                        </p>
                                        <p className="text-[11px] font-black text-text-secondary uppercase leading-relaxed">{detail.value || 'N/A'}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* <div className={`${isDarkMode ? 'bg-indigo-600' : 'bg-primary-600'} rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden group`}>
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                <Zap size={80} strokeWidth={1} />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-lg font-black uppercase tracking-tight mb-2">Important Notice</h3>
                                <p className={`text-[11px] font-bold ${isDarkMode ? 'text-indigo-100' : 'text-blue-50'} leading-relaxed uppercase opacity-80`}>
                                    Every loan request is subject to administrative review and approval by the management.
                                </p>
                            </div>
                        </div> */}
                    </div>

                    {/* Right: Submission Terminal */}
                    <div className="lg:col-span-12 xl:col-span-8 bg-card/80 backdrop-blur-xl rounded-[2.5rem] border border-border-default shadow-xl p-10">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-input rounded-2xl flex items-center justify-center text-primary-600 border border-border-default">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-text-primary uppercase tracking-tight leading-none mb-1">Loan Request Form</h2>
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Enter loan details below</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Loan Product *</label>
                                    <div className="relative">
                                        <Landmark className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted z-10 pointer-events-none" />
                                        <SearchableSelect
                                            options={loanProducts.map((p: any) => ({
                                                id: p.id.toString(),
                                                label: p.product_name,
                                                subLabel: `[${p.product_code}]`
                                            }))}
                                            value={formData.loan_product_id}
                                            onChange={(val) => handleProductChange(val as string || '')}
                                            placeholder="Select Service Class"
                                            className="[&>div:first-child]:pl-12 [&>div:first-child]:!py-3"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Witness *</label>
                                    <div className="relative">
                                        <Users className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted z-10 pointer-events-none" />
                                        <SearchableSelect
                                            options={witnessCandidates.map((staff: any) => ({
                                                id: staff.staff_id,
                                                label: staff.full_name || staff.name,
                                                subLabel: `[${staff.staff_id}]`
                                            }))}
                                            value={formData.witness_staff_id}
                                            onChange={(val) => setFormData({ ...formData, witness_staff_id: val as string || '' })}
                                            placeholder="Select Personnel Witness"
                                            className="[&>div:first-child]:pl-12 [&>div:first-child]:!py-3"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Loan Amount (LKR) *</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                        <input
                                            type="number"
                                            required
                                            min={loanProducts.find(p => p.id.toString() === formData.loan_product_id)?.min_amount || loanProducts.find(p => p.id.toString() === formData.loan_product_id)?.loan_amount || 1}
                                            max={loanProducts.find(p => p.id.toString() === formData.loan_product_id)?.max_amount || loanProducts.find(p => p.id.toString() === formData.loan_product_id)?.loan_limited_amount || undefined}
                                            step="0.01"
                                            placeholder="Enter Capital Sum..."
                                            value={formData.amount}
                                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                            className="w-full pl-12 pr-6 py-3 bg-input border border-border-default rounded-2xl text-[14px] font-black tracking-tight text-text-primary outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 transition-all"
                                        />
                                        {formData.loan_product_id && (
                                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-black text-text-muted uppercase tracking-widest">
                                                MAX: {Number(loanProducts.find(p => p.id.toString() === formData.loan_product_id)?.max_amount || loanProducts.find(p => p.id.toString() === formData.loan_product_id)?.loan_limited_amount || 0).toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Repayment Period (Months) *</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                        <input
                                            type="number"
                                            required
                                            readOnly
                                            value={formData.loan_duration}
                                            className="w-full pl-12 pr-6 py-3 bg-input/50 border border-border-default/50 rounded-2xl text-[14px] font-black tracking-tight text-text-muted outline-none cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div className="col-span-1 md:col-span-2 space-y-3">
                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Purpose of Loan *</label>
                                    <textarea
                                        required
                                        value={formData.purpose}
                                        onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                                        placeholder="Enter reason for loan request..."
                                        className="w-full px-6 py-3 bg-input border border-border-default rounded-2xl text-[13px] font-semibold text-text-primary outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 transition-all resize-none shadow-inner min-h-[80px] placeholder:text-text-muted"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group/btn relative overflow-hidden ${isDarkMode ? 'bg-gray-900 text-white hover:bg-black' : 'bg-primary-600 text-white hover:bg-primary-700'}`}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-r from-primary-600 to-indigo-600 opacity-0 group-hover/btn:opacity-100 transition-opacity ${!isDarkMode && 'hidden'}`} />
                                <span className="relative z-10 flex items-center gap-3">
                                    {submitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Submit Loan Application
                                            <ArrowUpRight size={18} />
                                        </>
                                    )}
                                </span>
                            </button>
                        </form>
                    </div>

                    {/* Transaction Registry */}
                    <div className="lg:col-span-12 bg-card/70 backdrop-blur-xl rounded-[2.5rem] border border-border-default shadow-xl overflow-hidden mt-8">
                        <div className="p-8 border-b border-border-divider flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-text-primary uppercase tracking-tight mb-1">My Loan History</h3>
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Previous loan requests</p>
                            </div>
                            <div className="w-10 h-10 bg-input rounded-xl flex items-center justify-center text-text-muted border border-border-default">
                                <Activity size={18} />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-table-header">
                                    <tr className="border-b border-border-default">
                                        <th className="pl-10 pr-4 py-6 text-[9px] font-black text-text-muted uppercase tracking-widest">Date</th>
                                        <th className="px-4 py-6 text-[9px] font-black text-text-muted uppercase tracking-widest">Purpose</th>
                                        <th className="px-4 py-6 text-[9px] font-black text-text-muted uppercase tracking-widest">Amount</th>
                                        <th className="px-4 py-6 text-[9px] font-black text-text-muted uppercase tracking-widest">Period</th>
                                        <th className="px-4 py-6 text-[9px] font-black text-text-muted uppercase tracking-widest">Witness</th>
                                        <th className="pr-10 pl-4 py-6 text-right text-[9px] font-black text-text-muted uppercase tracking-widest">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-divider">
                                    {myLoans.map((loan) => (
                                        <tr key={loan.id} className="group hover:bg-hover transition-colors">
                                            <td className="pl-10 pr-4 py-6">
                                                <div className="flex items-center gap-2 text-text-muted">
                                                    <Calendar size={12} strokeWidth={2.5} />
                                                    <span className="text-[10px] font-black tabular-nums">{new Date(loan.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-6">
                                                <p className="text-[11px] font-black text-text-primary uppercase tracking-tight truncate max-w-[250px]" title={loan.purpose}>
                                                    {loan.purpose}
                                                </p>
                                            </td>
                                            <td className="px-4 py-6">
                                                <p className="text-[13px] font-black text-text-primary tabular-nums tracking-tighter">{formatCurrency(Number(loan.amount))}</p>
                                            </td>
                                            <td className="px-4 py-6">
                                                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{loan.loan_duration} Months</p>
                                            </td>
                                            <td className="px-4 py-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 bg-input rounded-lg flex items-center justify-center text-[9px] font-black text-text-muted">W</div>
                                                    <p className="text-[10px] font-black text-text-secondary uppercase">{loan.witness?.full_name || 'N/A'}</p>
                                                </div>
                                            </td>
                                            <td className="pr-10 pl-4 py-6 text-right">
                                                <div className="flex flex-col items-end gap-1.5">
                                                    {getStatusBadge(loan.status)}
                                                    {loan.rejection_reason && loan.status === 'rejected' && (
                                                        <p className="text-[8px] font-bold text-rose-400 uppercase max-w-[150px] truncate" title={loan.rejection_reason}>
                                                            REF: {loan.rejection_reason}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {myLoans.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-24 text-center opacity-30">
                                                <Target size={32} className="mx-auto mb-3" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.4em]">No History Found</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
