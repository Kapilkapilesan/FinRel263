'use client'

import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Clock, MapPin, User, Users, X, Plus, Eye, Trash2 } from 'lucide-react';
import { Center, TemporaryAssignment } from '../../types/center.types';
import { centerService } from '../../services/center.service';
import { branchService } from '../../services/branch.service';
import { API_BASE_URL, getHeaders } from '../../services/api.config';
import { Branch } from '../../types/branch.types';
import { Staff } from '../../types/staff.types';
import { AssignCustomersModal } from './AssignCustomersModal';
import { colors } from '@/themes/colors';
import BMSLoader from '../common/BMSLoader';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { toast } from 'react-toastify';
import { CheckCircle2, ShieldCheck, UserCog } from 'lucide-react';
import { SearchableSelect } from '../common/SearchableSelect';
import { Pagination } from '../common/Pagination';

export function ViewMeetingScheduling() {
    const [centers, setCenters] = useState<Center[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedUser, setSelectedUser] = useState('');
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [showModal, setShowModal] = useState(false);
    const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
    const [temporaryAssignments, setTemporaryAssignments] = useState<TemporaryAssignment[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('temporaryAssignments');
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });

    const [assignmentForm, setAssignmentForm] = useState({
        temporaryUser: '',
        staffId: '',
        date: '',
        reason: '',
        type: 'temporary' as 'temporary' | 'permanent'
    });

    const [branches, setBranches] = useState<Branch[]>([]);
    const [staffList, setStaffList] = useState<Staff[]>([]);

    // Assign Customers Modal State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assigningCenter, setAssigningCenter] = useState<Center | null>(null);

    // Confirmation Dialog State
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    useEffect(() => {
        loadCenters();
    }, []);

    const loadCenters = async () => {
        try {
            setIsLoading(true);
            const [centersData, branchesData, fieldOfficersResponse] = await Promise.all([
                centerService.getCentersList(),
                branchService.getBranchesAll(),
                fetch(`${API_BASE_URL}/staffs/by-role/field_officer`, {
                    headers: getHeaders(),
                    credentials: 'include'
                }).then(res => res.ok ? res.json() : { data: [] })
            ]);

            setCenters(centersData || []);
            setBranches(branchesData || []);

            // Log for debugging (though USER won't see it directly, it ensures we follow CenterForm pattern)
            if (fieldOfficersResponse?.data && Array.isArray(fieldOfficersResponse.data)) {
                setStaffList(fieldOfficersResponse.data);
            } else if (Array.isArray(fieldOfficersResponse)) {
                setStaffList(fieldOfficersResponse);
            } else {
                setStaffList([]);
            }
        } catch (err: any) {
            console.error("Error loading meeting scheduling data:", err);
            setError(err.message || 'Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const branchOptions = branches.map(b => ({ id: b.id, label: b.branch_name }));
    const staffOptions = staffList.map(s => ({ id: s.staff_id, label: s.full_name, subLabel: s.staff_id }));

    const filteredCenters = centers.filter(center => {
        if (center.status === 'rejected') return false;
        if (selectedBranch && String(center.branch_id) !== String(selectedBranch)) return false;
        if (selectedUser && String(center.staff_id) !== String(selectedUser)) return false;
        return true;
    });

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedBranch, selectedUser]);

    // Calculate pagination
    const totalItems = filteredCenters.length;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCenters = filteredCenters.slice(startIndex, endIndex);

    const handleCardClick = (center: Center) => {
        setSelectedCenter(center);
        setAssignmentForm({
            temporaryUser: '',
            staffId: '',
            date: new Date().toISOString().split('T')[0],
            reason: '',
            type: 'temporary'
        });
        setShowModal(true);
    };

    const executeAssignment = async () => {
        if (!selectedCenter || !assignmentForm.staffId) return;

        // Check for existing assignment for the same staff on the same date at this center
        const targetDate = assignmentForm.type === 'temporary' ? assignmentForm.date : new Date().toISOString().split('T')[0];

        // Prevent assigning the same person who is already the primary officer
        if (selectedCenter.staff_id === assignmentForm.staffId) {
            toast.warning(`This staff is already the primary officer for ${selectedCenter.center_name}`);
            return;
        }

        // Check if this staff is already assigned for this date (across any center)
        const existingAssignment = temporaryAssignments.find(a => 
            a.date === targetDate &&
            (a.temporaryUser.includes(`(${assignmentForm.staffId})`) || a.temporaryUser === assignmentForm.staffId)
        );

        if (existingAssignment) {
            const sameCenter = existingAssignment.centerId === selectedCenter.id;
            const existingCenterName = centers.find(c => c.id === existingAssignment.centerId)?.center_name || 'another center';
            toast.warning(
                sameCenter 
                ? `This staff is already assigned to this center for ${targetDate}`
                : `This staff is already assigned to ${existingCenterName} for ${targetDate}`
            );
            return;
        }

        try {
            await centerService.assignStaff(selectedCenter.id, {
                staff_id: assignmentForm.staffId,
                type: assignmentForm.type,
                date: assignmentForm.date,
                reason: assignmentForm.reason
            });

            const originalUserDisplay = selectedCenter.staff?.full_name
                ? `${selectedCenter.staff.full_name} (${selectedCenter.staff_id})`
                : selectedCenter.staff_id;

            const temporaryUserDisplay = assignmentForm.temporaryUser && assignmentForm.staffId
                ? `${assignmentForm.temporaryUser} (${assignmentForm.staffId})`
                : (assignmentForm.temporaryUser || assignmentForm.staffId);

            const newAssignment: TemporaryAssignment = {
                centerId: selectedCenter.id,
                originalUser: originalUserDisplay,
                temporaryUser: temporaryUserDisplay,
                date: assignmentForm.type === 'temporary' ? assignmentForm.date : new Date().toISOString().split('T')[0],
                reason: assignmentForm.reason || (assignmentForm.type === 'permanent' ? 'Permanent Assignment' : ''),
                type: assignmentForm.type
            };

            const updatedAssignments = [...temporaryAssignments, newAssignment];
            setTemporaryAssignments(updatedAssignments);
            localStorage.setItem('temporaryAssignments', JSON.stringify(updatedAssignments));

            toast.success(`Staff assigned ${assignmentForm.type}ly successfully`);

            // Refresh centers list
            loadCenters();

            setShowModal(false);
        } catch (err: any) {
            toast.error(err.message || 'Failed to assign staff');
        }
    };

    const handleSaveAssignment = () => {
        if (selectedCenter && assignmentForm.staffId) {
            executeAssignment();
        }
    };

    const handleAssignCustomers = (e: React.MouseEvent, center: Center) => {
        e.stopPropagation(); // Don't trigger card click (temporary assignment)
        setAssigningCenter(center);
        setIsAssignModalOpen(true);
    };

    const handleAssignSuccess = () => {
        loadCenters();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
                <BMSLoader message="Loading Centers..." size="medium" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-red-600">
                <p>{error}</p>
                <button
                    onClick={loadCenters}
                    style={{ backgroundColor: colors.primary[600] }}
                    className="mt-4 px-4 py-2 text-white rounded-lg hover:opacity-90 font-medium text-sm"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-text-primary">View Meeting Scheduling</h1>
                <p className="text-sm text-text-muted mt-1">Manage temporary user assignments for center meetings</p>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-xl border border-border-default p-4 transition-colors shadow-sm">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[240px]">
                        <SearchableSelect
                            label="Branch"
                            options={branchOptions}
                            value={selectedBranch}
                            onChange={(val) => setSelectedBranch(val as string || '')}
                            placeholder="All Branches"
                            searchPlaceholder="Search branches..."
                        />
                    </div>

                    <div className="flex-1 min-w-[240px]">
                        <SearchableSelect
                            label="User"
                            options={staffOptions}
                            value={selectedUser}
                            onChange={(val) => setSelectedUser(val as string || '')}
                            placeholder="All Users"
                            searchPlaceholder="Search users..."
                        />
                    </div>
                </div>
            </div>

            {/* Centers List View */}
            <div className="bg-card rounded-xl border border-border-default overflow-hidden shadow-sm">
                {/* Header */}
                <div className="hidden lg:grid grid-cols-12 gap-4 bg-table-header border-b border-border-divider px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-widest">
                    <div className="col-span-3">Center Info</div>
                    <div className="col-span-3">Meeting Schedule</div>
                    <div className="col-span-3 text-center">Stats (G/M/L)</div>
                    <div className="col-span-3 text-right">Status & Action</div>
                </div>

                <div className="divide-y divide-border-divider">
                    {paginatedCenters.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <Users className="w-12 h-12 text-text-muted opacity-20 mx-auto mb-3" />
                            <p className="text-text-muted text-sm italic font-medium">No centers found.</p>
                        </div>
                    ) : (
                        paginatedCenters.map((center) => (
                            <div 
                                key={center.id} 
                                onClick={() => handleCardClick(center)}
                                className="group hover:bg-table-row-hover transition-all duration-200 cursor-pointer"
                            >
                                <div className="px-6 py-3">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
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
                                                    <span className="text-sm font-black text-text-primary group-hover:text-primary-600 transition-colors uppercase">
                                                        {center.center_name}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-text-muted font-bold tracking-tight uppercase">{center.CSU_id}</p>
                                            </div>
                                        </div>

                                        {/* Schedule */}
                                        <div className="lg:col-span-3">
                                            <div className="bg-input rounded-lg p-2 border border-border-divider max-w-[200px]">
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
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="lg:col-span-3">
                                            <div className="flex items-center justify-center gap-4">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">G</span>
                                                    <span className="text-sm font-black text-text-primary">{center.groups_count ?? center.group_count ?? 0}</span>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">M</span>
                                                    <span className="text-sm font-black text-text-primary">{center.customers_count ?? center.totalMembers ?? 0}</span>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">L</span>
                                                    <span className="text-sm font-black text-text-primary">{center.loans_count ?? center.totalLoans ?? 0}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status & Action */}
                                        <div className="lg:col-span-3 flex items-center justify-end gap-3">
                                            <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-full ${
                                                center.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {center.status}
                                            </span>
                                            <div className="p-1.5 rounded-lg bg-muted-bg text-text-muted group-hover:bg-primary-50 group-hover:text-primary-600 transition-all border border-transparent group-hover:border-primary-100">
                                                <Eye className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                <Pagination
                    currentPage={currentPage}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                    itemName="centers"
                />
            </div>

            {/* Modal */}
            {showModal && selectedCenter && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-2xl max-w-md w-full max-h-[min(700px,90vh)] flex flex-col shadow-2xl border border-border-default transform transition-all">
                        <div className="p-6 border-b border-border-divider">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-text-primary">Temporary User Assignment</h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-1 hover:bg-hover rounded transition-colors"
                                >
                                    <X className="w-5 h-5 text-text-muted" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                            <div className="bg-app-background rounded-lg p-4 space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Center Name</label>
                                    <p className="text-sm font-semibold text-text-primary">{selectedCenter.center_name}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Center Time</label>
                                    <p className="text-sm font-semibold text-text-primary">
                                        {selectedCenter.open_days?.map(d => `${d.time} (${d.day})`).join(', ') || 'No schedule'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Center User</label>
                                    <p className="text-sm font-semibold text-text-primary">
                                        {selectedCenter.staff?.full_name
                                            ? `${selectedCenter.staff.full_name} (${selectedCenter.staff_id})`
                                            : selectedCenter.staff_id}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Center Location</label>
                                    <p className="text-sm font-semibold text-text-primary">{selectedCenter.address}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pb-2">
                                <button
                                    type="button"
                                    onClick={() => setAssignmentForm({ ...assignmentForm, type: 'temporary' })}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-bold text-sm ${assignmentForm.type === 'temporary'
                                        ? 'border-primary-500 bg-primary-500/10 text-primary-600'
                                        : 'border-border-default bg-card text-text-secondary hover:bg-hover'
                                        }`}
                                >
                                    <Clock className="w-4 h-4" />
                                    Temporary
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAssignmentForm({ ...assignmentForm, type: 'permanent' })}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-bold text-sm ${assignmentForm.type === 'permanent'
                                        ? 'border-primary-500 bg-primary-500/10 text-primary-600'
                                        : 'border-border-default bg-card text-text-secondary hover:bg-hover'
                                        }`}
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    Permanent
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">Assign Field Officer *</label>
                                    <SearchableSelect
                                        options={staffOptions}
                                        value={assignmentForm.staffId}
                                        onChange={(val) => {
                                            const staffId = val as string;
                                            const staff = staffList.find(s => s.staff_id === staffId);
                                            setAssignmentForm({
                                                ...assignmentForm,
                                                staffId: staffId || '',
                                                temporaryUser: staff ? staff.full_name : ''
                                            });
                                        }}
                                        placeholder="Select Field Officer"
                                        searchPlaceholder="Search field officers..."
                                    />
                                </div>

                                {assignmentForm.type === 'temporary' && (
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">Assignment Date *</label>
                                        <input
                                            type="date"
                                            value={assignmentForm.date}
                                            onChange={(e) => setAssignmentForm({ ...assignmentForm, date: e.target.value })}
                                            className="w-full px-3 py-2 border border-border-default bg-input text-text-primary rounded-lg outline-none focus:ring-2 transition-all"
                                            style={{ '--tw-ring-color': colors.primary[500] } as any}
                                            required
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">Reason</label>
                                    <textarea
                                        value={assignmentForm.reason}
                                        onChange={(e) => setAssignmentForm({ ...assignmentForm, reason: e.target.value })}
                                        rows={3}
                                        placeholder="Reason for temporary assignment..."
                                        className="w-full px-3 py-2 border border-border-default bg-input text-text-primary rounded-lg outline-none focus:ring-2 transition-all resize-none"
                                        style={{ '--tw-ring-color': colors.primary[500] } as any}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-5 border-t border-border-divider flex items-center gap-3 justify-end bg-muted-bg/50 rounded-b-2xl">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-6 py-2.5 border border-border-default bg-card text-text-secondary rounded-xl hover:bg-hover transition-all font-black text-[11px] uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveAssignment}
                                disabled={!assignmentForm.staffId || (assignmentForm.type === 'temporary' && !assignmentForm.date)}
                                style={{ backgroundColor: colors.primary[600] }}
                                className="px-8 py-2.5 text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary-500/20"
                            >
                                Assign Staff
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assignments Summary */}
            {temporaryAssignments.length > 0 && (
                <div className="bg-card rounded-lg border border-border-default p-6">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Assignments</h3>
                    <div className="space-y-3">
                        {temporaryAssignments.slice().reverse().slice(0, 5).map((assignment, index) => {
                            const center = centers.find(c => c.id === assignment.centerId);
                            const isTemporary = assignment.type === 'temporary' || !assignment.type;
                            return (
                                <div key={index} className="flex items-center justify-between p-3 bg-muted-bg rounded-lg border border-border-default/50">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isTemporary ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                            {isTemporary ? <Clock className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-text-primary">
                                                {center?.center_name}
                                                <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${isTemporary ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                                                    {isTemporary ? 'Temp' : 'Perm'}
                                                </span>
                                            </p>
                                            <p className="text-xs text-text-muted">
                                                {assignment.originalUser} → {assignment.temporaryUser} on {assignment.date}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-text-muted italic hidden sm:block">{assignment.reason}</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const updated = temporaryAssignments.filter((_, i) => i !== (temporaryAssignments.length - 1 - index));
                                                setTemporaryAssignments(updated);
                                                localStorage.setItem('temporaryAssignments', JSON.stringify(updated));
                                                toast.info("Assignment record removed from history");
                                            }}
                                            className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Remove from history"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Assign Customers Modal */}
            {assigningCenter && (
                <AssignCustomersModal
                    isOpen={isAssignModalOpen}
                    center={assigningCenter}
                    onClose={() => {
                        setIsAssignModalOpen(false);
                        setAssigningCenter(null);
                    }}
                    onAssignSuccess={handleAssignSuccess}
                />
            )}
            {/* Confirmation Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText="Overwrite"
                cancelText="Cancel"
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                variant="warning"
            />
        </div>
    );
}
