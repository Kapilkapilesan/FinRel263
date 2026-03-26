'use client';

import React from 'react';
import { Eye, Trash2 } from 'lucide-react';
import { Loan } from '@/types/loan.types';
import { colors } from '@/themes/colors';

interface LoanTableProps {
    loans: Loan[];
    onView: (loan: Loan) => void;
    onDelete?: (loan: Loan) => void;
}

export function LoanTable({ loans, onView, onDelete }: LoanTableProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active':
            case 'activated':
                return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
            case 'approved':
                return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20';
            case 'awaiting_transfer':
                return 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20';
            case 'Pending':
            case 'pending_1st':
            case 'pending_2nd':
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
            case 'Completed':
                return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20';
            case 'Defaulted':
                return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
            case 'sent_back':
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
            default:
                return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20';
        }
    };

    const formatStatus = (status: string) => {
        if (status === 'approved') return 'Pending for Disburse';
        if (status === 'Active') return 'Disbursed';
        if (status === 'Completed') return 'Completed';
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <div className="bg-card rounded-3xl border border-border-default overflow-hidden transition-colors">
            <div className="bg-table-header border-b border-border-divider px-4 py-3">
                <div className="grid grid-cols-12 gap-4 text-[10px] font-black text-text-muted uppercase tracking-widest">
                    <div className="col-span-1">Contract No</div>
                    <div className="col-span-2">Customer</div>
                    <div className="col-span-1">Branch</div>
                    <div className="col-span-1">Center</div>
                    <div className="col-span-2">Amount</div>
                    <div className="col-span-2">Outstanding</div>
                    <div className="col-span-1">Terms</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-1 text-right">Actions</div>
                </div>
            </div>

            <div className="divide-y divide-border-divider">
                {loans.length > 0 ? (
                    loans.map((loan) => (
                        <div key={loan.id} className="px-4 py-3 hover:bg-hover transition-colors group">
                            <div className="grid grid-cols-12 gap-4 items-center">
                                {/* Contract No */}
                                <div className="col-span-1">
                                    <p className="font-bold text-text-primary text-xs">{loan.contract_number || loan.loan_id}</p>
                                    {(loan.agreement_date || loan.created_at) && (
                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60">
                                            {new Date(loan.agreement_date || loan.created_at).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>

                                {/* Customer */}
                                <div className="col-span-2">
                                    <p className="text-xs font-bold text-text-primary truncate uppercase">{loan.customer?.full_name || 'N/A'}</p>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60">{loan.customer?.customer_code || 'N/A'}</p>
                                </div>

                                {/* Branch */}
                                <div className="col-span-1">
                                    <p className="text-xs font-bold text-text-primary truncate uppercase" title={loan.center?.branch?.branch_name}>{loan.center?.branch?.branch_name || 'N/A'}</p>
                                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest opacity-60 truncate">BR: {loan.center?.branch?.id || '-'}</p>
                                </div>

                                {/* Center */}
                                <div className="col-span-1">
                                    <p className="text-xs font-bold text-text-primary truncate uppercase" title={loan.center?.center_name}>{loan.center?.center_name || 'N/A'}</p>
                                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest opacity-60 truncate">CSU: {loan.center?.CSU_id || '-'}</p>
                                </div>

                                {/* Amount */}
                                <div className="col-span-2">
                                    <p className="text-sm font-bold text-text-primary">LKR {Number(loan.approved_amount).toLocaleString()}</p>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60">{Number(loan.interest_rate)}% interest Rate</p>
                                </div>

                                {/* Outstanding */}
                                <div className="col-span-2">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <p className="text-sm font-bold text-text-primary">LKR {Number(loan.outstanding_amount).toLocaleString()}</p>
                                        <span className="text-[9px] font-black text-text-muted">
                                            {(() => {
                                                const totalPayable = Number(loan.full_amount || (Number(loan.approved_amount) * (1 + Number(loan.interest_rate) / 100)));
                                                if (totalPayable <= 0) return '0%';
                                                const outstanding = Number(loan.outstanding_amount);
                                                return `${Math.round((outstanding / totalPayable) * 100)}%`;
                                            })()}
                                        </span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden border border-border-divider">
                                        <div
                                            className="h-1.5 rounded-full transition-all duration-500"
                                            style={{
                                                backgroundColor: colors.primary[600],
                                                width: (() => {
                                                    const totalPayable = Number(loan.full_amount || (Number(loan.approved_amount) * (1 + Number(loan.interest_rate) / 100)));
                                                    if (totalPayable <= 0) return '0%';
                                                    const outstanding = Number(loan.outstanding_amount);
                                                    return `${(outstanding / totalPayable) * 100}%`;
                                                })()
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Terms */}
                                <div className="col-span-1">
                                    <p className="text-xs font-bold text-text-primary uppercase">{loan.terms} {loan.product?.term_type || 'Periods'}</p>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60">Tenure Logic</p>
                                </div>

                                {/* Status */}
                                <div className="col-span-1">
                                    <div className="flex flex-col gap-1">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${getStatusColor(loan.status)}`}>
                                            {formatStatus(loan.status)}
                                        </span>
                                        {loan.status === 'sent_back' && loan.rejection_reason && (
                                            <span className="text-[9px] text-amber-600 font-bold max-w-[100px] truncate italic" title={loan.rejection_reason}>
                                                "{loan.rejection_reason}"
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="col-span-1 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => onView(loan)}
                                            className="p-2 rounded-xl bg-muted hover:bg-primary-500/10 transition-all group/btn border border-border-divider"
                                            style={{ color: colors.primary[600] }}
                                        >
                                            <Eye className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                                        </button>

                                        {loan.status === 'sent_back' && onDelete && (
                                            <button
                                                onClick={() => onDelete(loan)}
                                                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-all group/btn border border-red-500/20 text-red-600"
                                                title="Delete this sent-back loan"
                                            >
                                                <Trash2 className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="px-6 py-12 text-center">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest italic opacity-50">
                            No matching loan records found
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
