import React from 'react';
import { Eye, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { ActionConfirmModal } from '@/components/common/ActionConfirmModal';
import { Complaint } from '@/types/complaint.types';
import { StatusBadge, PriorityBadge } from '../shared/ComplaintBadges';
import { authService } from '@/services/auth.service';

interface ComplaintsTableProps {
    complaints: Complaint[];
    onView: (complaint: Complaint) => void;
    onEdit: (complaint: Complaint) => void;
    onDelete: (complaint: Complaint) => void;
    onStatusChange: (id: string, status: Complaint['status']) => void;
}

export const ComplaintsTable: React.FC<ComplaintsTableProps> = ({ complaints, onView, onEdit, onDelete, onStatusChange }) => {
    const [confirmState, setConfirmState] = React.useState<{
        isOpen: boolean;
        ticketId: string;
        ticketNo: string;
        targetStatus: Complaint['status'];
    }>({
        isOpen: false,
        ticketId: '',
        ticketNo: '',
        targetStatus: 'Open'
    });

    const canEdit = authService.hasPermission('complaints.edit');
    const canDelete = authService.hasPermission('complaints.delete');
    // Manage permission allows full control
    const canManage = authService.hasPermission('complaints.manage');

    return (
        <div className="bg-card rounded-xl border border-border-default overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-table-header border-b border-border-divider">
                            <th className="text-left px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-widest">
                                Ticket Info
                            </th>
                            <th className="text-left px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-widest">
                                Complainant
                            </th>
                            <th className="text-left px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-widest">
                                Branch & Category
                            </th>
                            <th className="text-left px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-widest">
                                Priority
                            </th>
                            <th className="text-left px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-widest">
                                Status
                            </th>
                            <th className="text-right px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-widest">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-divider">
                        {complaints.map((complaint) => {
                            const user = authService.getCurrentUser();
                            // Strict Comparison: Ensure we have actual values to compare
                            const isCreator = !!user?.user_name && !!complaint.assignerId && user.user_name === complaint.assignerId;
                            const isAssignee = !!user?.id && !!complaint.assigneeId && String(complaint.assigneeId) === String(user.id);

                            // Edit is for Owners only while status is 'Open' (admins use status controls instead)
                            const showEdit = canEdit && (isCreator || isAssignee) && complaint.status === 'Open';
                            const showDelete = canDelete && isCreator;

                            // Resolve/Reject are for Admins (Managers) ONLY
                            const canResolve = canManage;

                            return (
                                <tr
                                    key={complaint.id}
                                    className="group hover:bg-table-row-hover transition-colors duration-200"
                                >
                                    {/* Ticket No & Date */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-text-primary group-hover:text-primary-500 transition-colors">
                                                #{complaint.ticketNo}
                                            </span>
                                            <span className="text-xs font-medium text-text-muted">
                                                {complaint.date}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Complainant Details */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-input flex items-center justify-center text-xs font-bold text-text-muted border border-border-divider">
                                                {complaint.complainant.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-text-primary leading-none">
                                                    {complaint.complainant}
                                                </p>
                                                <span className="text-[10px] text-text-muted uppercase tracking-tight font-medium">
                                                    {complaint.complainantType}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Branch & Subject */}
                                    <td className="px-6 py-4">
                                        <div className="max-w-[200px]">
                                            <p className="text-sm font-medium text-text-secondary truncate">
                                                {complaint.subject}
                                            </p>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <span className="text-xs text-text-muted font-medium flex items-center gap-1">
                                                    <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    </svg>
                                                    {complaint.branch}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Priority Badge */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <PriorityBadge priority={complaint.priority} />
                                    </td>

                                    {/* Status Badge */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={complaint.status} />
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Resolution Quick Button */}
                                            {canResolve && (complaint.status === 'Open' || complaint.status === 'In Progress') && (
                                                <>
                                                    <button
                                                        onClick={() => setConfirmState({
                                                            isOpen: true,
                                                            ticketId: complaint.id,
                                                            ticketNo: complaint.ticketNo,
                                                            targetStatus: 'Resolved'
                                                        })}
                                                        className="px-3 py-1.5 bg-primary-600 text-white rounded-lg font-black text-[10px] uppercase shadow-sm shadow-primary-500/20 hover:bg-primary-500 transition-all flex items-center gap-1.5"
                                                        title="Mark as Resolved"
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        Resolve
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmState({
                                                            isOpen: true,
                                                            ticketId: complaint.id,
                                                            ticketNo: complaint.ticketNo,
                                                            targetStatus: 'Rejected'
                                                        })}
                                                        className="px-3 py-1.5 bg-sky-500 text-white rounded-lg font-black text-[10px] uppercase shadow-sm shadow-sky-500/20 hover:bg-sky-400 transition-all flex items-center gap-1.5"
                                                        title="Reject Complaint"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        Reject
                                                    </button>
                                                </>
                                            )}

                                            {showEdit && (
                                                <button
                                                    onClick={() => onEdit(complaint)}
                                                    className="p-2 bg-card border border-border-default text-text-muted rounded-lg hover:border-amber-400 hover:text-amber-600 hover:shadow-sm transition-all"
                                                    title="Edit Complaint"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onView(complaint)}
                                                className="p-2 bg-card border border-border-default text-text-muted rounded-lg hover:border-primary-400 hover:text-primary-600 hover:shadow-sm transition-all"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {showDelete && (
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Are you sure you want to delete this complaint?')) {
                                                            onDelete(complaint);
                                                        }
                                                    }}
                                                    className="p-2 bg-card border border-border-default text-text-muted rounded-lg hover:border-red-400 hover:text-red-600 hover:shadow-sm transition-all"
                                                    title="Delete Complaint"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Table Footer / Summary */}
            <div className="px-6 py-4 bg-table-header border-t border-border-divider">
                <p className="text-xs text-text-muted font-medium italic">
                    Showing <span className="text-text-primary font-black">{complaints.length}</span> active tickets
                </p>
            </div>

            {/* Confirmation Modal */}
            <ActionConfirmModal
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={async () => {
                    await onStatusChange(confirmState.ticketId, confirmState.targetStatus);
                }}
                title="Confirm Authorization"
                message={`Are you sure you want to change the status of ticket #${confirmState.ticketNo} to ${confirmState.targetStatus.toUpperCase()}?`}
                confirmLabel={`Confirm ${confirmState.targetStatus}`}
                variant={confirmState.targetStatus === 'Resolved' ? 'primary' : 'warning'}
            />
        </div>
    );
};
