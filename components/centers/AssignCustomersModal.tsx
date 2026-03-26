'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, Check, Users, Loader2, UserPlus } from 'lucide-react';
import { Customer } from '../../types/customer.types';
import { Center } from '../../types/center.types';
import { customerService } from '../../services/customer.service';
import { toast } from 'react-toastify';
import { colors } from '../../themes/colors';

interface AssignCustomersModalProps {
    isOpen: boolean;
    onClose: () => void;
    center: Center;
    onAssignSuccess: () => void;
}

export function AssignCustomersModal({ isOpen, onClose, center, onAssignSuccess }: AssignCustomersModalProps) {
    const [unassignedCustomers, setUnassignedCustomers] = useState<Customer[]>([]);
    const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadUnassignedCustomers();
            setSelectedCustomers([]);
            setSearchQuery('');
        }
    }, [isOpen]);

    const loadUnassignedCustomers = async () => {
        setIsLoading(true);
        try {
            // Fetch only LOAD CUSTOMERS without center assignment
            const customers = await customerService.getCustomers({
                unassigned_only: true,
                gender: 'Female'
            });
            setUnassignedCustomers(customers);
        } catch (error) {
            console.error('Failed to load unassigned customers:', error);
            toast.error('Failed to load customers');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleCustomer = (customer: Customer) => {
        const isSelected = selectedCustomers.find(c => c.id === customer.id);
        if (isSelected) {
            setSelectedCustomers(selectedCustomers.filter(c => c.id !== customer.id));
        } else {
            setSelectedCustomers([...selectedCustomers, customer]);
        }
    };

    const toggleSelectAll = () => {
        if (selectedCustomers.length === filteredCustomers.length) {
            setSelectedCustomers([]);
        } else {
            setSelectedCustomers([...filteredCustomers]);
        }
    };

    const handleAssign = async () => {
        if (selectedCustomers.length === 0) {
            toast.warning('Please select at least one customer');
            return;
        }

        setIsSubmitting(true);
        try {
            const customerIds = selectedCustomers.map(c => c.id.toString());
            await customerService.bulkAssignToCenter(customerIds, center.id);

            toast.success(`Successfully assigned ${selectedCustomers.length} customer(s) to ${center.center_name}`);
            onAssignSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to assign customers:', error);
            toast.error(error.message || 'Failed to assign customers');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredCustomers = unassignedCustomers.filter(c =>
        c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.customer_code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-border-default transition-colors">
                {/* Header */}
                {/* Header */}
                <div className="p-6 border-b border-border-divider bg-card transition-colors">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-xl font-black text-text-primary flex items-center gap-2">
                                <UserPlus className="w-6 h-6" style={{ color: colors.primary[600] }} />
                                Assign Customers to Center
                            </h2>
                            <p className="text-xs text-text-muted mt-1 font-bold uppercase tracking-widest">
                                Target: <span className="text-text-primary">{center.center_name}</span>
                                {center.CSU_id && <span className="ml-2 opacity-60">({center.CSU_id})</span>}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-hover rounded-full transition-colors text-text-muted"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 transition-colors">
                    {/* Search and Select All */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-text-muted opacity-50" />
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                    Unassigned Customers
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span
                                    style={selectedCustomers.length > 0 ? {
                                        backgroundColor: `${colors.primary[600]}15`,
                                        color: colors.primary[600],
                                        border: `1px solid ${colors.primary[600]}30`
                                    } : {}}
                                    className={`text-[10px] font-black py-1 px-2.5 rounded-lg uppercase tracking-widest transition-all ${selectedCustomers.length > 0 ? '' : 'bg-muted-bg text-text-muted'}`}
                                >
                                    {selectedCustomers.length} selected
                                </span>
                                {filteredCustomers.length > 0 && (
                                    <button
                                        onClick={toggleSelectAll}
                                        className="text-[10px] font-black uppercase tracking-widest transition-colors hover:underline"
                                        style={{ color: colors.primary[600] }}
                                    >
                                        {selectedCustomers.length === filteredCustomers.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Search size={16} className="text-text-muted opacity-50" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name or customer code..."
                                className="w-full pl-12 pr-4 py-3 bg-input border border-border-default rounded-xl focus:ring-2 transition-all text-sm text-text-primary outline-none"
                                style={{ '--tw-ring-color': `${colors.primary[500]}20` } as any}
                            />
                        </div>
                    </div>

                    {/* Customer List */}
                    <div className="border border-border-divider rounded-xl overflow-hidden bg-card">
                        {isLoading ? (
                            <div className="p-12 flex flex-col items-center justify-center space-y-3">
                                <Loader2 size={32} className="animate-spin" style={{ color: colors.primary[600] }} />
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Fetching customers...</p>
                            </div>
                        ) : filteredCustomers.length > 0 ? (
                            <div className="max-h-[350px] overflow-y-auto divide-y divide-border-divider custom-scrollbar">
                                {filteredCustomers.map((customer) => {
                                    const isSelected = selectedCustomers.find(c => c.id === customer.id);

                                    return (
                                        <div
                                            key={customer.id}
                                            onClick={() => toggleCustomer(customer)}
                                            className={`p-4 flex items-center justify-between cursor-pointer hover:bg-hover transition-colors ${isSelected ? 'bg-primary-500/5 dark:bg-primary-500/10' : ''
                                                }`}
                                        >
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 transition-all ${isSelected ? '' : 'bg-muted-bg text-text-muted'}`}
                                                    style={isSelected ? { backgroundColor: colors.primary[600], color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } : {} as any}>
                                                    {customer.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-text-primary truncate uppercase tracking-tight">
                                                        {customer.full_name}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60">
                                                            {customer.customer_code}
                                                        </p>
                                                    </div>
                                                    {customer.branch && (
                                                        <p className="text-[9px] font-black text-text-muted mt-1 uppercase tracking-tighter opacity-100 group">
                                                            Branch: <span className="text-text-secondary">{typeof customer.branch === 'string' ? customer.branch : customer.branch.branch_name}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0 ml-3">
                                                {isSelected ? (
                                                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shadow-lg" style={{ backgroundColor: colors.primary[600] }}>
                                                        <Check size={14} className="text-white" strokeWidth={4} />
                                                    </div>
                                                ) : (
                                                    <div className="w-6 h-6 border-2 border-border-divider rounded-lg transition-colors group-hover:border-primary-500/50" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-12 text-center">
                                <Users className="w-12 h-12 text-text-muted opacity-30 mx-auto mb-3" />
                                <p className="text-sm text-text-muted opacity-60">
                                    {searchQuery ? 'No customers found matching your search.' : 'No unassigned customers available.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-border-divider bg-table-header flex gap-3 justify-end transition-colors pb-8">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-card border border-border-divider rounded-xl hover:bg-hover transition-all font-black text-xs uppercase tracking-widest text-text-secondary disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={selectedCustomers.length === 0 || isSubmitting}
                        style={!(selectedCustomers.length === 0 || isSubmitting) ? { backgroundColor: colors.primary[600] } : {} as any}
                        className={`px-8 py-2.5 text-white rounded-xl transition-all font-black text-xs uppercase tracking-widest shadow-lg disabled:cursor-not-allowed flex items-center gap-2 ${!(selectedCustomers.length === 0 || isSubmitting) ? 'hover:opacity-90 active:scale-[0.98]' : 'bg-muted-bg text-text-muted opacity-50'}`}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Assigning...
                            </>
                        ) : (
                            <>
                                <UserPlus size={16} />
                                Assign {selectedCustomers.length > 0 ? `(${selectedCustomers.length})` : 'Customers'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
