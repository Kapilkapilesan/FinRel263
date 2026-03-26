'use client';

import React from 'react';
import { SearchCode, FileText, ArrowLeftRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { colors } from '../../themes/colors';
import { Pagination } from '../common/Pagination';
import { BranchExpense } from '../../types/finance.types';

interface Props {
    records: BranchExpense[];
}

export function BankBranchHistoryTable({ records }: Props) {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);
    const [itemsPerPage, setItemsPerPage] = React.useState(10);

    const filteredRecords = records.filter(record => {
        const searchLower = searchTerm.trim().toLowerCase();
        return !searchTerm ||
            record.request_id?.toLowerCase().includes(searchLower) ||
            record.expense_type?.toLowerCase().includes(searchLower) ||
            record.description?.toLowerCase().includes(searchLower) ||
            (record.transaction?.soap_ref_no && record.transaction.soap_ref_no.toLowerCase().includes(searchLower));
    });

    // Reset pagination on search
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const paginatedRecords = filteredRecords.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved': return 'bg-primary-50 text-primary-600 border-primary-100 shadow-primary-100/20';
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-100/20';
            case 'rejected': return 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-100/20';
            default: return 'bg-muted-bg/50 text-text-muted border-border-default/50';
        }
    };

    return (
        <div className="space-y-4">
            {/* Filter Section */}
            <div className="bg-muted-bg/40 p-2 rounded-2xl border border-border-default/50 backdrop-blur-md flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-1 min-w-[300px] items-center gap-3 bg-card px-4 py-2.5 rounded-xl shadow-sm border border-border-default/50 focus-within:ring-4 focus-within:ring-primary-500/10 transition-all duration-300 group">
                    <SearchCode className="w-4 h-4 text-text-muted group-focus-within:text-primary-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by Request ID, Type or Transaction Reference..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent outline-none text-[10px] font-black text-text-primary placeholder:text-text-muted/50 uppercase tracking-[0.1em]"
                    />
                </div>
                <div className="flex items-center gap-6 px-6 border-l border-border-default/50 text-right">
                    <div>
                        <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Synchronization State</span>
                        <div className="flex items-center gap-1.5 mt-0.5 justify-end text-right">
                             <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">
                                {records.length} Transactions
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-2xl overflow-hidden shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] border border-border-default/50">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-muted-bg/40">
                                <th className="px-6 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-default/50 whitespace-nowrap">Transaction ID</th>
                                <th className="px-6 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-default/50 whitespace-nowrap">Category/Purpose</th>
                                <th className="px-6 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-default/50 whitespace-nowrap">Capital Flow</th>
                                <th className="px-6 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-default/50 whitespace-nowrap">Entity / Originator</th>
                                <th className="px-6 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-default/50 text-center whitespace-nowrap">Institutional Status</th>
                                <th className="px-6 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-default/50 text-right whitespace-nowrap">Temporal Marker</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default">
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center bg-muted-bg/20">
                                        <div className="flex flex-col items-center">
                                            <p className="text-[10px] font-black text-text-muted/30 uppercase tracking-[0.2em]">Transaction matrix synchronized - No activity detected</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedRecords.map((record) => (
                                    <tr key={record.id} className="group hover:bg-hover transition-all duration-300">
                                        <td className="px-6 py-4.5">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2.5 rounded-xl transition-all duration-300 shadow-sm ${record.type === 'inflow' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    <ArrowLeftRight className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <code className="text-[10px] font-black text-text-primary tracking-tighter uppercase">{record.request_id || `REF-${record.id}`}</code>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-1 h-1 rounded-full bg-border-default group-hover:bg-primary-400 transition-colors" />
                                                        <span className="text-[8px] font-black text-text-muted uppercase tracking-widest">{record.transaction?.soap_ref_no || 'SYSTEM-EXEC'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4.5">
                                            <div>
                                                <p className="text-sm font-black text-text-primary group-hover:text-primary-600 transition-colors uppercase tracking-tight leading-none mb-1.5">{record.expense_type}</p>
                                                <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                                                    <span className="w-2.5 h-[1px] bg-border-default" />
                                                    {record.description.length > 35 ? `${record.description.substring(0, 35)}...` : record.description}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4.5">
                                            <div className="flex flex-col">
                                                <div className="flex items-baseline gap-2 mb-1.5 transition-transform duration-300">
                                                    <span className={`text-sm font-black tracking-tighter tabular-nums leading-none ${record.type === 'inflow' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {record.type === 'inflow' ? '+' : '-'} {parseFloat(record.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                                <div className={`flex items-center gap-1.5 py-0.5 px-2 rounded-lg w-fit border shadow-sm ${record.type === 'inflow' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                    <span className="text-[8px] font-black uppercase tracking-widest uppercase">{record.medium} Allocation</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4.5">
                                            <div className="flex flex-col">
                                                <p className="text-[10px] font-black text-text-primary uppercase tracking-widest truncate leading-none mb-1.5">
                                                    {record.requested_by_user?.staff_id || record.requested_by_user?.user_name || 'SYSTEM'}
                                                </p>
                                                <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] opacity-40">
                                                    Originator Asset Class
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4.5 text-center">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black border uppercase tracking-[0.15em] transition-all duration-300 shadow-sm min-w-[120px] ${getStatusColor(record.status)}`}>
                                                    {record.status}
                                                </span>
                                                <span className="text-[8px] font-black text-text-muted/30 uppercase tracking-[0.2em]">Validated Protocol</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4.5 text-right">
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-2 group/time">
                                                    <Clock className="w-3 h-3 text-text-muted group-hover/time:text-primary-500 transition-colors" />
                                                    <span className="text-[10px] font-black text-text-primary uppercase tabular-nums tracking-tighter">
                                                        {new Date(record.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <span className="text-[8px] font-black text-text-muted uppercase tracking-widest opacity-40 mt-1">
                                                    {new Date(record.created_at).toLocaleTimeString()}
                                                </span>
                                            </div>
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
                itemName="transactions"
            />
        </div>
    );
}
