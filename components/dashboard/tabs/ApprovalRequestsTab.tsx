'use client'

import { CheckCircle, Calendar, DollarSign, Users, Edit3, Briefcase, ChevronRight, Hash, Clock, Landmark, UserPlus, FileEdit, ArrowUpRight, Receipt, FileText, Building2, TrendingUp } from 'lucide-react';
import { ApprovedRequest } from '@/types/dashboard.types';
import { colors } from '@/themes/colors';

interface ApprovalRequestsTabProps {
    loanRequests: ApprovedRequest[];
    centerRequests: ApprovedRequest[];
    promotionRequests: ApprovedRequest[];
    incrementRequests: ApprovedRequest[];
    centerChangeRequests: ApprovedRequest[];
    customerEditRequests: ApprovedRequest[];
    leaveRequests: ApprovedRequest[];
    salaryRequests: ApprovedRequest[];
    iouRequests: ApprovedRequest[];
    expenseRequests: ApprovedRequest[];
    investmentRequests: ApprovedRequest[];
    searchQuery: string;
}

export default function ApprovalRequestsTab({
    loanRequests,
    centerRequests,
    promotionRequests,
    incrementRequests,
    centerChangeRequests,
    customerEditRequests,
    leaveRequests,
    salaryRequests,
    iouRequests,
    expenseRequests,
    investmentRequests,
    searchQuery
}: ApprovalRequestsTabProps) {
    const filterReq = (reqs: ApprovedRequest[], keys: (keyof ApprovedRequest)[]) =>
        reqs.filter(req => keys.some(key => req[key]?.toString().toLowerCase().includes(searchQuery.toLowerCase())));

    const sections = [
        {
            title: 'Approved Loan Portfolio',
            icon: DollarSign,
            color: '#16a34a',
            bgColor: 'bg-success-500/10',
            items: filterReq(loanRequests, ['customer_name', 'loan_id']),
            type: 'loan'
        },
        {
            title: 'Authorized Promotions',
            icon: ArrowUpRight,
            color: '#00abeb',
            bgColor: 'bg-primary-500/10',
            items: filterReq(promotionRequests, ['staff_name']),
            type: 'promotion'
        },
        {
            title: 'Center Origin Finalized',
            icon: Landmark,
            color: '#6366f1',
            bgColor: 'bg-indigo-500/10',
            items: filterReq(centerRequests, ['center_name']),
            type: 'center'
        },
        {
            title: 'Salary Adjustments',
            icon: TrendingUpIcon,
            color: '#10b981',
            bgColor: 'bg-emerald-500/10',
            items: filterReq(incrementRequests, ['staff_name']),
            type: 'increment'
        },
        {
            title: 'Salary Payments Approved',
            icon: Receipt,
            color: '#7c3aed',
            bgColor: 'bg-purple-500/10',
            items: filterReq(salaryRequests, ['staff_name']),
            type: 'salary'
        },
        {
            title: 'Customer Migrations',
            icon: UserPlus,
            color: '#d97706',
            bgColor: 'bg-amber-500/10',
            items: filterReq(centerChangeRequests, ['customer_name']),
            type: 'migration'
        },
        {
            title: 'Registry Updates',
            icon: FileEdit,
            color: colors.warning[600] || '#ea580c',
            bgColor: 'bg-orange-500/10',
            items: filterReq(customerEditRequests, ['customer_name']),
            type: 'edit'
        },
        {
            title: 'Approved Leave Requests',
            icon: Briefcase,
            color: '#dc2626',
            bgColor: 'bg-rose-500/10',
            items: filterReq(leaveRequests, ['staff_name']),
            type: 'leave'
        },
        {
            title: 'Staff IOU Approved',
            icon: FileText,
            color: '#9333ea',
            bgColor: 'bg-fuchsia-500/10',
            items: filterReq(iouRequests, ['staff_name']),
            type: 'iou'
        },
        {
            title: 'Branch Expenses Approved',
            icon: Building2,
            color: '#475569',
            bgColor: 'bg-slate-500/10',
            items: filterReq(expenseRequests, ['staff_name']),
            type: 'expense'
        },
        {
            title: 'Investment Approvals',
            icon: TrendingUp,
            color: '#059669',
            bgColor: 'bg-teal-500/10',
            items: filterReq(investmentRequests, ['customer_name']),
            type: 'investment'
        }
    ];

    return (
        <div className="space-y-12 pb-12">
            {sections.map((section, sIdx) => (
                <div key={sIdx} className="animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${sIdx * 100}ms` }}>
                    <div className="flex items-center justify-between mb-6 px-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${section.bgColor} transition-colors`}>
                                <section.icon size={20} color={section.color} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-text-primary tracking-tight uppercase">
                                    {section.title}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">{section.items.length} Finalized Logs</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-px flex-1 mx-6 bg-border-divider hidden md:block" />
                    </div>

                    {section.items.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
                            {section.items.map((request, rIdx) => (
                                <div
                                    key={request.id || rIdx}
                                    className="group relative flex items-center justify-between p-5 bg-card rounded-2xl border border-border-default hover:border-transparent hover:shadow-2xl hover:shadow-success-500/10 transition-all duration-500 cursor-pointer overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: section.color }} />

                                    <div className="flex items-center gap-4 relative z-10">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-md transition-transform group-hover:scale-110 group-hover:rotate-3"
                                            style={{ background: `linear-gradient(135deg, ${section.color}, ${section.color}dd)` }}
                                        >
                                            <CheckCircle size={18} strokeWidth={3} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-text-primary uppercase tracking-tight group-hover:text-primary-600 transition-colors">
                                                {request.customer_name || request.staff_name || request.center_name}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <div className="px-1.5 py-0.5 bg-muted-bg rounded border border-border-divider flex items-center gap-1">
                                                    <Hash className="w-2.5 h-2.5 text-text-muted" />
                                                    <span className="text-[9px] font-black text-text-secondary tracking-widest">
                                                        {request.contract_number || request.loan_id || 'LOGGED'}
                                                    </span>
                                                </div>
                                                <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest opacity-60">
                                                    Authentic Request
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 relative z-10">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">Finalized Date</p>
                                            <p className="text-[12px] font-black text-emerald-600 tabular-nums tracking-tighter">
                                                {new Date(request.approved_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="w-px h-8 bg-border-divider" />
                                        <div className="p-2 rounded-xl bg-muted-bg text-text-muted group-hover:bg-primary-500/10 group-hover:text-primary-600 transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2">
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="mx-2 py-12 flex flex-col items-center justify-center bg-muted-bg/30 rounded-2xl border border-dashed border-border-default">
                            <div className="p-4 bg-card rounded-full shadow-sm mb-3">
                                <CheckCircle size={24} className="text-text-muted opacity-30" />
                            </div>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">No Authorized Logs</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function TrendingUpIcon({ size, color, strokeWidth }: { size: number, color: string, strokeWidth: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
        </svg>
    )
}
