import React from 'react';
import { X, Mail, Phone, MapPin, Calendar, User, Briefcase, Building, Heart, Users as UsersIcon, DollarSign, ShieldCheck, CheckCircle2, MessageSquare, Tag, ShieldAlert } from 'lucide-react';
import { Customer } from '../../types/customer.types';
import { colors } from '@/themes/colors';
import { SecureImage } from '../common/SecureImage';
import { API_BASE_URL } from '@/services/api.config';
import { toast } from 'react-toastify';

interface CustomerDetailsModalProps {
    customer: Customer;
    onClose: () => void;
    onStatusChange?: (customer: Customer, newStatus: string) => void;
}

export function CustomerDetailsModal({ customer, onClose, onStatusChange }: CustomerDetailsModalProps) {
    if (!customer) return null;

    const LabelValue = ({ label, value, icon: Icon, color = 'primary' }: { label: string, value: any, icon: any, color?: string }) => {
        return (
            <div className="flex items-start gap-4 group/item">
                <div className="p-2.5 rounded-xl shrink-0 transition-all bg-primary-500/5 group-hover/item:bg-primary-500/10 border border-primary-500/10 group-hover/item:border-primary-500/20">
                    <Icon className="w-4 h-4 text-primary-500" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase font-black text-text-muted opacity-40 tracking-widest">{label}</p>
                    <p className="text-[13px] font-black text-text-primary mt-1 tracking-tight truncate group-hover/item:text-primary-500 transition-colors">{value || 'N/A'}</p>
                </div>
            </div>
        );
    };

    const Section = ({ title, children, icon: Icon }: any) => (
        <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-border-divider/30">
                <div className="w-1.5 h-6 bg-primary-500 rounded-full" />
                <h4 className="text-[11px] font-black text-text-muted uppercase tracking-[0.3em]">{title}</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {children}
            </div>
        </div>
    );

    const isBlocked = customer.status === 'blocked';

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
            <div className="bg-card rounded-[3rem] max-w-5xl w-full shadow-2xl border border-border-default flex flex-col h-full max-h-[92vh] overflow-hidden transform scale-100 transition-all">

                {/* Header */}
                <div className={`p-10 border-b border-border-divider/30 flex items-center justify-between sticky top-0 z-10 transition-colors ${isBlocked ? 'bg-slate-900' : 'bg-card'}`}>
                    <div className="flex items-center gap-8">
                        <div
                            className={`w-20 h-20 rounded-[2rem] flex items-center justify-center flex-shrink-0 shadow-2xl overflow-hidden border-4 border-white/10 ${isBlocked ? 'bg-slate-800/50' : ''}`}
                            style={!isBlocked ? { backgroundColor: colors.primary[600] } : {}}
                        >
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
                                <span className="text-white text-3xl font-black">{customer.full_name?.charAt(0) || 'C'}</span>
                            )}
                        </div>
                        <div>
                            <h2 className={`text-3xl font-black tracking-tighter uppercase ${isBlocked ? 'text-white' : 'text-text-primary'}`}>{customer.full_name}</h2>
                            <div className="flex items-center gap-4 mt-2">
                                <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${isBlocked
                                    ? 'bg-white/20 text-white border-white/30 backdrop-blur-md'
                                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                    }`}>
                                    {isBlocked ? 'Blocked phase' : 'Active Phase'}
                                </span>
                                {customer.customer_id && (
                                    <span
                                        className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 px-4 py-1.5 rounded-xl border transition-all ${isBlocked
                                            ? 'bg-white/10 text-white border-white/20'
                                            : 'bg-primary-500/10 text-primary-500 border-primary-500/20'
                                            }`}
                                    >
                                        <ShieldCheck size={14} />
                                        System ID: {customer.customer_id}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-4 rounded-[1.5rem] transition-all border ${isBlocked
                            ? 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                            : 'bg-muted-bg/50 hover:bg-rose-500/10 hover:text-rose-500 text-text-muted border-border-divider/30'
                            }`}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-8 md:p-10 space-y-12 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">

                    <Section title="Personal Profile" icon={User}>
                        <LabelValue label="System ID" value={customer.customer_id} icon={ShieldCheck} color="primary" />
                        <LabelValue label="Identity (NIC)" value={customer.customer_code} icon={Tag} color="indigo" />
                        <LabelValue label="Date of Birth" value={customer.date_of_birth ? new Date(customer.date_of_birth).toLocaleDateString(undefined, { dateStyle: 'long' }) : '-'} icon={Calendar} color="purple" />
                        <LabelValue label="Gender" value={customer.gender} icon={User} color="pink" />
                        <LabelValue label="Civil Status" value={customer.civil_status} icon={Heart} color="red" />
                        <LabelValue label="Religion" value={customer.religion} icon={Building} color="orange" />
                        <LabelValue label="Spouse Name" value={customer.spouse_name} icon={UsersIcon} color="indigo" />
                        <LabelValue label="Initials" value={customer.initials} icon={User} color="slate" />
                        <LabelValue label="First Name" value={customer.first_name} icon={User} color="primary" />
                        <LabelValue label="Last Name" value={customer.last_name} icon={User} color="primary" />
                    </Section>

                    <Section title="Contact Channels" icon={Phone}>
                        <LabelValue label="Primary Mobile" value={customer.mobile_no_1} icon={Phone} color="green" />
                        <LabelValue label="Secondary Mobile" value={customer.mobile_no_2} icon={Phone} color="emerald" />
                        <LabelValue label="CCL Mobile" value={customer.ccl_mobile_no} icon={MessageSquare} color="teal" />
                        <LabelValue label="Email" value={customer.business_email} icon={Mail} color="purple" />
                        <LabelValue label="Fixed Line" value={customer.telephone} icon={Phone} color="primary" />
                    </Section>

                    <Section title="Residency & Address" icon={MapPin}>
                        <div className="md:col-span-3 bg-muted-bg/30 p-8 rounded-[2rem] border border-border-divider/30 relative overflow-hidden group/address">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full -mr-16 -mt-16 group-hover/address:scale-150 transition-transform" />
                            <p className="text-[15px] font-black text-text-primary leading-relaxed uppercase tracking-tight relative z-10">
                                {customer.address_line_1}
                                {customer.address_line_2 && <span className="text-text-muted/40 font-bold mx-2">/</span>}
                                {customer.address_line_2}
                                {customer.address_line_3 && <span className="text-text-muted/40 font-bold mx-2">/</span>}
                                {customer.address_line_3}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-10 relative z-10">
                                <div>
                                    <p className="text-[9px] uppercase font-black text-text-muted opacity-40 tracking-widest mb-1.5">City</p>
                                    <p className="text-[13px] font-black text-text-primary uppercase tracking-tight">{customer.city || 'UNSET'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase font-black text-text-muted opacity-40 tracking-widest mb-1.5">District</p>
                                    <p className="text-[13px] font-black text-text-primary uppercase tracking-tight">{customer.district || 'UNSET'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase font-black text-text-muted opacity-40 tracking-widest mb-1.5">Province</p>
                                    <p className="text-[13px] font-black text-text-primary uppercase tracking-tight">{customer.province || 'UNSET'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase font-black text-text-muted opacity-40 tracking-widest mb-1.5">GS Division</p>
                                    <p className="text-[13px] font-black text-text-primary uppercase tracking-tight">
                                        {customer.gsDivisionDetail ? (
                                            <span className="flex items-center gap-1.5">
                                                {customer.gsDivisionDetail.name}
                                                <span className="px-1.5 py-0.5 bg-primary-500/10 text-primary-600 rounded text-[9px]">
                                                    {customer.gsDivisionDetail.mpa_code}
                                                </span>
                                            </span>
                                        ) : (
                                            typeof customer.gs_division === 'string' ? customer.gs_division : (customer.gs_division as any)?.name || 'UNSET'
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Section>

                    <Section title="Business & assignment" icon={Briefcase}>
                        <LabelValue label="Branch" value={customer.branch?.branch_name || customer.branch_name} icon={MapPin} color="blue" />
                        <LabelValue label="Center" value={customer.center?.center_name || customer.center_name} icon={Building} color="indigo" />
                        <LabelValue label="Group" value={customer.group?.group_name || customer.group_name} icon={UsersIcon} color="purple" />
                        <LabelValue label="Business Name" value={customer.business_name} icon={Building} color="amber" />
                        <LabelValue label="Monthly Income" value={customer.monthly_income ? `Rs. ${Number(customer.monthly_income).toLocaleString()}` : '-'} icon={DollarSign} color="green" />
                        <LabelValue label="Sector" value={customer.sector} icon={Briefcase} color="emerald" />
                        <LabelValue label="Ownership" value={customer.ownership_type} icon={Building} color="indigo" />
                        <LabelValue label="Location" value={customer.location} icon={MapPin} color="blue" />
                        <LabelValue label="CSU Code" value={customer.pcsu_csu_code} icon={Building} color="violet" />
                    </Section>

                </div>

                {/* Footer */}
                <div className="p-10 border-t border-border-divider/30 flex justify-end gap-4 bg-muted-bg/30 backdrop-blur-3xl">
                    {onStatusChange && (
                        <button
                            onClick={() => {
                                const newStatus = isBlocked ? 'active' : 'blocked';
                                if (newStatus !== 'active' && (customer.grp_id || customer.group?.id)) {
                                    toast.error('Cannot block customer while assigned to a group. Remove from group first.');
                                    return;
                                }
                                onStatusChange(customer, newStatus);
                            }}
                            className={`flex items-center gap-4 px-10 py-4 rounded-[1.5rem] transition-all font-black text-[11px] uppercase tracking-[0.3em] active:scale-95 shadow-2xl border ${isBlocked
                                ? 'bg-emerald-600 text-white border-emerald-500/20 shadow-emerald-500/40 hover:bg-emerald-500 hover:shadow-emerald-500/60'
                                : 'bg-slate-800 text-white border-white/10 shadow-slate-900/40 hover:bg-slate-700 hover:shadow-slate-900/60'
                                }`}
                        >
                            <ShieldAlert size={20} />
                            {isBlocked ? 'Re-Initialize' : 'Deactivate Profile'}
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="flex items-center gap-4 px-16 py-4 bg-primary-600 text-white rounded-[1.5rem] transition-all font-black text-[11px] uppercase tracking-[0.3em] active:scale-95 shadow-2xl shadow-primary-500/40 hover:bg-primary-500 hover:shadow-primary-500/60"
                    >
                        <CheckCircle2 size={20} />
                        Done Viewing
                    </button>
                </div>
            </div>
        </div>
    );
}
