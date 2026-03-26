'use client'

import { CalendarClock } from 'lucide-react';
import { colors } from '@/themes/colors';

export interface DuePayment {
    id: string;
    customer: string;
    customerId: string;
    contractNo: string;
    dueAmount: number;
    outstandingAmount?: number;
    totalPayable?: number;
    center: string;
    centerId: string;
    dueDate: string | null;
    status: 'Pending' | 'Paid' | 'Overdue' | 'Partial';
    next_due_date?: string | null;
    payable_terms?: number;
    is_advance?: boolean;
}

interface DueListTableProps {
    payments: DuePayment[];
    selectedDate: string;
    isLoading?: boolean;
    onPaymentClick?: (payment: DuePayment) => void;
    onExtendClick?: (payment: DuePayment) => void;
}

export function DueListTable({ payments, selectedDate, isLoading, onPaymentClick, onExtendClick }: DueListTableProps) {
    const totalDue = payments.reduce((sum, p) => sum + p.dueAmount, 0);

    const getStatusBadge = (payment: DuePayment) => {
        if (payment.is_advance) {
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm italic">
                    Paid Ahead
                </span>
            );
        }

        const styles = {
            Pending: 'bg-amber-100 text-amber-700 border-amber-200',
            Paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            Overdue: 'bg-rose-100 text-rose-700 border-rose-200',
            Partial: '', // Managed by style
        };
        const statusColors = {
            Partial: { backgroundColor: colors.primary[50], color: colors.primary[700], borderColor: colors.primary[100] }
        };

        return (
            <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[payment.status]}`}
                style={(statusColors as any)[payment.status]}
            >
                {payment.status}
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="bg-card rounded-xl border border-border-default overflow-hidden shadow-sm">
                <div className="bg-table-header border-b border-border-default px-6 py-4">
                    <div className="h-5 bg-muted-bg rounded w-48 animate-pulse" />
                </div>
                <div className="divide-y divide-border-divider">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="px-6 py-4 animate-pulse">
                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-2"><div className="h-4 bg-gray-200 rounded w-full" /></div>
                                <div className="col-span-2"><div className="h-4 bg-gray-200 rounded w-3/4" /></div>
                                <div className="col-span-2"><div className="h-4 bg-gray-200 rounded w-2/3" /></div>
                                <div className="col-span-2"><div className="h-4 bg-gray-200 rounded w-1/2" /></div>
                                <div className="col-span-2"><div className="h-4 bg-gray-200 rounded w-3/4" /></div>
                                <div className="col-span-2"><div className="h-4 bg-gray-200 rounded w-16" /></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-xl border border-border-default overflow-hidden shadow-sm">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-700 to-primary-900 px-6 py-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Payments Due on {new Date(selectedDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </h3>
            </div>

            {/* Table Header */}
            <div className="bg-table-header border-b border-border-default px-6 py-3 hidden md:block">
                <div className="grid grid-cols-12 gap-4 text-xs font-bold text-text-secondary uppercase tracking-wider">
                    <div className="col-span-2">Customer</div>
                    <div className="col-span-2">Contract No</div>
                    <div className="col-span-2">Center</div>
                    <div className="col-span-2 text-right pr-6">Due Amount</div>
                    <div className="col-span-2 pl-4">Due Date</div>
                    <div className="col-span-1 text-center">Status</div>
                    <div className="col-span-1 text-right">Actions</div>
                </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-border-divider">
                {payments.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <div className="w-16 h-16 bg-muted-bg rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p className="text-text-secondary font-medium">No payments due for selected date</p>
                        <p className="text-text-muted text-sm mt-1">Try selecting a different date or center</p>
                    </div>
                ) : (
                    payments.map((payment) => (
                        <div
                            key={payment.id}
                            className="px-6 py-2.5 transition-colors cursor-pointer group hover:bg-table-row-hover"
                            onClick={() => onPaymentClick?.(payment)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = `${colors.primary[50]}80`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '';
                            }}
                        >
                            <div className="grid grid-cols-12 gap-4 items-center">
                                {/* Customer */}
                                <div className="col-span-12 md:col-span-2">
                                    <p
                                        className="font-semibold text-text-primary transition-colors group-hover:text-primary"
                                        style={{ '--group-hover-color': colors.primary[600] } as any}
                                        onMouseEnter={(e) => e.currentTarget.style.color = colors.primary[600]}
                                        onMouseLeave={(e) => e.currentTarget.style.color = ''}
                                    >
                                        {payment.customer.toUpperCase()}
                                    </p>
                                    <p className="text-xs text-text-muted font-mono">{payment.customerId}</p>
                                </div>

                                {/* Contract No */}
                                <div className="col-span-6 md:col-span-2">
                                    <p className="text-sm text-text-primary font-medium">{payment.contractNo}</p>
                                </div>

                                {/* Center */}
                                <div className="col-span-6 md:col-span-2">
                                    <span className="inline-flex items-center px-2 py-0.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 rounded text-xs font-bold uppercase">
                                        {payment.center}
                                    </span>
                                </div>

                                {/* Due Amount */}
                                <div className="col-span-6 md:col-span-2 text-right pr-6">
                                    <p className="text-sm font-bold text-text-primary">
                                        LKR {payment.dueAmount.toLocaleString()}
                                    </p>
                                    {payment.outstandingAmount !== undefined && (
                                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-tight">
                                            Balance: LKR {payment.outstandingAmount.toLocaleString()}
                                        </p>
                                    )}
                                </div>

                                {/* Due Date */}
                                <div className="col-span-6 md:col-span-2 pl-4">
                                    <p className="text-sm text-text-secondary">
                                        {payment.dueDate || <span className="text-text-muted italic">Skipped</span>}
                                    </p>
                                    {payment.is_advance && payment.next_due_date && (
                                        <div className="flex flex-col mt-0.5">
                                            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight">
                                                Resumes: {payment.next_due_date}
                                            </span>
                                            {payment.payable_terms !== undefined && (
                                                <span className="text-[10px] text-text-muted font-medium">
                                                    {payment.payable_terms} Terms Left
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Status */}
                                <div className="col-span-6 md:col-span-1 flex justify-start md:justify-center">
                                    {getStatusBadge(payment)}
                                </div>

                                {/* Actions */}
                                <div className="col-span-6 md:col-span-1 flex justify-end">
                                    {payment.dueDate && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onExtendClick?.(payment);
                                            }}
                                            className="p-1.5 text-text-muted hover:text-primary hover:bg-muted-bg rounded-full transition-colors"
                                            title="Skip Due Date"
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.color = colors.primary[600];
                                                e.currentTarget.style.backgroundColor = colors.primary[50];
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.color = '';
                                                e.currentTarget.style.backgroundColor = '';
                                            }}
                                        >
                                            <CalendarClock className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
