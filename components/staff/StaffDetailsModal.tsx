import { API_BASE_URL } from '../../services/api.config';
import { SecureImage } from '../common/SecureImage';
import React from 'react';
import {
    X,
    Mail,
    Phone,
    MapPin,
    Calendar,
    User,
    Briefcase,
    Building
} from 'lucide-react';
import { colors } from '@/themes/colors';

interface StaffDetailsModalProps {
    staff: any;
    onClose: () => void;
    publicView?: boolean;
}

export function StaffDetailsModal({
    staff,
    onClose,
    publicView = false
}: StaffDetailsModalProps) {
    if (!staff) return null;

    const roleName = (staff.role_name || staff.role || '').toLowerCase();

    // Construct profile image URL using secure media endpoint
    const profileImageUrl = staff.staff_id
        ? `${API_BASE_URL}/media/staff-profiles/${staff.staff_id}`
        : (staff.profile_image_url || (staff.profile_image?.startsWith('http') ? staff.profile_image : null));

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-card rounded-3xl max-w-2xl w-full shadow-2xl border border-border-default/50 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-500">

                {/* Header */}
                <div className="p-6 border-b border-border-default flex items-center justify-between bg-table-header/30">
                    <h2 className="text-xl font-black text-text-primary uppercase tracking-tight">
                        Staff Details
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-muted-bg text-text-muted hover:text-text-primary rounded-2xl transition-all active:scale-95 bg-muted-bg/50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-8">
                    <div className="space-y-10">

                        {/* Profile Section */}
                        <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-border-default/50">
                            <div
                                className="w-24 h-24 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden border-4 border-card shadow-xl relative group"
                                style={{ backgroundColor: colors.primary[500] }}
                            >
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                {profileImageUrl ? (
                                    <SecureImage
                                        src={profileImageUrl}
                                        alt={staff.full_name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        fallbackName={staff.full_name || staff.name}
                                    />
                                ) : (
                                    <span className="text-white text-3xl font-black">
                                        {(staff.full_name || staff.name || 'S').charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>

                            <div className="text-center sm:text-left">
                                <h3 className="text-2xl font-black text-text-primary tracking-tight uppercase">
                                    {(staff.full_name || staff.name)?.toUpperCase()}
                                </h3>

                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
                                    <span
                                        className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${staff.account_status === 'locked' || staff.is_locked
                                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                                            : staff.account_status === 'active' || staff.is_active
                                                ? 'bg-primary-500/10 border-primary-500/20 text-primary-500'
                                                : 'bg-muted-bg border-border-default text-text-muted'
                                            }`}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${staff.account_status === 'locked' || staff.is_locked
                                            ? 'bg-rose-500'
                                            : staff.account_status === 'active' || staff.is_active
                                                ? 'bg-primary-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse'
                                                : 'bg-text-muted'
                                            }`}></span>
                                        {staff.account_status === 'locked' || staff.is_locked
                                            ? 'LOCKED'
                                            : staff.account_status === 'active' || staff.is_active
                                                ? 'ACTIVE'
                                                : 'INACTIVE'}
                                    </span>

                                    <span
                                        className="inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border border-primary-500/20 bg-primary-500/10 text-primary-500 shadow-sm"
                                    >
                                        {(staff.role_name || staff.role || 'Staff')?.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Role Cell */}
                            <div className="flex items-start gap-4 p-4 bg-muted-bg/30 rounded-2xl border border-border-default/50 hover:border-primary-500/30 transition-colors">
                                <div className="p-3 bg-primary-500/10 rounded-xl">
                                    <Briefcase className="w-5 h-5 text-primary-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Role</p>
                                    <p className="text-sm font-black text-text-primary uppercase tracking-tight">
                                        {(staff.role_name || staff.role || 'Staff')?.toUpperCase()}
                                    </p>
                                </div>
                            </div>

                            {/* Email Cell */}
                            {(staff.email_id || staff.email) && (
                                <div className="flex items-start gap-4 p-4 bg-muted-bg/30 rounded-2xl border border-border-default/50 hover:border-primary-500/30 transition-colors">
                                    <div className="p-3 bg-primary-500/10 rounded-xl">
                                        <Mail className="w-5 h-5 text-primary-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Email</p>
                                        <p className="text-sm font-black text-text-primary truncate max-w-[180px]" title={staff.email_id || staff.email}>
                                            {staff.email_id || staff.email}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Contact Cell */}
                            {(staff.contact_no || staff.phone) && (
                                <div className="flex items-start gap-4 p-4 bg-muted-bg/30 rounded-2xl border border-border-default/50 hover:border-primary-500/30 transition-colors">
                                    <div className="p-3 bg-primary-500/10 rounded-xl">
                                        <Phone className="w-5 h-5 text-primary-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Contact Number</p>
                                        <p className="text-sm font-black text-text-primary">
                                            {staff.contact_no || staff.phone}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Identity Cell */}
                            {!publicView && staff.nic && (
                                <div className="flex items-start gap-4 p-4 bg-muted-bg/30 rounded-2xl border border-border-default/50 hover:border-amber-500/30 transition-colors">
                                    <div className="p-3 bg-amber-500/10 rounded-xl">
                                        <User className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">NIC</p>
                                        <p className="text-sm font-black text-text-primary tracking-widest">
                                            {staff.nic}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Age & Gender */}
                            {!publicView && (staff.age || staff.gender) && (
                                <div className="flex items-start gap-4 p-4 bg-muted-bg/30 rounded-2xl border border-border-default/50 transition-colors">
                                    <div className="p-3 bg-rose-500/10 rounded-xl">
                                        <User className="w-5 h-5 text-rose-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Age & Gender</p>
                                        <p className="text-sm font-black text-text-primary">
                                            {staff.age && `${staff.age} years`}{staff.gender && ` • ${staff.gender}`}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Branch Cell */}
                            {!(
                                roleName === 'admin' ||
                                roleName === 'super_admin' ||
                                roleName === 'administrator'
                            ) &&
                                (staff.branch_id || staff.branch) && (
                                    <div className="flex items-start gap-4 p-4 bg-muted-bg/30 rounded-2xl border border-border-default/50 hover:border-primary-500/30 transition-colors">
                                        <div className="p-3 bg-primary-500/10 rounded-xl">
                                            <Building className="w-5 h-5 text-primary-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Branch</p>
                                            <p className="text-sm font-black text-text-primary uppercase tracking-tight">
                                                {(staff.branch?.branch_name ||
                                                    staff.branch?.name ||
                                                    (typeof staff.branch === 'string'
                                                        ? staff.branch
                                                        : '') ||
                                                    `Branch ${staff.branch_id || ''}`)?.toUpperCase()}
                                            </p>
                                        </div>
                                    </div>
                                )}

                            {/* Centers Cell */}
                            {staff.centers && staff.centers.length > 0 && (
                                <div className="flex items-start gap-4 p-4 bg-muted-bg/30 rounded-2xl border border-border-default/50 hover:border-orange-500/30 transition-colors">
                                    <div className="p-3 bg-orange-500/10 rounded-xl">
                                        <MapPin className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Assigned Centers</p>
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {staff.centers.map((center: any) => (
                                                <span
                                                    key={center.id}
                                                    className="inline-flex items-center px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[9px] font-black uppercase tracking-tighter rounded-lg"
                                                >
                                                    {center.center_name?.toUpperCase()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Address Section */}
                        {!publicView && staff.address && (
                            <div className="pt-8 border-t border-border-default/30">
                                <div className="flex items-start gap-5">
                                    <div className="p-3 bg-primary-500/10 rounded-2xl">
                                        <MapPin className="w-5 h-5 text-primary-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Address</p>
                                        <p className="text-sm font-black text-text-primary leading-relaxed">
                                            {staff.address}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Work Info Section */}
                        {!publicView &&
                            (staff.department ||
                                (staff.work_info &&
                                    (staff.work_info.designation ||
                                        staff.work_info.department))) && (
                                <div className="pt-8 border-t border-border-default/30">
                                    <div className="flex items-start gap-5">
                                        <div className="p-3 bg-primary-500/10 rounded-2xl">
                                            <Calendar className="w-5 h-5 text-primary-500" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Employment & Role</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted-bg/20 p-5 rounded-2xl border border-border-default/30">
                                                {staff.department && (
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-text-muted uppercase tracking-tighter">Department</span>
                                                        <span className="text-sm font-black text-text-primary uppercase">{staff.department}</span>
                                                    </div>
                                                )}
                                                {staff.employee_type && (
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-text-muted uppercase tracking-tighter">Type</span>
                                                        <span className="text-sm font-black text-text-primary uppercase">{staff.employee_type}</span>
                                                    </div>
                                                )}
                                                {staff.joining_date && (
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-text-muted uppercase tracking-tighter">Joined</span>
                                                        <span className="text-sm font-black text-text-primary uppercase">
                                                            {(() => {
                                                                const dateStr = staff.joining_date;
                                                                if (!dateStr) return '-';
                                                                if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                                                                    const [y, m, d] = dateStr.split('-');
                                                                    return `${d}/${m}/${y}`;
                                                                }
                                                                const date = new Date(dateStr);
                                                                return isNaN(date.getTime()) ? '-' : `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
                                                            })()}
                                                        </span>
                                                    </div>
                                                )}
                                                {staff.work_info?.designation && (
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-text-muted uppercase tracking-tighter">Designation</span>
                                                        <span className="text-sm font-black text-text-primary uppercase">{staff.work_info.designation}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        {/* Experience Section */}
                        {staff.experience_info && (
                            <div className="pt-8 border-t border-border-default/30">
                                <div className="flex items-start gap-5">
                                    <div className="p-3 bg-rose-500/10 rounded-2xl">
                                        <Briefcase className="w-5 h-5 text-rose-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Work Experience</p>
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-6 bg-muted-bg/20 p-5 rounded-2xl border border-border-default/30">
                                                <div>
                                                    <p className="text-[9px] font-black text-text-muted uppercase tracking-tighter">BMS Capital Exp.</p>
                                                    <p className="text-sm font-black text-text-primary uppercase tracking-tight">{staff.experience_info.bms_experience || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-text-muted uppercase tracking-tighter">Total Experience</p>
                                                    <p className="text-sm font-black text-text-primary uppercase tracking-tight">{staff.experience_info.total_experience || 'N/A'}</p>
                                                </div>
                                                {staff.experience_info.previous_company && (
                                                    <div>
                                                        <p className="text-[9px] font-black text-text-muted uppercase tracking-tighter">Previous Company</p>
                                                        <p className="text-sm font-black text-text-primary uppercase tracking-tight">{staff.experience_info.previous_company}</p>
                                                    </div>
                                                )}
                                                {staff.experience_info.last_designation && (
                                                    <div>
                                                        <p className="text-[9px] font-black text-text-muted uppercase tracking-tighter">Last Designation</p>
                                                        <p className="text-sm font-black text-text-primary uppercase tracking-tight">{staff.experience_info.last_designation}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {staff.experience_info.responsibilities && (
                                                <div className="bg-input/50 p-5 rounded-2xl border border-border-default/50">
                                                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-2">Key Responsibilities</p>
                                                    <p className="text-xs font-bold text-text-secondary leading-relaxed whitespace-pre-wrap">{staff.experience_info.responsibilities}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border-default/30 flex justify-end bg-card/80 backdrop-blur-md rounded-b-3xl">
                    <button
                        onClick={onClose}
                        className="px-10 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary-500/20 active:scale-95 border border-primary-500/20"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
