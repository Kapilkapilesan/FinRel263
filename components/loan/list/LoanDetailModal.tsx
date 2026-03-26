'use client';

import React from 'react';
import { Loan } from '@/types/loan.types';
import { authService } from '@/services/auth.service';
import { LoanPaymentHistory } from '@/components/loan/list/LoanPaymentHistory';
import { LoanCardPrint } from '@/components/loan/LoanCardPrint';

interface LoanDetailModalProps {
    loan: Loan;
    onClose: () => void;
    initialTab?: 'overview' | 'payments' | 'card';
}

export function LoanDetailModal({ loan, onClose, initialTab = 'overview' }: LoanDetailModalProps) {
    const [activeTab, setActiveTab] = React.useState<'overview' | 'payments' | 'card'>(initialTab);
    // Permission-based edit control: allow if user has loans.edit OR (legacy FO pattern)
    const canEditLoan =
        authService.hasPermission('loans.edit') ||
        (authService.hasPermission('loans.create') && !authService.hasPermission('loans.approve'));

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
            case 'pending':
            case 'pending_1st':
            case 'pending_2nd':
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
            case 'completed':
                return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
            case 'defaulted':
                return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200';
            case 'sent_back':
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
            default:
                return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
        }
    };

    const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
        <div className="space-y-6">
            <h3 className="text-[10px] font-black text-text-muted underline decoration-primary-500/30 underline-offset-8 uppercase tracking-[0.2em]">
                {title}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {children}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10 text-text-primary overflow-hidden">
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-md"
                onClick={onClose}
            />
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative w-full max-w-5xl bg-card rounded-[2.5rem] shadow-2xl border border-border-default/50 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col h-[85vh] transition-all">
                {/* Header */}
                <div className="p-10 pb-8 border-b border-border-divider bg-card/50 backdrop-blur-xl sticky top-0 z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-primary-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary-500/30 text-white text-2xl font-black rotate-[-5deg] group-hover:rotate-0 transition-transform">
                                LN
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-text-primary tracking-tighter uppercase leading-none">Institutional Asset</h2>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-3">
                                    <div className="flex items-center gap-3">
                                        <div className="px-3 py-1 bg-primary-500/10 rounded-xl border border-primary-500/20">
                                            <span className="text-[11px] text-primary-600 font-black uppercase tracking-widest whitespace-nowrap">
                                                ID: {loan.contract_number || loan.loan_id}
                                            </span>
                                        </div>
                                        <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${getStatusColor(loan.status)}`}>
                                            {loan.status?.replace('_', ' ')}
                                        </span>
                                    </div>
                                    {loan.contract_number && (
                                        <span className="text-[10px] text-text-muted font-black uppercase opacity-40 tracking-widest">System Link: {loan.loan_id}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="flex items-center bg-muted-bg/50 p-1.5 rounded-[1.5rem] border border-border-divider/50 self-start md:self-center transition-all shadow-inner">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'overview' ? 'bg-card text-primary-600 shadow-2xl shadow-primary-500/20 border border-border-divider/50' : 'text-text-muted hover:text-text-primary'}`}
                            >
                                Overview
                            </button>
                            {['active', 'completed', 'defaulted'].includes(loan.status?.toLowerCase() || '') && (
                                <>
                                    <button
                                        onClick={() => setActiveTab('payments')}
                                        className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'payments' ? 'bg-card text-primary-600 shadow-2xl shadow-primary-500/20 border border-border-divider/50' : 'text-text-muted hover:text-text-primary'}`}
                                    >
                                        Repayments
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('card')}
                                        className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'card' ? 'bg-card text-primary-600 shadow-2xl shadow-primary-500/20 border border-border-divider/50' : 'text-text-muted hover:text-text-primary'}`}
                                    >
                                        Loan Card
                                    </button>
                                </>
                            )}
                        </div>

                        <button
                            onClick={onClose}
                            className="hidden md:flex w-14 h-14 items-center justify-center rounded-[1.5rem] bg-muted-bg/50 text-text-muted hover:bg-rose-500/10 hover:text-rose-500 transition-all active:scale-90 border border-border-divider shadow-sm"
                        >
                            <span className="text-3xl font-black">&times;</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-card transition-colors">
                    {activeTab === 'overview' && (
                        <div className="p-8 space-y-12">
                            {/* Sent Back Alert */}
                            {loan.status === 'sent_back' && loan.rejection_reason && (
                                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 flex items-start gap-5 shadow-sm">
                                    <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600 shrink-0 border border-amber-500/20">
                                        <span className="font-black text-xl">!</span>
                                    </div>
                                    <div>
                                        <p className="font-black text-amber-600 text-[10px] uppercase tracking-widest mb-1">Attention Required</p>
                                        <p className="text-sm font-bold text-text-secondary leading-relaxed italic">
                                            "{loan.rejection_reason}"
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Section: Identity & Context */}
                            <Section title="Institutional Context">
                                <DetailItem label="Center" value={loan.center?.center_name || 'N/A'} />
                                <DetailItem label="Group" value={loan.group?.group_name || 'N/A'} />
                                <DetailItem label="Branch" value={loan.center?.branch?.branch_name || 'N/A'} />
                                <DetailItem label="Loan Product" value={loan.product?.product_name || 'N/A'} />
                                <DetailItem label="Field Officer" value={loan.staff?.full_name || loan.staff?.user_name || 'System Assigned'} />
                            </Section>

                            {/* Section: Customer Profile */}
                            <Section title="Borrower Profile">
                                <DetailItem label="Full Name" value={loan.customer?.full_name} />
                                <DetailItem label="Identity (NIC)" value={loan.customer?.customer_code} />
                                <DetailItem label="Current Outstanding" value={`LKR ${Number(loan.outstanding_amount).toLocaleString()}`} highlight />
                            </Section>

                            {/* Section: Financials */}
                            <Section title="Financial Breakdown">
                                <DetailItem label="Requested Amount" value={`LKR ${Number(loan.request_amount || 0).toLocaleString()}`} />
                                <DetailItem label="Approved Amount" value={`LKR ${Number(loan.approved_amount).toLocaleString()}`} highlight={false} />
                                <DetailItem label="Interest Rate" value={`${Number(loan.interest_rate)}%`} />
                                <DetailItem label="Processing Fee" value={`LKR ${Number(loan.service_charge || 0).toLocaleString()}`} />
                                <DetailItem label="Documentation Fee" value={`LKR ${Number(loan.document_charge || 0).toLocaleString()}`} />
                                <DetailItem label="Expected Installment" value={loan.rentel ? `LKR ${Number(loan.rentel).toLocaleString()}` : 'Not Calculated'} />
                            </Section>

                            {/* Section: Schedule */}
                            <Section title="Repayment Schedule">
                                <DetailItem label="Tenure" value={`${loan.terms} periods (${loan.term_type || 'Monthly'})`} />
                                <DetailItem
                                    label="Agreement Date"
                                    value={loan.agreement_date ? new Date(loan.agreement_date).toLocaleDateString() : 'N/A'}
                                />
                                <DetailItem
                                    label="Maturity Date"
                                    value={loan.end_term ? new Date(loan.end_term).toLocaleDateString() : 'N/A'}
                                />
                            </Section>

                            {/* Section: Guarantees */}
                            <Section title="Securities & Guarantees">
                                <DetailItem label="Guarantor 01" value={loan.g1_details?.name || 'N/A'} subValue={loan.g1_details?.nic} />
                                <DetailItem label="Guarantor 02" value={loan.g2_details?.name || 'N/A'} subValue={loan.g2_details?.nic} />
                                <DetailItem label="Joint Borrower" value={loan.guardian_name || 'N/A'} subValue={loan.guardian_nic} />
                                <DetailItem label="Witness 01" value={loan.w1_details?.name || 'N/A'} />
                                <DetailItem label="Witness 02" value={loan.w2_details?.name || 'N/A'} />
                            </Section>
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="p-8">
                            <LoanPaymentHistory loanId={loan.id.toString()} />
                        </div>
                    )}

                    {activeTab === 'card' && (
                        <div className="p-8">
                            <LoanCardPrint loan={loan} />
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-10 bg-muted-bg/30 backdrop-blur-3xl border-t border-border-divider flex items-center justify-between gap-4 sticky bottom-0 transition-all">
                    <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] hidden sm:block opacity-40">
                        Updated at: {new Date(loan.created_at || Date.now()).toLocaleDateString()}
                    </p>
                    <div className="flex gap-4 w-full sm:w-auto">
                        <button
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-10 py-4.5 rounded-2xl bg-card border border-border-divider text-text-secondary font-black text-[10px] uppercase tracking-[0.25em] hover:bg-hover transition-all active:scale-95 shadow-sm"
                        >
                            Close View
                        </button>
                        {activeTab === 'overview' && canEditLoan && (loan.status === 'sent_back' || loan.status === 'pending_1st' || loan.status === 'pending_2nd') && (
                            <button
                                onClick={() => window.location.href = `/loans/edit?edit=${loan.id}`}
                                className="flex-1 sm:flex-none bg-primary-600 text-white px-12 py-4.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] hover:bg-primary-500 transition-all shadow-2xl shadow-primary-500/40 active:scale-95 flex items-center gap-2"
                            >
                                {loan.status === 'sent_back' ? 'Resend application' : 'Authorize Update'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailItem({ label, value, subValue, highlight }: { label: string; value: React.ReactNode; subValue?: string; highlight?: boolean }) {
    const formattedValue = typeof value === 'string' ? value.toUpperCase() : value;
    const formattedSubValue = typeof subValue === 'string' ? subValue.toUpperCase() : subValue;

    return (
        <div className="group space-y-1.5">
            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest transition-colors group-hover:text-primary-600 opacity-60">
                {label}
            </p>
            <div className={`text-sm font-bold truncate ${highlight ? 'text-primary-600' : 'text-text-primary'}`}>
                {formattedValue || '-'}
            </div>
            {formattedSubValue && <p className="text-[10px] text-text-muted font-bold tracking-tight opacity-50">{formattedSubValue}</p>}
        </div>
    );
}
