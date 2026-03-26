'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BMSLoader from '@/components/common/BMSLoader';

import { Center, CenterFormData, TemporaryAssignment } from '../../types/center.types';
import { centerService } from '../../services/center.service';
import { authService } from '../../services/auth.service';

import { CenterForm } from './CenterForm';
import { CenterTable } from './CenterTable';
import { CenterDetailsModal } from './CenterDetailsModal';
import { RejectionModal } from './RejectionModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ActionConfirmModal } from '../common/ActionConfirmModal';
import { AssignCustomersModal } from './AssignCustomersModal';
import { colors } from '@/themes/colors';
import { SearchableSelect } from '../common/SearchableSelect';

export function ViewScheduling() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserHierarchy, setCurrentUserHierarchy] = useState<number>(1000);
  const [hasBranchAssignment, setHasBranchAssignment] = useState<boolean>(true);

  useEffect(() => {
    setCurrentUserHierarchy(authService.getHighestHierarchy());

    // Check for branch assignment if user is field officer
    if (authService.hasRole('field_officer')) {
      const user = authService.getCurrentUser();
      const initialBranchChecked = !!(user?.branch?.id || (user as any)?.branch_id);
      setHasBranchAssignment(initialBranchChecked);

      // Fetch fresh profile to be sure
      authService.getProfile().then(freshUser => {
        const freshBranchId = freshUser?.branch?.id || (freshUser as any)?.branch_id;
        setHasBranchAssignment(!!freshBranchId);
      }).catch(err => console.error("Error refreshing profile for branch check", err));
    }
  }, []);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<Center | null>(null);

  // Details Modal State
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Rejection Modal State
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionCenterId, setRejectionCenterId] = useState<string | null>(null);
  const [rejectionCenterName, setRejectionCenterName] = useState('');

  // Delete Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [centerToDelete, setCenterToDelete] = useState<string | null>(null);

  // Approval Confirmation State
  const [approveConfirm, setApproveConfirm] = useState<{ isOpen: boolean; centerId: string | null }>({
    isOpen: false,
    centerId: null
  });

  // Status Toggle Confirmation State
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [centerToToggle, setCenterToToggle] = useState<Center | null>(null);

  // Assign Customers Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningCenter, setAssigningCenter] = useState<Center | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [statusTab, setStatusTab] = useState<'active' | 'inactive' | 'rejected' | 'disabled'>('active');

  // Temporary Assignments
  const [temporaryAssignments] = useState<TemporaryAssignment[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('temporaryAssignments');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const loadCenters = async (isBackground = false) => {
    try {
      if (!isBackground) setIsLoading(true);
      const data = await centerService.getCenters();
      setCenters(data);
    } catch (err: any) {
      console.error('Failed to load centers:', err);
      if (!isBackground) setError(err.message || 'Failed to load centers. Please check your connection.');
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCenters();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      // Check if any modal is open - don't refresh if user is currently interacting
      const canRefresh = !isCreateModalOpen &&
        !isDetailsModalOpen &&
        !isRejectionModalOpen &&
        !showDeleteConfirm &&
        !approveConfirm.isOpen &&
        !showStatusConfirm &&
        !isAssignModalOpen;

      if (canRefresh) {
        loadCenters(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [
    isCreateModalOpen,
    isDetailsModalOpen,
    isRejectionModalOpen,
    showDeleteConfirm,
    approveConfirm.isOpen,
    showStatusConfirm,
    isAssignModalOpen
  ]);

  const handleCreateCenter = async (centerData: CenterFormData) => {
    try {
      if (editingCenter) {
        const updatedCenter = await centerService.updateCenter(editingCenter.id, centerData);
        setCenters(centers.map(c => String(c.id) === String(updatedCenter.id) ? updatedCenter : c));
        toast.success('Center updated successfully!');
      } else {
        const newCenter = await centerService.createCenter(centerData);
        setCenters([...centers, newCenter]);
        toast.success('Center created successfully!');
      }
      setIsCreateModalOpen(false);
      setEditingCenter(null);
    } catch (err: any) {
      console.error('Failed to save center:', err);
      const errorMessage = err.errors ?
        Object.values(err.errors).flat().join(', ') :
        err.message || 'Failed to save center';
      toast.error(errorMessage);
      throw err;
    }
  };

  const handleEdit = (centerId: string | number) => {
    const center = centers.find(c => String(c.id) === String(centerId));
    if (center) {
      setEditingCenter(center);
      setIsCreateModalOpen(true);
    }
  };

  const handleViewDetails = (center: Center) => {
    setSelectedCenterId(String(center.id));
    setIsDetailsModalOpen(true);
  };

  const handleApprove = (centerId: string) => {
    if (!authService.hasPermission('centers.approve')) {
      toast.error('You do not have permission to approve centers');
      return;
    }
    setApproveConfirm({ isOpen: true, centerId });
  };

  const confirmApproveCenter = async (note?: string) => {
    if (!approveConfirm.centerId) return;

    try {
      const approvedCenter = await centerService.approveCenter(approveConfirm.centerId, note);
      setCenters(centers.map(c => String(c.id) === String(approvedCenter.id) ? approvedCenter : c));
      toast.success('Center approved successfully!');
      setApproveConfirm({ isOpen: false, centerId: null });
    } catch (err: any) {
      console.error('Failed to approve center:', err);
      toast.error(err.message || 'Failed to approve center');
    }
  };

  const handleReject = (centerId: string) => {
    if (!authService.hasPermission('centers.approve')) {
      toast.error('You do not have permission to reject requests');
      return;
    }

    const center = centers.find(c => String(c.id) === String(centerId));
    if (center) {
      setRejectionCenterId(String(centerId));
      setRejectionCenterName(center.center_name);
      setIsRejectionModalOpen(true);
    }
  };

  const confirmRejection = async (reason: string) => {
    if (!rejectionCenterId) return;

    try {
      await centerService.rejectCenter(rejectionCenterId, reason);
      const data = await centerService.getCenters(); // Refresh list to get updated statuses
      setCenters(data);
      toast.success('Request marked as rejected.');
      setIsRejectionModalOpen(false);
      setRejectionCenterId(null);
    } catch (err: any) {
      console.error('Failed to reject request:', err);
      toast.error(err.message || 'Failed to reject request');
    }
  };

  const handleToggleStatus = (center: Center) => {
    if (center.status === 'active') {
      setCenterToToggle(center);
      setShowStatusConfirm(true);
    } else {
      executeToggleStatus(center);
    }
  };

  const executeToggleStatus = async (center: Center) => {
    try {
      await centerService.toggleCenterStatus(center.id, center.status);
      toast.success(`Center ${center.status === 'active' ? 'disabled' : 'enabled'} successfully!`);
      loadCenters();
    } catch (err: any) {
      console.error('Failed to update center status:', err);
      const errorMessage = err.errors ?
        Object.values(err.errors).flat().join(', ') :
        err.message || 'Failed to update center status';
      toast.error(errorMessage);
    } finally {
      setShowStatusConfirm(false);
      setCenterToToggle(null);
    }
  };

  const handleDeleteCenter = (centerId: string) => {
    setCenterToDelete(centerId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!centerToDelete) return;

    try {
      await centerService.deleteCenter(centerToDelete);
      setCenters(centers.filter(c => String(c.id) !== String(centerToDelete)));
      toast.success('Center deleted successfully!');
    } catch (err: any) {
      console.error('Failed to delete center:', err);
      toast.error(err.message || 'Failed to delete center');
    } finally {
      setCenterToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleAssignCustomers = (center: Center) => {
    setAssigningCenter(center);
    setIsAssignModalOpen(true);
  };

  const handleAssignSuccess = () => {
    loadCenters(); // Refresh the list to show updated counts
  };

  const getTemporaryAssignment = (centerId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return temporaryAssignments.find(assignment =>
      assignment.centerId === centerId &&
      assignment.date === today
    );
  };

  const uniqueStaff = Array.from(new Set(centers.map(c => c.staff?.full_name).filter(Boolean))).sort();
  const userOptions = uniqueStaff.map(name => ({ id: name as string, label: name as string }));
  const dayOptions = daysOfWeek.map(day => ({ id: day, label: day }));

  const filteredCenters = centers.filter(center => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      (center.center_name || '').toLowerCase().includes(query) ||
      (center.CSU_id || '').toLowerCase().includes(query) ||
      (center.branch?.branch_name || '').toLowerCase().includes(query) ||
      (center.branch?.branch_id || '').toLowerCase().includes(query) ||
      String(center.branch_id || '').toLowerCase().includes(query);

    const matchesDay = !selectedDay || (center.open_days && center.open_days.some(s => s.day === selectedDay));
    const matchesUser = !selectedUser || center.staff?.full_name === selectedUser;
    const matchesStatus = center.status === statusTab;
    return matchesSearch && matchesDay && matchesUser && matchesStatus;
  });

  const pendingCount = centers.filter(c => c.status === 'inactive').length;
  const rejectedCount = centers.filter(c => c.status === 'rejected').length;
  const disabledCount = centers.filter(c => c.status === 'disabled').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <BMSLoader message="Loading schedule..." size="xsmall" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-600">
        <p>{error}</p>
        <button
          onClick={() => loadCenters()}
          style={{ backgroundColor: colors.primary[600] }}
          className="mt-4 px-4 py-2 text-white rounded-lg hover:opacity-90 font-medium text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  // Permissions
  const canApprove = authService.hasPermission('centers.approve');
  const canReject = authService.hasPermission('centers.approve');
  const canDelete = authService.hasPermission('centers.delete');
  const canEdit = authService.hasPermission('centers.edit');
  const canAssign = authService.hasPermission('centers.assign');
  const canToggleStatus = authService.hasPermission('centers.status');
  const canViewPending = authService.hasPermission('centers.view_pending');
  const canViewRejected = authService.hasPermission('centers.view_rejected');
  const canViewDisabled = authService.hasPermission('centers.view_disabled');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Center Scheduling</h1>
          <p className="text-sm text-text-muted mt-1">View and manage center meeting schedules</p>
        </div>
        {authService.hasPermission('centers.create') && (() => {
          const isFieldOfficer = authService.hasRole('field_officer');
          const isDisabled = isFieldOfficer && !hasBranchAssignment;

          return (
            <button
              onClick={() => {
                if (isDisabled) {
                  toast.error("You don't have an assigned branch. Please contact Admin to assign a branch before creating a center.");
                  return;
                }
                setIsCreateModalOpen(true);
              }}
              style={{
                backgroundImage: isDisabled
                  ? 'none'
                  : `linear-gradient(to right, ${colors.primary[600]}, ${colors.primary[400]})`,
                backgroundColor: isDisabled ? 'var(--muted-bg)' : undefined,
                color: isDisabled ? 'var(--text-muted)' : 'white',
                border: isDisabled ? '1px solid var(--border-default)' : 'none'
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl shadow-lg transition-all font-bold text-sm ${isDisabled ? 'cursor-not-allowed grayscale' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
              title={isDisabled ? "Contact Admin to assign branch" : ""}
            >
              <Plus className="w-4 h-4" />
              Create Center
            </button>
          );
        })()}
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 border-b border-border-default">
        <button
          onClick={() => setStatusTab('active')}
          className={`px-6 py-3 text-sm font-black border-b-2 transition-all ${statusTab === 'active'
            ? 'text-indigo-600 dark:text-indigo-400'
            : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          style={statusTab === 'active' ? { borderColor: colors.primary[600], color: colors.primary[600] } : {}}
        >
          Active Centers
        </button>
        {canViewPending && (
          <button
            onClick={() => setStatusTab('inactive')}
            className={`px-6 py-3 text-sm font-black border-b-2 transition-all flex items-center gap-2 ${statusTab === 'inactive'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            style={statusTab === 'inactive' ? { borderColor: colors.primary[600], color: colors.primary[600] } : {}}
          >
            Pending Approvals
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] rounded-full font-black">
                {pendingCount}
              </span>
            )}
          </button>
        )}
        {canViewRejected && (
          <button
            onClick={() => setStatusTab('rejected')}
            className={`px-6 py-3 text-sm font-black border-b-2 transition-all flex items-center gap-2 ${statusTab === 'rejected'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            style={statusTab === 'rejected' ? { borderColor: colors.primary[600], color: colors.primary[600] } : {}}
          >
            Rejected Requests
            {rejectedCount > 0 && (
              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] rounded-full font-black">
                {rejectedCount}
              </span>
            )}
          </button>
        )}
        {canViewDisabled && (
          <button
            onClick={() => setStatusTab('disabled')}
            className={`px-6 py-3 text-sm font-black border-b-2 transition-all flex items-center gap-2 ${statusTab === 'disabled'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            style={statusTab === 'disabled' ? { borderColor: colors.primary[600], color: colors.primary[600] } : {}}
          >
            Disabled Centers
            {disabledCount > 0 && (
              <span className="px-2 py-0.5 bg-muted text-text-muted text-[10px] rounded-full font-black">
                {disabledCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border border-border-default p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search centers by name, number, or branch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-input border border-border-default rounded-xl outline-none focus:ring-2 transition-all text-text-primary"
                style={{ '--tw-ring-color': `${colors.primary[500]}30` } as any}
              />
            </div>
          </div>

          <div className="min-w-[200px]">
            <SearchableSelect
              options={dayOptions}
              value={selectedDay}
              onChange={(val) => setSelectedDay(val as string || '')}
              placeholder="All Days"
              searchPlaceholder="Search days..."
            />
          </div>

          <div className="min-w-[240px]">
            <SearchableSelect
              options={userOptions}
              value={selectedUser}
              onChange={(val) => setSelectedUser(val as string || '')}
              placeholder="All Users"
              searchPlaceholder="Search users..."
            />
          </div>
        </div>
      </div>

      {/* Centers Table */}
      <CenterTable
        centers={filteredCenters}
        totalCenters={centers.length}
        getTemporaryAssignment={getTemporaryAssignment}
        onEdit={canEdit ? handleEdit : undefined}
        onApprove={canApprove ? handleApprove : undefined}
        onReject={canReject ? handleReject : undefined}
        onViewDetails={handleViewDetails}
        onDelete={canDelete ? handleDeleteCenter : undefined}
        onToggleStatus={canToggleStatus ? handleToggleStatus : undefined}
        onAssignCustomers={canAssign ? handleAssignCustomers : undefined}
        isFieldOfficer={currentUserHierarchy >= 250}
        isManager={currentUserHierarchy < 250 && currentUserHierarchy >= 50}
        isSuperAdmin={currentUserHierarchy < 50}
      />

      {filteredCenters.length === 0 && (
        <div className="bg-card rounded-lg border border-border-default p-8 text-center">
          <Users className="w-12 h-12 text-text-muted opacity-20 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-text-primary mb-2">No centers found</h3>
          <p className="text-text-muted">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* Create/Edit Center Modal */}
      <CenterForm
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingCenter(null);
        }}
        initialData={editingCenter}
        onSubmit={handleCreateCenter}
      />

      {/* Center Details Modal */}
      {selectedCenterId && (
        <CenterDetailsModal
          centerId={selectedCenterId}
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedCenterId(null);
          }}
          onApprove={canApprove ? handleApprove : undefined}
          onReject={canReject ? handleReject : undefined}
          onEdit={canEdit ? handleEdit : undefined}
          onDelete={canDelete ? handleDeleteCenter : undefined}
          isFieldOfficer={!authService.hasPermission('dashboard.view_all_branches')}
        />
      )}

      {/* Rejection Reason Modal */}
      <RejectionModal
        isOpen={isRejectionModalOpen}
        onClose={() => setIsRejectionModalOpen(false)}
        onConfirm={confirmRejection}
        centerName={rejectionCenterName}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Center"
        message="Are you sure you want to delete this center? This action cannot be undone and may affect related groups and members."
        confirmText="Delete Center"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setCenterToDelete(null);
        }}
      />

      {/* Status Toggle Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showStatusConfirm}
        title="Disable Center"
        message={`Are you sure you want to disable the center "${centerToToggle?.center_name}"? This will prevent new loans and activities in this center.`}
        confirmText="Disable Center"
        cancelText="Cancel"
        variant="warning"
        onConfirm={() => centerToToggle && executeToggleStatus(centerToToggle)}
        onCancel={() => {
          setShowStatusConfirm(false);
          setCenterToToggle(null);
        }}
      />

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
      {/* Modal JSX End */}

      {/* Approval Confirmation Modal */}
      <ActionConfirmModal
        isOpen={approveConfirm.isOpen}
        onClose={() => setApproveConfirm({ isOpen: false, centerId: null })}
        onConfirm={confirmApproveCenter}
        title="Approve Center"
        message="Are you sure you want to approve this center? This will enable it for customer assignments and financial activities."
        confirmLabel="Approve Center"
        variant="primary"
        showNoteInput={true}
      />

    </div>
  );
}


