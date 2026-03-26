import React, { useState } from 'react';
import { X, Phone, Mail, MapPin, Building, Eye, ShieldAlert, ShieldCheck, ArrowRightLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { Customer } from '../../types/customer.types';
import CenterTransferModal from './CenterTransferModal';
import { SecureImage } from '../common/SecureImage';
import { API_BASE_URL } from '@/services/api.config';
import { AddActivityForm } from './activities/AddActivityForm';
import { ActivityTimeline } from './activities/ActivityTimeline';

interface CustomerProfilePanelProps {
    customer: Customer;
    onClose: () => void;
    onEdit: (customer: Customer) => void;
    onStatusChange: (customer: Customer, newStatus: string) => void;
    onViewFullDetails: () => void;
}

export function CustomerProfilePanel({ customer, onClose, onEdit, onStatusChange, onViewFullDetails }: CustomerProfilePanelProps) {
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'activity'>('info');
    const [refreshActivityTrigger, setRefreshActivityTrigger] = useState(0);

    // Logic alignment with CustomerForm
    const hasActiveLoans = (customer.active_loans_count ?? 0) > 0;
    const isPendingApproval = customer.edit_request_status === 'pending';
    const isUnlocked = customer.is_edit_locked === false;
    const isBlocked = customer.status === 'blocked';

    // Determine if clicking "Edit" will lead to an approval flow
    // Locking only happens if they have active loans and are NOT unlocked by manager
    const requiresApproval = hasActiveLoans && !isUnlocked;

    return (
        <>
            <div className="bg-card rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-fit border border-border-default">
                {/* Header - Changes color if blocked */}
                <div className={`${isBlocked ? 'bg-slate-900' : 'bg-primary-600'} p-5 relative transition-colors`}>
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-white/70 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white text-xl font-black backdrop-blur-md border border-white/10 shadow-inner overflow-hidden">
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
                                customer.full_name?.charAt(0) || 'C'
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-black text-white uppercase tracking-tight">{customer.full_name}</h2>
                                {isBlocked && (
                                    <span className="bg-white/10 text-white text-[10px] uppercase font-black px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
                                        Blocked
                                    </span>
                                )}
                            </div>
                            <p className="text-white/60 text-[11px] font-black uppercase tracking-[0.2em] mt-1">{customer.customer_code}</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20">
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                {customer.active_loans_count ?? 0} Active Loans
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border-divider/50 bg-muted-bg/20">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`flex-1 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'info'
                            ? 'text-primary-500'
                            : 'text-text-muted opacity-40 hover:opacity-100 hover:text-text-primary'
                            }`}
                    >
                        {activeTab === 'info' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500" />}
                        Diagnostics
                    </button>
                    <button
                        onClick={() => setActiveTab('activity')}
                        className={`flex-1 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'activity'
                            ? 'text-primary-500'
                            : 'text-text-muted opacity-40 hover:opacity-100 hover:text-text-primary'
                            }`}
                    >
                        {activeTab === 'activity' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500" />}
                        Event Nexus
                    </button>
                </div>

                {/* Body Content */}
                {activeTab === 'info' ? (
                    <div className="p-5 flex flex-col gap-4">
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-4 group/item">
                                <div className="w-10 h-10 rounded-2xl bg-muted-bg/50 flex items-center justify-center flex-shrink-0 group-hover/item:bg-primary-500/10 transition-colors">
                                    <Phone className="w-5 h-5 text-text-muted group-hover/item:text-primary-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Frequency Link</p>
                                    <p className="text-[14px] font-black text-text-primary mt-1 tabular-nums tracking-tight">
                                        {customer.mobile_no_1}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 group/item">
                                <div className="w-10 h-10 rounded-2xl bg-muted-bg/50 flex items-center justify-center flex-shrink-0 group-hover/item:bg-primary-500/10 transition-colors">
                                    <MapPin className="w-5 h-5 text-text-muted group-hover/item:text-primary-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Center</p>
                                    <p className="text-[14px] font-black text-text-primary mt-1 tracking-tight uppercase">
                                        {customer.center?.center_name || customer.center_name || 'Unassigned Node'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 group/item">
                                <div className="w-10 h-10 rounded-2xl bg-muted-bg/50 flex items-center justify-center flex-shrink-0 group-hover/item:bg-primary-500/10 transition-colors">
                                    <Building className="w-5 h-5 text-text-muted group-hover/item:text-primary-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Branch</p>
                                    <p className="text-[14px] font-black text-text-primary mt-1 tracking-tight uppercase">
                                        {customer.branch?.branch_name || customer.branch_name || 'System Root'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Warning/Status Alert */}
                        {/* {(hasActiveLoans || isPendingApproval) && (
                            <div className={`
                            ${isPendingApproval ? 'bg-amber-500/10 border-amber-500/20' :
                                    isUnlocked && hasActiveLoans ? 'bg-emerald-500/10 border-emerald-500/20' :
                                        'bg-rose-500/10 border-rose-500/20'} 
                            border rounded-2xl p-5 flex gap-4 transition-colors tracking-tight`}
                            >
                                {isUnlocked && hasActiveLoans ? (
                                    <ShieldCheck className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <ShieldAlert className={`w-6 h-6 ${isPendingApproval ? 'text-amber-500' : 'text-rose-500'} flex-shrink-0 mt-0.5`} />
                                )}
                                <div>
                                    <h4 className={`text-xs font-black uppercase tracking-widest ${isPendingApproval ? 'text-amber-500' : (isUnlocked && hasActiveLoans) ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {isPendingApproval ? 'Review Phase' : (isUnlocked && hasActiveLoans) ? 'Encryption Bypass' : 'Protocol Lock'}
                                    </h4>
                                    <p className={`text-[11px] font-bold ${isPendingApproval ? 'text-amber-500/60' : (isUnlocked && hasActiveLoans) ? 'text-emerald-500/60' : 'text-rose-500/60'} mt-1 leading-normal`}>
                                        {isPendingApproval
                                            ? 'The system is validating a recent mutation request.'
                                            : (isUnlocked && hasActiveLoans)
                                                ? 'Command overrides enabled for direct database correction.'
                                                : 'Multiple active nodes detected. Elevated permissions required.'
                                        }
                                    </p>
                                </div>
                            </div>
                        )} */}

                        {/* Actions */}
                        <div className="flex flex-col gap-2 mt-1">
                            <button
                                onClick={() => {
                                    const newStatus = isBlocked ? 'active' : 'blocked';
                                    if (newStatus !== 'active' && (customer.grp_id || customer.group?.id)) {
                                        toast.error('Cannot block customer while assigned to a group. Remove from group first.');
                                        return;
                                    }
                                    onStatusChange(customer, newStatus);
                                }}
                                className={`w-full py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95 ${isBlocked
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                                    : 'bg-slate-800 text-white hover:bg-slate-700 shadow-slate-900/20'
                                    }`}
                            >
                                <ShieldAlert className="w-4 h-4" />
                                {isBlocked ? 'Re-Initialize Protocol' : 'Deactivate'}
                            </button>

                            <button
                                onClick={() => onEdit(customer)}
                                disabled={isPendingApproval}
                                className={`w-full py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95
                                ${isPendingApproval ? 'bg-muted-bg text-text-muted opacity-20 cursor-not-allowed shadow-none' :
                                        (isUnlocked && hasActiveLoans) ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20' :
                                            requiresApproval ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20' :
                                                'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/20'
                                    }`}
                            >
                                {(isUnlocked && hasActiveLoans) ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                                {isPendingApproval ? 'Approval Sequential' :
                                    (isUnlocked && hasActiveLoans) ? 'Force Correction' :
                                        requiresApproval ? 'Request Update' : 'Edit Details'}
                            </button>

                            {customer.center_id && (
                                <button
                                    onClick={() => setShowTransferModal(true)}
                                    className="w-full py-2.5 bg-primary-500/5 hover:bg-primary-500/10 text-primary-500 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 border border-primary-500/10 active:scale-95"
                                >
                                    <ArrowRightLeft className="w-4 h-4" />
                                    Center Transfer
                                </button>
                            )}

                            <button
                                onClick={onViewFullDetails}
                                className="w-full py-2.5 bg-muted-bg/50 hover:bg-card text-text-muted hover:text-text-primary rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 border border-border-divider/30 active:scale-95"
                            >
                                <Eye className="w-4 h-4" />
                                View Full Details
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-5 h-[450px] overflow-y-auto custom-scrollbar">
                        <AddActivityForm
                            customerId={Number(customer.id)}
                            onActivityAdded={() => setRefreshActivityTrigger(prev => prev + 1)}
                        />
                        <ActivityTimeline
                            customerId={Number(customer.id)}
                            refreshTrigger={refreshActivityTrigger}
                        />
                    </div>
                )}
            </div>
            {showTransferModal && (
                <CenterTransferModal
                    customer={customer}
                    onClose={() => setShowTransferModal(false)}
                    onSuccess={() => {
                        // Ideally refresh parent data
                    }}
                />
            )}
        </>
    );
}
