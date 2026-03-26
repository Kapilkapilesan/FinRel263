'use client';

import React, { useState } from 'react';
import { ChevronRight, Landmark, TrendingUp, User, Hash, Clock } from 'lucide-react';
import { Pagination } from '../common/Pagination';

interface Props {
    records: any[];
    selectedId: number | null;
    onSelect: (id: number) => void;
    isLoading?: boolean;
}

export function InvestmentApprovalTable({ records, selectedId, onSelect, isLoading }: Props) {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const paginatedRecords = records.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-card/30 rounded-2xl border border-dashed border-border-divider/50">
                <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest animate-pulse">
                    Synchronizing Approval Data...
                </p>
            </div>
        );
    }

    if (records.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-card/30 rounded-2xl border border-dashed border-border-divider/50">
                <div className="w-16 h-16 bg-muted-bg rounded-2xl flex items-center justify-center mb-4 shadow-inner border border-border-divider">
                    <Clock className="w-8 h-8 text-border-divider" />
                </div>
                <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">Queue Clear</h3>
                <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-1 opacity-60">
                    No pending authorizations detected
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Table Header */}
            <div className="bg-muted-bg/30 border-b border-border-divider/50 px-8 py-3.5">
                <div className="grid grid-cols-12 gap-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] opacity-40">
                    <div className="col-span-3">Identity & Handler</div>
                    <div className="col-span-3">Principal Investor</div>
                    <div className="col-span-3">Structure & Yield</div>
                    <div className="col-span-2 text-right">Balance (LKR)</div>
                    <div className="col-span-1 flex justify-center">
                        <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-border-divider/30 flex-1 overflow-y-auto custom-scrollbar">
                {paginatedRecords.map((record) => (
                    <div
                        key={record.id}
                        onClick={() => onSelect(record.id)}
                        className={`px-8 py-4 cursor-pointer transition-all relative group/row hover:bg-muted-bg/30 ${
                            selectedId === record.id ? 'bg-primary-500/5' : ''
                        }`}
                    >
                        {selectedId === record.id && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500" />
                        )}

                        <div className="grid grid-cols-12 gap-4 items-center">
                            {/* Identity */}
                            <div className="col-span-3 flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                    <Hash className="w-3 h-3 text-primary-500/50" />
                                    <code className="text-[10px] font-black tracking-tight text-primary-600 dark:text-primary-400 uppercase truncate">
                                        {record.transaction_id}
                                    </code>
                                </div>
                                <div className="flex items-center gap-2">
                                    <User className="w-3 h-3 text-text-muted opacity-40" />
                                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest truncate">
                                        BY {record.created_by?.full_name || record.created_by?.name || 'SYSTEM'}
                                    </span>
                                </div>
                            </div>

                            {/* Investor */}
                            <div className="col-span-3 min-w-0">
                                <p className="text-[13px] font-black text-text-primary uppercase tracking-tight truncate group-hover/row:text-primary-500 transition-colors">
                                    {record.customer?.full_name || 'N/A'}
                                </p>
                                <p className="text-[9px] font-black text-text-muted opacity-40 uppercase tracking-widest mt-0.5">
                                    ID: {record.customer?.customer_code}
                                </p>
                            </div>

                            {/* Yield */}
                            <div className="col-span-3">
                                <p className="text-[10px] font-black text-text-primary uppercase tracking-widest truncate mb-1">
                                    {record.product?.name || record.snapshot_product_name}
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 text-[9px] font-black text-primary-600 bg-primary-600/10 px-1.5 py-0.5 rounded border border-primary-600/20">
                                        <TrendingUp className="w-3 h-3" />
                                        {record.snapshot_interest_rate_maturity || record.snapshot_interest_rate_monthly}%
                                    </div>
                                    <span className="text-[8px] font-bold text-text-muted uppercase tracking-tighter opacity-40">
                                        {record.snapshot_policy_term} MONTHS
                                    </span>
                                </div>
                            </div>

                            {/* Balance */}
                            <div className="col-span-2 text-right">
                                <p className="text-[15px] font-black text-text-primary tracking-tighter tabular-nums">
                                    {Number(record.amount).toLocaleString()}
                                </p>
                                <p className="text-[8px] font-black text-text-muted uppercase tracking-widest opacity-40 mt-0.5">
                                    Principal Sum
                                </p>
                            </div>

                            {/* Indicator */}
                            <div className="col-span-1 flex justify-center">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                    selectedId === record.id 
                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20 rotate-0' 
                                    : 'bg-card text-text-muted group-hover/row:bg-primary-500/10 group-hover/row:text-primary-500 -rotate-90'
                                }`}>
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-border-divider/30 bg-card/30 backdrop-blur-sm rounded-b-2xl">
                <Pagination
                    currentPage={currentPage}
                    totalItems={records.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(newSize) => {
                        setItemsPerPage(newSize);
                        setCurrentPage(1);
                    }}
                    itemName="approvals"
                />
            </div>
        </div>
    );
}
