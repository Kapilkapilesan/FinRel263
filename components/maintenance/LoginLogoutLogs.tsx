'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    LogIn,
    LogOut,
    Search,
    Calendar as CalendarIcon,
    RefreshCw,
    User as UserIcon,
    Shield,
    Building,
    Clock,
    Tag,
    Activity,
    Globe
} from 'lucide-react';
import { authLogService, AuthLog } from '@/services/auth-logs.service';
import { Pagination } from '@/components/common/Pagination';
import BMSLoader from '@/components/common/BMSLoader';
import { toast } from 'react-toastify';

const LoginLogoutLogs: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'login' | 'logout'>('login');
    const [logs, setLogs] = useState<AuthLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [date, setDate] = useState<string>('');
    const [page, setPage] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const response = activeTab === 'login'
                ? await authLogService.getLoginLogs({ search, date, page })
                : await authLogService.getLogoutLogs({ search, date, page });

            setLogs(response.data);
            setTotalLogs(response.meta.total);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load logs');
        } finally {
            setLoading(false);
        }
    }, [activeTab, search, date, page]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchLogs();
    };

    const formatDateHeader = (dateString: string) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        if (!dateString) return '-';
        const d = new Date(dateString);
        return d.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    const getActionLabel = (log: AuthLog) => {
        if (activeTab === 'login') return 'LOGIN';
        switch (log.logout_type) {
            case 'LOGOUT': return 'LOGOUT';
            case 'ON_WORK': return 'ON WORK';
            case 'ON_FIELD': return 'ON FIELD';
            case 'ADMIN_LOGOUT': return 'ADMIN LOGOUT';
            case 'MAINTENANCE_LOGOUT': return 'MAINTENANCE LOGOUT';
            case 'AUTO_LOGOUT': return 'AUTO LOGOUT';
            case 'STAY_IN_OFFICE': return 'STAY IN OFFICE';
            default: return log.logout_type || 'LOGOUT';
        }
    };

    const getActionColorClass = (type: string | null) => {
        if (activeTab === 'login') return 'text-emerald-500';
        switch (type) {
            case 'LOGOUT': return 'text-amber-500';
            case 'AUTO_LOGOUT': return 'text-rose-500';
            case 'ADMIN_LOGOUT':
            case 'MAINTENANCE_LOGOUT': return 'text-purple-500';
            case 'ON_WORK':
            case 'ON_FIELD': return 'text-blue-500';
            default: return 'text-amber-500';
        }
    };

    const groupedLogs = useMemo(() => {
        return logs.reduce((acc: { [key: string]: AuthLog[] }, log) => {
            const dateStr = activeTab === 'login'
                ? new Date(log.login_at).toDateString()
                : new Date(log.logout_at!).toDateString();
            if (!acc[dateStr]) acc[dateStr] = [];
            acc[dateStr].push(log);
            return acc;
        }, {});
    }, [logs, activeTab]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-text-primary">Login & Logout Logs</h1>
                <p className="text-sm text-text-muted">Track system access and session history with detailed logs</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex bg-muted-bg/30 p-1 rounded-xl border border-border-default">
                    <button
                        onClick={() => { setActiveTab('login'); setPage(1); }}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'login'
                            ? 'bg-primary-600 text-white shadow-lg'
                            : 'text-text-muted hover:text-text-primary hover:bg-hover'
                            }`}
                    >
                        <LogIn size={16} />
                        Login Logs
                    </button>
                    <button
                        onClick={() => { setActiveTab('logout'); setPage(1); }}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'logout'
                            ? 'bg-primary-600 text-white shadow-lg'
                            : 'text-text-muted hover:text-text-primary hover:bg-hover'
                            }`}
                    >
                        <LogOut size={16} />
                        Logout Logs
                    </button>
                </div>

                <div className="flex items-center gap-3 flex-grow max-w-3xl">
                    <form onSubmit={handleSearch} className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                        <input
                            type="text"
                            placeholder="Search staff id or name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-input border border-border-default rounded-xl py-2 pl-10 pr-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium text-sm"
                        />
                    </form>
                    <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={18} />
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => { setDate(e.target.value); setPage(1); }}
                            className="bg-input border border-border-default rounded-xl py-2 pl-10 pr-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all appearance-none text-sm font-medium"
                        />
                    </div>
                    <button
                        onClick={() => fetchLogs()}
                        className="p-2 bg-input border border-border-default rounded-xl text-text-muted hover:text-text-primary hover:bg-hover transition-all"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <BMSLoader message="Loading activity logs..." size="small" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-muted-bg/10 rounded-3xl border border-dashed border-border-default gap-4">
                        <Activity size={48} className="text-text-muted/30" />
                        <div className="text-center">
                            <p className="text-text-primary font-bold">No activity found</p>
                            <p className="text-text-muted text-sm">Try adjusting your filters</p>
                        </div>
                    </div>
                ) : (
                    Object.entries(groupedLogs).map(([dateStr, dayLogs]) => (
                        <div key={dateStr} className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <CalendarIcon size={18} className="text-primary-500" />
                                <h3 className="text-lg font-bold text-text-primary">{formatDateHeader(dateStr)}</h3>
                                <span className="px-2 py-0.5 bg-primary-500/10 text-primary-600 text-[10px] font-black uppercase rounded-full border border-primary-500/20">
                                    {dayLogs.length} Activities
                                </span>
                            </div>

                            <div className="bg-card rounded-2xl border border-border-default overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-border-divider bg-table-header uppercase text-[10px] font-black text-text-muted tracking-widest">
                                            <th className="px-6 py-4 w-1/4">USER DETAILS</th>
                                            <th className="px-6 py-4 w-1/4">ACTIVITY</th>
                                            <th className="px-6 py-4 w-1/4">INFO & SCOPE</th>
                                            <th className="px-6 py-4 w-1/4">TIME & IP</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-divider">
                                        {dayLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-hover transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 border border-primary-500/20 shadow-sm">
                                                            <UserIcon size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-text-primary uppercase tracking-tight">{log.user?.name || log.user?.user_name || 'System'}</p>
                                                            <p className="text-[10px] text-text-muted font-bold tracking-wider flex items-center gap-1">
                                                                <Tag size={10} />
                                                                ID: {log.user?.staff?.staff_id || log.user_id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${getActionColorClass(log.logout_type)}`}>
                                                        {activeTab === 'login' ? <LogIn size={14} /> : <LogOut size={14} />}
                                                        {getActionLabel(log)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary">
                                                            <Shield size={12} className="text-primary-500" />
                                                            {log.user?.roles?.[0]?.display_name || 'REGULAR USER'}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted">
                                                            <Building size={12} />
                                                            {log.user?.staff?.branch?.branch_name || 'HEAD OFFICE'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <Clock size={12} className="text-primary-500" />
                                                            <p className="text-sm font-bold text-text-primary tracking-tight">
                                                                {activeTab === 'login' ? formatTime(log.login_at) : formatTime(log.logout_at!)}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Globe size={11} className="text-text-muted" />
                                                            <p className="text-[10px] font-bold text-text-muted tracking-widest">{log.login_ip || '::1'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {!loading && totalLogs > itemsPerPage && (
                <div className="bg-muted-bg/10 p-4 rounded-xl border border-border-default">
                    <Pagination
                        currentPage={page}
                        totalItems={totalLogs}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setPage}
                        onItemsPerPageChange={setItemsPerPage}
                        itemName="activity entries"
                    />
                </div>
            )}
        </div>
    );
};

export default LoginLogoutLogs;


