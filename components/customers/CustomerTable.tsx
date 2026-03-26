import React from 'react';
import { Edit, Trash2, Phone, Mail, Power } from 'lucide-react';
import { Customer } from '../../types/customer.types';
import { authService } from '../../services/auth.service';
import { toast } from 'react-toastify';
import { SecureImage } from '../common/SecureImage';
import { API_BASE_URL } from '@/services/api.config';

interface CustomerTableProps {
    customers: Customer[];
    onEdit: (customer: Customer) => void;
    onDelete: (customerId: string) => void;
    onStatusChange: (customer: Customer, newStatus: string) => void;
    onViewDetails: (customer: Customer) => void;
    selectedCustomer?: Customer | null;
}

export function CustomerTable({ customers, onEdit, onDelete, onStatusChange, onViewDetails, selectedCustomer }: CustomerTableProps) {
    return (
        <div>
            <div className="bg-muted-bg/30 border-b border-border-divider/50 px-8 py-3.5">
                <div className="grid grid-cols-12 gap-4 text-[11px] font-black text-text-muted uppercase tracking-[0.2em] opacity-40">
                    <div className="col-span-4">Customer</div>
                    <div className="col-span-3">Contact</div>
                    <div className="col-span-2">Branch/Center</div>
                    <div className="col-span-2 text-center">Status</div>
                    <div className="col-span-1 text-center">Actions</div>
                </div>
            </div>

            <div className="divide-y border-t border-border-divider/30 divide-border-divider/30">
                {customers.map((customer) => (
                    <div
                        key={customer.id}
                        onClick={() => onViewDetails(customer)}
                        className={`px-8 py-3 hover:bg-muted-bg/50 cursor-pointer transition-all relative group/row ${selectedCustomer?.id === customer.id ? 'bg-primary-500/5' : ''
                            }`}
                    >
                        {selectedCustomer?.id === customer.id && (
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary-500" />
                        )}
                        <div className="grid grid-cols-12 gap-4 items-center">
                            {/* Customer Info */}
                            <div className="col-span-4 flex items-center gap-4">
                                <div className="w-10 h-10 bg-muted-bg border border-border-default rounded-xl flex items-center justify-center flex-shrink-0 group-hover/row:border-primary-500/50 group-hover/row:scale-105 transition-all overflow-hidden shadow-sm">
                                    {customer.customer_profile_image || customer.profile_image_url ? (
                                        <SecureImage
                                            src={(customer.customer_profile_image || customer.profile_image_url || '').startsWith('http')
                                                ? (customer.customer_profile_image || customer.profile_image_url || '')
                                                : `${API_BASE_URL}/media/customers/${customer.id}`}
                                            alt={customer.full_name}
                                            className="w-full h-full object-cover"
                                            fallbackName={customer.full_name}
                                        />
                                    ) : (
                                        <span className="text-primary-500 text-lg font-black uppercase">{customer.full_name.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-[14px] font-black text-text-primary uppercase tracking-tight truncate group-hover/row:text-primary-500 transition-colors">{customer.full_name}</p>
                                    </div>
                                    <p className="text-[10px] font-black text-text-muted opacity-40 uppercase tracking-widest mt-0.5">{customer.customer_code}</p>
                                </div>
                            </div>

                            {/* Contact */}
                            <div className="col-span-3">
                                <div className="flex items-center gap-3 text-[13px] font-black text-text-primary mb-1.5 tabular-nums">
                                    <Phone className="w-4 h-4 text-primary-500/40" />
                                    <span>{customer.mobile_no_1}</span>
                                </div>
                                {customer.business_email && (
                                    <div className="flex items-center gap-3 text-[11px] font-bold text-text-muted/60 truncate">
                                        <Mail className="w-4 h-4 text-text-muted/20" />
                                        <span className="truncate">{customer.business_email}</span>
                                    </div>
                                )}
                            </div>

                            {/* Branch/Center/Group */}
                            <div className="col-span-2 min-w-0">
                                <p className="text-[11px] font-black text-text-primary uppercase tracking-widest truncate mb-1">
                                    {customer.branch?.branch_name || customer.branch_name || 'System Unassigned'}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted/60 uppercase tracking-tighter truncate">
                                    <span className="truncate">
                                        {customer.center?.center_name || customer.center_name || 'No Center Node'}
                                    </span>
                                    {(customer.group?.group_name || customer.group_name || customer.grp_id) && (
                                        <>
                                            <span className="w-1 h-1 rounded-full bg-border-divider" />
                                            <span className="truncate">
                                                {customer.group?.group_name || customer.group_name || 'Private Group'}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Status */}
                            <div className="col-span-2 text-center">
                                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${customer.status === 'active'
                                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                    : customer.status === 'blocked'
                                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                        : 'bg-muted-bg text-text-muted border-border-divider/50'
                                    }`}>
                                    {customer.status || 'Active'}
                                </span>
                                {(customer.active_loans_count ?? 0) > 0 && (
                                    <div className="flex items-center justify-center gap-1.5 mt-1.5">
                                        <div className="w-1 h-1 bg-amber-500 rounded-full animate-pulse" />
                                        <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">
                                            {customer.active_loans_count} Active Loans
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="col-span-1 flex items-center justify-center gap-1">
                                {authService.hasPermission('customers.edit') && (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newStatus = customer.status === 'blocked' ? 'active' : 'blocked';
                                                if (newStatus !== 'active' && (customer.grp_id || customer.group?.id)) {
                                                    toast.error('Cannot block customer while assigned to a group. Remove from group first.');
                                                    return;
                                                }
                                                onStatusChange(customer, newStatus);
                                            }}
                                            className={`p-1.5 rounded-lg transition-all active:scale-95 ${customer.status === 'blocked'
                                                ? 'hover:bg-blue-500/10 text-blue-500'
                                                : 'hover:bg-amber-500/10 text-amber-500'
                                                }`}
                                            title={customer.status === 'blocked' ? 'Enable Customer' : 'Disable Customer'}
                                        >
                                            <Power className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(customer);
                                            }}
                                            className="p-1.5 hover:bg-primary-500/10 text-primary-500 rounded-lg transition-all active:scale-95"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                                {authService.hasPermission('customers.delete') && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(customer.id);
                                        }}
                                        className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-all active:scale-95"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
