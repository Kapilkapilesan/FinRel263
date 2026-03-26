'use client';

import React from 'react';
import { SearchCode, WalletMinimal, CheckCircle2, Landmark, FileText, ArrowRight } from 'lucide-react';
import { colors } from '@/themes/colors';
import { Pagination } from '@/components/common/Pagination';

interface Props {
    records: any[];
    onDisburse: (record: any) => void;
}

export function LoanDisbursementTable({ records, onDisburse }: Props) {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);
    const [itemsPerPage, setItemsPerPage] = React.useState(10);

    const filteredRecords = records.filter(record => {
        const searchLower = searchTerm.trim().toLowerCase();
        return !searchTerm ||
            record.loan_id?.toLowerCase().includes(searchLower) ||
            record.contract_number?.toLowerCase().includes(searchLower) ||
            record.customer?.full_name?.toLowerCase().includes(searchLower);
    });

    // Reset pagination on search
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const paginatedRecords = filteredRecords.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="space-y-4">
            {/* High Density Filter Section */}
            {/* High Density Filter Section */}
            <div className="bg-muted-bg/40 p-2 rounded-2xl border border-border-default/50 backdrop-blur-md flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-1 min-w-[300px] items-center gap-3 bg-card px-4 py-2.5 rounded-xl shadow-sm border border-border-default/50 focus-within:ring-4 focus-within:ring-primary-500/10 transition-all duration-300 group">
                    <SearchCode className="w-4 h-4 text-text-muted group-focus-within:text-primary-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search assets by application identifier or borrower..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent outline-none text-[10px] font-black text-text-primary placeholder:text-text-muted/50 uppercase tracking-[0.1em]"
                    />
                </div>
                <div className="flex items-center gap-4 px-6 border-l border-border-default/50 text-right">
                    <div>
                        <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Active Queue</span>
                        <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">{records.filter(r => r.status === 'awaiting_transfer').length} Awaiting</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-2xl overflow-hidden shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] border border-border-default/50">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-muted-bg/40">
                                <th className="px-6 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-default/50 whitespace-nowrap">Asset Identity</th>
                                <th className="px-6 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-default/50 whitespace-nowrap">Principal Entity</th>
                                <th className="px-6 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-default/50 whitespace-nowrap">Allocated Capital</th>
                                <th className="px-6 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-default/50 whitespace-nowrap">Branch</th>
                                <th className="px-6 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-default/50 text-center whitespace-nowrap">Protocol Status</th>
                                <th className="px-6 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-default/50 text-right whitespace-nowrap">Action Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default">
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center bg-muted-bg/20">
                                        <div className="flex flex-col items-center">
                                            <p className="text-[10px] font-black text-text-muted/30 uppercase tracking-[0.2em]">Institutional queue currently synchronized</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedRecords.map((record) => (
                                    <tr key={record.id} className="group hover:bg-hover transition-all duration-300">
                                        <td className="px-6 py-4.5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <code className="text-[10px] font-black text-text-primary tracking-tighter uppercase">{record.contract_number || record.loan_id}</code>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-1 h-1 rounded-full bg-border-default group-hover:bg-primary-400 transition-colors" />
                                                        <span className="text-[8px] font-black text-text-muted uppercase tracking-widest">{record.SoapRefNo || 'INTERNAL-TRANS'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4.5">
                                            <div>
                                                <p className="text-sm font-black text-text-primary group-hover:text-primary-600 transition-colors uppercase tracking-tight leading-none mb-1.5">{record.customer?.full_name}</p>
                                                <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                                                    <span className="w-2.5 h-[1px] bg-border-default" />
                                                    {record.product?.product_name || 'Generic Asset Management'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4.5">
                                            <div className="flex flex-col">
                                                <div className="flex items-baseline gap-2 mb-1.5 group-hover:scale-105 origin-left transition-transform duration-300">
                                                    <span className="text-lg font-black text-primary-600 dark:text-primary-400 tracking-tighter tabular-nums leading-none">
                                                        {(record.net_disbursed_amount ?? record.approved_amount).toLocaleString()}
                                                    </span>
                                                    <span className="text-[10px] font-black text-text-muted/40 line-through tracking-tighter tabular-nums">
                                                        {parseFloat(record.approved_amount).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 py-0.5 px-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg w-fit border border-primary-100/50 dark:border-primary-900/30 shadow-sm">
                                                    <div className="w-1 h-1 rounded-full bg-primary-500 animate-pulse" />
                                                    <span className="text-[8px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">Net Payout Flow</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4.5">
                                            <div className="flex flex-col">
                                                <p className="text-[10px] font-black text-text-primary uppercase tracking-widest truncate leading-none mb-1.5">
                                                    {record.branch_name || record.center?.branch?.branch_name || 'N/A'}
                                                </p>
                                                <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] opacity-40">
                                                    Operational Branch
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4.5 text-center">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black border uppercase tracking-[0.15em] transition-all duration-300 shadow-sm min-w-[120px] ${record.status === 'awaiting_transfer'
                                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-primary-100 dark:border-primary-900/30 shadow-primary-100/20 dark:shadow-primary-900/20'
                                                    : 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-primary-100 dark:border-primary-900/30 shadow-primary-100/20 dark:shadow-primary-900/20'
                                                    }`}>
                                                    {record.status === 'awaiting_transfer' ? 'AWAITING TRANSFER' : record.status}
                                                </span>
                                                <span className="text-[8px] font-black text-text-muted/30 uppercase tracking-[0.2em]">Operational</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4.5 text-right">
                                            {record.status === 'awaiting_transfer' ? (
                                                <button
                                                    onClick={() => onDisburse(record)}
                                                    onMouseEnter={() => {
                                                        // Prefetch settlement details on hover for instant modal loading
                                                        import('../../services/finance.service').then(({ financeService }) => {
                                                            financeService.getLoanSettlementDetails(record.id);
                                                        });
                                                    }}
                                                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-primary-600/20 active:scale-95 flex items-center gap-2 group/btn"
                                                >
                                                    PROCESS PAYOUT
                                                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                                                </button>
                                            ) : (
                                                <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border border-primary-100/50 dark:border-primary-900/30 shadow-inner ml-auto">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    FINALIZED
                                                </div>
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

            <div className="p-5 bg-muted-bg/20 border-t border-border-default/50 rounded-b-2xl text-center">
                <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em] opacity-60">
                    Institutional asset distribution matrix synchronized
                </p>
            </div>
        </div>
    );
}
