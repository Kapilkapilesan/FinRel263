import React, { useState } from 'react';
import { Edit, Trash2, Unlock, Lock, CheckCircle, XCircle, Clock, AlertCircle, History as HistoryIcon, Eye } from 'lucide-react';
import { colors } from '@/themes/colors';
import { User } from '../../types/staff.types';
import { staffService } from '../../services/staff.service';
import { sessionService } from '../../services/session.service';
import { API_BASE_URL } from '../../services/api.config';
import { StaffDetailsModal } from './StaffDetailsModal';
import { SessionHistoryModal } from './SessionHistoryModal';
import { toast } from 'react-toastify';
import { SecureImage } from '../common/SecureImage';

interface StaffTableProps {
    users: User[];
    onEdit: (user: User) => void;
    onDelete: (userId: string) => void;
    onRefresh?: () => void; // Callback to refresh the list after actions
    showBranch?: boolean;
    showAttendance?: boolean;
}

export function StaffTable({
    users,
    onEdit,
    onDelete,
    onRefresh,
    showBranch = true,
    showAttendance = true,
}: StaffTableProps) {
    const [selectedStaff, setSelectedStaff] = useState<any>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [historyUser, setHistoryUser] = useState<User | null>(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    const handleViewHistory = (user: User) => {
        setHistoryUser(user);
        setShowHistoryModal(true);
    };

    const [confirmModal, setConfirmModal] = useState<{
        show: boolean;
        title: string;
        message: string;
        type: 'warning' | 'danger' | 'info';
        onConfirm: () => void;
        showInput?: boolean;
        inputLabel?: string;
        inputValue?: string;
    }>({
        show: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: () => { },
    });

    const handleNameClick = async (user: User) => {
        // If this user has a staffId, try to fetch full details
        if (user.staffId) {
            setLoadingDetails(true);
            try {
                const staffDetails = await staffService.getStaffDetails(user.staffId);
                if (staffDetails) {
                    setSelectedStaff(staffDetails);
                    setShowDetailsModal(true);
                    return;
                }
            } catch (error) {
                console.error('Failed to load staff details', error);
            } finally {
                setLoadingDetails(false);
            }
        }

        // Fallback: show what we have in User object
        setSelectedStaff({
            ...user,
            full_name: user.name,
            role_name: user.roleName || user.role,
            is_active: user.status === 'Active',
            is_locked: user.is_locked,
        });
        setShowDetailsModal(true);
    };

    // ────────────────────────────────────────────────
    // Manager / Admin Actions
    // ────────────────────────────────────────────────

    const handleDeleteClick = (user: User) => {
        setConfirmModal({
            show: true,
            title: 'Delete User Account',
            message: `Are you sure you want to permanently delete ${user.name?.toUpperCase()}'s account? This action cannot be undone.`,
            type: 'danger',
            onConfirm: async () => {
                setLoadingAction(`delete-${user.id}`);
                try {
                    await onDelete(user.id);
                } finally {
                    setLoadingAction(null);
                }
            },
        });
    };

    const handleUnlockUser = (user: User) => {
        setConfirmModal({
            show: true,
            title: 'Unlock User Account',
            message: `Are you sure you want to unlock ${user.name?.toUpperCase()}'s account? This will restore their access to the system.`,
            type: 'info',
            onConfirm: async () => {
                setLoadingAction(`unlock-${user.id}`);
                try {
                    await sessionService.unlockUserAccount(Number(user.id));
                    toast.success(`${user.name?.toUpperCase()}'s account has been unlocked`);
                    onRefresh?.();
                } catch (error: any) {
                    toast.error(error.message || 'Failed to unlock account');
                } finally {
                    setLoadingAction(null);
                }
            },
        });
    };

    const handleLockUser = (user: User) => {
        setConfirmModal({
            show: true,
            title: 'Lock User Account',
            message: `Are you sure you want to LOCK ${user.name?.toUpperCase()}'s account? This will immediately terminate any active session and prevent further access.`,
            type: 'danger',
            onConfirm: async () => {
                setLoadingAction(`lock-${user.id}`);
                try {
                    await sessionService.lockUserAccount(Number(user.id));
                    toast.success(`${user.name?.toUpperCase()}'s account has been manually locked`);
                    onRefresh?.();
                } catch (error: any) {
                    toast.error(error.message || 'Failed to lock account');
                } finally {
                    setLoadingAction(null);
                }
            },
        });
    };

    const handleApproveAttendance = async (user: User) => {
        if (!user.today_session) return;
        setLoadingAction(`approve-${user.id}`);
        try {
            await sessionService.approveAttendance(user.today_session.id);
            toast.success(`Attendance approved for ${user.name?.toUpperCase()}`);
            onRefresh?.();
        } catch (error: any) {
            toast.error(error.message || 'Failed to approve attendance');
        } finally {
            setLoadingAction(null);
        }
    };

    const handleRejectAttendance = (user: User) => {
        if (!user.today_session) return;

        setConfirmModal({
            show: true,
            title: 'Reject Attendance',
            message: `Please provide a reason for rejecting ${user.name?.toUpperCase()}'s attendance for today.`,
            type: 'warning',
            showInput: true,
            inputLabel: 'Rejection Reason',
            inputValue: '',
            onConfirm: async () => {
                const remarks = confirmModal.inputValue;
                if (!remarks) {
                    toast.error('Rejection reason is required');
                    return;
                }
                setLoadingAction(`reject-${user.id}`);
                try {
                    await sessionService.rejectAttendance(user.today_session!.id, remarks);
                    toast.success(`Attendance rejected for ${user.name?.toUpperCase()}`);
                    onRefresh?.();
                } catch (error: any) {
                    toast.error(error.message || 'Failed to reject attendance');
                } finally {
                    setLoadingAction(null);
                }
            },
        });
    };

    // Helpers
    const formatWorkedTime = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    };

    const getAttendanceStatusBadge = (user: User) => {
        const session = user.today_session;
        if (!session) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted-bg text-text-muted rounded text-xs">
                    <Clock className="w-3 h-3" /> NOT LOGGED IN
                </span>
            );
        }

        if (session.status === 'CLOSED') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted-bg text-text-muted rounded text-xs">
                    <Clock className="w-3 h-3" /> LOGGED OUT ({formatWorkedTime(session.worked_minutes)})
                </span>
            );
        }

        switch (session.attendance_status) {
            case 'APPROVED':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded text-xs border border-primary-500/20">
                        <CheckCircle className="w-3 h-3" /> APPROVED
                    </span>
                );
            case 'PENDING':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-warning-500/10 text-warning-600 dark:text-warning-400 rounded text-xs border border-warning-500/20">
                        <AlertCircle className="w-3 h-3" /> PENDING
                    </span>
                );
            case 'REJECTED':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-danger-500/10 text-danger-600 dark:text-danger-400 rounded text-xs border border-danger-500/20">
                        <XCircle className="w-3 h-3" /> REJECTED
                    </span>
                );
            case 'PRESENT':
            default:
                return (
                    <span
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-primary-500/10 text-primary-600 dark:text-primary-400"
                    >
                        <Clock className="w-3 h-3" /> {formatWorkedTime(session.worked_minutes)}
                    </span>
                );
        }
    };

    return (
        <div className="bg-card rounded-3xl border border-border-default overflow-hidden shadow-sm">
            {/* Table Header */}
            <div className="bg-table-header border-b border-border-default px-6 py-3">
                <div className="grid grid-cols-12 gap-6 text-xs font-semibold text-text-muted uppercase">
                    <div
                        className={
                            (showBranch && showAttendance) ? "col-span-2" :
                                (!showBranch && !showAttendance) ? "col-span-3" :
                                    (!showBranch) ? "col-span-3" : "col-span-4"
                        }
                    >
                        Name
                    </div>
                    <div className={(!showBranch && !showAttendance) ? "col-span-3" : "col-span-2"}>Contacts</div>
                    <div className={(!showBranch && !showAttendance) ? "col-span-2" : "col-span-1"}>Role</div>
                    {showBranch && <div className="col-span-1 pl-4">Branch</div>}
                    <div className="col-span-1">Status</div>
                    {showAttendance && <div className="col-span-2">Attendance</div>}
                    <div className="col-span-3">Actions</div>
                </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-border-divider">
                {users.map((user) => {
                    const isStaff = !!user.staffId;
                    const isLocked = user.is_locked;
                    const hasPendingAttendance = user.today_session?.attendance_status === 'PENDING' && user.today_session?.status === 'OPEN';
                    const isBlacklisted = user.is_blacklisted;

                    return (
                        <div
                            key={user.id}
                            className={`px-6 py-4 hover:bg-hover transition-colors ${isBlacklisted ? 'border-l-4 border-danger-500 bg-danger-500/5 dark:bg-danger-500/10' : ''}`}
                        >
                            <div className="grid grid-cols-12 gap-6 items-center">
                                {/* Name + Avatar */}
                                <div
                                    className={
                                        (showBranch && showAttendance) ? "col-span-2 flex items-center gap-3" :
                                            (!showBranch && !showAttendance) ? "col-span-3 flex items-center gap-3" :
                                                (!showBranch) ? "col-span-3 flex items-center gap-3" : "col-span-4 flex items-center gap-3"
                                    }
                                >
                                    <div
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden shadow-inner ${isLocked ? 'bg-danger-600' : 'bg-primary-600'}`}
                                    >
                                        {(user.avatar || user.staffId || user.userName) ? (
                                            <SecureImage
                                                src={user.avatar?.startsWith('http') ? user.avatar : `${API_BASE_URL}/media/staff-profiles/${user.userName || user.staffId}`}
                                                alt={user.name}
                                                className="w-full h-full object-cover"
                                                fallbackName={user.name}
                                            />
                                        ) : (
                                            <span className="text-white text-sm font-semibold">{user.name?.charAt(0)?.toUpperCase()}</span>
                                        )}

                                        {isLocked && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-danger-600 rounded-full flex items-center justify-center z-10">
                                                <AlertCircle className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="min-w-0 flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleNameClick(user)}
                                                disabled={loadingDetails}
                                                className="font-medium truncate text-left underline decoration-dotted hover:decoration-solid transition-all disabled:opacity-50 block text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                                            >
                                                {loadingDetails && user.staffId ? 'Loading...' : user.name?.toUpperCase()}
                                            </button>

                                            {isBlacklisted && (
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter bg-danger-600 text-white animate-pulse">
                                                    Blacklisted
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[10px] font-semibold text-text-muted tracking-wider uppercase">
                                                ID: {user.userName}
                                            </span>
                                            {isLocked && (
                                                <span className="text-[9px] font-black px-1.5 py-0.5 bg-danger-500/10 text-danger-600 dark:text-danger-400 rounded border border-danger-500/20">
                                                    LOCKED
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Contacts */}
                                <div className={(!showBranch && !showAttendance) ? "col-span-3" : "col-span-2"}>
                                    <p className="text-sm text-text-primary truncate" title={user.email}>
                                        {user.email}
                                    </p>
                                    {user.phone && user.phone !== 'N/A' && (
                                        <p className="text-xs text-text-muted mt-0.5">{user.phone}</p>
                                    )}
                                </div>

                                {/* Role */}
                                <div className={(!showBranch && !showAttendance) ? "col-span-2" : "col-span-1"}>
                                    <span
                                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium truncate bg-primary-500/10 text-primary-600 dark:text-primary-400"
                                    >
                                        {user.role?.toUpperCase()}
                                    </span>
                                </div>

                                {/* Branch */}
                                {showBranch && (
                                    <div className="col-span-1 pl-4">
                                        <p className="text-sm text-text-primary truncate">
                                            {(typeof user.branch === 'object' ? (user.branch as any).branch_name : user.branch)?.toUpperCase()}
                                        </p>
                                    </div>
                                )}

                                {/* Status */}
                                <div className="col-span-1">
                                    <span
                                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${user.status === 'Active'
                                            ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                                            : 'bg-muted-bg text-text-muted'
                                            }`}
                                    >
                                        {user.status?.toUpperCase()}
                                    </span>
                                </div>

                                {/* Attendance */}
                                {showAttendance && (
                                    <div className="col-span-2">
                                        {getAttendanceStatusBadge(user)}
                                        {user.today_session?.login_at && (
                                            <div className="text-[10px] text-text-muted mt-1 pl-1">
                                                Login: {new Date(user.today_session.login_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="col-span-3 flex items-center gap-1 flex-wrap">
                                    <button
                                        onClick={() => handleNameClick(user)}
                                        className="p-1.5 rounded transition-colors text-primary-600 dark:text-primary-400 hover:bg-primary-500/10"
                                        title="View Details"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>

                                    <button
                                        onClick={() => handleViewHistory(user)}
                                        className="p-1.5 rounded transition-colors text-primary-600 dark:text-primary-400 hover:bg-primary-500/10"
                                        title="View Activity History"
                                    >
                                        <HistoryIcon className="w-4 h-4" />
                                    </button>

                                    {/* Lock / Unlock logic */}
                                    {isLocked ? (
                                        <button
                                            onClick={() => handleUnlockUser(user)}
                                            disabled={loadingAction === `unlock-${user.id}`}
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 bg-warning-500/10 text-warning-600 dark:text-warning-400 hover:bg-warning-500/20 border border-warning-500/20"
                                            title="Unlock Account and Session"
                                        >
                                            <Unlock className="w-3 h-3" />
                                            {loadingAction === `unlock-${user.id}` ? '...' : 'Unlock'}
                                        </button>
                                    ) : (
                                        (isStaff || (user.role && (user.role.toLowerCase().includes('admin') || user.roleName === 'admin'))) && (
                                            <button
                                                onClick={() => handleLockUser(user)}
                                                disabled={loadingAction === `lock-${user.id}`}
                                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 bg-danger-500/10 text-danger-600 dark:text-danger-400 hover:bg-danger-500/20 border border-danger-500/20"
                                                title="Lock Account"
                                            >
                                                <Lock className="w-3 h-3" />
                                                {loadingAction === `lock-${user.id}` ? '...' : 'Lock'}
                                            </button>
                                        )
                                    )}

                                    {/* Approve / Reject Attendance */}
                                    {showAttendance && hasPendingAttendance && (
                                        <>
                                            <button
                                                onClick={() => handleApproveAttendance(user)}
                                                disabled={loadingAction === `approve-${user.id}`}
                                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 bg-primary-500/10 text-primary-600 dark:text-primary-400 hover:bg-primary-500/20 border border-primary-500/20"
                                                title="Approve Attendance"
                                            >
                                                <CheckCircle className="w-3 h-3" />
                                                {loadingAction === `approve-${user.id}` ? '...' : 'Approve'}
                                            </button>

                                            <button
                                                onClick={() => handleRejectAttendance(user)}
                                                disabled={loadingAction === `reject-${user.id}`}
                                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 bg-danger-500/10 text-danger-600 dark:text-danger-400 hover:bg-danger-500/20 border border-danger-500/20"
                                                title="Reject Attendance"
                                            >
                                                <XCircle className="w-3 h-3" />
                                                {loadingAction === `reject-${user.id}` ? '...' : 'Reject'}
                                            </button>
                                        </>
                                    )}

                                    {/* Edit / Delete */}
                                    <button
                                        onClick={() => onEdit(user)}
                                        className="p-1.5 rounded transition-colors text-primary-600 dark:text-primary-400 hover:bg-primary-500/10"
                                        title="Edit User"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>

                                    <button
                                        onClick={() => handleDeleteClick(user)}
                                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400"
                                        title="Delete User"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {users.length === 0 && (
                <div className="px-6 py-12 text-center bg-card">
                    <p className="text-text-muted">No users found</p>
                </div>
            )}

            {/* Pagination (placeholder – implement real pagination if needed) */}
            <div className="bg-table-header border-t border-border-default px-6 py-3">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-text-muted">
                        Showing <span className="font-medium text-text-primary">{users.length}</span> of <span className="font-medium text-text-primary">{users.length}</span> users
                    </p>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border border-border-default rounded-xl text-sm text-text-secondary hover:bg-card disabled:opacity-50">
                            Previous
                        </button>
                        <button
                            className="px-3 py-1 text-white rounded-xl text-sm bg-primary-600 hover:bg-primary-700 shadow-sm"
                        >
                            1
                        </button>
                        <button className="px-3 py-1 border border-border-default rounded-xl text-sm text-text-secondary hover:bg-card disabled:opacity-50">
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showDetailsModal && selectedStaff && (
                <StaffDetailsModal
                    staff={selectedStaff}
                    onClose={() => {
                        setShowDetailsModal(false);
                        setSelectedStaff(null);
                    }}
                />
            )}

            {showHistoryModal && historyUser && (
                <SessionHistoryModal
                    userId={historyUser.id}
                    userName={historyUser.name}
                    onClose={() => {
                        setShowHistoryModal(false);
                        setHistoryUser(null);
                    }}
                />
            )}

            {/* Confirmation Modal */}
            {confirmModal.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
                    <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-border-default/50">
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${confirmModal.type === 'danger'
                                        ? 'bg-danger-500/10'
                                        : confirmModal.type === 'warning'
                                            ? 'bg-warning-500/10'
                                            : 'bg-primary-500/10'
                                        }`}
                                >
                                    {confirmModal.type === 'danger' ? (
                                        <Lock className="w-6 h-6 text-danger-600" />
                                    ) : confirmModal.type === 'warning' ? (
                                        <AlertCircle className="w-6 h-6 text-warning-600" />
                                    ) : (
                                        <Unlock className="w-6 h-6 text-primary-600" />
                                    )}
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-text-primary">{confirmModal.title}</h3>
                                    <p className="text-text-secondary mt-1 leading-relaxed">{confirmModal.message}</p>

                                    {confirmModal.showInput && (
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-text-secondary mb-1">
                                                {confirmModal.inputLabel}
                                            </label>
                                            <textarea
                                                className="w-full px-4 py-2 bg-input border border-border-default rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-text-primary"
                                                rows={3}
                                                placeholder="Enter reason here..."
                                                value={confirmModal.inputValue}
                                                onChange={(e) => setConfirmModal({ ...confirmModal, inputValue: e.target.value })}
                                                autoFocus
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-muted-bg/30 flex items-center justify-end gap-3 border-t border-border-default/50">
                            <button
                                onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                                className="px-6 py-2.5 text-sm font-semibold text-text-muted hover:text-text-primary transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    confirmModal.onConfirm();
                                    setConfirmModal({ ...confirmModal, show: false });
                                }}
                                className={`px-8 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 ${confirmModal.type === 'danger'
                                    ? 'bg-danger-600 hover:bg-danger-700 shadow-danger-200 dark:shadow-none'
                                    : confirmModal.type === 'warning'
                                        ? 'bg-warning-600 hover:bg-warning-700 shadow-warning-200 dark:shadow-none'
                                        : 'bg-primary-600 hover:bg-primary-700 shadow-primary-200 dark:shadow-none'
                                    }`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}