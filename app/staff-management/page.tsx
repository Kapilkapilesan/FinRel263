"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { colors } from '@/themes/colors';
import { StaffStatsCard } from '../../components/staff/StaffStats';
import { StaffTable } from '../../components/staff/StaffTable';
import { RolePermissionsTable } from '../../components/staff/RolePermissionsTable';
import { StaffForm } from '../../components/staff/StaffForm';
import { StaffEditForm } from '../../components/staff/StaffEditForm';
import { staffService } from '../../services/staff.service';
import { authService } from '../../services/auth.service';
import { branchService } from '../../services/branch.service';
import { centerService } from '../../services/center.service';
import { User, Permission, StaffStats } from '../../types/staff.types';
import { useRouter } from 'next/navigation';
import { AttendanceView } from '../../components/staff/AttendanceView';
import { LeaveRequestsView } from '../../components/staff/leave/LeaveRequestsView';
import Complaints from '../../components/complaints/Complaints';
import { SalaryManagement } from '../../components/staff/salary/SalaryManagement';
import { AdminForm } from '../../components/staff/AdminForm';
import BMSLoader from '../../components/common/BMSLoader';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { Pagination } from '@/components/common/Pagination';


export default function StaffManagementPage() {
    const [activeTab, setActiveTab] = useState<'users' | 'attendance' | 'salary' | 'complaints' | 'leave'>('users');

    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<any[]>([]); // Using any[] to bypass strict check for now, ideally update type
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [currentUserRole, setCurrentUserRole] = useState<string>('');
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);
    const [permittedTabs, setPermittedTabs] = useState<string[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [centers, setCenters] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBranch, setSelectedBranch] = useState<string | number | undefined>(undefined);
    const [selectedRole, setSelectedRole] = useState<string | number | undefined>(undefined);
    const [selectedCenter, setSelectedCenter] = useState<string | number | undefined>(undefined);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
    const router = useRouter();

    useEffect(() => {
        // Security check: Verify if the user has permission to view this page
        const checkAccess = () => {
            const hasViewPermission =
                authService.hasPermission('staff.view') ||
                authService.hasPermission('attendance.view') ||
                authService.hasPermission('salary.view') ||
                authService.hasPermission('payroll.view') ||
                authService.hasPermission('complaints.view') ||
                authService.hasPermission('leave.view') ||
                authService.hasPermission('users.view');

            if (!hasViewPermission) {
                console.warn('[Security] Unauthorized access attempt to staff-management. Redirecting...');
                router.push('/');
                return false;
            }
            return true;
        };

        if (typeof window !== 'undefined') {
            const allowed = checkAccess();
            setHasAccess(allowed);
            if (!allowed) return;

            // Determine permitted tabs
            const tabs = [];
            if (authService.hasPermission('staff.view')) tabs.push('users');
            if (authService.hasPermission('attendance.view')) tabs.push('attendance');
            if (authService.hasPermission('payroll.view') || authService.hasPermission('salary.view')) tabs.push('salary');
            if (authService.hasPermission('complaints.staffmanagement_manage')) tabs.push('complaints');
            if (authService.hasPermission('leave.view')) tabs.push('leave');

            setPermittedTabs(tabs);
            if (tabs.length > 0 && !tabs.includes(activeTab)) {
                setActiveTab(tabs[0] as any);
            }
        }

        // checks for user role (Super Admin vs Admin) using localStorage.
        const storedRolesStr = localStorage.getItem('roles');
        if (storedRolesStr) {
            try {
                const userRoles = JSON.parse(storedRolesStr);
                if (Array.isArray(userRoles) && userRoles.length > 0) {
                    // Prioritize super_admin, then admin
                    if (userRoles.some(ur => ur.name === 'super_admin')) {
                        setCurrentUserRole('super_admin');
                    } else if (userRoles.some(ur => ur.name === 'admin')) {
                        setCurrentUserRole('admin');
                    } else {
                        setCurrentUserRole(userRoles[0].name);
                    }
                }
            } catch (e) { }
        }

        if (typeof window !== 'undefined' && checkAccess()) {
            loadInitialData();
        }
    }, [router]);

    const loadInitialData = async () => {
        try {
            const [fetchedRoles, fetchedPermissions, fetchedBranches, fetchedCenters] = await Promise.all([
                staffService.getAllRoles(),
                staffService.getPermissions(),
                branchService.getBranchesDropdown(),
                centerService.getCentersList()
            ]);
            setRoles(fetchedRoles);
            setPermissions(fetchedPermissions);
            setBranches(fetchedBranches);
            setCenters(fetchedCenters);
        } catch (error) {
            console.error("Failed to load initialization data", error);
        }
    };

    // Simplified useEffect for initial data load
    useEffect(() => {
        if (hasAccess) {
            loadData();
        }
    }, [hasAccess]);

    // Local filtering logic
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            // Search filter
            const matchesSearch = !searchTerm || searchTerm.length < 2 || 
                user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.userName?.toLowerCase().includes(searchTerm.toLowerCase());

            // Branch filter
            const matchesBranch = !selectedBranch || user.branchId?.toString() === selectedBranch.toString();

            // Role filter
            const matchesRole = !selectedRole || user.roleName === selectedRole;

            // Center filter
            const matchesCenter = !selectedCenter || user.centerId?.toString() === selectedCenter.toString();

            return matchesSearch && matchesBranch && matchesRole && matchesCenter;
        });
    }, [users, searchTerm, selectedBranch, selectedRole, selectedCenter]);

    // Apply pagination
    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredUsers, currentPage, itemsPerPage]);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedBranch, selectedRole, selectedCenter]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Determine user type to fetch based on current role
            let isSuperAdmin = false;
            if (typeof window !== 'undefined') {
                const storedRolesStr = localStorage.getItem('roles');
                if (storedRolesStr && storedRolesStr.includes('super_admin')) {
                    isSuperAdmin = true;
                }
            }

            const userTypeToFetch = isSuperAdmin ? 'admins' : 'staff';

            // Fetch a larger set for local filtering (e.g., 500)
            const fetchedUsers = await staffService.getUsers(userTypeToFetch, { per_page: 500 });
            setUsers(fetchedUsers);
        } catch (error) {
            console.error("Failed to load staff data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveUser = async (userData: any) => {
        try {
            let response;
            if (editingUser) {
                response = await staffService.updateUser(editingUser.id, userData);
                toast.success('User updated successfully!');
            } else {
                response = await staffService.createUser(userData);
                toast.success('User created successfully!');
            }
            setShowAddUserModal(false);
            setEditingUser(null);
            loadData(); // Reload to show new user or updated user
            return response;
        } catch (error: any) {
            console.error("Failed to save user", error);
            toast.error(error.message || 'Failed to save user');
            throw error;
        }
    };

    const handleDeleteUser = async (userId: string) => {
        try {
            await staffService.deleteUser(userId);
            toast.success('User deleted successfully');
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete user');
        }
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setShowAddUserModal(true);
    };

    const stats: StaffStats = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.status === 'Active').length,
        totalRoles: roles.length
    };

    if (hasAccess === false) {
        return null; // Don't render anything while redirecting
    }

    if (loading || hasAccess === null) {
        return (
            <div className="h-screen flex items-center justify-center">
                <BMSLoader message="Loading staff data..." />
            </div>
        );
    }

    return (
        <div className="space-y-4 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
                    <p className="text-sm text-text-muted mt-1">Manage users, roles, and permissions</p>
                </div>
                {activeTab === 'users' && (
                    <button
                        onClick={() => {
                            setEditingUser(null);
                            setShowAddUserModal(true);
                        }}
                        className="flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                        style={{ backgroundColor: colors.primary[600] }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primary[700]}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary[600]}
                    >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">Add User</span>
                    </button>
                )}
            </div>

            {/* Statistics Cards */}
            <StaffStatsCard stats={stats} />

            {/* Main Content */}
            <div className="bg-card rounded-2xl border border-border-default/50 overflow-hidden shadow-sm">
                <div className="border-b border-border-default/50 overflow-x-auto">
                    <div className="flex min-w-max">
                        {permittedTabs.includes('users') && (
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`px-6 py-3 border-b-2 transition-colors text-sm font-semibold ${activeTab === 'users'
                                    ? 'border-primary-600 text-primary-600 bg-primary-500/10'
                                    : 'border-transparent text-text-muted hover:text-text-primary'
                                    }`}
                            >
                                Staff Users
                            </button>
                        )}
                        {permittedTabs.includes('attendance') && (
                            <button
                                onClick={() => setActiveTab('attendance')}
                                className={`px-6 py-3 border-b-2 transition-colors text-sm font-semibold ${activeTab === 'attendance'
                                    ? 'border-primary-600 text-primary-600 bg-primary-500/10'
                                    : 'border-transparent text-text-muted hover:text-text-primary'
                                    }`}
                            >
                                Attendance Management
                            </button>
                        )}
                        {permittedTabs.includes('salary') && (
                            <button
                                onClick={() => setActiveTab('salary')}
                                className={`px-6 py-3 border-b-2 transition-colors text-sm font-semibold ${activeTab === 'salary'
                                    ? 'border-primary-600 text-primary-600 bg-primary-500/10'
                                    : 'border-transparent text-text-muted hover:text-text-primary'
                                    }`}
                            >
                                Salary Management
                            </button>
                        )}
                        {permittedTabs.includes('complaints') && (
                            <button
                                onClick={() => setActiveTab('complaints')}
                                className={`px-6 py-3 border-b-2 transition-colors text-sm font-semibold ${activeTab === 'complaints'
                                    ? 'border-primary-600 text-primary-600 bg-primary-500/10'
                                    : 'border-transparent text-text-muted hover:text-text-primary'
                                    }`}
                            >
                                Complaints
                            </button>
                        )}
                        {permittedTabs.includes('leave') && (
                            <button
                                onClick={() => setActiveTab('leave')}
                                className={`px-6 py-3 border-b-2 transition-colors text-sm font-semibold ${activeTab === 'leave'
                                    ? 'border-primary-600 text-primary-600 bg-primary-500/10'
                                    : 'border-transparent text-text-muted hover:text-text-primary'
                                    }`}
                            >
                                Leave Requests
                            </button>
                        )}
                    </div>
                </div>


                {/* Users Tab Content */}
                {activeTab === 'users' && (
                    <>
                        {/* Filters Bar */}
                        <div className="p-3 md:p-4 border-b border-border-default/50 flex flex-col md:flex-row gap-4 items-center justify-between bg-muted-bg/5">
                            <div className="flex-1 w-full max-w-sm">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                    <input
                                        type="text"
                                        placeholder="Search by name, email, or ID..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-input border border-border-default rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm shadow-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                                    <div className="w-full sm:w-[200px]">
                                        <SearchableSelect
                                            options={branches.map(b => ({ id: b.id, label: b.branch_name?.toUpperCase() }))}
                                            value={selectedBranch}
                                            onChange={(val) => setSelectedBranch(val)}
                                            placeholder="ALL BRANCHES"
                                            searchPlaceholder="Search branch..."
                                        />
                                    </div>

                                    <div className="w-full sm:w-[200px]">
                                        <SearchableSelect
                                            options={roles.map(r => ({ id: r.name, label: (r.display_name || r.name)?.toUpperCase() }))}
                                            value={selectedRole}
                                            onChange={(val) => setSelectedRole(val)}
                                            placeholder="ALL ROLES"
                                            searchPlaceholder="Search role..."
                                        />
                                    </div>

                                    <div className="w-full sm:w-[200px]">
                                        <SearchableSelect
                                            options={centers.map(c => ({ id: c.id, label: c.center_name?.toUpperCase() }))}
                                            value={selectedCenter}
                                            onChange={(val) => setSelectedCenter(val)}
                                            placeholder="ALL CENTERS"
                                            searchPlaceholder="Search center..."
                                        />
                                    </div>

                                    {(searchTerm || selectedBranch || selectedRole || selectedCenter) && (
                                        <button
                                            onClick={() => {
                                                setSearchTerm('');
                                                setSelectedBranch(undefined);
                                                setSelectedRole(undefined);
                                                setSelectedCenter(undefined);
                                            }}
                                            className="text-xs font-semibold text-primary-600 hover:text-primary-700 underline underline-offset-4 px-2"
                                        >
                                            Clear Filters
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <StaffTable
                            users={paginatedUsers}
                            onEdit={handleEditUser}
                            onDelete={handleDeleteUser}
                            onRefresh={loadData}
                            showBranch={currentUserRole !== 'super_admin'}
                            showAttendance={currentUserRole !== 'super_admin'}
                        />

                        <Pagination
                            currentPage={currentPage}
                            totalItems={filteredUsers.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                            onItemsPerPageChange={setItemsPerPage}
                            itemName="staff members"
                        />
                    </>
                )}



                {/* Attendance Tab Content */}
                {activeTab === 'attendance' && (
                    <div className="p-4">
                        <AttendanceView />
                    </div>
                )}

                {/* Salary Tab Content */}
                {activeTab === 'salary' && (
                    <div className="p-4">
                        <SalaryManagement />
                    </div>
                )}

                {/* Complaints Tab Content */}
                {activeTab === 'complaints' && (
                    <div className="p-4">
                        <Complaints readOnly={true} />
                    </div>
                )}

                {/* Leave Tab Content */}
                {activeTab === 'leave' && (
                    <div className="p-4">
                        <LeaveRequestsView isAdmin={authService.hasPermission('leave.approve') || authService.hasPermission('leave.view_all')} />
                    </div>
                )}

            </div>

            {/* Add/Edit User Modal */}
            {showAddUserModal && !editingUser && (
                currentUserRole === 'super_admin' ? (
                    <AdminForm
                        onClose={() => {
                            setShowAddUserModal(false);
                            setEditingUser(null);
                        }}
                        onSuccess={() => {
                            loadData();
                        }}
                    />
                ) : (
                    <StaffForm
                        onClose={() => {
                            setShowAddUserModal(false);
                            setEditingUser(null);
                        }}
                        onSubmit={handleSaveUser}
                        roles={roles.filter(r => {
                            if (currentUserRole === 'admin') {
                                return r.name !== 'super_admin' && r.name !== 'admin';
                            }
                            return true;
                        })}
                    />
                )
            )}

            {showAddUserModal && editingUser && (
                (currentUserRole === 'super_admin' && (editingUser.roleName === 'admin' || editingUser.role?.toLowerCase().includes('admin'))) ? (
                    <AdminForm
                        onClose={() => {
                            setShowAddUserModal(false);
                            setEditingUser(null);
                        }}
                        onSuccess={() => {
                            loadData();
                        }}
                        initialData={editingUser}
                    />
                ) : (
                    <StaffEditForm
                        onClose={() => {
                            setShowAddUserModal(false);
                            setEditingUser(null);
                        }}
                        onSubmit={handleSaveUser}
                        initialData={editingUser}
                        roles={roles.filter(r => {
                            if (currentUserRole === 'admin') {
                                return r.name !== 'super_admin' && r.name !== 'admin';
                            }
                            return true;
                        })}
                    />
                )
            )}
        </div>
    );
}
