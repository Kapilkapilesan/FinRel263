'use client'

import React from 'react';
import { X, UserPlus } from 'lucide-react';
import { Group, GroupMember } from '../../types/group.types';
import { isLoanClosed } from '../../types/loan.types';
import { toast } from 'react-toastify';

interface GroupMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    group: Group | null;
    onEdit?: (group: Group) => void;
}

export function GroupMemberModal({ isOpen, onClose, group, onEdit }: GroupMemberModalProps) {
    if (!isOpen || !group) return null;

    const members = group.members || [];
    const customers = group.customers || [];
    const displayCount = customers.length > 0 ? customers.length : members.length;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-border-default">
                <div className="p-6 border-b border-border-default bg-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-text-primary">{group.group_name}</h2>
                            <p className="text-sm text-text-muted mt-1">
                                {displayCount} {displayCount === 1 ? 'Member' : 'Members'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-muted-bg rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-text-muted hover:text-text-primary" />
                        </button>
                    </div>
                </div>

                <div className="p-6 bg-card">
                    {group.customers && group.customers.length > 0 ? (
                        <div className="space-y-3">
                            {group.customers.map((customer) => {
                                const isTransferred = Number(customer.center_id) !== Number(group.center_id);

                                return (
                                    <div
                                        key={customer.id}
                                        className={`flex items-center justify-between p-4 border rounded-xl transition-colors ${isTransferred
                                            ? 'bg-amber-500/10 border-amber-500/20'
                                            : 'border-border-default hover:bg-muted-bg'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${isTransferred ? 'bg-amber-500 shadow-amber-500/20' : 'bg-blue-600 shadow-blue-500/20'
                                                }`}>
                                                <span className="text-white text-base font-bold">
                                                    {customer.full_name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-text-primary">{customer.full_name}</p>
                                                    {isTransferred && (
                                                        <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-500 text-[10px] uppercase font-bold rounded border border-amber-500/20">
                                                            Transferred
                                                        </span>
                                                    )}
                                                    {/* Active Loan Status */}
                                                    {customer.loans?.find(l => !isLoanClosed(l.status || '')) && (
                                                        <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-500 text-[10px] font-bold rounded border border-rose-500/20 flex items-center gap-1">
                                                            <span className="w-1 h-1 bg-rose-500 rounded-full animate-pulse"></span>
                                                            Has Active Loan ({customer.loans.find(l => !isLoanClosed(l.status || ''))?.loan_id})
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-text-muted font-mono uppercase mt-0.5">{customer.customer_code}</p>
                                                {isTransferred && (
                                                    <p className="text-[10px] text-amber-500 mt-0.5 font-medium">
                                                        Transferred to: {customer.center?.center_name || `#${customer.center_id}`}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${customer.status === 'active'
                                                    ? 'bg-primary-500/10 text-primary-500'
                                                    : 'bg-rose-500/10 text-rose-500'
                                                    }`}
                                            >
                                                {customer.status || 'Active'}
                                            </span>
                                            <div className="text-[10px] text-text-muted mt-1.5 font-medium space-y-0.5">
                                                <p className="flex items-center justify-end gap-1">
                                                    <span className="text-text-muted/40 uppercase text-[9px]">Branch:</span>
                                                    <span className="text-text-secondary">{customer.branch?.branch_name || 'N/A'}</span>
                                                </p>
                                                <p className="flex items-center justify-end gap-1">
                                                    <span className="text-text-muted/40 uppercase text-[9px]">Center:</span>
                                                    <span className="text-text-secondary">{customer.center?.center_name || 'N/A'}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : members.length > 0 ? (
                        <div className="space-y-3">
                            {members.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center justify-between p-4 border border-border-default rounded-xl hover:bg-muted-bg transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                                            <span className="text-white text-sm font-bold">
                                                {member.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-text-primary">{member.name}</p>
                                            <p className="text-sm text-text-muted mt-0.5">{member.customer_id}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span
                                            className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold capitalize ${member.status === 'active'
                                                ? 'bg-primary-500/10 text-primary-500'
                                                : 'bg-muted-bg text-text-secondary border border-border-default'
                                                }`}
                                        >
                                            {member.status}
                                        </span>
                                        <p className="text-[10px] text-text-muted mt-1 font-medium">
                                            Joined {new Date(member.joined_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-text-muted font-medium">No members in this group yet.</p>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-border-default flex gap-3 justify-end bg-muted-bg/30">
                    <button
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                        onClick={() => {
                            if (displayCount >= 3) {
                                toast.warning('This group has reached the maximum of 3 members.');
                                return;
                            }
                            if (onEdit) onEdit(group);
                        }}
                        disabled={displayCount >= 3}
                    >
                        <UserPlus className="w-4 h-4" />
                        Add Member
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 border border-border-default rounded-xl bg-card hover:bg-muted-bg transition-all font-bold text-sm text-text-secondary"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
