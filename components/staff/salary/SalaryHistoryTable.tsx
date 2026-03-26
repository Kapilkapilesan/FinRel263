import React, { useState } from 'react';
import { Search, Filter, Calendar, MoreVertical, Plus } from 'lucide-react';
import { SalaryPayment } from '@/types/salary.types';
import { colors } from '@/themes/colors';

interface SalaryHistoryTableProps {
    history: SalaryPayment[];
    onProcessNew: () => void;
}

export const SalaryHistoryTable: React.FC<SalaryHistoryTableProps> = ({ history, onProcessNew }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [monthFilter, setMonthFilter] = useState('All Months');

    const filteredHistory = history.filter(record => {
        const matchesSearch = !searchTerm ||
            record.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesStatus = true;
        if (statusFilter !== 'All Status') {
            const mappedStatus = (record.status === 'Paid' || record.status === 'Disbursed') ? 'Disbursed' : record.status;
            matchesStatus = mappedStatus === statusFilter;
        }

        let matchesMonth = true;
        if (monthFilter !== 'All Months') {
            matchesMonth = record.month === monthFilter;
        }

        return matchesSearch && matchesStatus && matchesMonth;
    });

    return (
        <div className="bg-card rounded-2xl border border-border-default p-6 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-start sm:items-center">
                <div className="flex-1 w-full sm:w-auto flex flex-wrap gap-4 items-center">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search history..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-input border border-border-default rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-text-primary"
                        />
                    </div>
                    <div className="relative flex items-center gap-2 bg-input border border-border-default/50 rounded-xl px-4 py-2 group cursor-pointer">
                        <Filter className="w-4 h-4 text-text-muted" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full"
                        >
                            <option className="bg-card">All Status</option>
                            <option className="bg-card">Pending</option>
                            <option className="bg-card">Approved</option>
                            <option className="bg-card">Disbursed</option>
                        </select>
                        <span className="text-sm font-bold text-text-primary">{statusFilter}</span>
                    </div>
                    <div className="relative flex items-center gap-2 bg-input border border-border-default/50 rounded-xl px-4 py-2 group cursor-pointer">
                        <Calendar className="w-4 h-4 text-text-muted" />
                        <select
                            value={monthFilter}
                            onChange={(e) => setMonthFilter(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full"
                        >
                            <option className="bg-card" value="All Months">All Months</option>
                            {Array.from(new Set(history.map(r => r.month))).filter(Boolean).map(m => (
                                <option key={m} className="bg-card" value={m}>{m}</option>
                            ))}
                        </select>
                        <span className="text-sm font-bold text-text-primary whitespace-nowrap">{monthFilter}</span>
                    </div>
                </div>

                <button
                    onClick={onProcessNew}
                    className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary-500/10 active:scale-95 whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">New Payment</span>
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-table-header border-b border-border-divider">
                            <th className="py-4 px-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Payment Date</th>
                            <th className="py-4 px-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Employee</th>
                            <th className="py-4 px-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Month</th>
                            <th className="py-4 px-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Base Salary</th>
                            <th className="py-4 px-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Total Paid</th>
                            <th className="py-4 px-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Status</th>
                            <th className="py-4 px-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-divider">
                        {filteredHistory.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-20 text-center text-text-muted">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="p-4 bg-muted-bg rounded-2xl mb-4 border border-border-default/50">
                                            <Search className="w-8 h-8 text-text-muted opacity-20" />
                                        </div>
                                        <h3 className="text-lg font-black uppercase tracking-tight text-text-primary">No Records Identified</h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-2">No history records found for this period.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredHistory.map((record) => (
                                <tr key={record.id} className="hover:bg-hover transition-colors group">
                                    <td className="py-4 px-6">
                                        <span className="text-sm font-bold text-text-primary tracking-tight">{record.paymentDate}</span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div>
                                            <p className="text-sm font-black text-text-primary uppercase tracking-tight leading-none mb-1.5">{record.employeeName}</p>
                                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.1em] opacity-50">{record.employeeId}</p>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className="text-sm font-bold text-text-primary tracking-tight">{record.month}</span>
                                    </td>
                                    <td className="py-4 px-6 text-sm font-bold text-text-primary tracking-tight">Rs. {record.baseSalary.toLocaleString()}</td>
                                    <td className="py-4 px-6">
                                        <span className="text-sm font-black text-primary-500 tracking-tight">Rs. {record.netPayable.toLocaleString()}</span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${record.status === 'Disbursed' || record.status === 'Paid'
                                                ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/20'
                                                : record.status === 'Pending'
                                                    ? 'bg-warning-500/10 text-warning-600 dark:text-warning-400 border-warning-500/20'
                                                    : 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/20'
                                                }`}
                                        >
                                            {record.status === 'Pending' ? 'Pending' :
                                                record.status === 'Approved' ? 'Approved' :
                                                    record.status === 'Disbursed' || record.status === 'Paid' ? 'Disbursed' : record.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <button className="p-2 hover:bg-muted-bg rounded-xl transition-colors text-text-muted hover:text-text-primary border border-transparent hover:border-border-default/50">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
