'use client';

import React, { useState, useEffect } from 'react';
import {
    Database,
    HardDrive,
    Clock,
    Download,
    Plus,
    Trash2,
    CheckCircle,
    XCircle,
    RefreshCw,
    ShieldCheck,
    FileText,
    Calendar,
    Settings,
    ChevronRight,
    Play,
    RotateCcw,
    AlertTriangle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { backupService, BackupStatus, BackupSchedule, BackupActivity } from '../../services/backup.service';

export function BackupSystem() {
    const [activeTab, setActiveTab] = useState<'database' | 'media'>('database');
    const [status, setStatus] = useState<BackupStatus | null>(null);
    const [schedules, setSchedules] = useState<BackupSchedule[]>([]);
    const [activities, setActivities] = useState<BackupActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ type: 'restore' | 'delete'; activity: BackupActivity } | null>(null);

    // Schedule form state
    const [scheduleForm, setScheduleForm] = useState({
        schedule_time: '00:00',
        days_of_week: [] as string[]
    });

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    useEffect(() => {
        loadStatus();
    }, []);

    useEffect(() => {
        loadTabData();
    }, [activeTab]);

    const loadStatus = async () => {
        try {
            const response = await backupService.getStatus();
            setStatus(response.data);
        } catch (error) {
            console.error('Failed to load backup status', error);
        }
    };

    const loadTabData = async () => {
        setIsLoading(true);
        try {
            const [schedRes, activityRes] = await Promise.all([
                backupService.getSchedules(activeTab),
                backupService.getActivity(activeTab)
            ]);
            setSchedules(schedRes.data);
            setActivities(activityRes.data);
        } catch (error) {
            console.error('Failed to load tab data', error);
            toast.error('Failed to load backup data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRunBackup = async () => {
        setIsActionLoading(true);
        try {
            await backupService.runBackup(activeTab);
            toast.success(`${activeTab === 'database' ? 'Database' : 'Media'} backup started successfully`);
            loadStatus();
            loadTabData();
        } catch (error: any) {
            toast.error(error.message || 'Backup failed to start');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleRestoreBackup = async (activity: BackupActivity) => {
        setIsActionLoading(true);
        try {
            await backupService.restoreBackup(activity.id);
            toast.success('Database restored successfully from: ' + activity.filename);
        } catch (error: any) {
            toast.error(error.message || 'Restore failed');
        } finally {
            setIsActionLoading(false);
            setConfirmAction(null);
        }
    };

    const handleDeleteBackup = async (activity: BackupActivity) => {
        setIsActionLoading(true);
        try {
            await backupService.deleteBackup(activity.id);
            toast.success('Backup deleted successfully');
            loadStatus();
            loadTabData();
        } catch (error: any) {
            toast.error(error.message || 'Delete failed');
        } finally {
            setIsActionLoading(false);
            setConfirmAction(null);
        }
    };

    const handleSaveSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (scheduleForm.days_of_week.length === 0) {
            toast.warning('Please select at least one day');
            return;
        }
        try {
            await backupService.saveSchedule({
                type: activeTab,
                ...scheduleForm
            });
            toast.success('Backup schedule saved');
            setShowScheduleModal(false);
            setScheduleForm({ schedule_time: '00:00', days_of_week: [] });
            loadTabData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save schedule');
        }
    };

    const handleDeleteSchedule = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this schedule?')) return;
        try {
            await backupService.deleteSchedule(id);
            toast.success('Schedule deleted');
            loadTabData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete schedule');
        }
    };

    const toggleDay = (day: string) => {
        setScheduleForm(prev => ({
            ...prev,
            days_of_week: prev.days_of_week.includes(day)
                ? prev.days_of_week.filter(d => d !== day)
                : [...prev.days_of_week, day]
        }));
    };

    const accentColor = activeTab === 'database' ? 'primary' : 'purple';

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="bg-primary-500/10 p-3.5 rounded-2xl shadow-sm border border-primary-500/20">
                        <Database className={`w-8 h-8 ${activeTab === 'database' ? 'text-primary-500' : 'text-purple-500'}`} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">Backup & Restore</h1>
                        <p className="text-text-secondary font-medium mt-0.5 text-sm">Manage backups, restore data, and schedule automated backups</p>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-bold border border-emerald-500/20">
                                <ShieldCheck className="w-3 h-3" />
                                System Protected
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tabs Toggle */}
                <div className="bg-card p-1 rounded-2xl border border-border-default flex gap-1 shadow-sm h-fit">
                    <button
                        onClick={() => setActiveTab('database')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'database'
                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                            : 'text-text-muted hover:text-text-primary hover:bg-hover'}`}
                    >
                        <Database className="w-4 h-4" />
                        Database
                    </button>
                    <button
                        onClick={() => setActiveTab('media')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'media'
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                            : 'text-text-muted hover:text-text-primary hover:bg-hover'}`}
                    >
                        <HardDrive className="w-4 h-4" />
                        Media
                    </button>
                </div>
            </div>

            {/* Stats + Backup Action Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Last Backup Stat */}
                <div className="bg-card rounded-2xl border border-border-default p-5 shadow-sm">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.15em] mb-1.5">Last Backup</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-text-primary">
                            {status?.[activeTab].lastBackup?.size || 'N/A'}
                        </span>
                        <span className="text-xs font-bold text-text-muted">
                            {status?.[activeTab].lastBackup?.date || 'Never'}
                        </span>
                    </div>
                </div>

                {/* Active Schedules Stat */}
                <div className="bg-card rounded-2xl border border-border-default p-5 shadow-sm">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.15em] mb-1.5">Active Schedules</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-text-primary">
                            {status?.[activeTab].activeSchedules || 0}
                        </span>
                        <span className="text-xs font-bold text-text-muted">Configured</span>
                    </div>
                </div>

                {/* Run Backup Button */}
                <div className="bg-card rounded-2xl border border-border-default p-5 shadow-sm flex items-center justify-center">
                    <button
                        onClick={handleRunBackup}
                        disabled={isActionLoading}
                        className={`flex items-center justify-center gap-2.5 w-full py-3 rounded-xl text-white font-bold text-sm transition-all duration-300 shadow-lg hover:scale-[1.02] active:scale-[0.98] ${activeTab === 'database'
                            ? 'bg-primary-500 shadow-primary-500/25'
                            : 'bg-purple-600 shadow-purple-600/25'
                            } disabled:opacity-50`}
                    >
                        {isActionLoading ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                Backup {activeTab === 'database' ? 'Database' : 'Media'} Now
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Backup History (takes 2 cols) */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Backup History / Activity */}
                    <div className="bg-card rounded-2xl border border-border-default shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border-divider">
                            <div className="flex items-center gap-2.5">
                                <RefreshCw className="w-4.5 h-4.5 text-amber-500" />
                                <h3 className="text-base font-bold text-text-primary">Backup History</h3>
                            </div>
                            <span className="text-xs font-bold text-text-muted">{activities.length} backups</span>
                        </div>

                        <div className="divide-y divide-border-divider">
                            {activities.length === 0 ? (
                                <div className="text-center py-12 px-6">
                                    <Database className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
                                    <p className="text-sm text-text-muted font-medium">No {activeTab} backups yet</p>
                                    <p className="text-xs text-text-muted mt-1">Run a backup to get started</p>
                                </div>
                            ) : (
                                activities.map((activity) => (
                                    <div key={activity.id} className="px-6 py-4 hover:bg-hover/50 transition-colors group">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${activity.status === 'success' ? 'bg-emerald-500' :
                                                    activity.status === 'failed' ? 'bg-rose-500' : 'bg-primary-500 animate-pulse'
                                                    }`} />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-bold text-text-primary truncate">{activity.filename}</p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-[10px] font-bold text-text-muted uppercase">
                                                            {activity.trigger.replace('_', ' ')}
                                                        </span>
                                                        <span className="text-[10px] text-text-muted">•</span>
                                                        <span className="text-[10px] font-bold text-text-muted">{activity.size}</span>
                                                        <span className="text-[10px] text-text-muted">•</span>
                                                        <span className="text-[10px] font-bold text-text-muted">
                                                            {new Date(activity.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            {activity.status === 'success' && (
                                                <div className="flex items-center gap-1 shrink-0">
                                                    {/* Download */}
                                                    <button
                                                        onClick={() => backupService.downloadBackup(activity.id, activity.filename)}
                                                        title="Download Backup"
                                                        className="p-2 rounded-lg text-text-muted hover:text-primary-500 hover:bg-primary-500/10 transition-all"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>

                                                    {/* Restore */}
                                                    <button
                                                        onClick={() => setConfirmAction({ type: 'restore', activity })}
                                                        title={activity.type === 'database' ? 'Restore Database' : 'Restore Media'}
                                                        className="p-2 rounded-lg text-text-muted hover:text-amber-500 hover:bg-amber-500/10 transition-all"
                                                    >
                                                        <RotateCcw className="w-4 h-4" />
                                                    </button>


                                                    {/* Delete */}
                                                    <button
                                                        onClick={() => setConfirmAction({ type: 'delete', activity })}
                                                        title="Delete Backup"
                                                        className="p-2 rounded-lg text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Auto Backup Info */}
                    <div className="bg-card rounded-2xl border border-border-default p-5 flex items-center gap-4">
                        <div className="bg-amber-500/10 p-3 rounded-xl text-amber-500 shrink-0">
                            <Settings className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-text-primary">Automatic Safety Backups</h4>
                            <p className="text-xs text-text-muted font-medium mt-0.5">
                                The system performs an automatic emergency backup whenever Maintenance Mode is enabled or if critical system instability is detected.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right: Schedules + Info */}
                <div className="space-y-4">
                    {/* Schedules Card */}
                    <div className="bg-card rounded-2xl border border-border-default p-6 shadow-sm h-fit">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2.5">
                                <Calendar className="w-4.5 h-4.5 text-primary-500" />
                                <h3 className="text-base font-bold text-text-primary">Schedules</h3>
                            </div>
                            <button
                                onClick={() => setShowScheduleModal(true)}
                                className="p-1.5 hover:bg-hover rounded-lg text-primary-500 transition-colors"
                            >
                                <Plus className="w-5 h-5 border-2 border-primary-500/20 rounded-md" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {schedules.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-xs text-text-muted font-medium italic">No {activeTab} schedules configured</p>
                                </div>
                            ) : (
                                schedules.map((schedule) => (
                                    <div key={schedule.id} className="p-3 bg-hover rounded-xl border border-border-divider flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-card rounded-lg shadow-sm">
                                                <Clock className="w-3.5 h-3.5 text-text-muted" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-text-primary">{schedule.schedule_time}</p>
                                                <p className="text-[9px] text-text-muted font-black uppercase mt-0.5">
                                                    {schedule.days_of_week.join(', ')}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteSchedule(schedule.id)}
                                            className="p-1.5 text-text-muted hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Cloud Storage Info (Media only) */}
                    {activeTab === 'media' && (
                        <div className="bg-purple-600 rounded-2xl p-6 shadow-lg shadow-purple-600/20 text-white relative overflow-hidden group">
                            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
                            <div className="relative z-10">
                                <ShieldCheck className="w-8 h-8 mb-3 opacity-50" />
                                <h3 className="text-lg font-black mb-1.5">Cloud Storage</h3>
                                <p className="text-xs font-medium opacity-80 leading-relaxed">
                                    All backups are automatically encrypted and synchronized with our protected S3 bucket for maximum redundancy.
                                </p>
                                <div className="mt-4">
                                    <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full">S3 Bucket Sync: Active</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Restore Info (Database only) */}
                    {activeTab === 'database' && (
                        <div className="bg-card rounded-2xl border border-border-default p-6 shadow-sm">
                            <div className="flex items-center gap-2.5 mb-3">
                                <RotateCcw className="w-4.5 h-4.5 text-amber-500" />
                                <h3 className="text-base font-bold text-text-primary">Restore Info</h3>
                            </div>
                            <p className="text-xs text-text-muted font-medium leading-relaxed">
                                Click the <RotateCcw className="w-3 h-3 inline text-amber-500" /> icon on any successful backup to restore your database to that point.
                                This will <strong className="text-text-primary">replace all current data</strong> with the backup contents.
                            </p>
                            <div className="mt-3 flex items-center gap-2 p-2.5 bg-amber-500/5 border border-amber-500/15 rounded-xl">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Always create a fresh backup before restoring an older one.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Schedule Modal */}
            {showScheduleModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-card w-full max-w-lg rounded-3xl border border-border-default shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-black text-text-primary">Add Backup Schedule</h3>
                                    <p className="text-text-muted font-medium mt-1 text-sm">Automate your {activeTab} backups</p>
                                </div>
                                <div className={`p-3 rounded-xl ${activeTab === 'database' ? 'bg-primary-500/10 text-primary-500' : 'bg-purple-500/10 text-purple-500'}`}>
                                    <Clock className="w-5 h-5" />
                                </div>
                            </div>

                            <form onSubmit={handleSaveSchedule} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-text-muted uppercase tracking-[0.15em] ml-1">Time to Run</label>
                                    <input
                                        type="time"
                                        required
                                        value={scheduleForm.schedule_time}
                                        onChange={(e) => setScheduleForm(prev => ({ ...prev, schedule_time: e.target.value }))}
                                        className="w-full px-6 py-4 bg-hover border border-border-default rounded-2xl font-bold text-lg text-text-primary focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-black text-text-muted uppercase tracking-[0.15em] ml-1">Select Days</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {days.map((day) => (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => toggleDay(day)}
                                                className={`py-3 px-4 rounded-xl font-bold text-sm transition-all border ${scheduleForm.days_of_week.includes(day)
                                                    ? activeTab === 'database'
                                                        ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20'
                                                        : 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-600/20'
                                                    : 'bg-hover text-text-secondary border-border-divider hover:border-text-muted'
                                                    }`}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowScheduleModal(false)}
                                        className="flex-1 py-4 bg-hover hover:bg-border-divider text-text-secondary rounded-2xl font-bold transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-black transition-all shadow-xl shadow-black/10 active:scale-95 ${activeTab === 'database' ? 'bg-primary-500' : 'bg-purple-600'
                                            }`}
                                    >
                                        <Plus className="w-4 h-4" />
                                        Save Schedule
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Action Modal (Restore / Delete) */}
            {confirmAction && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-card w-full max-w-md rounded-3xl border border-border-default shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 text-center">
                            <div className={`w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center ${confirmAction.type === 'restore'
                                ? 'bg-amber-500/10'
                                : 'bg-rose-500/10'
                                }`}>
                                {confirmAction.type === 'restore' ? (
                                    <RotateCcw className="w-8 h-8 text-amber-500" />
                                ) : (
                                    <Trash2 className="w-8 h-8 text-rose-500" />
                                )}
                            </div>

                            <h3 className="text-xl font-black text-text-primary mb-2">
                                {confirmAction.type === 'restore'
                                    ? (confirmAction.activity.type === 'database' ? 'Restore Database?' : 'Restore Media?')
                                    : 'Delete Backup?'}
                            </h3>

                            <p className="text-sm text-text-muted font-medium mb-2">
                                {confirmAction.type === 'restore'
                                    ? (confirmAction.activity.type === 'database'
                                        ? 'This will replace ALL current database data with the contents of this backup. This action cannot be undone.'
                                        : 'This will restore all media files from the backup mirror. Files not in the backup will be removed.')
                                    : 'This will permanently delete the backup file and its log entry. This cannot be undone.'}
                            </p>

                            <div className="bg-hover rounded-xl p-3 mb-6 border border-border-divider">
                                <p className="text-xs font-bold text-text-primary truncate">{confirmAction.activity.filename}</p>
                                <p className="text-[10px] text-text-muted font-medium mt-0.5">
                                    {confirmAction.activity.size} • {new Date(confirmAction.activity.created_at).toLocaleString()}
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmAction(null)}
                                    disabled={isActionLoading}
                                    className="flex-1 py-3.5 bg-hover hover:bg-border-divider text-text-secondary rounded-2xl font-bold transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirmAction.type === 'restore') {
                                            handleRestoreBackup(confirmAction.activity);
                                        } else {
                                            handleDeleteBackup(confirmAction.activity);
                                        }
                                    }}
                                    disabled={isActionLoading}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-black transition-all shadow-lg active:scale-95 disabled:opacity-50 ${confirmAction.type === 'restore'
                                        ? 'bg-amber-500 shadow-amber-500/25'
                                        : 'bg-rose-500 shadow-rose-500/25'
                                        }`}
                                >
                                    {isActionLoading ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : confirmAction.type === 'restore' ? (
                                        <>
                                            <RotateCcw className="w-4 h-4" />
                                            Restore
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
