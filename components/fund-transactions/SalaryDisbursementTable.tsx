'use client';

import React, { useState, useEffect } from 'react';
import { SearchCode, WalletMinimal, CheckCircle2, Building, Filter, CheckSquare, Square, Landmark } from 'lucide-react';
import { staffService } from '../../services/staff.service';
import { branchService } from '../../services/branch.service';
import { colors } from '@/themes/colors';
import { Pagination } from '@/components/common/Pagination';

interface Props {
    records: any[];
    onDisburse: (record: any) => void;
    onBulkDisburse?: (records: any[]) => void;
}

export function SalaryDisbursementTable({ records, onDisburse, onBulkDisburse }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All Roles');
    const [groupFilter, setGroupFilter] = useState('All Groups');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [roles, setRoles] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        const loadFilters = async () => {
            try {
                const availableRoles = await staffService.getAllRoles().catch(() => []);
                const availableBranches = await branchService.getBranchesAll().catch(() => []);
                setRoles(availableRoles);
                setBranches(availableBranches);
            } catch (error) {
                console.error("Failed to load filters", error);
            }
        };
        loadFilters();
    }, []);

    const filteredRecords = records.filter(record => {
        const staff = record.staff;
        const searchLower = searchTerm.trim().toLowerCase();
        const matchesSearch = !searchTerm ||
            staff?.full_name?.toLowerCase().includes(searchLower) ||
            record.id.toString().includes(searchLower);

        const matchesRole = roleFilter === 'All Roles' ||
            staff?.role === roleFilter ||
            staff?.work_info?.designation === roleFilter;

        const matchesGroup = groupFilter === 'All Groups' ||
            staff?.branch?.branch_name === groupFilter ||
            staff?.branch?.name === groupFilter;

        return matchesSearch && matchesRole && matchesGroup;
    });

    // Reset pagination on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, roleFilter, groupFilter]);

    const paginatedRecords = filteredRecords.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const isAllSelected = filteredRecords.length > 0 &&
        filteredRecords.filter(r => r.status !== 'Paid' && r.status !== 'Disbursed').length > 0 &&
        filteredRecords.filter(r => r.status !== 'Paid' && r.status !== 'Disbursed').every(r => selectedIds.has(r.id.toString()));

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            const disbursable = filteredRecords.filter(r => r.status !== 'Paid' && r.status !== 'Disbursed');
            setSelectedIds(new Set(disbursable.map(r => r.id.toString())));
        }
    };

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBulkDisburse = () => {
        if (onBulkDisburse) {
            const selectedRecords = records.filter(r => selectedIds.has(r.id.toString()));
            onBulkDisburse(selectedRecords);
        }
    };

    return (
        <div className="space-y-4">
            {/* High Density Filter Section */}
            <div className="bg-muted-bg/40 p-2 rounded-2xl border border-border-default/50 backdrop-blur-md space-y-2 shadow-[0_5px_15px_-5px_rgba(0,0,0,0.02)]">
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex-1 min-w-[300px] flex items-center gap-3 bg-card px-4 py-2.5 rounded-xl shadow-sm border border-border-default/50 focus-within:ring-4 focus-within:ring-primary-500/10 transition-all duration-300 group">
                        <SearchCode className="w-4 h-4 text-text-muted group-focus-within:text-primary-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Identify resources by name or payroll identifier..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-transparent outline-none text-[10px] font-black text-text-primary placeholder:text-text-muted/50 uppercase tracking-[0.1em]"
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-xl shadow-sm border border-border-default group">
                        <Filter className="w-3.5 h-3.5 text-primary-500" />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="bg-transparent outline-none text-[9px] font-black text-text-secondary uppercase tracking-widest min-w-[120px] cursor-pointer appearance-none text-center"
                        >
                            <option className="bg-card text-text-primary">All Roles</option>
                            {roles.map(r => (
                                <option key={r.id} value={r.name} className="bg-card text-text-primary">{r.display_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-xl shadow-sm border border-border-default group">
                        <Building className="w-3.5 h-3.5 text-indigo-500" />
                        <select
                            value={groupFilter}
                            onChange={(e) => setGroupFilter(e.target.value)}
                            className="bg-transparent outline-none text-[9px] font-black text-text-secondary uppercase tracking-widest min-w-[120px] cursor-pointer appearance-none text-center"
                        >
                            <option className="bg-card text-text-primary">All Branches</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.branch_name || b.name} className="bg-card text-text-primary">{b.branch_name || b.name}</option>
                            ))}
                        </select>
                    </div>

                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleBulkDisburse}
                            className="relative overflow-hidden group/btn px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all shadow-lg active:scale-95 animate-in zoom-in-95 flex items-center gap-3"
                        >
                            <WalletMinimal className="w-3.5 h-3.5 relative z-10" />
                            <span className="relative z-10">Process Bulk ({selectedIds.size})</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-card rounded-2xl overflow-hidden shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] border border-border-default/50">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-muted-bg/40">
                                <th className="px-4 py-4 w-12 border-b border-border-default/50 text-center">
                                    <button
                                        onClick={toggleSelectAll}
                                        className="text-text-muted hover:text-primary-600 transition-all bg-card w-8 h-8 rounded-lg border border-border-default flex items-center justify-center shadow-sm hover:shadow-md active:scale-95"
                                    >
                                        {isAllSelected ? <CheckSquare className="w-4 h-4 text-primary-600" /> : <Square className="w-4 h-4" />}
                                    </button>
                                </th>
                                <th className="px-4 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-default/50 whitespace-nowrap">Asset Identity</th>
                                <th className="px-4 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-default/50 whitespace-nowrap">Operating Role</th>
                                <th className="px-4 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-default/50 whitespace-nowrap text-center">Branch</th>
                                <th className="px-4 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-default/50 text-center whitespace-nowrap">Cycle</th>
                                <th className="px-4 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-default/50 text-center whitespace-nowrap">Net Allocation</th>
                                <th className="px-4 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-default/50 text-center whitespace-nowrap">Registry Status</th>
                                <th className="px-4 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-default/50 text-right whitespace-nowrap">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default/80">
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-20 text-center bg-muted-bg/20">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center mb-4 shadow-xl border border-border-default/50">
                                                <Landmark className="w-8 h-8 text-text-muted/30" />
                                            </div>
                                            <p className="text-[10px] font-black text-text-muted/50 uppercase tracking-[0.2em]">No personnel records detected</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedRecords.map((record) => (
                                    <tr key={record.id} className={`group hover:bg-hover transition-all duration-300 ${selectedIds.has(record.id.toString()) ? 'bg-primary-50/10 dark:bg-primary-900/10' : ''}`}>
                                        <td className="px-4 py-4 text-center">
                                            {record.status !== 'Paid' && record.status !== 'Disbursed' && (
                                                <button
                                                    onClick={() => toggleSelect(record.id.toString())}
                                                    className="text-text-muted hover:text-primary-600 transition-all hover:scale-110 active:scale-90"
                                                >
                                                    {selectedIds.has(record.id.toString()) ?
                                                        <CheckSquare className="w-5 h-5 text-primary-600" /> : <Square className="w-5 h-5 outline-none" />}
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div>
                                                <p className="text-sm font-black text-text-primary group-hover:text-primary-600 transition-colors uppercase tracking-tight leading-none mb-1">{record.staff?.full_name || 'System Resource'}</p>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1 h-1 rounded-full bg-border-default group-hover:bg-primary-400 transition-colors" />
                                                    <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest">{record.staff?.branch?.branch_name || record.staff?.branch?.name || 'CENTRAL'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest bg-muted-bg/50 px-3 py-1 rounded-lg border border-border-default/50 group-hover:bg-card transition-colors">
                                                {record.staff?.work_info?.designation || record.staff?.role || 'RESOURCE'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="text-[9px] font-black text-text-primary uppercase tracking-widest">
                                                {record.staff?.branch?.branch_name || record.staff?.branch?.name || 'CENTRAL'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">{record.month}</span>
                                                <div className="w-6 h-[1px] bg-indigo-100 dark:bg-indigo-900/30 rounded-full" />
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-lg font-black text-text-primary tracking-tighter tabular-nums leading-none mb-1 group-hover:scale-105 transition-transform duration-300">
                                                    {Number(record.net_payable).toLocaleString()}
                                                </span>
                                                <span className="text-[8px] font-black text-text-muted uppercase tracking-widest">Net</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={`px-3 py-1 rounded-xl text-[9px] font-black border uppercase tracking-[0.1em] transition-all duration-300 shadow-sm min-w-[90px] ${record.status === 'Disbursed' || record.status === 'Paid'
                                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-primary-100 dark:border-primary-900/30'
                                                    : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30 animate-pulse'
                                                    }`}>
                                                    {record.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            {record.status !== 'Disbursed' && record.status !== 'Paid' ? (
                                                <button
                                                    onClick={() => onDisburse(record)}
                                                    className="relative overflow-hidden group/btn px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.15em] shadow-lg active:scale-95 transition-all flex items-center gap-2 ml-auto"
                                                >
                                                    <WalletMinimal className="w-3.5 h-3.5 relative z-10" />
                                                    <span className="relative z-10">Process</span>
                                                </button>
                                            ) : (
                                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border border-primary-100/50 dark:border-primary-900/30 shadow-inner ml-auto">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Settled
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
                itemName="salaries"
            />

            <div className="p-4 bg-muted-bg/20 border-t border-border-default/50 rounded-b-2xl text-center">
                <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em] opacity-60">
                    Personnel capital distribution verified by treasury protocols
                </p>
            </div>
        </div>
    );
}
