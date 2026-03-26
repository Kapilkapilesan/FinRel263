'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { AttendanceCard } from './attendance/AttendanceCard';
import { LeaveRequestModal } from './leave/LeaveRequestModal';
import { attendanceService } from '@/services/attendance.service';
import { leaveService } from '@/services/leave.service';
import { authService } from '@/services/auth.service';
import { AttendanceRecord } from '@/types/attendance.types';
import { LeaveRequestFormData } from '@/types/leave.types';
import { toast } from 'react-toastify';
import { AttendanceHistoryTable } from './attendance/AttendanceHistoryTable';
import { AttendanceDailyTable } from './attendance/AttendanceDailyTable';
import { LeaveRequestsView } from './leave/LeaveRequestsView';
import { colors } from '@/themes/colors';

export const AttendanceView: React.FC = () => {
    const [view, setView] = useState<'daily' | 'history' | 'leaves'>('daily');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [isAdmin, setIsAdmin] = useState(false);
    const [canViewHistory, setCanViewHistory] = useState(false);
    const [canViewLeave, setCanViewLeave] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    useEffect(() => {
        // Check if user has attendance management permissions
        const user = authService.getCurrentUser();
        const adminCheck = authService.hasPermission('attendance.view_all') ||
            authService.hasPermission('attendance.approve') ||
            authService.hasPermission('attendance.manage') ||
            authService.hasPermission('attendance.view_reports');

        const managementCheck = authService.hasRole('admin') ||
            authService.hasRole('super_admin') ||
            authService.hasRole('manager');

        setIsAdmin(adminCheck);
        setCanViewHistory(managementCheck);
        setCanViewLeave(managementCheck && authService.hasPermission('leave.view'));
        setCurrentUserId(user?.id || null);
    }, []);

    useEffect(() => {
        if (view === 'daily') {
            loadData();
        }
    }, [date, view]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await attendanceService.getDailyAttendance(date);
            setRecords(data);
        } catch (error) {
            console.error("Failed to load attendance", error);
            toast.error("Failed to load attendance records");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRecord = async (id: string, updates: Partial<AttendanceRecord>) => {
        // Optimistic update
        setRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));

        try {
            await attendanceService.markAttendance({ id, ...updates, date });
        } catch (error) {
            toast.error("Failed to save update");
            loadData(); // Revert on error
        }
    };


    // Filter records based on role and search/status filters
    const filteredRecords = records.filter(record => {
        const searchLower = searchTerm.trim().toLowerCase();
        // Role-based filtering: non-admins see only their own record
        if (!isAdmin && currentUserId && record.id !== currentUserId.toString()) {
            return false;
        }

        // Search filter
        const matchesSearch = record.name.toLowerCase().includes(searchLower);

        // Status filter
        const matchesStatus = statusFilter === 'All Status' || record.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-6 pb-4">
                {/* Top Row: Title */}
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-text-primary tracking-tight">
                        {isAdmin ? 'Attendance Management' : 'My Attendance'}
                    </h2>
                </div>

                {/* Bottom Row: Filters (Search, Date, Status) + Tabs (Right aligned) */}
                <div className="flex flex-col xxl:flex-row xxl:items-center justify-between gap-5">
                    {/* Filters Group */}
                    <div className="flex flex-wrap items-center gap-4">
                        {view === 'daily' && isAdmin && (
                            <div className="relative min-w-[280px] flex-1 sm:flex-none">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search staff..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-muted-bg/30 border border-border-default/40 rounded-2xl text-sm font-medium outline-none transition-all duration-300 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 text-text-primary placeholder:text-text-muted"
                                />
                            </div>
                        )}

                        {view === 'daily' && (
                            <div className="flex items-center gap-4 bg-muted-bg/30 border border-border-default/40 rounded-2xl px-5 py-3 shadow-sm flex-1 sm:flex-none">
                                <span className="text-sm font-bold text-text-muted whitespace-nowrap">Select Date:</span>
                                <div className="relative flex items-center gap-3">
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="bg-transparent text-sm font-black text-text-primary focus:outline-none cursor-pointer p-0 m-0"
                                    />
                                    <div className="flex items-center gap-1 text-text-muted border-l border-border-default/30 pl-3">
                                        <CalendarIcon className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {view === 'daily' && isAdmin && (
                            <div className="relative flex-1 sm:flex-none">
                                <div className="flex items-center justify-between gap-3 bg-muted-bg/30 border border-border-default/40 rounded-2xl px-5 py-3 shadow-sm group cursor-pointer hover:border-primary-500/50 transition-all duration-300 min-w-[140px]">
                                    <span className="text-xs font-bold text-text-primary uppercase tracking-tight">{statusFilter}</span>
                                    <Filter className="w-3.5 h-3.5 text-text-muted group-hover:text-primary-500 transition-colors" />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full"
                                    >
                                        <option className="bg-card text-text-primary">All Status</option>
                                        <option className="bg-card text-text-primary">Present</option>
                                        <option className="bg-card text-text-primary">Absent</option>
                                        <option className="bg-card text-text-primary">Half Day</option>
                                        <option className="bg-card text-text-primary">Leave</option>
                                        <option className="bg-card text-text-primary">Not Marked</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    

                    {/* Navigation Tabs aligned to the right */}
                    <div className="flex bg-muted-bg/40 p-1.5 rounded-2xl border border-border-default/20 w-fit self-end xxl:self-auto">
                        <button
                            onClick={() => setView('daily')}
                            className={`px-5 py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ${view === 'daily'
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                                : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                                }`}
                        >
                            Daily
                        </button>
                        {canViewHistory && (
                            <button
                                onClick={() => setView('history')}
                                className={`px-5 py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ${view === 'history'
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                                    : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                                    }`}
                            >
                                History
                            </button>
                        )}
                        {canViewLeave && (
                            <button
                                onClick={() => setView('leaves')}
                                className={`px-5 py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ${view === 'leaves'
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                                    : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                                    }`}
                            >
                                Leaves
                            </button>
                        )}
                    </div>
                    </div>
                </div>
            </div>

            {view === 'daily' ? (
                <>
                    {loading ? (
                        <div className="text-center py-12 text-text-muted">Loading attendance data...</div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="text-center py-12 bg-card rounded-2xl border border-border-default/50 border-dashed">
                            <p className="text-text-muted">
                                {isAdmin
                                    ? 'No staff records found matching your filters.'
                                    : 'No attendance record available for this date.'}
                            </p>
                        </div>
                    ) : (
                        isAdmin ? (
                            <AttendanceDailyTable
                                records={filteredRecords}
                                onUpdate={handleUpdateRecord}
                            />
                        ) : (
                            <div className="max-w-md mx-auto">
                                {filteredRecords.map(record => (
                                    <AttendanceCard
                                        key={record.id}
                                        record={record}
                                        onChange={handleUpdateRecord}
                                    />
                                ))}
                            </div>
                        )
                    )}
                </>
            ) : view === 'history' ? (
                <AttendanceHistoryTable isAdmin={isAdmin} />
            ) : (
                <LeaveRequestsView isAdmin={isAdmin} />
            )}

        </div>
    );
};