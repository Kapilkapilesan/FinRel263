'use client'

import React, { useState, useEffect } from 'react';
import { GroupFormData } from '../../types/group.types';
import { Center } from '../../types/center.types';
import { Customer } from '../../types/customer.types';
import { isLoanClosed } from '../../types/loan.types';
import { centerService } from '../../services/center.service';
import { customerService } from '../../services/customer.service';
import { authService } from '../../services/auth.service';
import { X, Search, Check, Users, Loader2, AlertCircle } from 'lucide-react';
import { SearchableSelect } from '../common/SearchableSelect';

interface GroupFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: GroupFormData) => void;
    initialData?: GroupFormData | null;
}

export function GroupForm({ isOpen, onClose, onSubmit, initialData }: GroupFormProps) {
    const [centers, setCenters] = useState<Center[]>([]);
    const [availableCustomers, setAvailableCustomers] = useState<Customer[]>([]);
    const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCenterId, setSelectedCenterId] = useState<string>(initialData?.center_id || '');
    const [groupName, setGroupName] = useState(initialData?.group_name || '');

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoadingData(true);
            try {
                const centersData = await centerService.getCentersList('active');
                const user = authService.getCurrentUser();
                const isFieldOfficer = !authService.hasPermission('dashboard.view_all_branches');

                // Filter logic: Active centers + assigned to FO (if applicable)
                let filtered = centersData.filter((center: Center) => center.status === 'active');

                if (isFieldOfficer && user) {
                    filtered = filtered.filter((center: Center) => center.staff_id === user.user_name);
                }

                setCenters(filtered);
            } catch (error) {
                console.error('Failed to load centers:', error);
            } finally {
                setIsLoadingData(false);
            }
        };

        if (isOpen) {
            loadInitialData();
            if (!initialData) {
                setSelectedCustomers([]);
                setSelectedCenterId('');
                setGroupName('');
                setSearchQuery('');
            } else {
                setSelectedCenterId(initialData.center_id);
                setGroupName(initialData.group_name);
            }
        }
    }, [isOpen, initialData]);

    // Load customers when center changes
    useEffect(() => {
        const loadCustomers = async () => {
            if (!selectedCenterId) {
                setAvailableCustomers([]);
                return;
            }

            setIsLoadingCustomers(true);
            try {
                // Fetch all customers for this specific center
                const customers = await customerService.getCustomers({
                    center_id: selectedCenterId,
                    gender: 'Female'
                });

                // Filter: Active Customers + (not in any group OR already in this group if editing)
                const filtered = customers.filter(c =>
                    c.status === 'active' &&
                    (!c.grp_id || (initialData?.id && c.grp_id === initialData.id))
                );
                setAvailableCustomers(filtered);

                // If editing, pre-select the existing members
                if (initialData?.customer_ids && initialData.customer_ids.length > 0) {
                    const initiallySelected = customers.filter(c => initialData.customer_ids?.includes(c.id.toString()));
                    setSelectedCustomers(initiallySelected);
                }
            } catch (error) {
                console.error('Failed to load customers:', error);
            } finally {
                setIsLoadingCustomers(false);
            }
        };

        if (isOpen && selectedCenterId) {
            loadCustomers();
        }
    }, [selectedCenterId, isOpen, initialData]);

    const toggleCustomer = (customer: Customer) => {
        const isSelected = selectedCustomers.find(c => c.id === customer.id);
        if (isSelected) {
            setSelectedCustomers(selectedCustomers.filter(c => c.id !== customer.id));
        } else {
            setSelectedCustomers([...selectedCustomers, customer]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Final guard: Must have at least 1 and maximum 3 customers
        if (selectedCustomers.length < 1 || selectedCustomers.length > 3) return;

        const data: GroupFormData = {
            id: initialData?.id,
            group_name: groupName,
            center_id: selectedCenterId,
            customer_ids: selectedCustomers.map(c => c.id.toString()),
            status: (initialData?.status || 'active') as 'active' | 'inactive'
        };
        onSubmit(data);
    };

    const filteredCustomers = availableCustomers.filter(c =>
        c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.customer_code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Disable logic: Group can ONLY be created/updated with 1-3 members
    const isSubmitDisabled = !groupName.trim() || !selectedCenterId || selectedCustomers.length < 1 || selectedCustomers.length > 3 || isLoadingData;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-border-default">
                {/* Header */}
                <div className="p-6 border-b border-border-default flex items-center justify-between bg-card">
                    <div>
                        <h2 className="text-xl font-bold text-text-primary">
                            {initialData ? 'Edit Group' : 'Add New Group'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted-bg rounded-full transition-colors"
                    >
                        <X size={20} className="text-text-muted hover:text-text-primary" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-card">
                    {/* Group Name - Hide in Edit Mode */}
                    {!initialData && (
                        <div>
                            <label className="block text-sm font-semibold text-text-secondary mb-1.5">
                                Group Name *
                            </label>
                            <input
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 bg-input border border-border-default text-text-primary rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm placeholder:text-text-muted/40 uppercase"
                                placeholder="Enter group name"
                            />
                        </div>
                    )}

                    {/* Center Selection - Hide in Edit Mode */}
                    {!initialData && (
                        <div className="space-y-4">
                            <SearchableSelect
                                label="Center *"
                                placeholder="Select Center"
                                searchPlaceholder="Search centers by name or CSU ID..."
                                options={centers.map(center => ({
                                    id: center.id,
                                    label: center.center_name,
                                    subLabel: center.CSU_id ? `CSU: ${center.CSU_id}` : null
                                }))}
                                value={selectedCenterId}
                                onChange={(val) => {
                                    setSelectedCenterId(val?.toString() || '');
                                    setSelectedCustomers([]); // Reset selections on center change
                                }}
                                isLoading={isLoadingData}
                                disabled={isLoadingData}
                            />
                        </div>
                    )}

                    {/* Customer Selection Logic */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-semibold text-text-secondary">
                                Select Customers (1 - 3 members)
                            </label>
                            <span className={`text-xs font-bold py-1 px-2 rounded-lg ${selectedCustomers.length >= 1 && selectedCustomers.length <= 3 ? 'bg-primary-500/10 text-primary-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                {selectedCustomers.length} selected
                            </span>
                        </div>

                        {!selectedCenterId ? (
                            <div className="p-10 border border-border-default bg-muted-bg/50 rounded-2xl flex flex-col items-center justify-center text-center">
                                <p className="text-sm text-text-muted">Select a center to view customers.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {initialData && selectedCustomers.some(c => c.loans?.some((l: any) => !isLoanClosed(l.status || '') && Number(l.outstanding_amount) > 0)) && (
                                    <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                        <AlertCircle size={16} className="text-amber-500 shrink-0" />
                                        <p className="text-xs font-medium text-amber-700 leading-tight">
                                            Group structure is locked because members have active loans.
                                            You cannot remove members until all loans are settled.
                                        </p>
                                    </div>
                                )}

                                {/* Search by NIC or Name */}
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                        <Search size={16} className="text-text-muted group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by name or NIC"
                                        className="w-full pl-10 pr-4 py-2.5 bg-input border border-border-default text-text-primary rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm placeholder:text-text-muted/40 uppercase"
                                    />
                                </div>

                                {/* Customer Results List */}
                                <div className="border border-border-default rounded-2xl max-h-[220px] overflow-y-auto divide-y divide-border-divider shadow-sm bg-input custom-scrollbar">
                                    {isLoadingCustomers ? (
                                        <div className="p-8 flex flex-col items-center justify-center space-y-2">
                                            <Loader2 size={24} className="animate-spin text-blue-500" />
                                            <p className="text-xs text-text-muted">Fetching customers...</p>
                                        </div>
                                    ) : filteredCustomers.length > 0 ? (
                                        filteredCustomers.map((customer) => {
                                            const isSelected = selectedCustomers.find(c => c.id === customer.id);

                                            // 1. Check if THIS specific customer has an active loan
                                            const activeLoan = customer.loans?.find((l: any) => {
                                                return !isLoanClosed(l.status || '') && Number(l.outstanding_amount) > 0;
                                            });

                                            // 2. Check if ANY of the ALREADY SELECTED members have an active loan (Group Lock)
                                            // This only applies if we are editing an existing group (initialData exists)
                                            const groupHasActiveLoan = initialData && selectedCustomers.some(c =>
                                                c.loans?.some((l: any) => !isLoanClosed(l.status || '') && Number(l.outstanding_amount) > 0)
                                            );

                                            // Logic for action:
                                            // - If customer not selected: allow selecting ONLY IF they don't have active loan AND group not full
                                            // - If customer already selected: allow unselecting ONLY IF NO ONE in the group has an active loan
                                            const isActionDisabled = isSelected
                                                ? groupHasActiveLoan // Cannot remove if group is locked by any loan
                                                : activeLoan;       // Cannot add if customer has their own loan elsewhere

                                            return (
                                                <div
                                                    key={customer.id}
                                                    onClick={() => !isActionDisabled && toggleCustomer(customer)}
                                                    className={`p-3.5 flex items-center justify-between cursor-pointer hover:bg-muted-bg transition-colors ${isSelected ? 'bg-blue-500/5' : ''} ${isActionDisabled ? 'opacity-60 cursor-not-allowed bg-muted-bg/50' : ''}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${isSelected ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-muted-bg text-text-muted'}`}>
                                                            {customer.full_name.charAt(0)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-semibold text-text-primary leading-none truncate">{customer.full_name}</p>
                                                                {activeLoan && (
                                                                    <span className="text-[9px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">
                                                                        Has Active Loan ({activeLoan.loan_id})
                                                                    </span>
                                                                )}
                                                                {isSelected && !activeLoan && groupHasActiveLoan && (
                                                                    <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                                                        Locked by Group Loan
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-text-muted font-mono mt-1">{customer.customer_code}</p>
                                                        </div>
                                                    </div>
                                                    {isSelected ? (
                                                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                                            <Check size={12} className="text-white" strokeWidth={3} />
                                                        </div>
                                                    ) : (
                                                        <div className="w-5 h-5 border border-border-default rounded-full" />
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="p-8 text-center">
                                            <p className="text-sm text-text-muted">No available customers found in this center.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Validation Hint */}
                        {selectedCustomers.length > 3 && (
                            <div className="flex items-center gap-2 text-rose-500 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                                <AlertCircle size={14} />
                                <p className="text-[11px] font-medium">Maximum 3 members allowed per group.</p>
                            </div>
                        )}
                        {selectedCustomers.length === 0 && (
                            <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                                <AlertCircle size={14} />
                                <p className="text-[11px] font-medium">Please select at least 1 customer.</p>
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="p-6 border-t border-border-default flex gap-3 justify-end bg-card">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 bg-card border border-border-default rounded-xl hover:bg-muted-bg transition-all font-semibold text-sm text-text-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitDisabled}
                        className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all font-semibold text-sm shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                        {initialData ? 'Update Group' : 'Add Group'}
                    </button>
                </div>
            </div>
        </div>
    );
}
