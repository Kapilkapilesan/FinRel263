'use client'

import { UserCheck, Clock, Filter, Hash, User, ShieldCheck, Activity, CalendarDays, CheckCircle2, XCircle } from 'lucide-react';
import { StaffAttendanceRecord, StaffMonthlyAttendance, DateFilter, AttendanceFilter } from '@/types/dashboard.types';
import { colors } from '@/themes/colors';

interface StaffTabProps {
    staffData: (StaffAttendanceRecord | StaffMonthlyAttendance)[];
    dateFilter: DateFilter;
    searchQuery: string;
    attendanceFilter: AttendanceFilter;
    onFilterChange: (filter: AttendanceFilter) => void;
}

export default function StaffTab({
    staffData,
    dateFilter,
    searchQuery,
    attendanceFilter,
    onFilterChange
}: StaffTabProps) {
    const isDailyView = dateFilter === 'day';

    const filteredStaff = staffData.filter((staff) => {
        const matchesSearch = staff.staff_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            staff.staff_id.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (isDailyView) {
            const dailyStaff = staff as StaffAttendanceRecord;
            if (attendanceFilter === 'all') return true;
            return dailyStaff.status === attendanceFilter;
        }

        return true;
    });

    const getStatusTheme = (status: string) => {
        const safeStatus = (status || 'not marked').toLowerCase();
        const themes: Record<string, { color: string, bg: string, ring: string, icon: any }> = {
            'present': { color: '#16a34a', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/10', icon: CheckCircle2 },
            'absent': { color: '#dc2626', bg: 'bg-rose-500/10', ring: 'ring-rose-500/10', icon: XCircle },
            'half day': { color: '#d97706', bg: 'bg-amber-500/10', ring: 'ring-amber-500/10', icon: Clock },
            'leave': { color: colors.primary[600], bg: 'bg-primary-500/10', ring: 'ring-primary-500/10', icon: CalendarDays },
            'not marked': { color: '#64748b', bg: 'bg-slate-500/10', ring: 'ring-slate-500/10', icon: Activity },
        };
        return themes[safeStatus] || themes['not marked'];
    };

    const filterOptions: { id: AttendanceFilter, label: string }[] = [
        { id: 'all', label: 'All Personal' },
        { id: 'present', label: 'Active/Present' },
        { id: 'absent', label: 'Absent Trace' },
        { id: 'half day', label: 'Partial Cycle' },
        { id: 'leave', label: 'Authorized Leave' },
        { id: 'not marked', label: 'Pending Log' }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Filter Architecture */}
            {isDailyView && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-muted-bg flex items-center justify-center border border-border-default shadow-sm transition-colors">
                            <Filter className="w-4 h-4 text-primary-500" strokeWidth={2.5} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none">Attendance Protocol</p>
                            <h4 className="text-sm font-black text-text-primary uppercase tracking-tighter mt-1">Registry Filtering</h4>
                        </div>
                    </div>

                    <div className="flex bg-muted-bg p-1.5 rounded-2xl border border-border-divider backdrop-blur-sm overflow-x-auto no-scrollbar transition-colors">
                        {filterOptions.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => onFilterChange(option.id)}
                                className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 whitespace-nowrap ${attendanceFilter === option.id
                                    ? 'bg-card text-primary-600 shadow-lg scale-105'
                                    : 'text-text-muted hover:text-text-secondary'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Entity Registry Table */}
            <div className="bg-card rounded-[2rem] border border-border-default overflow-hidden shadow-sm transition-colors">
                <table className="w-full text-left border-separate border-spacing-0">
                    <thead>
                        <tr className="bg-table-header">
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-text-muted tracking-[0.2em] border-b border-border-divider">Personnel Identity</th>
                            {isDailyView ? (
                                <>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase text-text-muted tracking-[0.2em] border-b border-border-divider">Cycle Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase text-text-muted tracking-[0.2em] border-b border-border-divider">Arrival Trace</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase text-text-muted tracking-[0.2em] border-b border-border-divider">Departure Trace</th>
                                </>
                            ) : (
                                <>
                                    {['Present', 'Absent', 'Half Day', 'Leave', 'Pending'].map((h) => (
                                        <th key={h} className="px-6 py-5 text-[10px] font-black uppercase text-text-muted tracking-[0.2em] border-b border-border-divider text-center">{h}</th>
                                    ))}
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-divider">
                        {filteredStaff.map((staff, idx) => {
                            const dailyStaff = staff as StaffAttendanceRecord;
                            const monthlyStaff = staff as StaffMonthlyAttendance;
                            const theme = isDailyView ? getStatusTheme(dailyStaff.status) : null;
                            const Icon = theme?.icon || User;

                            return (
                                <tr key={idx} className="group hover:bg-hover transition-all duration-500">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                {staff.avatar ? (
                                                    <img
                                                        src={staff.avatar}
                                                        alt={staff.staff_name}
                                                        className="w-10 h-10 rounded-xl object-cover shadow-sm ring-1 ring-border-divider transition-transform group-hover:scale-110"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl bg-muted-bg flex items-center justify-center border border-border-divider shadow-sm transition-transform group-hover:scale-110">
                                                        <User className="w-5 h-5 text-text-muted opacity-50" />
                                                    </div>
                                                )}
                                                {isDailyView && (
                                                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-card pointer-events-none" style={{ backgroundColor: theme?.color }} />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-text-primary uppercase tracking-tight group-hover:text-primary-600 transition-colors">
                                                    {staff.staff_name}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-1 opacity-60">
                                                    <Hash className="w-2.5 h-2.5 text-text-muted" />
                                                    <span className="text-[9px] font-black text-text-muted tracking-[0.2em]">{staff.staff_id}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {isDailyView ? (
                                        <>
                                            <td className="px-8 py-5">
                                                <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border ring-4 transition-all ${theme?.bg} ${theme?.ring} border-border-default shadow-sm`}>
                                                    <Icon size={12} color={theme?.color} strokeWidth={2.5} />
                                                    <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: theme?.color }}>
                                                        {dailyStaff.status || 'LOG PENDING'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                {dailyStaff.check_in_time ? (
                                                    <div className="flex items-center gap-2.5 group/trace">
                                                        <Clock className="w-4 h-4 text-emerald-500 opacity-60 group-hover/trace:opacity-100 transition-opacity" />
                                                        <span className="text-xs font-black text-text-primary tabular-nums tracking-tighter">
                                                            {dailyStaff.check_in_time}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-[2px] bg-border-divider rounded-full" />
                                                )}
                                            </td>
                                            <td className="px-8 py-5">
                                                {dailyStaff.check_out_time ? (
                                                    <div className="flex items-center gap-2.5 group/trace">
                                                        <Clock className="w-4 h-4 text-rose-500 opacity-60 group-hover/trace:opacity-100 transition-opacity" />
                                                        <span className="text-xs font-black text-text-primary tabular-nums tracking-tighter">
                                                            {dailyStaff.check_out_time}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-[2px] bg-border-divider rounded-full" />
                                                )}
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            {[
                                                { count: monthlyStaff.present_count, color: '#16a34a', bg: 'bg-emerald-500/10' },
                                                { count: monthlyStaff.absent_count, color: '#dc2626', bg: 'bg-rose-500/10' },
                                                { count: monthlyStaff.half_day_count, color: '#d97706', bg: 'bg-amber-500/10' },
                                                { count: monthlyStaff.leave_count, color: colors.primary[600], bg: 'bg-primary-500/10' },
                                                { count: monthlyStaff.not_marked_count, color: '#64748b', bg: 'bg-slate-500/10' }
                                            ].map((m, i) => (
                                                <td key={i} className="px-6 py-5 text-center">
                                                    <div
                                                        className={`inline-flex min-w-[32px] h-8 items-center justify-center rounded-xl font-black text-[12px] tabular-nums transition-all group-hover:scale-110 ${m.bg}`}
                                                        style={{ color: m.color }}
                                                    >
                                                        {m.count}
                                                    </div>
                                                </td>
                                            ))}
                                        </>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {filteredStaff.length === 0 && (
                    <div className="py-24 flex flex-col items-center justify-center uppercase">
                        <div className="p-8 bg-muted-bg rounded-[2rem] mb-6">
                            <ShieldCheck size={48} className="text-text-muted opacity-30" />
                        </div>
                        <p className="text-[10px] font-black text-text-muted tracking-[0.4em]">Registry Profile Empty</p>
                    </div>
                )}
            </div>

            {/* Table Precision Tag */}
            <div className="flex items-center justify-between px-8">
                <p className="text-[9px] font-black text-text-muted opacity-40 uppercase tracking-[0.3em]">Institutional Verification v4.0</p>
                <div className="flex items-center gap-2 opacity-30">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[8px] font-black text-text-muted uppercase tracking-widest">Atomic Trace Verified</span>
                </div>
            </div>
        </div>
    );
}
