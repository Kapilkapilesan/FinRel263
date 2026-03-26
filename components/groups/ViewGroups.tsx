'use client'
import React, { useState, useEffect } from 'react';
import { Search, Plus, UsersRound, Users, TrendingUp, UserPlus, Filter } from 'lucide-react';
import { Group, GroupFormData } from '../../types/group.types';
import { Center } from '../../types/center.types';
import BMSLoader from '@/components/common/BMSLoader';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { GroupForm } from './GroupForm';
import { GroupTable } from './GroupTable';
import { GroupMemberModal } from './GroupMemberModal';
import { BulkGroupModal } from './BulkGroupModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { groupService } from '../../services/group.service';
import { centerService } from '../../services/center.service';
import { toast } from 'react-toastify';
import { authService } from '../../services/auth.service';
import { typography } from '../../themes/typography';
import { primary, semantic } from '../../themes/colors';

export function ViewGroups() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [centers, setCenters] = useState<Center[]>([]);
    const [selectedCenterId, setSelectedCenterId] = useState<string>('all');

    // Confirmation States
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState<number | null>(null);
    const [showStatusConfirm, setShowStatusConfirm] = useState(false);
    const [groupToToggle, setGroupToToggle] = useState<Group | null>(null);

    // Permission Checks
    const canCreate = authService.hasPermission('groups.create');
    const canEdit = authService.hasPermission('groups.edit');
    const canDelete = authService.hasPermission('groups.delete');
    const canStatus = authService.hasPermission('groups.status');

    // Memoize the form initial data to prevent unnecessary re-renders
    const groupFormInitialData = React.useMemo(() => {
        if (!selectedGroup) return null;
        return {
            id: selectedGroup.id,
            group_name: selectedGroup.group_name,
            center_id: selectedGroup.center_id,
            branch_id: (selectedGroup.branch_id || selectedGroup.center?.branch_id)?.toString(),
            status: selectedGroup.status,
            customer_ids: selectedGroup.customers?.map(c => c.id.toString())
        };
    }, [selectedGroup?.id, selectedGroup?.status, selectedGroup?.group_name, selectedGroup?.center_id]);

    // Fetch groups on mount and set up polling
    const loadGroups = React.useCallback(async (silent = false) => {
        try {
            if (!silent) setIsLoading(true);
            const data = await groupService.getGroups({ scope: 'own' });
            if (data) {
                setGroups(data);
                setError(null);
            }
        } catch (err: any) {
            console.error('Failed to load groups:', err);
            setError((prev: string | null) => {
                if (!silent || groups.length === 0) {
                    return err.message || 'Failed to load groups. Please check your connection.';
                }
                return prev;
            });
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [groups.length]);

    useEffect(() => {
        // Fetch centers for filter
        const loadCenters = async () => {
            try {
                const data = await centerService.getCentersList('active');
                // Even though the API is filtered, adding a client-side filter for safety
                const filtered = data.filter((center: Center) => center.status === 'active');
                setCenters(filtered);
            } catch (err) {
                console.error('Failed to load centers:', err);
            }
        };
        loadCenters();

        const isAnyModalOpen =
            isCreateModalOpen ||
            isBulkModalOpen ||
            isMemberModalOpen ||
            showDeleteConfirm ||
            showStatusConfirm;

        loadGroups(); // Initial load

        if (isAnyModalOpen) return;

        const pollInterval = setInterval(() => {
            loadGroups(true); // Silent update
        }, 5000);

        return () => clearInterval(pollInterval);
    }, [loadGroups, isCreateModalOpen, isBulkModalOpen, isMemberModalOpen, showDeleteConfirm, showStatusConfirm]);

    const handleCreateGroup = async (groupData: GroupFormData) => {
        try {
            const newGroup = await groupService.createGroup(groupData);
            setGroups([...groups, newGroup]);
            setIsCreateModalOpen(false);
            toast.success('Group created successfully!');
        } catch (err: any) {
            console.error('Failed to create group:', err);
            const errorMessage = err.errors
                ? Object.values(err.errors).flat().join(', ')
                : err.message || 'Failed to create group';
            toast.error(errorMessage);
        }
    };

    const handleUpdateGroup = async (groupData: GroupFormData) => {
        if (!selectedGroup) return;
        try {
            const updatedGroup = await groupService.updateGroup(selectedGroup.id, groupData);
            setGroups(groups.map(g => g.id === selectedGroup.id ? updatedGroup : g));
            setIsCreateModalOpen(false);
            setSelectedGroup(null);
            toast.success('Group updated successfully!');
        } catch (err: any) {
            console.error('Failed to update group:', err);
            const errorMessage = err.errors
                ? Object.values(err.errors).flat().join(', ')
                : err.message || 'Failed to update group';
            toast.error(errorMessage);
        }
    };

    const handleToggleStatus = (group: Group) => {
        setGroupToToggle(group);
        setShowStatusConfirm(true);
    };

    const confirmToggleStatus = async () => {
        if (!groupToToggle) return;
        try {
            await groupService.toggleGroupStatus(groupToToggle.id, groupToToggle.status);
            toast.success(`Group ${groupToToggle.status === 'active' ? 'disabled' : 'enabled'} successfully!`);
            loadGroups();
        } catch (err: any) {
            console.error('Failed to update group status:', err);
            const errorMessage = err.errors
                ? Object.values(err.errors).flat().join(', ')
                : err.message || 'Failed to update group status';
            toast.error(errorMessage);
        } finally {
            setShowStatusConfirm(false);
            setGroupToToggle(null);
        }
    };

    const handleDeleteGroup = (groupId: number) => {
        setGroupToDelete(groupId);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!groupToDelete) return;
        try {
            await groupService.deleteGroup(groupToDelete);
            setGroups(groups.filter(g => g.id !== groupToDelete));
            toast.success('Group deleted successfully!');
        } catch (err: any) {
            console.error('Failed to delete group:', err);
            toast.error(err.message || 'Failed to delete group');
        } finally {
            setGroupToDelete(null);
            setShowDeleteConfirm(false);
        }
    };

    const handleEdit = (group: Group) => {
        setSelectedGroup(group);
        setIsCreateModalOpen(true);
    };

    const handleViewMembers = (group: Group) => {
        setSelectedGroup(group);
        setIsMemberModalOpen(true);
    };

    const handleAddNew = () => {
        setSelectedGroup(null);
        setIsCreateModalOpen(true);
    };

    const filteredGroups = groups.filter(group => {
        const searchLower = searchTerm.trim().toLowerCase();
        const matchesSearch =
            group.group_name.toLowerCase().includes(searchLower) ||
            (group.group_code && group.group_code.toLowerCase().includes(searchLower)) ||
            (group.center?.center_name && group.center.center_name.toLowerCase().includes(searchLower));

        const matchesCenter = selectedCenterId === 'all' || group.center_id.toString() === selectedCenterId;

        return matchesSearch && matchesCenter;
    });

    const centerOptions = React.useMemo(() => [
        { id: 'all', label: 'All Centers' },
        ...centers.map(center => ({
            id: center.id.toString(),
            label: center.center_name
        }))
    ], [centers]);

    // Calculate statistics
    const totalGroups = groups.length;
    const activeGroups = groups.filter(g => g.status === 'active').length;
    const totalMembers = groups.reduce((sum, g) => sum + (g.member_count || g.customers?.length || g.members?.length || 0), 0);
    const avgMembersPerGroup = totalGroups > 0 ? Math.round(totalMembers / totalGroups) : 0;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <BMSLoader message="Loading groups..." size="xsmall" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-red-600">
                <p>{error}</p>
                <button
                    onClick={() => loadGroups()}
                    className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium text-sm"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="relative p-6 lg:p-10 space-y-8 pb-12">
            {/* Decorative Background Elements */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 -left-24 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header Section */}
            <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-1">
                <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-primary-500 rounded-full" />
                        <h1 className={`${typography.size.xl} ${typography.weight.bold} text-text-primary tracking-tight uppercase`}>
                            GROUP MANAGEMENT
                        </h1>
                    </div>
                    <p className={`${typography.size.xs} text-text-muted ml-3.5 font-medium`}>
                        Manage self-help groups and member growth.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {canCreate && (
                        <button
                            onClick={() => setIsBulkModalOpen(true)}
                            className={`group relative flex items-center gap-2 overflow-hidden bg-primary-500 text-white px-5 py-2.5 rounded-xl transition-all duration-300 shadow-lg shadow-primary-500/20 ${typography.weight.bold} ${typography.size.sm} hover:-translate-y-0.5 active:scale-95`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full duration-1000 transition-transform" />
                            <Plus className="w-4 h-4" />
                            <span className="uppercase">Add New Group</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Groups', value: totalGroups, icon: UsersRound, color: 'primary', trend: null },
                    { label: 'Active Groups', value: activeGroups, icon: TrendingUp, color: 'primary', trend: totalGroups > 0 ? `${((activeGroups / totalGroups) * 100).toFixed(0)}%` : null },
                    { label: 'Total Members', value: totalMembers, icon: Users, color: 'indigo', trend: null },
                    { label: 'Avg Members', value: avgMembersPerGroup, icon: UserPlus, color: 'amber', trend: null }
                ].map((stat, i) => (
                    <div
                        key={i}
                        className="group relative bg-card/60 backdrop-blur-sm rounded-2xl border border-border-default/50 p-3 shadow-sm hover:shadow-xl hover:shadow-primary-500/5 hover:border-primary-500/30 transition-all duration-500 overflow-hidden"
                    >
                        <div
                            className="absolute top-0 right-0 -mr-3 -mt-3 w-20 h-20 bg-current opacity-[0.02] rounded-full group-hover:scale-150 transition-transform duration-700"
                            style={{ color: `var(--${stat.color}-500)` }}
                        />
                        <div className="relative flex items-center gap-3">
                            <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-105 shadow-md shadow-${stat.color}-500/5`}
                                style={{
                                    backgroundColor: `rgba(var(--color-${stat.color}-500-rgb), 0.1)`,
                                    color: `var(--${stat.color}-500)`
                                }}
                            >
                                <stat.icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className={`${typography.size.xs} uppercase tracking-wider font-bold text-text-muted/60 mb-0.5`}>
                                    {stat.label}
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className={`${typography.size.xl} ${typography.weight.bold} text-text-primary tracking-tight`}>
                                        {stat.value}
                                    </span>
                                    {stat.trend && (
                                        <span className="px-1.5 py-0.5 bg-primary-500/10 text-primary-500 rounded-md text-[10px] font-black ring-1 ring-primary-500/10">
                                            {stat.trend}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search & Filter Bar */}
            <div className="relative z-40 bg-card/90 backdrop-blur-md rounded-[2rem] p-4 border border-border-default/50 shadow-sm flex flex-col md:flex-row gap-4 items-stretch">
                <div className="flex-1 relative group/search">
                    <div className="relative bg-muted-bg/50 border-2 border-border-divider rounded-2xl transition-all hover:border-border-default focus-within:border-primary-500/50 focus-within:ring-4 focus-within:ring-primary-500/10 flex items-center px-5 py-3.5">
                        <Search className="w-5 h-5 text-primary-500 mr-3 shrink-0" />
                        <input
                            type="text"
                            placeholder="SEARCH BY GROUP NAME, CODE OR CENTER..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-transparent text-text-primary focus:outline-none placeholder:text-text-muted/40 text-sm font-black uppercase tracking-tight"
                        />
                    </div>
                </div>

                <div className="md:w-72 relative group/filter">
                    <SearchableSelect
                        options={centerOptions}
                        value={selectedCenterId}
                        onChange={(val) => setSelectedCenterId(val?.toString() || 'all')}
                        placeholder="ALL CENTERS"
                        searchPlaceholder="FILTER CENTER..."
                        className="w-full"
                    />
                </div>
            </div>

            {/* Groups Table */}
            <GroupTable
                groups={filteredGroups}
                totalGroups={totalGroups}
                onEdit={handleEdit}
                onViewMembers={handleViewMembers}
                onDelete={handleDeleteGroup}
                onToggleStatus={handleToggleStatus}
                canEdit={canEdit}
                canDelete={canDelete}
                canStatus={canStatus}
            />

            {filteredGroups.length === 0 && (
                <div className="bg-card rounded-lg border border-border-default p-8 text-center">
                    <UsersRound className="w-12 h-12 text-text-muted mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-text-primary mb-2">No groups found</h3>
                    <p className="text-text-muted">Try adjusting your search or create a new group.</p>
                </div>
            )}

            {/* Modals */}
            <GroupForm
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setSelectedGroup(null);
                }}
                onSubmit={selectedGroup ? handleUpdateGroup : handleCreateGroup}
                initialData={groupFormInitialData}
            />

            <GroupMemberModal
                isOpen={isMemberModalOpen}
                onClose={() => {
                    setIsMemberModalOpen(false);
                    setSelectedGroup(null);
                }}
                group={selectedGroup}
                onEdit={(group) => {
                    setIsMemberModalOpen(false);
                    handleEdit(group);
                }}
            />

            <BulkGroupModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                onSuccess={loadGroups}
            />

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Delete Group"
                message="Are you sure you want to delete this group? This action cannot be undone and may affect associated members and loans."
                confirmText="Delete Group"
                cancelText="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => {
                    setShowDeleteConfirm(false);
                    setGroupToDelete(null);
                }}
            />

            <ConfirmDialog
                isOpen={showStatusConfirm}
                title={groupToToggle?.status === 'active' ? 'Disable Group' : 'Enable Group'}
                message={`Are you sure you want to ${groupToToggle?.status === 'active' ? 'disable' : 'enable'} the group "${groupToToggle?.group_name}"?`}
                confirmText={groupToToggle?.status === 'active' ? 'Disable Group' : 'Enable Group'}
                cancelText="Cancel"
                variant={groupToToggle?.status === 'active' ? 'warning' : 'info'}
                onConfirm={confirmToggleStatus}
                onCancel={() => {
                    setShowStatusConfirm(false);
                    setGroupToToggle(null);
                }}
            />
        </div>
    );
}