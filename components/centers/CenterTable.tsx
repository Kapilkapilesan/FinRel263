'use client'

import React from 'react';
import {
    Calendar,
    User,
    Users,
    AlertTriangle,
    Trash2,
    Power,
    Edit,
    CheckCircle,
    XCircle,
    Eye,
    UserPlus,
    MapPin,
    Clock
} from 'lucide-react';
import { Center, TemporaryAssignment } from '../../types/center.types';
import { colors } from '../../themes/colors';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../common/Pagination';

interface CenterTableProps {
    centers: Center[];
    totalCenters: number;
    getTemporaryAssignment: (centerId: string) => TemporaryAssignment | undefined;
    onEdit?: (centerId: string) => void;
    onViewSchedule?: (centerId: string) => void;
    onApprove?: (centerId: string) => void;
    onReject?: (centerId: string) => void;
    onViewDetails: (center: Center) => void;
    onDelete?: (centerId: string) => void;
    onToggleStatus?: (center: Center) => void;
    onAssignCustomers?: (center: Center) => void;
    isFieldOfficer?: boolean;
    isManager?: boolean;
    isSuperAdmin?: boolean;
}

export function CenterTable({
    centers,
    totalCenters,
    getTemporaryAssignment,
    onEdit,
    onApprove,
    onReject,
    onViewDetails,
    onDelete,
    onToggleStatus,
    onAssignCustomers,
    isFieldOfficer,
    isManager,
    isSuperAdmin
}: CenterTableProps) {
    const {
        currentPage,
        itemsPerPage,
        startIndex,
        endIndex,
        handlePageChange,
        handleItemsPerPageChange
    } = usePagination({ totalItems: centers.length });

    const currentCenters = centers.slice(startIndex, endIndex);

    return (
        <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border-default overflow-hidden shadow-sm">
                {/* Header - Hidden on small screens, shown as thin bar on large */}
                <div className="hidden lg:grid grid-cols-12 gap-4 bg-table-header border-b border-border-divider px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-widest">
                    <div className="col-span-3">Center & Branch</div>
                    <div className="col-span-3">Meeting Schedule</div>
                    <div className="col-span-2 text-center">Assigned User</div>
                    <div className="col-span-1 text-center">Status</div>
                    <div className="col-span-3 text-right">Actions</div>
                </div>

                <div className="divide-y divide-border-divider">
                    {currentCenters.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <Users className="w-12 h-12 text-text-muted opacity-20 mx-auto mb-3" />
                            <p className="text-text-muted text-sm italic font-medium">No centers found.</p>
                        </div>
                    ) : (
                        currentCenters.map((center) => {
                            const tempAssignment = getTemporaryAssignment(center.id);

                            return (
                                <div key={center.id} className="group hover:bg-table-row-hover transition-all duration-200">
                                    <div className="px-6 py-3">
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start lg:items-center">
                                            {/* Center Info */}
                                            <div className="lg:col-span-3 flex items-center gap-4">
                                                <div
                                                    style={{ backgroundColor: `${colors.primary[600]}15` }}
                                                    className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200 shadow-sm"
                                                >
                                                    <Users className="w-5 h-5" style={{ color: colors.primary[600] }} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => onViewDetails(center)}
                                                            className="text-base font-black text-text-primary hover:text-primary-600 dark:hover:text-primary-400 transition-colors truncate uppercase"
                                                        >
                                                            {center.center_name}
                                                        </button>
                                                        <span
                                                            className="lg:hidden px-2 py-0.5 text-[10px] font-black rounded-full uppercase"
                                                            style={{
                                                                backgroundColor: `${colors.primary[600]}15`,
                                                                color: colors.primary[600]
                                                            }}
                                                        >
                                                            {center.location}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col gap-0.5 mt-0.5">
                                                        <span className="text-xs text-text-muted font-bold tracking-tight uppercase">{center.CSU_id}</span>
                                                        <span className="text-[11px] text-text-muted flex items-center gap-1 font-medium">
                                                            <MapPin className="w-3 h-3 opacity-50" />
                                                            {center.branch?.branch_name || center.branch_id}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Schedule Card */}
                                            <div className="lg:col-span-3">
                                                <div className="bg-input rounded-lg p-2 border border-border-divider">
                                                    <div className="space-y-1">
                                                        {center.open_days?.slice(0, 2).map((s, i) => (
                                                            <div key={i} className="flex items-center justify-between text-[11px]">
                                                                <span className="font-bold text-text-secondary flex items-center gap-1.5">
                                                                    <Calendar className="w-3 h-3 text-text-muted opacity-50" />
                                                                    {s.day}
                                                                </span>
                                                                <span className="text-text-muted flex items-center gap-1.5 bg-card px-1.5 py-0.5 rounded shadow-sm border border-border-divider">
                                                                    <Clock className="w-3 h-3 text-text-muted opacity-50" />
                                                                    {s.time}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {(!center.open_days || center.open_days.length === 0) && (
                                                            <span className="text-[11px] text-text-muted italic opacity-60">No schedule set</span>
                                                        )}
                                                        {(center.open_days?.length || 0) > 2 && (
                                                            <button
                                                                onClick={() => onViewDetails(center)}
                                                                style={{ color: colors.primary[600] }}
                                                                className="text-[10px] font-black hover:underline"
                                                            >
                                                                +{(center.open_days?.length || 0) - 2} more schedules
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Assigned User */}
                                            <div className="lg:col-span-2">
                                                <div className="flex flex-col items-center lg:justify-center gap-0.5">
                                                    <div className="w-7 h-7 rounded-full bg-muted-bg flex items-center justify-center border-2 border-card shadow-sm ring-1 ring-border-default overflow-hidden">
                                                        {center.staff?.profile_image_url ? (
                                                            <img src={center.staff.profile_image_url} alt="User" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User className="w-4 h-4 text-text-muted" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 w-full text-center">
                                                        <p className="text-[10px] font-black text-text-primary truncate uppercase tracking-tighter leading-tight">
                                                            {center.staff?.full_name || 'Unassigned'}
                                                        </p>
                                                        {center.staff_id && (
                                                            <p className="text-[8px] text-text-muted font-bold tracking-widest uppercase opacity-60 leading-tight">
                                                                {center.staff_id}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="lg:col-span-1 flex justify-center">
                                                <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border shadow-sm ${center.status === 'active'
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                                                    : center.status === 'rejected'
                                                        ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                                                        : center.status === 'disabled'
                                                            ? 'bg-muted-bg text-text-muted border-border-divider'
                                                            : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                                                    }`}>
                                                    {center.status === 'inactive' ? 'Pending' : center.status}
                                                </span>
                                            </div>

                                            {/* ACTIONS FOCUS AREA */}
                                            <div className="lg:col-span-3 flex flex-wrap justify-end items-center gap-2 mt-2 lg:mt-0">
                                                {/* Quick View */}
                                                <button
                                                    onClick={() => onViewDetails(center)}
                                                    className="p-2 bg-card text-text-muted hover:text-text-primary hover:bg-hover border border-border-default rounded-lg shadow-sm transition-all hover:scale-105"
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                {/* Edit */}
                                                {onEdit && (center.status !== 'rejected' || isFieldOfficer) && (
                                                    <button
                                                        onClick={() => onEdit(center.id)}
                                                        className="p-2 bg-card text-text-muted hover:text-amber-500 hover:bg-hover border border-border-default rounded-lg shadow-sm transition-all hover:scale-105"
                                                        title="Edit Center"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                )}

                                                {/* Approval Flow */}
                                                {center.status === 'inactive' && onApprove && (
                                                    <button
                                                        onClick={() => onApprove(center.id)}
                                                        className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white rounded-lg shadow-md hover:bg-primary-700 transition-all font-bold text-xs hover:scale-105"
                                                    >
                                                        <CheckCircle size={14} />
                                                        Approve
                                                    </button>
                                                )}

                                                {center.status === 'inactive' && onReject && (
                                                    <button
                                                        onClick={() => onReject(center.id)}
                                                        className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition-all font-bold text-xs hover:scale-105"
                                                    >
                                                        <XCircle size={14} />
                                                        Reject
                                                    </button>
                                                )}

                                                {/* Toggle Status (Enable/Disable) */}
                                                {onToggleStatus && (
                                                    <button
                                                        onClick={() => onToggleStatus(center)}
                                                        className={`p-2 rounded-lg border shadow-sm transition-all hover:scale-105 ${center.status === 'active'
                                                            ? 'text-red-500 bg-red-50 border-red-100 hover:bg-red-100'
                                                            : 'text-blue-500 bg-blue-50 border-blue-100 hover:bg-blue-100'
                                                            }`}
                                                        title={center.status === 'active' ? "Disable Center" : "Enable Center"}
                                                    >
                                                        <Power size={16} />
                                                    </button>
                                                )}

                                                {/* Delete - visible if user has permission and center is empty */}
                                                {onDelete && (center.groups_count || 0) === 0 && (center.customers_count || 0) === 0 && (!isFieldOfficer || !center.open_days || center.open_days.length === 0) && (
                                                    <button
                                                        onClick={() => onDelete(center.id)}
                                                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-lg transition-all hover:scale-105"
                                                        title="Delete Center"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}

                                                {/* Assign Customers */}
                                                {onAssignCustomers && center.status === 'active' && (
                                                    <button
                                                        onClick={() => onAssignCustomers(center)}
                                                        style={{ backgroundColor: colors.primary[600] }}
                                                        className="flex items-center gap-2.5 px-4 py-2 text-white rounded-xl shadow-lg hover:opacity-90 transition-all font-black text-xs hover:scale-105 active:scale-[0.98]"
                                                    >
                                                        <UserPlus size={14} />
                                                        Assign Customers
                                                    </button>
                                                )}


                                            </div>
                                        </div>

                                        {/* Bottom Stats & Extra Info */}
                                        <div className="mt-2 pt-2 border-t border-border-divider flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex gap-6">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Groups</span>
                                                    <span className="text-sm font-black text-text-primary">{center.groups_count || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Members</span>
                                                    <span className="text-sm font-black text-text-primary">{center.customers_count || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Loans</span>
                                                    <span className="text-sm font-black text-text-primary">{center.loans_count || center.totalLoans || 0}</span>
                                                </div>
                                            </div>

                                            {center.location && (
                                                <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-black">
                                                    <MapPin className="w-3 h-3" style={{ color: colors.primary[600] }} />
                                                    <span
                                                        className="px-2 py-0.5 rounded-full uppercase"
                                                        style={{
                                                            backgroundColor: `${colors.primary[600]}15`,
                                                            color: colors.primary[600]
                                                        }}
                                                    >
                                                        {center.location} Area
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Temporary Assignment Banner */}
                                        {tempAssignment && (
                                            <div className="mt-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-xl p-2.5 flex items-start gap-3">
                                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-amber-900 dark:text-amber-400">Temporary Duty Active</p>
                                                    <p className="text-[11px] text-amber-800 dark:text-amber-500 mt-0.5">
                                                        {tempAssignment.originalUser} is on leave. <span className="underline font-bold text-amber-900">{tempAssignment.temporaryUser}</span> is covering for {tempAssignment.date}.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                {/* Pagination Controls */}
                <Pagination
                    currentPage={currentPage}
                    totalItems={centers.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    itemName="centers"
                />
            </div>
        </div>
    );
}
