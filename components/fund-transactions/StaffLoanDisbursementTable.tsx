'use client';

import React from 'react';
import { DollarSign, User, CheckCircle2, Landmark, SearchCode } from 'lucide-react';
import { colors } from '@/themes/colors';
import { Pagination } from '../common/Pagination';

interface StaffLoanDisbursementTableProps {
    records: any[];
    onDisburse: (record: any) => void;
}

export function StaffLoanDisbursementTable({ records, onDisburse }: StaffLoanDisbursementTableProps) {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);
    const [itemsPerPage, setItemsPerPage] = React.useState(10);

    const filteredRecords = records.filter(record => {
        const searchLower = searchTerm.trim().toLowerCase();
        return !searchTerm ||
            record.staff?.full_name?.toLowerCase().includes(searchLower) ||
            record.staff?.staff_id?.toLowerCase().includes(searchLower);
    });

    // Reset pagination on search
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const paginatedRecords = filteredRecords.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (!records || records.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-muted-bg/20 rounded-2xl border border-border-default/50">
                <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-border-default">
                    <User className="w-8 h-8 text-text-muted/30" />
                </div>
                <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">No Pending Internal Disbursements</h3>
                <p className="text-[8px] text-text-muted/50 font-bold uppercase tracking-widest mt-2">Corporate resource allocation is synchronized</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="bg-card rounded-2xl overflow-hidden shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] border border-border-default/50">
                <div className="p-5 border-b border-border-default/80 flex flex-wrap gap-4 items-center justify-between bg-muted-bg/20">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/20">
                            <Landmark className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-text-primary tracking-tight uppercase leading-none">Internal Capital Release</h3>
                            <p className="text-[9px] text-text-muted font-bold tracking-[0.2em] uppercase mt-1.5">Institutional Resource Allocation</p>
                        </div>
                    </div>

                    <div className="flex flex-1 min-w-[300px] items-center gap-3 bg-card px-4 py-2 rounded-xl shadow-sm border border-border-default/50 focus-within:ring-4 focus-within:ring-primary-500/10 transition-all duration-300 group">
                        <SearchCode className="w-4 h-4 text-text-muted group-focus-within:text-primary-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Identify resources by name or identifier..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-transparent outline-none text-[10px] font-black text-text-primary placeholder:text-text-muted/50 uppercase tracking-[0.1em]"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-muted-bg/40">
                                <th className="px-6 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-default/50 whitespace-nowrap">Principal Staff Member</th>
                                <th className="px-6 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-default/50 whitespace-nowrap">Asset Purpose</th>
                                <th className="px-6 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-default/50 whitespace-nowrap">Branch</th>
                                <th className="px-6 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-default/50 text-right whitespace-nowrap">Capital Volume</th>
                                <th className="px-6 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-default/50 text-center whitespace-nowrap">Registry Status</th>
                                <th className="px-6 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-default/50 text-right whitespace-nowrap">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default/80">
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <p className="text-[10px] font-black text-text-muted/50 uppercase tracking-[0.2em]">No personnel records match search criteria</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedRecords.map((record) => (
                                    <tr key={record.id} className="group hover:bg-hover transition-all duration-300">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-black text-text-primary group-hover:text-primary-600 transition-colors uppercase tracking-tight leading-none mb-1">{record.staff?.full_name}</p>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[8px] font-black text-text-muted uppercase tracking-widest bg-muted-bg/50 px-1.5 py-0.5 rounded border border-border-default/50 transition-colors">{record.staff?.staff_id}</span>
                                                    <span className="text-[8px] font-bold text-text-muted/30">•</span>
                                                    <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest">{record.staff?.branch?.branch_name}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                <p className="text-[10px] font-black text-text-secondary uppercase tracking-tight leading-none group-hover:text-primary-600 transition-colors">{record.purpose}</p>
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary-50 dark:bg-primary-900/20 rounded-md border border-primary-100/30 dark:border-primary-900/30 w-fit">
                                                    <span className="text-[8px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">TERM: {record.loan_duration} MONTHS</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[9px] font-black text-text-primary uppercase tracking-widest">
                                                {record.staff?.branch?.branch_name || record.staff?.branch?.name || 'CENTRAL'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-lg font-black text-text-primary tracking-tighter tabular-nums leading-none mb-1 group-hover:scale-105 transition-transform duration-300 origin-right">
                                                    {Number(record.amount).toLocaleString()}
                                                </span>
                                                <span className="text-[8px] font-black text-text-muted uppercase tracking-widest bg-muted-bg/50 px-1.5 py-0.5 rounded-md">Principal</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black border uppercase tracking-[0.1em] transition-all duration-300 shadow-sm min-w-[100px] ${record.status === 'disbursed'
                                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-primary-100 dark:border-primary-900/30'
                                                    : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30 animate-pulse'
                                                    }`}>
                                                    {record.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {record.status === 'disbursed' ? (
                                                <div className="inline-flex items-center gap-2 px-6 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border border-primary-100/50 dark:border-primary-900/30 shadow-inner ml-auto">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Authorized
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => onDisburse(record)}
                                                    className="relative overflow-hidden group/btn px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.15em] shadow-lg active:scale-95 transition-all flex items-center gap-2 ml-auto"
                                                >
                                                    <DollarSign className="w-3.5 h-3.5 relative z-10" />
                                                    <span className="relative z-10">Disburse</span>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination
                currentPage={currentPage}
                totalItems={filteredRecords.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(newSize) => {
                    setItemsPerPage(newSize);
                    setCurrentPage(1);
                }}
                itemName="loans"
            />

            <div className="p-4 bg-muted-bg/20 border-t border-border-default/50 rounded-b-2xl text-center">
                <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em] opacity-60">
                    Internal asset registry synchronized
                </p>
            </div>
        </div>
    );
}
