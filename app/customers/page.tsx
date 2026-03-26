"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Search, Download, Filter, Upload, UserPlus, MapPin, Building, Briefcase, Users } from 'lucide-react';
import { Customer, CustomerStats } from '../../types/customer.types';
import { customerService } from '../../services/customer.service';
import { useCustomersList, useCustomerConstants } from '../../hooks/useCustomers';
import { CustomerStatsCard } from '../../components/customers/CustomerStats';
import { CustomerTable } from '../../components/customers/CustomerTable';
import { CustomerDetailsModal } from '../../components/customers/CustomerDetailsModal';
import { CustomerForm } from '../../components/customers/CustomerForm';
import { CustomerProfilePanel } from '../../components/customers/CustomerProfilePanel';
import { CenterAssignmentModal } from '../../components/customers/CenterAssignmentModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { toast } from 'react-toastify';
import { authService } from '../../services/auth.service';
import { useRouter } from 'next/navigation';
import BMSLoader from '../../components/common/BMSLoader';
import { Pagination } from '../../components/common/Pagination';
import { SearchableSelect } from '@/components/common/SearchableSelect';

export default function CustomersPage() {
    const { data: customers = [], isLoading: loadingCustomers, refetch: loadCustomers } = useCustomersList();
    const { data: constants } = useCustomerConstants();
    const loading = loadingCustomers;
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'All' | 'active' | 'blocked'>('All');
    const [filterBranch, setFilterBranch] = useState<string>('All');
    const [filterCenter, setFilterCenter] = useState<string>('All');
    const [filterGroup, setFilterGroup] = useState<string>('All');
    const [showAssignModal, setShowAssignModal] = useState(false);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Confirmation States
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showStatusConfirm, setShowStatusConfirm] = useState(false);
    const [importing, setImporting] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [pendingAction, setPendingAction] = useState<{
        customer: Customer | null;
        newStatus?: string;
    }>({ customer: null });

    const router = useRouter();

    const [hasAccess, setHasAccess] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAccess = () => {
            const hasViewPermission = authService.hasPermission('customers.view');

            if (!hasViewPermission) {
                toast.error('You do not have permission to view customers');
                router.push('/');
                return false;
            }
            return true;
        };

        if (typeof window !== 'undefined') {
            const allowed = checkAccess();
            setHasAccess(allowed);
        }
    }, [router]);

    // Stats dynamically calculated from cached query data
    const stats = React.useMemo(() => {
        const data = customers;
        if (!data || data.length === 0) {
            return {
                totalCustomers: 0,
                activeCustomers: 0,
                blockedCustomers: 0,
                customersWithLoans: 0,
                newThisMonth: 0,
                pendingRequestsCount: 0
            };
        }
        
        const activeCount = data.filter(c => c.status === 'active').length;
        const blockedCount = data.filter(c => c.status === 'blocked').length;
        const withLoansCount = data.filter(c => (Number(c.active_loans_count) || 0) > 0).length;
        const pendingCount = data.filter(c => c.edit_request_status === 'pending').length;

        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const newThisMonthCount = data.filter(c => {
            if (!c.created_at) return false;
            const createdDate = new Date(c.created_at);
            return createdDate >= firstDayOfMonth;
        }).length;

        return {
            totalCustomers: data.length,
            activeCustomers: activeCount,
            blockedCustomers: blockedCount,
            customersWithLoans: withLoansCount,
            newThisMonth: newThisMonthCount,
            pendingRequestsCount: pendingCount
        };
    }, [customers]);

    // Calculate filtered data synchronously avoiding state loops
    const filteredCustomers = React.useMemo(() => {
        let filtered = customers;

        if (searchTerm) {
            const query = searchTerm.trim().toLowerCase();
            filtered = filtered.filter(customer =>
                customer.full_name.toLowerCase().includes(query) ||
                customer.customer_code.toLowerCase().includes(query) ||
                customer.mobile_no_1.includes(searchTerm.trim())
            );
        }

        if (filterStatus !== 'All') {
            filtered = filtered.filter(customer => customer.status === filterStatus);
        }

        if (filterBranch !== 'All') {
            if (filterBranch === 'unassigned') {
                filtered = filtered.filter(customer => !customer.branch_id);
            } else {
                filtered = filtered.filter(customer => customer.branch_id?.toString() === filterBranch);
            }
        }

        if (filterCenter !== 'All') {
            if (filterCenter === 'unassigned') {
                filtered = filtered.filter(customer => !customer.center_id);
            } else {
                filtered = filtered.filter(customer => customer.center_id?.toString() === filterCenter);
            }
        }

        if (filterGroup !== 'All') {
            if (filterGroup === 'unassigned') {
                filtered = filtered.filter(customer => !customer.grp_id);
            } else {
                filtered = filtered.filter(customer => customer.grp_id?.toString() === filterGroup);
            }
        }

        return filtered;
    }, [customers, searchTerm, filterStatus, filterBranch, filterCenter, filterGroup]);

    // Calculate paginated data
    const paginatedCustomers = React.useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredCustomers.slice(startIndex, endIndex);
    }, [filteredCustomers, currentPage, itemsPerPage]);

    const handleViewDetails = (customer: Customer) => {
        if (selectedCustomer?.id === customer.id) {
            setSelectedCustomer(null);
        } else {
            setSelectedCustomer(customer);
        }
    };


    const handleViewFullDetails = () => {
        setShowDetailsModal(true);
    };

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer);
        setShowEditModal(true);
    };

    const handleDelete = (customerId: string) => {
        const customer = customers.find(c => c.id === customerId);
        setPendingAction({ customer: customer || null });
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!pendingAction.customer) return;
        try {
            await customerService.deleteCustomer(pendingAction.customer.id);
            toast.success('Customer deleted successfully');
            loadCustomers();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete customer');
        } finally {
            setShowDeleteConfirm(false);
            setPendingAction({ customer: null });
        }
    };

    const handleStatusChange = (customer: Customer, newStatus: string) => {
        setPendingAction({ customer, newStatus });
        setShowStatusConfirm(true);
    };

    const confirmStatusChange = async () => {
        if (!pendingAction.customer || !pendingAction.newStatus) return;
        const { customer, newStatus } = pendingAction;

        // 🔒 Group Validation (Final Guard)
        if (newStatus !== 'active' && (customer.grp_id || customer.group?.id)) {
            toast.error('Cannot block customer while assigned to a group. Remove from group first.');
            setShowStatusConfirm(false);
            return;
        }

        try {
            await customerService.updateCustomer(customer.id, { status: newStatus as any });
            toast.success(`Customer ${newStatus === 'blocked' ? 'disabled' : 'enabled'} successfully`);

            // Sync selectedCustomer if it's the one we just changed
            if (selectedCustomer?.id === customer.id) {
                setSelectedCustomer({ ...customer, status: newStatus as any });
            }

            loadCustomers();
        } catch (error: any) {
            toast.error(error.message || `Failed to update customer status`);
        } finally {
            setShowStatusConfirm(false);
            setPendingAction({ customer: null });
        }
    };

    const handleSaveCustomer = async (data: any) => {
        if (showEditModal && selectedCustomer) {
            // Update
            return await customerService.updateCustomer(selectedCustomer.id, data);
        } else {
            // Create
            return await customerService.createCustomer(data);
        }
    };

    const handleOpenAddModal = () => {
        setSelectedCustomer(null); // Clear selection to prevent accidents
        setShowAddModal(true);
    };

    const handleFormClose = () => {
        setShowAddModal(false);
        setShowEditModal(false);
        setSelectedCustomer(null);
        loadCustomers();
    };

    // Pagination handlers
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset to first page when changing items per page
    };

    const handleExport = async () => {
        try {
            await customerService.exportCustomers();
            toast.success('Customers exported successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to export customers');
        }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.name.endsWith('.csv')) {
            toast.error('Please upload a valid CSV file');
            return;
        }

        setImporting(true);
        try {
            await customerService.importCustomers(file);
            toast.success('Customers imported successfully');
            loadCustomers();
        } catch (error: any) {
            toast.error(error.message || 'Failed to import customers');
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (hasAccess === false) return null;

    if (hasAccess === null || loading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
                <BMSLoader message="Loading customers..." size="medium" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-text-primary uppercase tracking-tight">Customer List</h1>
                    <p className="text-sm text-text-muted mt-1 font-bold uppercase tracking-widest opacity-60">Manage and track all customer information</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImport}
                        accept=".csv"
                        className="hidden"
                    />
                    {(authService.hasPermission('customers.import')) && (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={importing}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-card border border-border-default text-text-primary px-4 py-2.5 rounded-xl hover:bg-muted-bg transition-all shadow-sm font-black text-xs uppercase tracking-widest disabled:opacity-50"
                        >
                            <Upload className="w-4 h-4 text-text-muted" />
                            <span>{importing ? 'Importing...' : 'Import CSV'}</span>
                        </button>
                    )}
                    {(authService.hasPermission('customers.export')) && (
                        <button
                            onClick={handleExport}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-card border border-border-default text-text-primary px-4 py-2.5 rounded-xl hover:bg-muted-bg transition-all shadow-sm font-black text-xs uppercase tracking-widest"
                        >
                            <Download className="w-4 h-4 text-text-muted" />
                            <span>Export CSV</span>
                        </button>
                    )}
                    {(authService.hasPermission('customers.assign')) && (
                        <button
                            onClick={() => setShowAssignModal(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary-500/10 border border-primary-500/20 text-primary-500 px-4 py-2.5 rounded-xl hover:bg-primary-500/20 transition-all font-black text-xs uppercase tracking-widest"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span>Add to Center</span>
                        </button>
                    )}
                    {(authService.hasPermission('customers.create')) && (
                        <button
                            onClick={handleOpenAddModal}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 font-black text-xs uppercase tracking-widest"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Customer</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Statistics */}
            <CustomerStatsCard
                stats={stats}
                pendingRequestsCount={(stats as any).pendingRequestsCount}
            />

            {/* Search and Filters */}
            <div className="bg-card rounded-2xl border border-border-default p-5 shadow-sm transition-all hover:shadow-md">
                <div className="flex flex-col xl:flex-row gap-5 items-stretch lg:items-center">
                    {/* Search Field */}
                    <div className="relative flex-1 group">
                        <Search className="w-4 h-4 text-text-muted/40 absolute left-5 top-1/2 -translate-y-1/2 group-focus-within:text-primary-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Enter Name, NIC, or Mobile Number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-5 py-3.5 bg-input/50 border border-border-divider/50 rounded-2xl text-[13px] font-black tracking-tight focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/30 transition-all text-text-primary placeholder:text-text-muted/20 uppercase"
                        />
                    </div>

                    {/* Filter Action Group */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 xl:flex-[2]">
                        {/* Status Filter */}
                        <div className="flex-1 min-w-[140px]">
                            <SearchableSelect
                                options={[
                                    { id: 'All', label: 'All Statuses' },
                                    { id: 'active', label: 'Active Only' },
                                    { id: 'blocked', label: 'Blocked Only' }
                                ]}
                                value={filterStatus}
                                onChange={(val) => setFilterStatus(val as any)}
                                placeholder="Status"
                                className="w-full"
                            />
                        </div>

                        {/* Branch Filter */}
                        <div className="flex-1 min-w-[140px]">
                            <SearchableSelect
                                options={[
                                    { id: 'All', label: 'All Branches' },
                                    { id: 'unassigned', label: 'Unassigned' },
                                    ...(constants?.branches || []).map((b: any) => ({
                                        id: b.id.toString(),
                                        label: b.branch_name
                                    }))
                                ]}
                                value={filterBranch}
                                onChange={(val) => {
                                    setFilterBranch(val?.toString() || 'All');
                                    setFilterCenter('All');
                                    setFilterGroup('All');
                                }}
                                placeholder="Branch"
                                className="w-full"
                            />
                        </div>

                        {/* Center Filter */}
                        <div className="flex-1 min-w-[140px]">
                            <SearchableSelect
                                options={[
                                    { id: 'All', label: 'All Centers' },
                                    { id: 'unassigned', label: 'Unassigned' },
                                    ...(constants?.centers || [])
                                        .filter((c: any) => filterBranch === 'All' || c.branch_id?.toString() === filterBranch)
                                        .map((c: any) => ({
                                            id: c.id.toString(),
                                            label: c.center_name
                                        }))
                                ]}
                                value={filterCenter}
                                onChange={(val) => {
                                    setFilterCenter(val?.toString() || 'All');
                                    setFilterGroup('All');
                                }}
                                placeholder="Center"
                                className="w-full"
                                disabled={filterBranch === 'unassigned'}
                            />
                        </div>

                        {/* Group Filter */}
                        <div className="flex-1 min-w-[140px]">
                            <SearchableSelect
                                options={[
                                    { id: 'All', label: 'All Groups' },
                                    { id: 'unassigned', label: 'Unassigned' },
                                    ...(constants?.groups || [])
                                        .filter((g: any) => filterCenter === 'All' || g.center_id?.toString() === filterCenter)
                                        .map((g: any) => ({
                                            id: g.id.toString(),
                                            label: g.group_name
                                        }))
                                ]}
                                value={filterGroup}
                                onChange={(val) => setFilterGroup(val?.toString() || 'All')}
                                placeholder="Group"
                                className="w-full"
                                disabled={filterCenter === 'unassigned'}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Customer Table */}
                <div className="flex-1 min-w-0 bg-card rounded-3xl border border-border-default overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="p-12 text-center flex flex-col items-center">
                            <BMSLoader message="Loading customers..." size="xsmall" />
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="p-16 text-center">
                            <Users className="w-16 h-16 text-text-muted opacity-20 mx-auto mb-6" />
                            <p className="text-text-muted font-black uppercase tracking-[0.2em] italic">No customers found</p>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="mt-6 text-primary-500 hover:text-primary-600 transition-all text-xs font-black uppercase tracking-widest bg-primary-500/10 px-6 py-2.5 rounded-xl border border-primary-500/20"
                            >
                                Add your first customer
                            </button>
                        </div>
                    ) : (
                        <CustomerTable
                            customers={paginatedCustomers}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onStatusChange={handleStatusChange}
                            onViewDetails={handleViewDetails}
                            selectedCustomer={selectedCustomer}
                        />
                    )}

                    {/* Pagination */}
                    <div className="flex-1 lg:flex-shrink-0">
                        <Pagination
                            currentPage={currentPage}
                            totalItems={filteredCustomers.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={handlePageChange}
                            onItemsPerPageChange={handleItemsPerPageChange}
                            itemName="customers"
                        />
                    </div>
                </div>

                {/* Side Panel */}
                {selectedCustomer && (
                    <div className="w-full lg:w-[400px] flex-shrink-0">
                        <CustomerProfilePanel
                            customer={selectedCustomer}
                            onClose={() => setSelectedCustomer(null)}
                            onEdit={handleEdit}
                            onViewFullDetails={handleViewFullDetails}
                            onStatusChange={handleStatusChange}
                        />
                    </div>
                )}
            </div>

            {/* Modals */}
            {showDetailsModal && selectedCustomer && (
                <CustomerDetailsModal
                    customer={selectedCustomer}
                    onClose={() => {
                        setShowDetailsModal(false);
                    }}
                    onStatusChange={handleStatusChange}
                />
            )}

            {showAddModal && (
                <CustomerForm
                    onClose={handleFormClose}
                    onSubmit={handleSaveCustomer}
                />
            )}

            {showEditModal && selectedCustomer && (
                <CustomerForm
                    onClose={handleFormClose}
                    onSubmit={handleSaveCustomer}
                    initialData={selectedCustomer}
                />
            )}

            {showAssignModal && (
                <CenterAssignmentModal
                    onClose={() => setShowAssignModal(false)}
                    onSuccess={() => {
                        setShowAssignModal(false);
                        loadCustomers();
                    }}
                />
            )}

            {/* Confirmation Dialogs */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Delete Customer Profile"
                message={`Are you sure you want to permanently delete ${pendingAction.customer?.full_name}'s profile? This action cannot be undone.`}
                confirmText="Permanently Delete"
                cancelText="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />

            <ConfirmDialog
                isOpen={showStatusConfirm}
                title={pendingAction.newStatus === 'blocked' ? 'Disable Customer' : 'Activate Customer'}
                message={`Are you sure you want to ${pendingAction.newStatus === 'blocked' ? 'disable' : 'enable'} ${pendingAction.customer?.full_name}? ${pendingAction.newStatus === 'blocked' ? 'They will no longer be eligible for new transactions.' : 'They will be able to perform transactions again.'}`}
                confirmText={pendingAction.newStatus === 'blocked' ? 'Yes, Disable' : 'Yes, Activate'}
                cancelText="Cancel"
                variant={pendingAction.newStatus === 'blocked' ? 'warning' : 'info'}
                onConfirm={confirmStatusChange}
                onCancel={() => setShowStatusConfirm(false)}
            />
        </div>
    );
}
