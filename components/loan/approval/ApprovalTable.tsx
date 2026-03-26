import React, { useState } from 'react';
import { Eye, AlertCircle } from 'lucide-react';
import { colors } from '@/themes/colors';
import { LoanApprovalItem } from '@/types/loan-approval.types';
import { Pagination } from '@/components/common/Pagination';

interface ApprovalTableProps {
    loans: LoanApprovalItem[];
    onView: (loan: LoanApprovalItem) => void;
}

export const ApprovalTable: React.FC<ApprovalTableProps> = ({ loans, onView }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const getTimeDifferenceInHours = (dateStr: string, timeStr: string): number => {
        const submittedDateTime = new Date(`${dateStr} ${timeStr}`);
        const now = new Date();
        const diffMs = now.getTime() - submittedDateTime.getTime();
        return diffMs / (1000 * 60 * 60);
    };

    const isOverdue = (dateStr: string, timeStr: string): boolean => {
        return getTimeDifferenceInHours(dateStr, timeStr) > 1;
    };

    // Pagination logic
    const totalItems = loans.length;
    const sortedLoans = [...loans].sort((a, b) => a.serialNo - b.serialNo);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = sortedLoans.slice(startIndex, endIndex);

    return (
        <div className="bg-card rounded-3xl border border-border-default overflow-hidden transition-colors">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-table-header border-b border-border-divider">
                        <tr className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                            <th className="px-2 py-3">Serial</th>
                            <th className="px-2 py-3">Contract No</th>
                            <th className="px-2 py-3">Customer Name</th>
                            <th className="px-2 py-3">NIC</th>
                            <th className="px-2 py-3">Loan Amount</th>
                            <th className="px-2 py-3 text-center">Staff</th>
                            <th className="px-2 py-3">Submitted Date</th>
                            <th className="px-2 py-3 text-center">1st Approval</th>
                            <th className="px-2 py-3 text-center">2nd Approval</th>
                            <th className="px-2 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-divider">
                        {currentItems.length > 0 ? (
                            currentItems.map((loan) => {
                                const overdueWarning = isOverdue(loan.submittedDate, loan.submittedTime);
                                
                                return (
                                    <tr key={loan.id} className={`hover:bg-hover transition-colors group ${overdueWarning ? 'bg-primary-50/10 dark:bg-primary-500/5' : ''}`}>
                                        {/* Serial */}
                                        <td className="px-2 py-3 text-xs text-text-primary font-medium">#{loan.serialNo}</td>

                                        {/* Contract No */}
                                        <td className="px-2 py-3">
                                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                <span className="text-xs font-bold text-text-primary">{loan.contractNo}</span>
                                                {overdueWarning && (
                                                    <span title="Over 1 hour pending">
                                                        <AlertCircle className="w-3 h-3 text-primary-600 shrink-0" />
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Customer Name */}
                                        <td className="px-2 py-3 text-xs text-text-primary font-bold whitespace-nowrap">{loan.customerName}</td>

                                        {/* NIC */}
                                        <td className="px-2 py-3 text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60 whitespace-nowrap">{loan.nic}</td>

                                        {/* Loan Amount */}
                                        <td className="px-2 py-3">
                                            <span className="text-xs font-bold text-text-primary whitespace-nowrap">LKR {loan.loanAmount.toLocaleString()}</span>
                                        </td>

                                        {/* Staff */}
                                        <td className="px-2 py-3 text-xs font-bold text-text-primary capitalize whitespace-nowrap text-center">{loan.staff}</td>

                                        {/* Submitted Date & Time */}
                                        <td className="px-2 py-3 text-center">
                                            <div className="text-[9px] font-black text-text-muted uppercase tracking-widest opacity-60 whitespace-nowrap">
                                                {loan.submittedDate} • {loan.submittedTime}
                                            </div>
                                        </td>

                                        {/* 1st Approval */}
                                        <td className="px-2 py-3 text-center">
                                            {loan.firstApproval === 'Pending' ? (
                                                <span className="inline-flex items-center px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded text-[9px] font-black uppercase tracking-tighter shadow-sm w-[65px] justify-center">Pending</span>
                                            ) : loan.firstApproval === 'Approved' ? (
                                                <span className="inline-flex items-center px-1.5 py-0.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 rounded text-[9px] font-black uppercase tracking-tighter shadow-sm w-[65px] justify-center">Approved</span>
                                            ) : loan.firstApproval === 'Sent Back' ? (
                                                <span className="inline-flex items-center px-1.5 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded text-[9px] font-black uppercase tracking-tighter shadow-sm w-[65px] justify-center">Sent Back</span>
                                            ) : (
                                                <span className="text-[9px] text-text-muted">N/A</span>
                                            )}
                                        </td>

                                        {/* 2nd Approval */}
                                        <td className="px-2 py-3 text-center">
                                            {loan.secondApproval === null && loan.loanAmount <= 200000 ? (
                                                <span className="text-[9px] font-black text-text-muted uppercase tracking-widest opacity-40">N/A</span>
                                            ) : loan.secondApproval === 'Pending' ? (
                                                <span className="inline-flex items-center px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded text-[9px] font-black uppercase tracking-tighter shadow-sm w-[65px] justify-center">Pending</span>
                                            ) : loan.secondApproval === 'Approved' ? (
                                                <span className="inline-flex items-center px-1.5 py-0.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 rounded text-[9px] font-black uppercase tracking-tighter shadow-sm w-[65px] justify-center">Approved</span>
                                            ) : loan.secondApproval === 'Sent Back' ? (
                                                <span className="inline-flex items-center px-1.5 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded text-[9px] font-black uppercase tracking-tighter shadow-sm w-[65px] justify-center">Sent Back</span>
                                            ) : (
                                                <span className="text-[9px] font-black text-text-muted uppercase tracking-widest opacity-40">-</span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-2 py-3 text-right">
                                            <button
                                                onClick={() => onView(loan)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/10 text-primary-600 hover:bg-primary-500/20 transition-all rounded-lg border border-primary-500/20 text-[10px] font-black uppercase tracking-widest group/btn"
                                            >
                                                <Eye className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" />
                                                <span>View</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={10} className="px-6 py-12 text-center text-[10px] font-black text-text-muted uppercase tracking-widest italic opacity-50">
                                    No loans pending approval found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                itemName="loans"
            />
        </div>
    );
};
