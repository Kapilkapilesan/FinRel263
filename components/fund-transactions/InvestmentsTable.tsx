'use client';

import React from 'react';
import { User, ShieldCheck, SearchCode } from 'lucide-react';
import { colors } from '@/themes/colors';

interface ShareholderRecord {
    id: string | number;
    name: string;
    total_investment: number;
    nic?: string;
}

export function ShareholdersTable({ records }: { records: ShareholderRecord[] }) {
    const [searchTerm, setSearchTerm] = React.useState('');

    const filteredRecords = records.filter(record => {
        const searchLower = searchTerm.trim().toLowerCase();
        return !searchTerm ||
            record.name?.toLowerCase().includes(searchLower) ||
            record.nic?.toLowerCase().includes(searchLower);
    });

    return (
        <div className="space-y-4">
            <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border-default/50">
                <div className="p-5 border-b border-border-default flex flex-wrap gap-4 items-center justify-between bg-card">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/20">
                            <User className="w-4 h-4 text-primary-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-text-primary tracking-tight uppercase">Capital Structure</h3>
                            <p className="text-[9px] text-text-muted font-bold tracking-[0.2em] uppercase mt-0.5">Shareholder Equity Matrix</p>
                        </div>
                    </div>

                    <div className="flex flex-1 min-w-[300px] items-center gap-3 bg-muted-bg/30 px-4 py-2 rounded-xl shadow-sm border border-border-default/50 focus-within:ring-4 focus-within:ring-primary-500/10 transition-all duration-300 group">
                        <SearchCode className="w-4 h-4 text-text-muted group-focus-within:text-primary-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Identify stakeholders by name or NIC..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-transparent outline-none text-[10px] font-black text-text-primary placeholder:text-text-muted/50 uppercase tracking-[0.1em]"
                        />
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-100 dark:border-primary-900/30">
                        <div className="w-1 h-1 rounded-full bg-primary-500 animate-pulse" />
                        <span className="text-[9px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest leading-none">Persistent</span>
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-muted-bg/30">
                                <th className="px-6 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-default">Identity</th>
                                <th className="px-6 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-default">NIC / Identifier</th>
                                <th className="px-6 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-default">Allocation</th>
                                <th className="px-6 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-default">Branch</th>
                                <th className="px-6 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-default text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default">
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-14 h-14 bg-muted-bg rounded-xl flex items-center justify-center mb-4 border border-border-default shadow-inner">
                                                <User className="w-7 h-7 text-text-muted/30" />
                                            </div>
                                            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">No stakeholders match search criteria</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((record) => (
                                    <tr key={record.id} className="group hover:bg-hover transition-all duration-300">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-[10px] shadow-md transition-all duration-500 group-hover:rotate-3"
                                                    style={{
                                                        background: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[700]})`,
                                                        boxShadow: `0 6px 12px ${colors.primary[600]}15`
                                                    }}
                                                >
                                                    {record.name.charAt(0)}
                                                </div>
                                                <p className="text-sm font-black text-text-primary group-hover:text-primary-600 transition-colors uppercase tracking-tight">{record.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[9px] font-black text-text-muted font-mono tracking-widest uppercase">{record.nic || 'UNSPECIFIED'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-text-primary tabular-nums tracking-tighter">
                                                    Rs. {Number(record.total_investment).toLocaleString()}
                                                </span>
                                                <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest mt-0.5">Active Capital</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">HEAD OFFICE</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-flex items-center px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg text-[8px] font-black uppercase tracking-widest border border-primary-100/30 dark:border-primary-900/30">
                                                Active Tier
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-muted-bg/30 border-t border-border-default">
                    <p className="text-[8px] font-black text-text-muted/50 uppercase tracking-[0.3em] text-center">
                        Shareholder distribution matrix verified by internal audit
                    </p>
                </div>
            </div>
        </div>
    );
}
