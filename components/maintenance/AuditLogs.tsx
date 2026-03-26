'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Search,
    Calendar as CalendarIcon,
    X,
    Eye,
    Clock,
    User as UserIcon,
    Tag,
    ChevronRight,
    Activity,
    PlusCircle,
    Edit,
    Trash2,
    Database,
    Building,
    Shield,
    RefreshCw,
    Globe
} from 'lucide-react';
import { auditService, AuditLog, AuditSummary } from '@/services/audit.service';
import BMSLoader from '@/components/common/BMSLoader';
import { Pagination } from '@/components/common/Pagination';
import { AuditDetailModal } from '@/components/maintenance/AuditDetailModal';
import { toast } from 'react-toastify';

const AuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [summary, setSummary] = useState<AuditSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [activeTab, setActiveTab] = useState('all');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    const loadSummary = useCallback(async () => {
        try {
            const summaryData = await auditService.getSummary(selectedMonth);
            setSummary(summaryData);
        } catch (error) {
            console.error('Failed to load audit summary:', error);
        }
    }, [selectedMonth]);

    const loadLogs = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await auditService.getLogs({
                month: selectedMonth,
                date: selectedDate,
                action: activeTab === 'all' ? '' : activeTab,
                search: searchQuery,
                page: currentPage,
                per_page: itemsPerPage
            });
            setLogs(response.data);
            setTotalItems(response.total);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load audit logs');
        } finally {
            setIsLoading(false);
        }
    }, [selectedMonth, selectedDate, activeTab, searchQuery, currentPage, itemsPerPage]);

    useEffect(() => {
        loadSummary();
    }, [loadSummary]);

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        loadLogs();
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

    const getEventIcon = (event: string) => {
        switch (event.toLowerCase()) {
            case 'created': return <PlusCircle size={14} className="text-emerald-500" />;
            case 'updated': return <Edit size={14} className="text-amber-500" />;
            case 'deleted': return <Trash2 size={14} className="text-rose-500" />;
            default: return <Activity size={14} className="text-blue-500" />;
        }
    };

    const getEventColorClass = (event: string) => {
        switch (event.toLowerCase()) {
            case 'created': return 'text-emerald-500';
            case 'updated': return 'text-amber-500';
            case 'deleted': return 'text-rose-500';
            default: return 'text-blue-500';
        }
    };

    const groupedLogs = useMemo(() => {
        return logs.reduce((acc: { [key: string]: AuditLog[] }, log) => {
            const dateStr = new Date(log.created_at).toDateString();
            if (!acc[dateStr]) acc[dateStr] = [];
            acc[dateStr].push(log);
            return acc;
        }, {});
    }, [logs]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-text-primary">Audit Logs</h1>
                <p className="text-sm text-text-muted">Track and monitor all system activities and user actions</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total', count: summary.reduce((acc, curr) => acc + curr.total, 0), icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Created', count: summary.reduce((acc, curr) => acc + curr.created_count, 0), icon: PlusCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Updated', count: summary.reduce((acc, curr) => acc + curr.updated_count, 0), icon: Edit, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    { label: 'Deleted', count: summary.reduce((acc, curr) => acc + curr.deleted_count, 0), icon: Trash2, color: 'text-rose-500', bg: 'bg-rose-500/10' }
                ].map((stat) => (
                    <div key={stat.label} className="bg-card p-4 rounded-2xl border border-border-default flex items-center gap-4 shadow-sm hover:translate-y-[-2px] transition-all">
                        <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color} border border-current/10 shadow-sm`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">{stat.label} Activities</p>
                            <p className="text-xl font-bold text-text-primary">{stat.count}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex bg-muted-bg/30 p-1 rounded-xl border border-border-default">
                    {['all', 'create', 'update', 'delete'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                            className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === tab
                                ? 'bg-primary-600 text-white shadow-lg'
                                : 'text-text-muted hover:text-text-primary hover:bg-hover'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 flex-grow max-w-4xl">
                    <form onSubmit={handleSearch} className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                        <input
                            type="text"
                            placeholder="Search staff id or name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-input border border-border-default rounded-xl py-2 pl-10 pr-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium text-sm"
                        />
                    </form>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={18} />
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="bg-input border border-border-default rounded-xl py-2 pl-10 pr-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all appearance-none text-sm font-medium"
                            />
                        </div>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={18} />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => { setSelectedDate(e.target.value); setCurrentPage(1); }}
                                className="bg-input border border-border-default rounded-xl py-2 pl-10 pr-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all appearance-none text-sm font-medium"
                            />
                        </div>
                    </div>
                    <button
                        onClick={() => loadLogs()}
                        className="p-2 bg-input border border-border-default rounded-xl text-text-muted hover:text-text-primary hover:bg-hover transition-all"
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-8">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <BMSLoader message="Loading audit history..." size="small" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-muted-bg/10 rounded-3xl border border-dashed border-border-default gap-4">
                        <Activity size={48} className="text-text-muted/30" />
                        <div className="text-center">
                            <p className="text-text-primary font-bold">No logs found</p>
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

                            <div className="bg-card rounded-2xl border border-border-default overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-border-divider bg-table-header uppercase text-[10px] font-black text-text-muted tracking-widest">
                                            <th className="px-6 py-4 w-1/4">USER DETAILS</th>
                                            <th className="px-6 py-4 w-[15%]">ACTIVITY</th>
                                            <th className="px-6 py-4 w-1/4">INFO & SCOPE</th>
                                            <th className="px-6 py-4 w-[25%]">DETAILS SUMMARY</th>
                                            <th className="px-6 py-4 w-[15%] text-right">TIME / ACTION</th>
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
                                                            <p className="text-sm font-bold text-text-primary uppercase tracking-tight">{log.user?.user_name || log.user?.name || 'System'}</p>
                                                            <p className="text-[10px] text-text-muted font-bold tracking-wider flex items-center gap-1">
                                                                <Tag size={10} />
                                                                ID: {log.user_id || '-'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${getEventColorClass(log.event)}`}>
                                                        {getEventIcon(log.event)}
                                                        {log.event}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary">
                                                            <Database size={12} className="text-primary-500/70" />
                                                            {log.module_name.toUpperCase()} (ID: {log.auditable_id})
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted">
                                                            <Building size={12} />
                                                            {log.user?.branch?.branch_name || log.user?.branch?.name || 'HEAD OFFICE'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2 italic font-medium">
                                                        {log.event === 'updated'
                                                            ? `Modified ${Object.keys(log.new_values || {}).length} fields: ${Object.keys(log.new_values || {}).join(', ')}`
                                                            : log.event === 'created'
                                                                ? `Created new ${log.module_name} record`
                                                                : `Deleted ${log.module_name} record #${log.auditable_id}`
                                                        }
                                                    </p>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex flex-col items-end gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <Clock size={12} className="text-primary-500" />
                                                            <p className="text-sm font-bold text-text-primary tracking-tight">
                                                                {formatTime(log.created_at)}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => { setSelectedLog(log); setIsDetailOpen(true); }}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-input border border-border-default text-text-primary rounded-lg transition-all shadow-sm font-bold text-[10px] uppercase tracking-wider hover:bg-primary-500 hover:text-white hover:border-primary-600 group"
                                                        >
                                                            <Eye size={12} className="group-hover:scale-110 transition-transform" />
                                                            Details
                                                        </button>
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

            {!isLoading && totalItems > itemsPerPage && (
                <div className="bg-muted-bg/10 p-4 rounded-xl border border-border-default">
                    <Pagination
                        currentPage={currentPage}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={setItemsPerPage}
                        itemName="audit entries"
                    />
                </div>
            )}

            {isDetailOpen && selectedLog && (
                <AuditDetailModal
                    log={selectedLog}
                    onClose={() => { setIsDetailOpen(false); setSelectedLog(null); }}
                />
            )}
        </div>
    );
};

export default AuditLogs;
