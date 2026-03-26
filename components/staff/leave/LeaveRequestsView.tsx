'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Search, CheckCircle, XCircle, Clock, Eye, Plus, Edit, Trash2 } from 'lucide-react';
import { LeaveRequest, LeaveRequestFormData } from '@/types/leave.types';
import { LeaveRequestModal } from './LeaveRequestModal';
import { leaveService } from '@/services/leave.service';
import { authService } from '@/services/auth.service';
import { ProcessLeaveModal } from './ProcessLeaveModal';
import { toast } from 'react-toastify';
import { colors } from '@/themes/colors';

interface LeaveRequestsViewProps {
    isAdmin?: boolean;
}

export const LeaveRequestsView: React.FC<LeaveRequestsViewProps> = ({ isAdmin: isAdminProp }) => {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdmin, setIsAdmin] = useState(isAdminProp ?? false);
    const [processingRequest, setProcessingRequest] = useState<{
        id: string;
        userName: string;
        status: 'Approved' | 'Rejected';
    } | null>(null);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);
    const [viewingRequest, setViewingRequest] = useState<LeaveRequest | null>(null);
    const [canEditLeave, setCanEditLeave] = useState(false);

    useEffect(() => {
        // Set admin state: priority to prop, then check authService
        if (isAdminProp !== undefined) {
            setIsAdmin(isAdminProp);
        } else {
            const check = authService.hasPermission('leave.approve') || authService.hasPermission('leave.view_all');
            setIsAdmin(check);
        }
        setCanEditLeave(authService.hasPermission('leave.edit'));
    }, [isAdminProp]);

    useEffect(() => {
        loadRequests();
    }, [filterStatus, isAdmin]);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const data = isAdmin
                ? await leaveService.getAllLeaveRequests(filterStatus)
                : await leaveService.getMyLeaveRequests();
            setRequests(data);
        } catch (error) {
            console.error('Failed to load leave requests', error);
            toast.error('Failed to load leave requests');
        } finally {
            setLoading(false);
        }
    };

    const handleProcessRequest = async (reason?: string) => {
        if (!isAdmin || !processingRequest) return;

        try {
            const success = await leaveService.updateLeaveRequestStatus(
                processingRequest.id,
                processingRequest.status,
                reason
            );

            if (success) {
                toast.success(`Leave request ${processingRequest.status.toLowerCase()} successfully`);
                loadRequests();
            }
        } catch (error: any) {
            toast.error(error.message || `Failed to ${processingRequest.status.toLowerCase()} request`);
        } finally {
            setProcessingRequest(null);
        }
    };

    const handleSubmitLeaveRequest = async (data: LeaveRequestFormData) => {
        try {
            if (editingRequest) {
                await leaveService.updateLeaveRequest(editingRequest.id, data);
                toast.success('Leave request updated successfully');
            } else {
                await leaveService.submitLeaveRequest(data);
                toast.success('Leave request submitted successfully');
            }
            loadRequests();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save leave request');
        } finally {
            setShowLeaveModal(false);
            setEditingRequest(null);
        }
    };

    const handleDeleteRequest = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this leave request?')) return;

        try {
            await leaveService.deleteLeaveRequest(id);
            toast.success('Leave request deleted successfully');
            loadRequests();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete leave request');
        }
    };

    const openProcessModal = (id: string, userName: string, status: 'Approved' | 'Rejected') => {
        setProcessingRequest({ id, userName, status });
    };

    const handleApprove = (request: LeaveRequest) => {
        if (!isAdmin) return;
        openProcessModal(request.id, request.userName, 'Approved');
    };

    const handleReject = (request: LeaveRequest) => {
        if (!isAdmin) return;
        openProcessModal(request.id, request.userName, 'Rejected');
    };

    const handleEdit = (request: LeaveRequest) => {
        setEditingRequest(request);
        setShowLeaveModal(true);
    };

    const handleView = (request: LeaveRequest) => {
        setViewingRequest(request);
    };

    const filteredRequests = requests.filter(req => {
        const searchLower = searchTerm.trim().toLowerCase();
        return req.userName.toLowerCase().includes(searchLower) ||
            req.reason.toLowerCase().includes(searchLower);
    });

    const currentUser = authService.getCurrentUser();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-text-primary">
                        {isAdmin ? 'Leave Requests Management' : 'My Leave Requests'}
                    </h2>
                    <p className="text-sm text-text-muted mt-1 font-medium italic">
                        {isAdmin ? 'Review and approve leave requests' : 'Track your leave request status'}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => {
                            setEditingRequest(null);
                            setShowLeaveModal(true);
                        }}
                        className="flex items-center gap-2 text-white px-6 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-xl transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-primary-500/20 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Request Leave
                    </button>
                    <div className="relative flex-grow sm:flex-grow-0">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search requests..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-input border border-border-input rounded-xl focus:ring-2 transition-all text-text-primary outline-none text-sm font-medium"
                            style={{ '--tw-ring-color': `${colors.primary[500]}33` } as any}
                        />
                    </div>

                    {isAdmin && (
                        <div className="relative flex items-center gap-2 bg-input border border-border-input rounded-xl px-4 py-2.5 transition-all hover:border-primary-500/50">
                            <span className="text-sm font-bold text-text-primary">
                                {filterStatus === 'all' ? 'All Status' : filterStatus}
                            </span>
                            <Filter className="w-4 h-4 text-text-muted" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="absolute opacity-0 w-full inset-0 cursor-pointer"
                            >
                                <option value="all">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-card rounded-2xl border border-border-default overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-table-header border-b border-border-divider">
                            {isAdmin && (
                                <th className="px-6 py-4 text-[11px] font-black text-text-muted uppercase tracking-widest">Employee</th>
                            )}
                            <th className="px-6 py-4 text-[11px] font-black text-text-muted uppercase tracking-widest">Dates & Duration</th>
                            <th className="px-6 py-4 text-[11px] font-black text-text-muted uppercase tracking-widest">Type</th>
                            <th className="px-6 py-4 text-[11px] font-black text-text-muted uppercase tracking-widest">Reason</th>
                            <th className="px-6 py-4 text-[11px] font-black text-text-muted uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-[11px] font-black text-text-muted uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-divider">
                        {loading ? (
                            <tr>
                                <td colSpan={isAdmin ? 6 : 5} className="px-6 py-10 text-center text-gray-500">
                                    Loading requests...
                                </td>
                            </tr>
                        ) : filteredRequests.length === 0 ? (
                            <tr>
                                <td colSpan={isAdmin ? 6 : 5} className="px-6 py-10 text-center text-gray-500">
                                    No leave requests found.
                                </td>
                            </tr>
                        ) : (
                            filteredRequests.map((request) => (
                                <tr key={request.id} className="group hover:bg-table-row-hover transition-colors duration-200">
                                    {isAdmin && (
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-bold text-text-primary group-hover:text-primary-500 transition-colors">{request.userName}</p>
                                                <p className="text-xs font-medium text-text-muted">{request.userRole}</p>
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
                                                <Calendar className="w-3.5 h-3.5 text-primary-500" />
                                                <span>{request.startDate}</span>
                                            </div>
                                            <span className="text-xs font-medium text-text-muted mt-0.5 ml-5.5">to {request.endDate}</span>
                                            <div className="flex items-center gap-2 mt-2 ml-5.5">
                                                <span
                                                    className="text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border italic shadow-sm"
                                                    style={{ backgroundColor: `${colors.primary[500]}15`, color: colors.primary[600], borderColor: `${colors.primary[500]}30` }}
                                                >
                                                    {(request as any).dayType}
                                                </span>
                                                <span className="text-[9px] font-black uppercase bg-input text-text-muted px-2 py-0.5 rounded-lg border border-border-divider shadow-sm whitespace-nowrap">
                                                    {request.totalDays} {request.totalDays === 1 ? 'Day' : 'Days'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-black text-text-secondary uppercase tracking-tight">
                                            {request.leaveType}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-text-secondary leading-relaxed line-clamp-2 italic">
                                            "{request.reason}"
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm"
                                            style={
                                                request.status === 'Approved' ? { backgroundColor: `${colors.primary[500]}15`, color: colors.primary[600], borderColor: `${colors.primary[500]}30` } :
                                                    request.status === 'Rejected' ? { backgroundColor: `${colors.danger[500]}15`, color: colors.danger[600], borderColor: `${colors.danger[500]}30` } :
                                                        { backgroundColor: `${colors.warning[500]}15`, color: colors.warning[600], borderColor: `${colors.warning[500]}30` }
                                            }
                                        >
                                            {request.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            

                                            {/* Admin Actions: Approve/Reject */}
                                            {isAdmin && request.status === 'Pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(request)}
                                                        className="p-2 bg-input border border-border-default text-primary-600 rounded-lg hover:bg-primary-500/10 hover:border-primary-500/30 transition-all"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(request)}
                                                        className="p-2 bg-input border border-border-default text-rose-600 rounded-lg hover:bg-rose-500/10 hover:border-rose-500/30 transition-all"
                                                        title="Reject"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}

                                            <button
                                                onClick={() => handleView(request)}
                                                className="p-2 bg-input border border-border-default text-text-muted rounded-lg hover:bg-hover hover:text-text-primary transition-all shadow-sm"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>

                                            {/* Staff/Admin Actions: Edit/Delete */}
                                            {request.status === 'Pending' && (isAdmin || String(request.userId) === String(currentUser?.id)) && (
                                                <>
                                                    {(canEditLeave || isAdmin) && (
                                                        <button
                                                            onClick={() => handleEdit(request)}
                                                            className="p-2 bg-input border border-border-default text-primary-600 rounded-lg hover:bg-primary-500/10 hover:border-primary-500/30 transition-all"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteRequest(request.id)}
                                                        className="p-2 bg-input border border-border-default text-rose-600 rounded-lg hover:bg-rose-500/10 hover:border-rose-500/30 transition-all shadow-sm"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {processingRequest && (
                <ProcessLeaveModal
                    status={processingRequest.status}
                    userName={processingRequest.userName}
                    onClose={() => setProcessingRequest(null)}
                    onConfirm={handleProcessRequest}
                />
            )}

            {showLeaveModal && (
                <LeaveRequestModal
                    onClose={() => {
                        setShowLeaveModal(false);
                        setEditingRequest(null);
                    }}
                    onSubmit={handleSubmitLeaveRequest}
                    initialData={editingRequest || undefined}
                />
            )}

            {viewingRequest && (
                <LeaveRequestModal
                    onClose={() => setViewingRequest(null)}
                    onSubmit={async () => { }} // No submit in view mode
                    initialData={viewingRequest}
                    isViewOnly={true}
                />
            )}
        </div>
    );
};
