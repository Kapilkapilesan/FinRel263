'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Plus, Settings, Edit, Loader2, ChevronDown } from 'lucide-react';
import { Privilege, Role, Permission, PermissionGroup } from '../../types/role.types';
import { PrivilegeListItem } from './PrivilegeListItem';
import { RoleListItem } from './RoleListItem';
import { PermissionsTable } from './PermissionsTable';
import { RoleModal } from './RoleModal';
import { PrivilegeModal } from './PrivilegeModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { roleService } from '../../services/role.service';
import { authService } from '../../services/auth.service';
import { toast } from 'react-toastify';
import BMSLoader from '@/components/common/BMSLoader';

export function RolesPrivileges() {
    // Data States
    const [roles, setRoles] = useState<Role[]>([]);
    const [allPermissions, setAllPermissions] = useState<any[]>([]);
    const [privileges, setPrivileges] = useState<Privilege[]>([]);
    const [matrixColumns, setMatrixColumns] = useState<Privilege[]>([]);
    const [modules, setModules] = useState<string[]>([]);
    const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);

    // UI States
    const [loading, setLoading] = useState(true);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [roleModalOpen, setRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [privModalOpen, setPrivModalOpen] = useState(false);
    const [editingPrivilege, setEditingPrivilege] = useState<Privilege | null>(null);

    // Confirmation States
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
    const [showDeletePrivConfirm, setShowDeletePrivConfirm] = useState(false);
    const [privToDelete, setPrivToDelete] = useState<string | null>(null);
    const [expandedDictionaryModules, setExpandedDictionaryModules] = useState<Record<string, boolean>>({});

    const toggleDictionaryModule = (module: string) => {
        setExpandedDictionaryModules(prev => ({
            ...prev,
            [module]: !prev[module]
        }));
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [fetchedRoles, fetchedPerms, fetchedGroups] = await Promise.all([
                roleService.getRoles(),
                roleService.getAvailablePermissions(),
                roleService.getPermissionGroups()
            ]);

            setRoles(fetchedRoles);
            setAllPermissions(fetchedPerms);
            setPermissionGroups(fetchedGroups);

            // Dynamically determine modules and privileges (actions)
            const extractedModules = Array.from(new Set(fetchedPerms.map((p: any) => p.module || 'System'))).sort() as string[];
            setModules(extractedModules);

            const extractedActions = Array.from(new Set(fetchedPerms.map((p: any) => p.name.split('.').pop()))).sort() as string[];

            // Map backend permissions to UI Privileges for the dictionary
            const mappedPrivileges: Privilege[] = fetchedPerms.map((p: any) => ({
                id: p.id.toString(),
                name: p.name,
                display_name: p.display_name || p.name,
                description: p.description || `Permission for ${p.name}`,
                module: p.module,
                permission_group_id: p.permission_group_id,
                is_core: p.is_core,
                group: fetchedGroups.find(g => g.id === p.permission_group_id)
            }));
            setPrivileges(mappedPrivileges);

            // Use the simple actions for the Matrix columns
            const matrixCols: Privilege[] = extractedActions.map((action, idx) => ({
                id: `action-${idx}`,
                name: action,
                description: `Permission to ${action}`
            }));
            setMatrixColumns(matrixCols);

            // Update selected role if it exists
            if (selectedRole) {
                const refreshed = fetchedRoles.find(r => r.id === selectedRole.id);
                if (refreshed) setSelectedRole(refreshed);
            } else if (fetchedRoles.length > 0) {
                setSelectedRole(fetchedRoles[0]);
            }

        } catch (error) {
            console.error("Failed to load roles/permissions", error);
            toast.error("Failed to connect to security server");
        } finally {
            setLoading(false);
        }
    }, [selectedRole]);

    useEffect(() => {
        loadData();
    }, []); // Run once on mount

    // Handlers - Roles
    const handleCreateRole = () => {
        setEditingRole(null);
        setRoleModalOpen(true);
    };

    const handleEditRole = (role: Role) => {
        setEditingRole(role);
        setRoleModalOpen(true);
    };

    const handleSaveRole = async (roleData: Partial<Role>) => {
        try {
            // roleData.permissions contains the matrix format from RoleModal
            // The service will convert it to permission_matrix format for the backend

            if (editingRole) {
                await roleService.updateRole(editingRole.id, roleData);
                toast.success("Role updated successfully");
            } else {
                await roleService.createRole(roleData);
                toast.success("New role created");
            }
            await loadData();
            setRoleModalOpen(false);
            // Trigger background sync for the current admin session too
            authService.refreshProfile();
        } catch (error: any) {
            toast.error(error.message || "Failed to save role");
        }
    };

    const handleDeleteRole = (id: string) => {
        setRoleToDelete(id);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteRole = async () => {
        if (!roleToDelete) return;
        try {
            await roleService.deleteRole(roleToDelete);
            toast.success("Role removed");
            await loadData();
        } catch (error: any) {
            toast.error(error.message || "Deletion failed");
        } finally {
            setShowDeleteConfirm(false);
            setRoleToDelete(null);
        }
    };

    // Handlers - Privileges
    const handleSavePrivilege = async (privilegeData: Partial<Privilege>) => {
        try {
            if (privilegeData.name) {
                await roleService.createPermission({
                    name: privilegeData.name,
                    description: privilegeData.description || ''
                });
                toast.success("Permission created successfully");
                await loadData(); // Reload to see the new permission in the list
                setPrivModalOpen(false);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to create permission");
        }
    };

    const handleCreatePrivilege = () => {
        setEditingPrivilege(null);
        setPrivModalOpen(true);
    };

    const handleDeletePrivilege = (id: string) => {
        setPrivToDelete(id);
        setShowDeletePrivConfirm(true);
    };

    const confirmDeletePrivilege = async () => {
        if (!privToDelete) return;
        try {
            await roleService.deletePermission(privToDelete);
            toast.success("Permission removed from dictionary");
            await loadData();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete permission. Note: Core permissions cannot be removed.");
        } finally {
            setShowDeletePrivConfirm(false);
            setPrivToDelete(null);
        }
    };

    const [showSidebar, setShowSidebar] = useState(true);

    if (loading && roles.length === 0) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <BMSLoader message="Synchronizing Guard Data..." />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 h-full">
            {/* Optimized Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card px-10 py-8 rounded-[2.5rem] border border-border-default shadow-sm transition-all">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-text-primary tracking-tight flex items-center gap-3">
                        Security Management
                        {loading && <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />}
                    </h1>
                    <p className="text-sm text-text-muted font-medium opacity-80 uppercase tracking-widest">Configure access roles and system-wide privileges</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        className={`hidden xl:flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${showSidebar
                            ? 'bg-muted-bg text-text-muted hover:bg-hover'
                            : 'bg-primary-500/10 text-primary-500 hover:bg-primary-500/20'
                            }`}
                    >
                        {showSidebar ? 'Maximize Matrix' : 'Show Sidebar'}
                    </button>
                    <button
                        onClick={handleCreatePrivilege}
                        className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
                    >
                        <Settings size={18} />
                        New Permission
                    </button>
                    <button
                        onClick={handleCreateRole}
                        className="flex items-center gap-3 bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary-500/20 transition-all active:scale-95"
                    >
                        <Plus size={18} />
                        New Role
                    </button>
                </div>
            </div>

            {/* Main Application Interface */}
            <div className="flex flex-col xl:flex-row gap-8 items-start h-full pb-10">

                {/* Unified Sidebar: Privileges & Roles */}
                <div className={`xl:w-[450px] w-full space-y-8 h-full transition-all duration-500 ease-in-out ${!showSidebar ? 'xl:-ml-[480px] xl:opacity-0 pointer-events-none' : 'opacity-100'}`}>

                    {/* Access Roles Section */}
                    <div className="bg-card/70 p-8 rounded-[2.5rem] border border-border-default shadow-sm backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-8 px-2">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted">Access Roles</h3>
                            <span className="text-[10px] bg-primary-500/10 text-primary-500 px-3 py-1 rounded-full font-black uppercase tracking-widest">{roles.length} Active</span>
                        </div>
                        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-border-divider scrollbar-track-transparent">
                            {roles.map(role => (
                                <RoleListItem
                                    key={role.id}
                                    role={role}
                                    isActive={selectedRole?.id === role.id}
                                    onClick={() => setSelectedRole(role)}
                                    onEdit={handleEditRole}
                                    onDelete={handleDeleteRole}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Grouped Capability Dictionary Section */}
                    <div className="bg-card/50 p-8 rounded-[2.5rem] border border-border-default flex flex-col h-full overflow-hidden backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-8 px-2 shrink-0">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted">Capability Dictionary</h3>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full font-black uppercase tracking-widest">{privileges.length} Total</span>
                        </div>

                        <div className="space-y-4 overflow-y-auto pr-3 scrollbar-init scrollbar-thin scrollbar-thumb-border-divider scrollbar-track-transparent pb-4">
                            {modules.map(moduleName => {
                                const modulePrivs = privileges.filter(p => (p.module || 'System') === moduleName);
                                if (modulePrivs.length === 0) return null;

                                const isExpanded = expandedDictionaryModules[moduleName];

                                return (
                                    <div
                                        key={moduleName}
                                        className={`group flex flex-col bg-card rounded-[2rem] border transition-all duration-300 ${isExpanded
                                            ? 'ring-2 ring-emerald-500/20 border-emerald-500/30'
                                            : 'border-border-default hover:border-emerald-500/30'}`}
                                    >
                                        <div
                                            onClick={() => toggleDictionaryModule(moduleName)}
                                            className="p-5 flex items-center justify-between cursor-pointer select-none"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl transition-colors ${isExpanded ? 'bg-emerald-600 text-white' : 'bg-muted-bg text-text-muted group-hover:bg-emerald-500/10 group-hover:text-emerald-500'}`}>
                                                    <Shield size={16} />
                                                </div>
                                                <div>
                                                    <h4 className="text-[11px] font-black text-text-primary capitalize tracking-tight leading-none">
                                                        {moduleName.replace(/_/g, ' ')}
                                                    </h4>
                                                    <p className="text-[9px] font-bold text-text-muted mt-1 uppercase tracking-widest">
                                                        {modulePrivs.length} Permissions
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronDown size={14} className={`text-text-muted transition-transform duration-300 ${isExpanded ? 'rotate-180 text-emerald-500' : ''}`} />
                                        </div>

                                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                                            <div className="px-5 pb-5 pt-1 border-t border-border-divider mt-1">
                                                <div className="space-y-3 overflow-y-auto max-h-[320px] scrollbar-thin scrollbar-thumb-border-divider pr-2">
                                                    {modulePrivs.map(priv => (
                                                        <PrivilegeListItem
                                                            key={priv.id}
                                                            privilege={priv}
                                                            onEdit={() => toast.info('Privilege details are managed via permission seeds')}
                                                            onDelete={handleDeletePrivilege}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Main Content Area: Matrix View */}
                <div className="flex-1 w-full min-w-0 h-full transition-all duration-500">
                    {selectedRole ? (
                        <div className="bg-card p-10 rounded-[3rem] border border-border-default shadow-xl shadow-black/5 animate-in zoom-in-95 duration-500 h-full overflow-hidden flex flex-col">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 text-white rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-primary-500/20">
                                            <Shield size={28} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-3xl font-black text-text-primary tracking-tight leading-none">
                                                    {selectedRole.display_name || selectedRole.name}
                                                </h2>
                                                {selectedRole.is_system && (
                                                    <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-amber-500/20">
                                                        System
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-3">
                                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${selectedRole.level === 'super_admin' ? 'bg-purple-500/10 text-purple-500 ring-purple-500/20' :
                                                    selectedRole.level === 'admin' ? 'bg-primary-500/10 text-primary-500 ring-primary-500/20' :
                                                        selectedRole.level === 'manager' ? 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/20' :
                                                            'bg-muted-bg text-text-muted ring-border-default'
                                                    }`}>
                                                    {selectedRole.level?.replace('_', ' ')}
                                                </span>
                                                <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest flex items-center gap-2">
                                                    <div className="w-1 h-1 rounded-full bg-border-divider" />
                                                    Hierarchy: {selectedRole.hierarchy}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-text-muted font-medium leading-relaxed max-w-xl">
                                        {selectedRole.description || 'Define specific module-level access and capability controls for this role.'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleEditRole(selectedRole)}
                                        className="flex items-center gap-2 px-8 py-4 bg-muted-bg hover:bg-hover text-text-primary rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 border border-border-default"
                                    >
                                        <Edit size={16} />
                                        Modify Matrix
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
                                <PermissionsTable
                                    permissions={selectedRole.permissions}
                                    availablePrivileges={matrixColumns}
                                    allPrivileges={privileges}
                                    readOnly={true}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-muted-bg/30 rounded-[3rem] border-2 border-dashed border-border-default">
                            <div className="p-8 bg-card rounded-[2rem] shadow-2xl mb-8 transform -rotate-3 hover:rotate-0 transition-transform duration-500 border border-border-default">
                                <Shield size={64} className="text-primary-500/10" strokeWidth={1} />
                            </div>
                            <h3 className="text-2xl font-black text-text-primary tracking-tight">Security Matrix Interface</h3>
                            <p className="text-sm text-text-muted font-medium mt-3 max-w-xs text-center leading-relaxed">Select an access role from the structural directory to view and configure its capability matrix.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <RoleModal
                isOpen={roleModalOpen}
                onClose={() => setRoleModalOpen(false)}
                onSave={handleSaveRole}
                editingRole={editingRole}
                privileges={matrixColumns}
                allDefinitions={privileges}
                defaultModules={modules}
                existingRoles={roles}
            />

            <PrivilegeModal
                isOpen={privModalOpen}
                onClose={() => setPrivModalOpen(false)}
                onSave={handleSavePrivilege}
                editingPrivilege={editingPrivilege}
            />

            {/* Deletion Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Delete Role"
                message="Are you sure you want to delete this role? This action cannot be undone and may affect users assigned to this role."
                confirmText="Delete Role"
                cancelText="Cancel"
                variant="danger"
                onConfirm={confirmDeleteRole}
                onCancel={() => {
                    setShowDeleteConfirm(false);
                    setRoleToDelete(null);
                }}
            />

            <ConfirmDialog
                isOpen={showDeletePrivConfirm}
                title="Delete Permission"
                message="Are you sure you want to remove this permission from the Capability Dictionary? This will remove it from all roles currently using it."
                confirmText="Delete Permission"
                cancelText="Cancel"
                variant="danger"
                onConfirm={confirmDeletePrivilege}
                onCancel={() => {
                    setShowDeletePrivConfirm(false);
                    setPrivToDelete(null);
                }}
            />
        </div>
    );
}
