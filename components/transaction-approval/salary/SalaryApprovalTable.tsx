'use client';

import React from 'react';
import { CheckCircle2, Search, Calendar, Filter, User, ChevronRight, Info } from 'lucide-react';
import { colors } from '@/themes/colors';
import BMSLoader from '@/components/common/BMSLoader';

interface SalaryRecord {
    id: string;
    processedDate: string;
    employeeName: string;
    role: string;
    month: string;
    baseSalary: number;
    adjustments: number;
    totalPaid: number;
    status: 'Pending' | 'Approved' | 'Rejected';
    avatar?: string;
}

interface SalaryApprovalTableProps {
    records: SalaryRecord[];
    onApprove: (id: string) => void;
    approvingId?: string | null;
    selectedIds: string[];
    onToggleSelect: (id: string) => void;
    onToggleSelectAll: () => void;
}

export function SalaryApprovalTable({
    records,
    onApprove,
    approvingId,
    selectedIds,
    onToggleSelect,
    onToggleSelectAll
}: SalaryApprovalTableProps) {
    const isAllSelected = records.length > 0 && selectedIds.length === records.length;

    return (
        <div className="bg-card">
            {/* High Density Header & Filters Section */}
            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-divider">
                <div>
                    <h2 className="text-base font-black text-text-primary tracking-tight flex items-center gap-2">
                        <div className="p-1 px-1.5 rounded-lg bg-input border border-border-default">
                            <ChevronRight className="w-3 h-3 text-text-muted" />
                        </div>
                        Payroll Ledger
                    </h2>
                    <p className="text-[9px] text-text-muted font-bold uppercase tracking-[0.2em] mt-0.5 ml-8">System Transaction Queue</p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="relative group min-w-[220px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted group-focus-within:text-primary-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Employee search..."
                            className="w-full pl-8 pr-4 py-2 bg-input/50 border-border-default border rounded-xl text-[10px] font-bold shadow-sm focus:outline-none focus:ring-4 transition-all text-text-primary placeholder:text-text-muted"
                            style={{
                                // @ts-ignore
                                '--tw-ring-color': `${colors.primary[600]}1a`,
                            } as any}
                        />
                    </div>

                    <div className="relative">
                        <select className="appearance-none pl-3 pr-8 py-2 bg-input/50 border-border-default border rounded-xl text-[9px] font-black shadow-sm cursor-pointer focus:outline-none focus:ring-4 transition-all uppercase tracking-wider text-text-primary hover:border-border-default/80">
                            <option>2026-01</option>
                            <option>2025-12</option>
                        </select>
                        <Calendar className="w-2.5 h-2.5 text-text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <select className="appearance-none pl-3 pr-8 py-2 bg-input/50 border-border-default border rounded-xl text-[9px] font-black shadow-sm cursor-pointer focus:outline-none focus:ring-4 transition-all uppercase tracking-wider text-text-primary hover:border-border-default/80">
                            <option>Pending</option>
                            <option>Approved</option>
                            <option>Rejected</option>
                        </select>
                        <Filter className="w-2.5 h-2.5 text-text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* High Density Table */}
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-separate border-spacing-0">
                    <thead>
                        <tr className="bg-table-header">
                            <th className="px-5 py-3.5 border-b border-border-divider w-12">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={onToggleSelectAll}
                                        className="w-3.5 h-3.5 rounded border-border-default text-primary-600 focus:ring-primary-500/10 cursor-pointer transition-all"
                                        style={{ accentColor: colors.primary[600] }}
                                    />
                                </div>
                            </th>
                            <th className="px-5 py-3.5 border-b border-border-divider text-[9px] font-black text-text-muted uppercase tracking-widest">Release Date</th>
                            <th className="px-5 py-3.5 border-b border-border-divider text-[9px] font-black text-text-muted uppercase tracking-widest">Entity / Employee</th>
                            <th className="px-5 py-3.5 border-b border-border-divider text-[9px] font-black text-text-muted uppercase tracking-widest">Cycle</th>
                            <th className="px-5 py-3.5 border-b border-border-divider text-[9px] font-black text-text-muted uppercase tracking-widest">Volume</th>
                            <th className="px-5 py-3.5 border-b border-border-divider text-[9px] font-black text-text-muted uppercase tracking-widest">Net Payable</th>
                            <th className="px-5 py-3.5 border-b border-border-divider text-[9px] font-black text-text-muted uppercase tracking-widest">Protocol</th>
                            <th className="px-5 py-3.5 border-b border-border-divider text-[9px] font-black text-text-muted uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-divider">
                        {records.map((record) => {
                            const isSelected = selectedIds.includes(record.id);
                            return (
                                <tr
                                    key={record.id}
                                    className={`group transition-all duration-200 hover:bg-table-row-hover ${isSelected ? 'bg-primary-50/10' : ''}`}
                                >
                                    <td className="px-5 py-3">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => onToggleSelect(record.id)}
                                                className="w-3.5 h-3.5 rounded border-border-default text-primary-600 focus:ring-primary-500/10 cursor-pointer transition-all"
                                                style={{ accentColor: colors.primary[600] }}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-[11px] font-bold text-text-secondary tracking-tight font-mono">{record.processedDate}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-sm transition-transform group-hover:scale-105"
                                                style={{
                                                    background: `linear-gradient(135deg, ${colors.primary[500]}, ${colors.primary[700]})`
                                                }}
                                            >
                                                {record.employeeName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-[12px] font-black text-text-primary tracking-tight leading-none mb-1 group-hover:text-primary-600 transition-colors">{record.employeeName}</p>
                                                <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{record.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-input text-text-secondary uppercase tracking-widest border border-border-default">
                                            {record.month}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-[12px] font-bold text-text-secondary tracking-tight tabular-nums">
                                        <span className="text-[8px] text-text-muted mr-1 font-black uppercase">LKR</span>
                                        {record.baseSalary.toLocaleString()}
                                    </td>
                                    <td className="px-5 py-3 text-[13px] font-black text-text-primary tracking-tighter tabular-nums">
                                        <span className="text-[8px] text-text-muted mr-1 font-black uppercase">LKR</span>
                                        {record.totalPaid.toLocaleString()}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${record.status === 'Pending'
                                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            }`}>
                                            <div className={`w-1 h-1 rounded-full mr-1 animate-pulse ${record.status === 'Pending' ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`} />
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <button
                                            onClick={() => onApprove(record.id)}
                                            disabled={approvingId === record.id}
                                            className="group/btn relative inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                                            style={{
                                                background: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[700]})`,
                                                boxShadow: `0 4px 12px ${colors.primary[600]}15`
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-white opacity-0 group-hover/btn:opacity-10 transition-opacity" />
                                            {approvingId === record.id ? (
                                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="w-3 h-3 text-white" />
                                            )}
                                            <span className="text-white">
                                                {approvingId === record.id ? 'Authorize' : 'Approve'}
                                            </span>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* High Density Footer */}
            <div className="p-4 bg-input/20 border-t border-border-default">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-card border border-border-default rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Info className="w-4 h-4 text-primary-500/50" />
                    </div>
                    <div>
                        <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest leading-relaxed">
                            Verification required before final authorization. All records are subject to internal resource audit logs.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
