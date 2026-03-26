import React from 'react';
import { ActionConfirmModal } from '@/components/common/ActionConfirmModal';
import { CheckCircle, XCircle } from 'lucide-react';
import { Complaint } from '@/types/complaint.types';
import { StatusBadge, PriorityBadge } from '../shared/ComplaintBadges';
import { authService } from '@/services/auth.service';

interface ViewComplaintModalProps {
    complaint: Complaint;
    onClose: () => void;
    onStatusChange: (ticketId: string, status: Complaint['status']) => void;
    onFeedbackUpdate?: (ticketId: string, feedback: string) => Promise<void>;
}

export const ViewComplaintModal: React.FC<ViewComplaintModalProps> = ({ complaint, onClose, onStatusChange, onFeedbackUpdate }) => {
    const user = authService.getCurrentUser();
    const isCreator = user?.user_name === complaint.assignerId;
    const isAssignee = user && complaint.assigneeId && String(complaint.assigneeId) === String(user.id);
    // Only admins (complaints.manage) can change status
    const canManage = authService.hasPermission('complaints.manage');
    // Creators and assignees can still interact (feedback, view details)
    const canInteract = canManage || isCreator || isAssignee;
    const [feedback, setFeedback] = React.useState(complaint.feedback || '');
    const [isSavingFeedback, setIsSavingFeedback] = React.useState(false);
    const [confirmState, setConfirmState] = React.useState<{
        isOpen: boolean;
        targetStatus: Complaint['status'];
    }>({
        isOpen: false,
        targetStatus: 'Open'
    });

    const handleSaveFeedback = async () => {
        if (!onFeedbackUpdate) return;
        setIsSavingFeedback(true);
        try {
            await onFeedbackUpdate(complaint.id, feedback);
        } finally {
            setIsSavingFeedback(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all animate-in fade-in duration-200">
            <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-border-default">

                {/* Header Section */}
                <div className="p-6 border-b border-border-divider bg-table-header">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 bg-primary-500/10 px-2.5 py-1 rounded-lg">
                                Complaint Details
                            </span>
                            <h2 className="text-2xl font-black text-text-primary mt-3">{complaint.complaintId || complaint.ticketNo}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-text-secondary font-bold tracking-tight">{complaint.subject}</p>
                                {complaint.complaintId && (
                                    <span className="text-[10px] text-text-muted font-black uppercase opacity-60">Ref: {complaint.ticketNo}</span>
                                )}
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-hover rounded-full transition-colors text-text-muted">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Status</p>
                            {canManage ? (
                                <div className="flex flex-col gap-2">
                                    <select
                                        value={complaint.status}
                                        onChange={e => setConfirmState({
                                            isOpen: true,
                                            targetStatus: e.target.value as Complaint['status']
                                        })}
                                        className={`block w-full pl-3 pr-8 py-2 text-xs font-black rounded-xl border-0 ring-1 ring-inset focus:ring-2 appearance-none cursor-pointer transition-all ${complaint.status === 'Open' ? 'bg-rose-500/10 text-rose-600 ring-rose-500/20' :
                                            complaint.status === 'In Progress' ? 'bg-amber-500/10 text-amber-600 ring-amber-500/20' :
                                                complaint.status === 'Resolved' ? 'bg-primary-500/10 text-primary-600 ring-primary-500/20' :
                                                    complaint.status === 'Rejected' ? 'bg-orange-500/10 text-orange-600 ring-orange-500/20' :
                                                        'bg-input text-text-primary ring-border-default'
                                            }`}
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.2em 1.2em', backgroundRepeat: 'no-repeat' }}
                                    >
                                        <option value="Open">Open</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Resolved">Resolved</option>
                                        <option value="Rejected">Rejected</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                    {(complaint.status === 'Open' || complaint.status === 'In Progress') && (
                                        <div className="flex flex-col gap-2 w-full mt-1">
                                            <button
                                                onClick={() => setConfirmState({
                                                    isOpen: true,
                                                    targetStatus: 'Resolved'
                                                })}
                                                className="w-full py-2 bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-700 transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                                            >
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                Quick Resolve
                                            </button>
                                            <button
                                                onClick={() => setConfirmState({
                                                    isOpen: true,
                                                    targetStatus: 'Rejected'
                                                })}
                                                className="w-full py-2 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                                            >
                                                <XCircle className="w-3.5 h-3.5" />
                                                Quick Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="pt-1">
                                    <StatusBadge status={complaint.status} />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Priority</p>
                            <div className="pt-1"><PriorityBadge priority={complaint.priority} /></div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Date Filed</p>
                            <p className="text-sm font-bold text-text-primary">{complaint.date}</p>
                        </div>

                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Branch</p>
                            <p className="text-sm font-bold text-text-primary">{complaint.branch}</p>
                        </div>

                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Category</p>
                            <p className="text-sm font-bold text-text-primary">{complaint.category}</p>
                        </div>

                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Complainant</p>
                            <div className="flex flex-col gap-1.5">
                                <p className="text-sm font-bold text-text-primary leading-tight">{complaint.complainant}</p>
                                <span className="text-[9px] bg-input text-text-muted border border-border-divider w-fit px-2 py-0.5 rounded-lg font-black uppercase tracking-widest">{complaint.complainantType}</span>
                            </div>
                        </div>
                    </div>

                    {/* Content Sections */}
                    <div className="space-y-6">
                        <div className="relative group bg-input/40 p-5 rounded-2xl border border-border-divider">
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">Incident Description</p>
                            <div className="text-sm font-medium text-text-secondary leading-relaxed italic">
                                "{complaint.description}"
                            </div>
                        </div>

                        {(complaint.assignedTo || complaint.assignerName) && (
                            <div className="flex gap-10 py-5 border-y border-border-divider">
                                {complaint.assignedTo && (
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Assigned Personnel</p>
                                        <p className="text-sm font-black text-primary-600 dark:text-primary-400">{complaint.assignedTo}</p>
                                    </div>
                                )}
                                {complaint.assignerName && (
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Registered By</p>
                                        <p className="text-sm font-black text-text-primary">{complaint.assignerName}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Feedback Section */}
                        <div className="relative group pt-4 border-t border-border-divider">
                            <p className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.2em] mb-2.5 flex items-center gap-2">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                                Administrative Feedback
                            </p>
                            {canManage ? (
                                <div className="space-y-3">
                                    <textarea
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        placeholder="Add administrative feedback or notes..."
                                        className="w-full px-4 py-2.5 bg-input border border-border-input rounded-xl focus:ring-2 transition-all outline-none text-sm text-text-primary min-h-[60px] resize-none font-medium italic"
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleSaveFeedback}
                                            disabled={isSavingFeedback || feedback === (complaint.feedback || '')}
                                            className="px-6 py-2.5 bg-primary-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg active:scale-95"
                                        >
                                            {isSavingFeedback ? (
                                                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            ) : 'Update Feedback'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-input/60 border border-border-divider p-5 rounded-2xl text-text-secondary leading-relaxed italic text-sm font-medium">
                                    {complaint.feedback || "No administrative feedback has been registered for this ticket yet."}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-table-header border-t border-border-divider flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-card border border-border-input text-text-secondary font-black text-xs uppercase tracking-widest rounded-xl hover:bg-hover hover:text-text-primary transition-all shadow-sm active:scale-95"
                    >
                        Close Portal
                    </button>
                </div>
            </div>

            {/* Confirmation Modal */}
            <ActionConfirmModal
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={async () => {
                    await onStatusChange(complaint.id, confirmState.targetStatus);
                }}
                title="Confirm Authorization"
                message={`Are you sure you want to change the status of this ticket to ${confirmState.targetStatus.toUpperCase()}?`}
                confirmLabel={`Confirm ${confirmState.targetStatus}`}
                variant={confirmState.targetStatus === 'Resolved' ? 'primary' : 'warning'}
            />
        </div>
    );
};