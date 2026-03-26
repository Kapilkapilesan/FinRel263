"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { Branch, BranchStats as BranchStatsType, BranchFormData } from '../../types/branch.types';
import { branchService } from '../../services/branch.service';
import { BranchStats } from '../../components/branches/BranchStats';
import { BranchTable } from '../../components/branches/BranchTable';
import { BranchForm } from '../../components/branches/BranchForm';
import { BranchDetailModal } from '../../components/branch/BranchDetailModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { colors } from '../../themes/colors';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { authService } from '../../services/auth.service';
import { useRouter } from 'next/navigation';
import BMSLoader from '../../components/common/BMSLoader';

export default function BranchManagementPage() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [viewingBranch, setViewingBranch] = useState<Branch | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [branchToDelete, setBranchToDelete] = useState<number | null>(null);
    const [showStatusConfirm, setShowStatusConfirm] = useState(false);
    const [branchToToggle, setBranchToToggle] = useState<Branch | null>(null);
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);
    const router = useRouter();

    // Permission-based UI control flags
    const canCreate = authService.hasModulePermission('branches', 'create');
    const canEdit = authService.hasModulePermission('branches', 'edit');
    const canDelete = authService.hasModulePermission('branches', 'delete');
    const canToggleStatus = authService.hasModulePermission('branches', 'status');

    // Initial data fetch and security check
    useEffect(() => {
        const checkAccess = () => {
            const hasViewPermission = authService.hasModulePermission('branches', 'view');

            if (!hasViewPermission) {
                router.push('/');
                return false;
            }
            return true;
        };

        if (typeof window !== 'undefined') {
            const allowed = checkAccess();
            setHasAccess(allowed);
            if (allowed) loadBranches();
        }
    }, [router]);

    const loadBranches = async () => {
        try {
            setLoading(true);
            const data = await branchService.getBranches();
            setBranches(data);
        } catch (error) {
            console.error('Failed to load branches:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingBranch(null);
        setShowModal(true);
    };

    const handleEdit = (branch: Branch) => {
        setEditingBranch(branch);
        setShowModal(true);
    };

    const handleViewDetail = async (branch: Branch) => {
        try {
            // Fetch fresh data with all relations
            const fullBranch = await branchService.getBranchById(branch.id);
            setViewingBranch(fullBranch);
            setShowDetailModal(true);
        } catch (error) {
            console.error('Failed to load branch details:', error);
            toast.error('Failed to load full branch details');
        }
    };

    const handleDelete = (id: number) => {
        setBranchToDelete(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (branchToDelete === null) return;

        try {
            await branchService.deleteBranch(branchToDelete);
            await loadBranches();
            toast.success('Branch deleted successfully!');
        } catch (error: any) {
            console.error('Failed to delete branch:', error);
            const errorMessage = error.message || 'Failed to delete branch. It may be in use.';
            toast.error(errorMessage);
        } finally {
            setBranchToDelete(null);
        }
    };

    const handleSave = async (formData: BranchFormData) => {
        try {
            if (editingBranch) {
                await branchService.updateBranch(editingBranch.id, formData);
                toast.success('Branch updated successfully!');
            } else {
                await branchService.createBranch(formData);
                toast.success('Branch created successfully!');
            }
            setShowModal(false);
            loadBranches();
        } catch (error: any) {
            console.error('Failed to save branch:', error);
            const errorMessage = error.errors ?
                Object.values(error.errors).flat().join(', ') :
                error.message || 'Failed to save branch';
            toast.error(errorMessage);
        }
    };

    const handleToggleStatus = (branch: Branch) => {
        setBranchToToggle(branch);
        setShowStatusConfirm(true);
    };

    const confirmToggleStatus = async () => {
        if (!branchToToggle) return;

        try {
            await branchService.toggleBranchStatus(branchToToggle.id, branchToToggle.status);
            toast.success(`Branch ${branchToToggle.status === 'active' ? 'disabled' : 'enabled'} successfully!`);
            loadBranches();
        } catch (error: any) {
            console.error('Failed to update branch status:', error);
            const errorMessage = error.errors ?
                Object.values(error.errors).flat().join(', ') :
                error.message || 'Failed to update branch status';
            toast.error(errorMessage);
        } finally {
            setShowStatusConfirm(false);
            setBranchToToggle(null);
        }
    };

    // Filter branches based on search
    const filteredBranches = branches.filter(branch => {
        const searchLower = searchTerm.trim().toLowerCase();
        return (
            (branch.branch_name ?? '').toLowerCase().includes(searchLower) ||
            (branch.branch_id ?? '').toLowerCase().includes(searchLower) ||
            (branch.location ?? '').toLowerCase().includes(searchLower) ||
            (branch.district ?? '').toLowerCase().includes(searchLower) ||
            (branch.province ?? '').toLowerCase().includes(searchLower) ||
            (branch.address ?? '').toLowerCase().includes(searchLower) ||
            String(branch.id).toLowerCase().includes(searchLower)
        );
    });

    // Calculate statistics
    const stats: BranchStatsType = {
        totalBranches: branches.length,
        activeBranches: branches.filter(b => b.status === 'active').length,
        totalCustomers: branches.reduce((sum, b) => sum + (b.customers_count || 0), 0),
        totalLoans: branches.reduce((sum, b) => sum + (b.loans_count || 0), 0)
    };

    if (hasAccess === false) return null;

    if ((loading && branches.length === 0) || hasAccess === null) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
                <BMSLoader message="Loading branches..." size="medium" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-text-primary tracking-tight uppercase">Branch Management</h1>
                    <p className="text-[10px] font-black text-text-muted mt-2 uppercase tracking-[0.2em] opacity-60">Manage all branch locations and details</p>
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                    {canCreate && (
                        <button
                            onClick={handleAdd}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-primary-600 text-white px-8 py-3.5 rounded-2xl hover:bg-primary-500 transition-all shadow-2xl shadow-primary-500/30 font-black text-[10px] uppercase tracking-[0.2em] active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Branch</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Statistics */}
            <BranchStats stats={stats} />

            {/* Search */}
            <div className="bg-card rounded-[2rem] border border-border-default shadow-2xl overflow-hidden group">
                <div className="relative">
                    <Search className="w-5 h-5 text-text-muted/30 absolute left-6 top-1/2 -translate-y-1/2 group-focus-within:text-primary-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search branches by identity, location, or protocol ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-16 pr-8 py-5 bg-transparent text-text-primary placeholder:text-text-muted/40 focus:outline-none text-sm font-black tracking-widest uppercase transition-all"
                    />
                </div>
            </div>

            {/* Table */}
            <BranchTable
                branches={filteredBranches}
                totalBranches={branches.length}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                onViewDetail={handleViewDetail}
                canEdit={canEdit}
                canDelete={canDelete}
                canToggleStatus={canToggleStatus}
            />

            {/* Branch Form Modal */}
            <BranchForm
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSave}
                initialData={editingBranch}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Delete Branch"
                message="Are you sure you want to delete this branch? This action cannot be undone and may affect related centers and groups."
                confirmText="Delete Branch"
                cancelText="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => {
                    setShowDeleteConfirm(false);
                    setBranchToDelete(null);
                }}
            />

            {/* Status Toggle Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showStatusConfirm}
                title={branchToToggle?.status === 'active' ? 'Disable Branch' : 'Enable Branch'}
                message={`Are you sure you want to ${branchToToggle?.status === 'active' ? 'disable' : 'enable'} the branch "${branchToToggle?.branch_name}"?`}
                confirmText={branchToToggle?.status === 'active' ? 'Disable Branch' : 'Enable Branch'}
                cancelText="Cancel"
                variant={branchToToggle?.status === 'active' ? 'warning' : 'info'}
                onConfirm={confirmToggleStatus}
                onCancel={() => {
                    setShowStatusConfirm(false);
                    setBranchToToggle(null);
                }}
            />

            {/* Detail Modal */}
            <BranchDetailModal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                branch={viewingBranch}
            />
        </div>
    );
}
