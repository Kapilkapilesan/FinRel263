'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { sessionService, StaffSession } from '@/services/session.service';
import { authService } from '@/services/auth.service';
import { staffService } from '@/services/staff.service';
import { toast } from 'react-toastify';
import { colors } from '@/themes/colors';

interface AttendanceHistoryTableProps {
    isAdmin?: boolean;
}

export const AttendanceHistoryTable: React.FC<AttendanceHistoryTableProps> = ({ isAdmin }) => {
    const [sessions, setSessions] = useState<StaffSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined);
    const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [staffList, setStaffList] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    useEffect(() => {
        if (isAdmin) {
            loadStaffList();
        } else {
            const user = authService.getCurrentUser();
            if (user) {
                setSelectedUserId(user.id);
            }
        }
    }, [isAdmin]);

    useEffect(() => {
        // Only load if we have a user selected OR if it's for self
        if (!isAdmin || selectedUserId) {
            loadHistory();
        }
    }, [selectedUserId, month, year]);

    const loadStaffList = async () => {
        try {
            const data = await staffService.getUsers('staff');
            setStaffList(data);
        } catch (error) {
            console.error("Failed to load staff list", error);
        }
    };

    const loadHistory = async () => {
        if (!selectedUserId) return;
        setLoading(true);
        try {
            // Calculate start and end date of the month
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const lastDay = new Date(year, month, 0).getDate();
            const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

            const data = await sessionService.getUserSessionHistory(selectedUserId, {
                startDate,
                endDate,
                limit: 50 // Backend limit is 50
            });

            setSessions(data.sessions);
            setSummary({
                totalWorkedMinutes: data.period_summary.total_worked_minutes,
                userName: data.user.full_name
            });
        } catch (error) {
            console.error("Failed to load attendance history", error);
            toast.error("Failed to load history records");
        } finally {
            setLoading(false);
        }
    };




    const formatTime = (isoString: string | null) => {
        if (!isoString) return '--:--';
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            {/* Filters */}
            <div className="bg-card p-4 rounded-2xl border border-border-default/50 shadow-sm">
                <div className="flex flex-wrap gap-4 items-end">
                    {isAdmin && (
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-black text-text-muted uppercase mb-2 ml-1 tracking-widest">Select Employee</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <select
                                    className="w-full pl-10 pr-4 py-2.5 bg-input border border-border-default/50 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-text-primary"
                                    value={selectedUserId || ''}
                                    onChange={(e) => setSelectedUserId(Number(e.target.value))}
                                >
                                    <option value="" className="bg-card">Select Staff Member</option>
                                    {staffList.map(staff => (
                                        <option key={staff.id} value={staff.id} className="bg-card">{staff.name} ({staff.role})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="w-40">
                        <label className="block text-xs font-black text-text-muted uppercase mb-2 ml-1 tracking-widest">Month</label>
                        <select
                            className="w-full px-4 py-2.5 bg-input border border-border-default/50 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-text-primary"
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                        >
                            {months.map((m, i) => (
                                <option key={m} value={i + 1} className="bg-card">{m}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-32">
                        <label className="block text-xs font-black text-text-muted uppercase mb-2 ml-1 tracking-widest">Year</label>
                        <select
                            className="w-full px-4 py-2.5 bg-input border border-border-default/50 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-text-primary"
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                        >
                            {years.map(y => (
                                <option key={y} value={y} className="bg-card">{y}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={loadHistory}
                        className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 h-[42px]"
                    >
                        Refresh History
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div
                        className="p-4 rounded-2xl text-white shadow-xl shadow-primary-500/10"
                        style={{ background: `linear-gradient(135deg, ${colors.primary[500]}, ${colors.primary[600]})` }}
                    >
                        <p className="text-white/80 text-[10px] font-black uppercase tracking-widest">Total Worked Time</p>
                        <h3 className="text-2xl font-black mt-1">
                            {sessionService.formatWorkedTime(summary.totalWorkedMinutes)}
                        </h3>
                    </div>
                    <div className="bg-card p-4 rounded-2xl border border-border-default/50 shadow-sm">
                        <p className="text-text-muted text-[10px] font-black uppercase tracking-widest">Days Present</p>
                        <h3 className="text-2xl font-black mt-1 text-text-primary">
                            {new Set(sessions.map(s => s.date)).size} Days
                        </h3>
                    </div>
                </div>
            )}

            {/* History Table */}
            <div className="bg-card rounded-2xl border border-border-default/50 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-table-header/30 border-b border-border-default/50">
                                <th className="px-6 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Date</th>
                                <th className="px-6 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Login</th>
                                <th className="px-6 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Logout</th>
                                <th className="px-6 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Duration</th>
                                <th className="px-6 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Device/IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default/50">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-4">
                                            <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : sessions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                                        No attendance records found for this period.
                                    </td>
                                </tr>
                            ) : (
                                sessions.map(session => (
                                    <tr key={session.id} className="hover:bg-hover transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-text-muted" />
                                                <span className="text-sm font-bold text-text-primary">
                                                    {formatDate(session.date)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-primary-500" />
                                                <span className="text-sm font-bold text-text-primary">
                                                    {formatTime(session.login_at)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-danger-500" />
                                                <span className="text-sm font-bold text-text-primary">
                                                    {formatTime(session.logout_at)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-black text-text-primary tracking-tight">
                                                {session.status === 'OPEN' ? (
                                                    <span className="flex items-center gap-1.5 text-primary-500">
                                                        <Clock className="w-3 h-3 animate-spin" /> In Progress
                                                    </span>
                                                ) : (
                                                    sessionService.formatWorkedTime(session.worked_minutes)
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-text-muted/60 uppercase tracking-widest">
                                                <MapPin className="w-3 h-3 text-text-muted/40" />
                                                <span className="truncate max-w-[120px]" title={session.login_ip || 'Unknown'}>
                                                    {session.login_ip || 'Unknown IP'}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};