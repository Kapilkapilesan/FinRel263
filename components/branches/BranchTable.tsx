'use client'

import React from 'react';
import { Building2, Edit, Trash2, MapPin, Phone, Mail, Power } from 'lucide-react';
import { Branch } from '../../types/branch.types';
import { colors } from '../../themes/colors';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../common/Pagination';

interface BranchTableProps {
    branches: Branch[];
    totalBranches: number;
    onEdit: (branch: Branch) => void;
    onDelete: (id: number) => void;
    onToggleStatus: (branch: Branch) => void;
    onViewDetail: (branch: Branch) => void;
    canEdit?: boolean;
    canDelete?: boolean;
    canToggleStatus?: boolean;
}

export function BranchTable({
    branches,
    totalBranches,
    onEdit,
    onDelete,
    onToggleStatus,
    onViewDetail,
    canEdit = false,
    canDelete = false,
    canToggleStatus = false
}: BranchTableProps) {
    const {
        currentPage,
        itemsPerPage,
        startIndex,
        endIndex,
        handlePageChange,
        handleItemsPerPageChange
    } = usePagination({ totalItems: branches.length });

    const currentBranches = branches.slice(startIndex, endIndex);

    const hasAnyAction = canEdit || canDelete || canToggleStatus;

    return (
        <div className="bg-card rounded-[2.5rem] border border-border-default/50 overflow-hidden shadow-2xl">
            <div className="bg-muted-bg/30 border-b border-border-divider/50 px-8 py-5">
                <div className="grid grid-cols-12 gap-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] opacity-40">
                    <div className="col-span-3">Branch</div>
                    <div className="col-span-3">Contact</div>
                    <div className="col-span-2">Location</div>
                    <div className="col-span-2">Manager</div>
                    <div className="col-span-1 text-center">Status</div>
                    <div className="col-span-1 text-right">{hasAnyAction && 'Actions'}</div>
                </div>
            </div>

            <div className="divide-y divide-border-divider">
                {currentBranches.length === 0 ? (
                    <div className="px-6 py-8 text-center text-text-muted text-sm">
                        No branches found.
                    </div>
                ) : (
                    currentBranches.map((branch) => (
                        <div
                            key={branch.id}
                            className="px-6 py-4 hover:bg-table-row-hover transition-colors cursor-pointer group/row"
                            onClick={() => onViewDetail(branch)}
                        >
                            <div className="grid grid-cols-12 gap-4 items-center">
                                {/* Branch: Name + ID */}
                                <div className="col-span-3 flex items-center gap-5 min-w-0">
                                    <div className="w-12 h-12 bg-primary-500/10 border border-primary-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover/row:scale-110 transition-transform">
                                        <Building2 className="w-5 h-5 text-primary-500" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[14px] font-black text-text-primary uppercase tracking-tight truncate group-hover/row:text-primary-500 transition-colors" title={branch.branch_name}>{branch.branch_name}</p>
                                        <p className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest mt-1 truncate" title={branch.branch_id}>{branch.branch_id}</p>
                                    </div>
                                </div>

                                {/* Contact: Phone + Email */}
                                <div className="col-span-3">
                                    <div className="flex items-center gap-3 text-[13px] font-black text-text-primary mb-1.5 tabular-nums">
                                        <Phone className="w-4 h-4 text-primary-500/40" />
                                        <span>{branch.phone || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[11px] font-bold text-text-muted/60 truncate">
                                        <Mail className="w-4 h-4 text-text-muted/20" />
                                        <span className="truncate">{branch.email || '-'}</span>
                                    </div>
                                </div>

                                {/* Location: district + Province */}
                                <div className="col-span-2 min-w-0">
                                    <div className="flex items-center gap-2 text-[11px] font-black text-text-primary uppercase tracking-widest mb-1">
                                        <MapPin className="w-4 h-4 text-primary-500/40 shrink-0" />
                                        <span className="truncate" title={branch.district || branch.location || '-'}>{branch.district || branch.location || '-'}</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-text-muted/60 uppercase tracking-tighter truncate ml-6" title={branch.province || ''}>{branch.province || ''}</p>
                                </div>

                                {/* Manager: Name + Customer Count */}
                                <div className="col-span-2 min-w-0">
                                    <p className="text-[11px] font-black text-text-primary uppercase tracking-widest truncate mb-1" title={branch.manager?.full_name || 'Unassigned'}>
                                        {branch.manager?.full_name || 'Unassigned'}
                                    </p>
                                    <p className="text-[10px] font-bold text-text-muted/60 uppercase tracking-tighter">
                                        {branch.customers_count ?? 0} customers
                                    </p>
                                </div>

                                <div className="col-span-1 flex justify-center">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border 
                                        ${(branch.status || 'active').toLowerCase() === 'inactive'
                                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                            : 'bg-primary-500/10 text-primary-500 border-primary-500/20'}`}>
                                        {branch.status || 'active'}
                                    </span>
                                </div>

                                <div className="col-span-1 flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                    {canToggleStatus && (
                                        <button
                                            onClick={() => onToggleStatus(branch)}
                                            className={`p-1.5 rounded-lg transition-all active:scale-95 ${branch.status === 'inactive'
                                                ? 'hover:bg-primary-500/10 text-primary-500'
                                                : 'hover:bg-amber-500/10 text-amber-500'
                                                }`}
                                            title={branch.status === 'inactive' ? 'Enable Branch' : 'Disable Branch'}
                                        >
                                            <Power className="w-4 h-4" />
                                        </button>
                                    )}
                                    {canEdit && (
                                        <button
                                            onClick={() => onEdit(branch)}
                                            className="p-1.5 hover:bg-primary-500/10 text-primary-500 rounded-lg transition-all active:scale-95"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button
                                            onClick={() => onDelete(branch.id)}
                                            className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-all active:scale-95"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                totalItems={branches.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                itemName="branches"
            />
        </div>
    );
}
