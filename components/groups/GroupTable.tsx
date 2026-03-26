'use client'

import React from 'react';
import { Edit, UsersRound, Trash2, Power, TrendingUp } from 'lucide-react';
import { Group } from '../../types/group.types';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../common/Pagination';
import { typography } from '../../themes/typography';
import { primary } from '../../themes/colors';

interface GroupTableProps {
    groups: Group[];
    totalGroups: number;
    onEdit: (group: Group) => void;
    onViewMembers: (group: Group) => void;
    onDelete?: (groupId: number) => void;
    onToggleStatus?: (group: Group) => void;
    canEdit?: boolean;
    canDelete?: boolean;
    canStatus?: boolean;
}

export function GroupTable({
    groups,
    totalGroups,
    onEdit,
    onViewMembers,
    onDelete,
    onToggleStatus,
    canEdit = false,
    canDelete = false,
    canStatus = false
}: GroupTableProps) {
    const {
        currentPage,
        itemsPerPage,
        startIndex,
        endIndex,
        handlePageChange,
        handleItemsPerPageChange
    } = usePagination({ totalItems: groups.length });

    const currentGroups = groups.slice(startIndex, endIndex);

    return (
        <div className="space-y-4">
            {/* Minimal Header */}
            <div className={`px-8 py-2 grid grid-cols-12 gap-6 ${typography.size.xs} ${typography.weight.black} text-text-muted/40 uppercase tracking-[0.2em]`}>
                <div className="col-span-4">Identification</div>
                <div className="col-span-3">Network & Location</div>
                <div className="col-span-3">Group Pulse</div>
                <div className="col-span-2 text-right">Operations</div>
            </div>

            <div className="space-y-4">
                {currentGroups.map((group) => (
                    <div key={group.id}
                        className="group relative bg-card rounded-[2rem] border border-border-default/60 p-2 hover:border-primary-500/40 hover:shadow-2xl hover:shadow-primary-500/5 hover:-translate-y-1 transition-all duration-500">
                        {/* Status Indicator Bar */}
                        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-r-full transition-all duration-500 ${group.status === 'active' ? 'bg-primary-500 shadow-[0_0_15px_rgba(0,132,209,0.5)]' : 'bg-text-muted/20'}`} />

                        <div className="grid grid-cols-12 gap-4 items-center px-5 py-3">
                            {/* 1. Group Identity */}
                            <div className="col-span-4 flex items-center gap-4">
                                <div className="relative">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/15 to-primary-500/5 flex items-center justify-center transition-transform duration-500 group-hover:scale-105 shadow-sm`}>
                                        <UsersRound className="w-6 h-6 text-primary-500" />
                                    </div>
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card flex items-center justify-center ${group.status === 'active' ? 'bg-primary-500' : 'bg-gray-400'}`}>
                                        <div className="w-1 h-1 rounded-full bg-white transition-all group-hover:animate-pulse" />
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className={`${typography.size.base} ${typography.weight.bold} text-text-primary tracking-tight truncate`}>
                                        {(() => {
                                            const match = group.group_name.match(/Group\s+(\d+)/i);
                                            return match ? match[1] : group.group_name;
                                        })()}
                                    </h4>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className={`${typography.size.xs} ${typography.weight.bold} text-primary-500 bg-primary-500/10 px-1.5 py-0.5 rounded-md`}>
                                            {group.group_code || 'G-UNIT'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Network & Location */}
                            <div className="col-span-3 space-y-2">
                                <div className="flex items-center gap-2">
                                    <p className={`${typography.size.sm} ${typography.weight.bold} text-text-primary truncate`}>
                                        {(group.center?.center_name || 'Individual').toUpperCase()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                                    <p className={`${typography.size.xs} text-text-muted font-bold truncate tracking-wide`}>
                                        {(group.center?.branch?.branch_name || 'Corporate').toUpperCase()}
                                    </p>
                                </div>
                            </div>

                            {/* 3. Group Pulse (Members & Loans) */}
                            <div className="col-span-3">
                                <button onClick={() => onViewMembers(group)} className="text-left group/members hover:scale-102 transition-transform duration-300">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex -space-x-2">
                                            {(group.customers || []).slice(0, 4).map((customer) => (
                                                <div key={customer.id} className="w-7 h-7 rounded-full bg-gradient-to-br from-white to-gray-50 border-2 border-card flex items-center justify-center text-[10px] font-black text-primary-500 shadow-sm ring-1 ring-black/5" title={customer.full_name}>
                                                    {customer.full_name.charAt(0)}
                                                </div>
                                            ))}
                                            {(group.customers?.length || 0) > 4 && (
                                                <div className="w-7 h-7 rounded-full bg-primary-500 border-2 border-card flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                                                    +{(group.customers?.length || 0) - 4}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 bg-primary-500/10 px-1.5 py-0.5 rounded-md">
                                                <TrendingUp className="w-2.5 h-2.5 text-primary-500" />
                                                <span className={`text-[10px] text-primary-500 font-black`}>
                                                    {group.loans_count || 0} Loans
                                                </span>
                                            </div>
                                            <span className={`text-[10px] text-text-muted font-bold`}>
                                                {group.customers_count || group.customers?.length || 0} Members
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            </div>

                            {/* 4. Operations */}
                            <div className="col-span-2 flex items-center justify-end gap-2">
                                {canStatus && (
                                    <button onClick={() => onToggleStatus?.(group)}
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${group.status === 'inactive' ? 'bg-primary-500/10 text-primary-500 hover:bg-primary-500' : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500'} hover:text-white hover:shadow-md active:scale-95`}>
                                        <Power className="w-4 h-4" />
                                    </button>
                                )}
                                {canEdit && (
                                    <button onClick={() => onEdit(group)}
                                        className="w-9 h-9 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center hover:bg-primary-500 hover:text-white transition-all duration-300 hover:shadow-md active:scale-95">
                                        <Edit className="w-4 h-4" />
                                    </button>
                                )}
                                {canDelete && (
                                    <button onClick={() => onDelete?.(group.id)}
                                        className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all duration-300 hover:shadow-md active:scale-95">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Premium Pagination */}
            <div className="mt-8">
                <Pagination
                    currentPage={currentPage}
                    totalItems={groups.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    itemName="GROUPS"
                />
            </div>
        </div>
    );
}
