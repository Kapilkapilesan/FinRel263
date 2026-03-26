'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, Users, Loader2, UserPlus, Info, CheckCircle2 } from 'lucide-react';
import { Customer } from '../../types/customer.types';
import { Center } from '../../types/center.types';
import { groupService } from '../../services/group.service';
import { customerService } from '../../services/customer.service';
import { centerService } from '../../services/center.service';
import { authService } from '../../services/auth.service';
import { toast } from 'react-toastify';
import { SearchableSelect } from '../common/SearchableSelect';

interface BulkGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function BulkGroupModal({ isOpen, onClose, onSuccess }: BulkGroupModalProps) {
    const [centers, setCenters] = useState<Center[]>([]);
    const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
    const [existingGroups, setExistingGroups] = useState<any[]>([]);
    const [isLoadingCenters, setIsLoadingCenters] = useState(false);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [selectedCenterId, setSelectedCenterId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [customerGroupMap, setCustomerGroupMap] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            loadCenters();
            setSelectedCenterId('');
            setCustomerGroupMap({});
            setSearchQuery('');
        }
    }, [isOpen]);

    const loadCenters = async () => {
        setIsLoadingCenters(true);
        try {
            const data = await centerService.getCentersList('active');
            const user = authService.getCurrentUser();
            const isFieldOfficer = !authService.hasPermission('dashboard.view_all_branches');

            let filtered = data.filter((center: Center) => center.status === 'active');
            if (isFieldOfficer && user) {
                filtered = filtered.filter((center: Center) => center.staff_id === user.user_name);
            }
            setCenters(filtered);
        } catch (error) {
            console.error('Failed to load centers:', error);
            toast.error('Failed to load centers');
        } finally {
            setIsLoadingCenters(false);
        }
    };

    useEffect(() => {
        const loadCustomers = async () => {
            if (!selectedCenterId) {
                setAllCustomers([]);
                return;
            }

            setIsLoadingCustomers(true);
            try {
                const customers = await customerService.getCustomers({
                    center_id: selectedCenterId,
                    gender: 'Female'
                });
                const unassigned = customers.filter(c => !c.grp_id && c.status === 'active');
                setAllCustomers(unassigned);
                setCustomerGroupMap({});

                const groups = await groupService.getGroupsByCenter(selectedCenterId);
                setExistingGroups(groups);
            } catch (error) {
                console.error('Failed to load customers:', error);
                toast.error('Failed to load customers');
            } finally {
                setIsLoadingCustomers(false);
            }
        };

        if (isOpen && selectedCenterId) {
            loadCustomers();
        }
    }, [selectedCenterId, isOpen]);

    const handleGroupNumberChange = (customerId: string, value: string) => {
        const sanitized = value.replace(/[^0-9]/g, '').slice(0, 5);
        setCustomerGroupMap(prev => ({
            ...prev,
            [customerId]: sanitized
        }));
    };

    const filteredCustomers = allCustomers.filter(c =>
        c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.customer_code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group customers by the number entered
    const groupsToCreate: Record<string, string[]> = {};
    Object.entries(customerGroupMap).forEach(([custId, groupNum]) => {
        if (groupNum.trim()) {
            if (!groupsToCreate[groupNum]) {
                groupsToCreate[groupNum] = [];
            }
            groupsToCreate[groupNum].push(custId);
        }
    });

    const groupCounts: Record<string, number> = {};
    Object.values(customerGroupMap).forEach(num => {
        if (num.trim()) {
            groupCounts[num] = (groupCounts[num] || 0) + 1;
        }
    });

    const totalGroups = Object.keys(groupsToCreate).length;

    const getValidationErrors = (customerId: string) => {
        const num = customerGroupMap[customerId];
        if (!num) return null;

        const errors = [];
        const center = centers.find(c => c.id.toString() === selectedCenterId);
        const potentialName = `${center?.center_name || ''} - Group ${num}`.toLowerCase();
        const existingGroup = existingGroups.find(eg => eg.group_name.toLowerCase() === potentialName);

        const existingCount = existingGroup?.customers_count || 0;
        const newCount = groupCounts[num] || 0;
        const totalCount = existingCount + newCount;

        if (totalCount > 3) {
            if (existingCount > 0) {
                errors.push(`Group ${num} already has ${existingCount} members. Cannot add ${newCount} more. (Limit 3)`);
            } else {
                errors.push(`Already has 3 members in this group. Please select another number.`);
            }
        }

        return errors.length > 0 ? errors : null;
    };

    const hasGlobalErrors = Object.keys(groupsToCreate).some(num => {
        const center = centers.find(c => c.id.toString() === selectedCenterId);
        const potentialName = `${center?.center_name || ''} - Group ${num}`.toLowerCase();
        const existingGroup = existingGroups.find(eg => eg.group_name.toLowerCase() === potentialName);
        const totalCount = (existingGroup?.customers_count || 0) + (groupCounts[num] || 0);
        return totalCount > 3;
    });

    const handleSubmit = async () => {
        if (totalGroups === 0) {
            toast.warning('Please assign at least one customer to a group number');
            return;
        }

        if (hasGlobalErrors) {
            toast.error('Please fix the validation errors before submitting');
            return;
        }

        setIsSubmitting(true);
        try {
            const groupsPayload = Object.entries(groupsToCreate).map(([num, ids]) => ({
                group_number: num,
                customer_ids: ids
            }));

            await groupService.bulkCreateGroups(selectedCenterId, groupsPayload);
            toast.success('Groups created successfully!');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to create groups:', error);
            toast.error(error.message || 'Failed to create groups');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-card rounded-[2.5rem] max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-border-default/50 animate-in zoom-in-95 duration-500">
                <div className="p-8 border-b border-border-default flex items-center justify-between bg-table-header/30">
                    <h2 className="text-xl font-black text-text-primary uppercase tracking-tight">Add Group</h2>
                    <button onClick={onClose} className="p-3 hover:bg-muted-bg text-text-muted hover:text-text-primary rounded-2xl transition-all active:scale-95 bg-muted-bg/50">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                    <div className="bg-primary-500/10 border border-primary-500/20 rounded-[2rem] p-6 flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-primary-500 uppercase tracking-wider">Create Multiple Groups</h3>
                            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                                Select a center and assign group numbers to customers. Customers with the same number will be grouped together. (Max 3 members per group)
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <SearchableSelect
                            label="Select Center *"
                            placeholder="Select a Center"
                            searchPlaceholder="Search centers by name..."
                            options={centers.map(center => ({
                                id: center.id,
                                label: center.center_name,
                                subLabel: center.staff_id ? `Staff ID: ${center.staff_id}` : null
                            }))}
                            value={selectedCenterId}
                            onChange={(val) => setSelectedCenterId(val?.toString() || '')}
                            isLoading={isLoadingCenters}
                            className="bg-card/50"
                        />
                    </div>

                    {selectedCenterId && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="relative flex-1 group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/40 group-focus-within:text-primary-500 transition-colors" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Filter customers..."
                                        className="w-full pl-11 pr-4 py-3 bg-muted-bg/50 border border-border-default rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none transition-all text-sm text-text-primary placeholder:text-text-muted/30 font-bold"
                                    />
                                </div>
                                <span className="text-xs font-black text-text-muted bg-muted-bg px-4 py-2 rounded-full border border-border-default/50 uppercase tracking-wider">
                                    {filteredCustomers.length} Customers found
                                </span>
                            </div>

                            <div className="border border-border-default rounded-[2rem] overflow-hidden shadow-lg">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-table-header border-b border-border-default">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Customer List</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] text-right">Group Number</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-divider bg-card">
                                        {isLoadingCustomers ? (
                                            <tr>
                                                <td colSpan={2} className="px-6 py-16 text-center">
                                                    <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
                                                    <p className="text-xs text-text-muted mt-3 font-bold uppercase tracking-wider">Loading customers...</p>
                                                </td>
                                            </tr>
                                        ) : filteredCustomers.length > 0 ? (
                                            filteredCustomers.map(customer => {
                                                const errors = getValidationErrors(customer.id.toString());
                                                return (
                                                    <tr key={customer.id} className="group hover:bg-table-row-hover transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div>
                                                                <p className="text-sm font-black text-text-primary">{customer.full_name}</p>
                                                                <p className="text-[11px] text-text-muted font-mono mt-0.5">{customer.customer_code}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex justify-end relative">
                                                                <input
                                                                    type="text"
                                                                    value={customerGroupMap[customer.id] || ''}
                                                                    onChange={(e) => handleGroupNumberChange(customer.id.toString(), e.target.value)}
                                                                    placeholder="e.g. 1"
                                                                    className={`w-24 px-3 py-2.5 bg-muted-bg/50 border ${errors ? 'border-rose-500 focus:ring-rose-500/10' : 'border-border-default focus:ring-primary-500/10'} rounded-xl text-center text-sm font-black text-text-primary focus:ring-4 focus:border-primary-500/50 outline-none transition-all shadow-sm`}
                                                                />
                                                                {errors && errors.length > 0 && (
                                                                    <div className="absolute top-full mt-2 right-0 w-max z-20 pointer-events-none">
                                                                        {errors.map((err, i) => (
                                                                            <p key={i} className="text-[10px] text-rose-500 font-black bg-card px-3 py-2 rounded-xl shadow-xl border border-rose-500/20 flex items-center gap-2 mb-1">
                                                                                <Info size={12} /> {err}
                                                                            </p>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={2} className="px-6 py-16 text-center text-text-muted">
                                                    <div className="flex flex-col items-center">
                                                        <UserPlus size={48} className="opacity-10 mb-3 text-text-muted" />
                                                        <p className="text-sm font-bold">No unassigned customers available in this center.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-border-default flex items-center justify-between bg-table-header/30">
                    <div className="flex items-center gap-2 text-xs text-text-muted font-bold">
                        <Info size={14} className="text-primary-500" />
                        <span>Same group number creates one group.</span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-8 py-3 bg-card border border-border-default text-text-secondary rounded-2xl hover:bg-muted-bg font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || totalGroups === 0 || hasGlobalErrors}
                            className={`px-10 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl flex items-center gap-3 active:scale-95 ${totalGroups > 0 && !hasGlobalErrors
                                ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-primary-500/20'
                                : 'bg-muted-bg text-text-muted cursor-not-allowed border border-border-default opacity-50'
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Create {totalGroups} Group{totalGroups !== 1 ? 's' : ''}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
