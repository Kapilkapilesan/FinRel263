'use client';

import React from 'react';
import { Printer, Eye } from 'lucide-react';
import { Loan } from '@/types/loan.types';
import { colors } from '@/themes/colors';

interface LoanCardTableProps {
    loans: Loan[];
    onPrint?: (loan: Loan) => void;
    onView?: (loan: Loan) => void;
}

export function LoanCardTable({ loans, onPrint, onView }: LoanCardTableProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active':
            case 'activated':
                return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
            case 'approved':
                return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20';
            case 'Completed':
                return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20';
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
            <div className="bg-table-header border-b border-border-divider px-6 py-4">
                <div className="grid grid-cols-12 gap-4 text-[10px] font-black text-text-muted uppercase tracking-widest">
                    <div className="col-span-2">Contract No</div>
                    <div className="col-span-3">Customer</div>
                    <div className="col-span-3">Branch / Center</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>
            </div>

            <div className="divide-y divide-border-divider">
                {loans.length > 0 ? (
                    loans.map((loan) => (
                        <div key={loan.id} className="px-6 py-4 hover:bg-hover transition-colors group">
                            <div className="grid grid-cols-12 gap-4 items-center">
                                {/* Contract No */}
                                <div className="col-span-2">
                                    <p className="font-bold text-text-primary text-sm">{loan.contract_number || loan.loan_id}</p>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60">
                                        ID: {loan.loan_id}
                                    </p>
                                </div>

                                {/* Customer */}
                                <div className="col-span-3">
                                    <p className="text-sm font-bold text-text-primary truncate">{loan.customer?.full_name || 'N/A'}</p>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60">{loan.customer?.customer_id || 'N/A'}</p>
                                </div>

                                {/* Branch / Center */}
                                <div className="col-span-3">
                                    <p className="text-sm font-bold text-text-primary">
                                        {(loan as any).center?.branch?.branch_name || 'N/A'}
                                    </p>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60">
                                        {(loan as any).center?.center_name || 'N/A'} ({(loan as any).center?.CSU_id || ''})
                                    </p>
                                </div>

                                {/* Status */}
                                <div className="col-span-2">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${getStatusColor(loan.status)}`}>
                                        {formatStatus(loan.status)}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="col-span-2 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => onPrint?.(loan)}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-500 transition-all shadow-lg shadow-primary-500/20 text-[10px] font-black uppercase tracking-widest"
                                        >
                                            <Printer className="w-4 h-4" />
                                            Print
                                        </button>
                                        <button
                                            onClick={() => onView?.(loan)}
                                            className="p-2 rounded-xl bg-muted hover:bg-hover transition-all border border-border-divider text-text-muted hover:text-text-primary"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="px-6 py-12 text-center">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest italic opacity-50">
                            No loans available for card printing
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
