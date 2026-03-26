'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Building, Users, Filter, X, Eye, Phone, Mail, CheckCircle, XCircle } from 'lucide-react';
import { User } from '../../types/staff.types';
import { Branch } from '../../types/branch.types';
import { Center } from '../../types/center.types';
import { staffService } from '../../services/staff.service';
import { branchService } from '../../services/branch.service';
import { centerService } from '../../services/center.service';
import { StaffDetailsModal } from './StaffDetailsModal';
import BMSLoader from '@/components/common/BMSLoader';
import { Pagination } from '@/components/common/Pagination';
import { colors } from '@/themes/colors';
import { SecureImage } from '../common/SecureImage';
import { API_BASE_URL } from '@/services/api.config';
import { SearchableSelect } from '../common/SearchableSelect';

export function StaffDirectory() {
    const [users, setUsers] = useState<User[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [centers, setCenters] = useState<Center[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedStaffUser, setSelectedStaffUser] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBranchId, setSelectedBranchId] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [selectedCenterId, setSelectedCenterId] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [usersData, branchesData, centersData] = await Promise.all([
                staffService.getUsers('staff', { ignore_hierarchy: 'true' }), // Get all staff users
                branchService.getBranchesAll(),
                centerService.getCentersList()
            ]);

            const adminsData = await staffService.getUsers('admins', { ignore_hierarchy: 'true' });

            // Merge and dedup by ID
            const allUsers = [...usersData, ...adminsData].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

            setUsers(allUsers);
            setBranches((branchesData || []).filter(b => b.status === 'active' || !b.status));
            setCenters((centersData || []).filter(c => c.status === 'active'));
        } catch (error) {
            console.error('Failed to load directory data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter Logic
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            // Exclude Super Admin role from the directory
            const role = (user.roleName || user.role || '').toLowerCase();
            if (role === 'super_admin' || role === 'super admin') return false;

            // 1. Search Query (Name, Email, StaffID)
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                (user.name?.toLowerCase() || '').includes(query) ||
                (user.email?.toLowerCase() || '').includes(query) ||
                (user.staffId?.toLowerCase() || '').includes(query);

            if (!matchesSearch) return false;

            // 2. Branch Filter
            if (selectedBranchId) {
                // user.branchId might be number or string
                if (String(user.branchId) !== String(selectedBranchId)) return false;
            }

            // 3. Center Filter
            if (selectedCenterId) {
                const center = centers.find(c => String(c.id) === String(selectedCenterId));
                if (center) {
                    // Check if this user is the staff assigned to this center
                    if (String(center.staff_id) !== String(user.staffId)) return false;
                }
            }

            // 4. Status Filter (Only Active)
            if (user.status !== 'Active') return false;

            return true;
        });
    }, [users, searchQuery, selectedBranchId, selectedCenterId, centers]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedBranchId, selectedCenterId, itemsPerPage]);

    // Paginated slice of filtered users
    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredUsers, currentPage, itemsPerPage]);

    const handleViewDetails = async (user: User) => {
        if (user.staffId) {
            try {
                const details = await staffService.getStaffDetails(user.staffId);
                if (details) {
                    setSelectedStaffUser(details);
                    setIsDetailsOpen(true);
                    return;
                }
            } catch (error) {
                console.error("Failed to fetch staff details", error);
            }
        }

        // Fallback for admins or if staff fetch fails
        setSelectedStaffUser({
            ...user,
            full_name: user.name,
            role_name: user.roleName || user.role,
            is_active: user.status === 'Active',
            is_locked: user.is_locked
        });
        setIsDetailsOpen(true);
    };

    // Derived lists for dropdowns
    const filteredCenters = useMemo(() => {
        if (!selectedBranchId) return centers;
        return centers.filter(c => String(c.branch_id) === String(selectedBranchId));
    }, [centers, selectedBranchId]);

    // Helper to find assigned center name nicely
    const getAssignedCenterInfo = (user: User) => {
        const assignedCenters = centers.filter(c => String(c.staff_id) === String(user.staffId));
        if (assignedCenters.length > 0) {
            return assignedCenters.length === 1
                ? assignedCenters[0].center_name
                : `${assignedCenters.length} Centers`;
        }
        return '-';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Staff Directory</h1>
                    <p className="text-sm text-text-muted mt-1">
                        Browse and view details of all staff members across branches.
                    </p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-card p-4 rounded-xl border border-border-default shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative col-span-1 md:col-span-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-border-default rounded-lg focus:outline-none bg-input text-text-primary placeholder:text-text-muted transition-all shadow-sm"
                            style={{ '--tw-ring-color': `${colors.primary[500]}33` } as any}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = colors.primary[500];
                                e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary[500]}33`;
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = '';
                                e.currentTarget.style.boxShadow = '';
                            }}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Branch Select */}
                    <div>
                        <SearchableSelect
                            options={branches.map(b => ({ id: b.id, label: b.branch_name }))}
                            value={selectedBranchId}
                            onChange={(val) => {
                                setSelectedBranchId(val ? String(val) : '');
                                setSelectedCenterId('');
                            }}
                            placeholder="All Branches"
                            searchPlaceholder="Search branch..."
                        />
                    </div>

                    {/* Center Select */}
                    <div>
                        <SearchableSelect
                            options={filteredCenters.map(c => ({
                                id: c.id,
                                label: c.center_name,
                                subLabel: c.CSU_id
                            }))}
                            value={selectedCenterId}
                            onChange={(val) => setSelectedCenterId(val ? String(val) : '')}
                            placeholder="All Centers"
                            searchPlaceholder="Search center..."
                        />
                    </div>
                </div>
            </div>

            {/* List View Table */}
            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <BMSLoader message="Loading staff directory..." size="xsmall" />
                </div>
            ) : filteredUsers.length > 0 ? (
                <div className="bg-card rounded-lg border border-border-default overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-table-header border-b border-border-default text-xs uppercase text-text-muted font-semibold tracking-wider">
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Branch</th>
                                    <th className="px-6 py-4">Contacts</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-divider">
                                {paginatedUsers.map(user => {
                                    const centerInfo = getAssignedCenterInfo(user);

                                    return (
                                        <tr
                                            key={user.id}
                                            className={`hover:bg-hover transition-colors ${user.is_blacklisted ? 'border-l-4 border-red-500 bg-red-50/30 dark:bg-red-900/10' : ''}`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm relative`}
                                                        style={!(user.avatar || user.staffId || user.userName) ? (user.status === 'Active' ? { backgroundColor: colors.primary[600], color: 'white' } : { backgroundColor: '#9CA3AF', color: 'white' }) : {}}
                                                    >
                                                        {(user.avatar || user.staffId || user.userName) ? (
                                                            <SecureImage
                                                                src={user.avatar?.startsWith('http') ? user.avatar : `${API_BASE_URL}/media/staff-profiles/${user.userName || user.staffId}`}
                                                                alt={user.name}
                                                                className="w-full h-full object-cover"
                                                                fallbackName={user.name}
                                                            />
                                                        ) : (
                                                            <span className="font-bold text-sm">{user.name.charAt(0)}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <div className="font-medium text-text-primary">
                                                                {user.name}
                                                            </div>
                                                            {user.is_blacklisted && (
                                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter bg-red-600 text-white animate-pulse">
                                                                    Blacklisted
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-md italic uppercase tracking-wider border shadow-sm"
                                                    style={{ backgroundColor: colors.primary[50], color: colors.primary[600], borderColor: colors.primary[100] }}
                                                >
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-text-secondary flex items-center gap-1.5">
                                                    <Building className="w-3.5 h-3.5 text-text-muted" />
                                                    {user.branch || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-sm text-text-secondary flex items-center gap-2">
                                                        <Mail className="w-3.5 h-3.5 text-text-muted" />
                                                        <span className="truncate max-w-[150px]" title={user.email}>{user.email}</span>
                                                    </div>
                                                    <div className="text-sm text-text-secondary flex items-center gap-2">
                                                        <Phone className="w-3.5 h-3.5 text-text-muted" />
                                                        <span>{(user.phone && user.phone !== 'N/A') ? user.phone : '-'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm transition-all ${user.status === 'Active'
                                                    ? 'bg-primary-600 text-white shadow-primary-500/20'
                                                    : 'bg-gray-500 text-white shadow-gray-500/20'
                                                    }`}>
                                                    {user.status === 'Active' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleViewDetails(user)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-input border border-border-default text-text-primary rounded-lg transition-all shadow-sm font-bold text-xs"
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = colors.primary[50];
                                                        e.currentTarget.style.borderColor = colors.primary[200];
                                                        e.currentTarget.style.color = colors.primary[600];
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = '';
                                                        e.currentTarget.style.borderColor = '';
                                                        e.currentTarget.style.color = '';
                                                    }}
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <Pagination
                        currentPage={currentPage}
                        totalItems={filteredUsers.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={setItemsPerPage}
                        itemName="staff members"
                    />
                </div>
            ) : (
                <div className="text-center py-20 bg-input rounded-xl border border-dashed border-border-default">
                    <Users className="w-12 h-12 text-text-muted mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-text-primary">No staff found</h3>
                    <p className="text-text-muted">Try adjusting your filters to see more results.</p>
                </div>
            )}

            {/* Read-Only Details Modal */}
            {selectedStaffUser && (
                <StaffDetailsModal
                    staff={selectedStaffUser}
                    publicView={true}
                    onClose={() => {
                        setIsDetailsOpen(false);
                        setSelectedStaffUser(null);
                    }}
                />
            )}
        </div>
    );
}
