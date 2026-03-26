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
    Activity,
    PlusCircle,
    Edit,
    Trash2,
    Database,
    Shield,
    Building,
    RefreshCw,
    Globe
} from 'lucide-react';
import { modificationLogService, ModificationLog } from '@/services/modification-log.service';
import BMSLoader from '@/components/common/BMSLoader';
import { Pagination } from '@/components/common/Pagination';
import { ModificationLogDetailModal } from '@/components/maintenance/ModificationLogDetailModal';
import { toast } from 'react-toastify';

const ModificationLogs: React.FC = () => {
    const [logs, setLogs] = useState<ModificationLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<ModificationLog | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    const loadLogs = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await modificationLogService.getLogs({
                date: selectedDate,
                action: activeTab === 'all' ? '' : activeTab,
                search: searchQuery,
                page: currentPage,
                per_page: itemsPerPage
            });
            setLogs(response.data);
            setTotalItems(response.total);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load modification logs');
        } finally {
            setIsLoading(false);
        }
    }, [selectedDate, activeTab, searchQuery, currentPage, itemsPerPage]);

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

    const getActionIcon = (action: string) => {
        switch (action.toLowerCase()) {
            case 'created': return <PlusCircle size={14} className="text-emerald-500" />;
            case 'updated': return <Edit size={14} className="text-amber-500" />;
            case 'deleted': return <Trash2 size={14} className="text-rose-500" />;
            default: return <Activity size={14} className="text-blue-500" />;
        }
    };

    const getActionColorClass = (action: string) => {
        switch (action.toLowerCase()) {
            case 'created': return 'text-emerald-500';
            case 'updated': return 'text-amber-500';
            case 'deleted': return 'text-rose-500';
            default: return 'text-blue-500';
        }
    };

    const groupedLogs = useMemo(() => {
        return logs.reduce((acc: { [key: string]: ModificationLog[] }, log) => {
            const dateStr = new Date(log.created_at).toDateString();
            if (!acc[dateStr]) acc[dateStr] = [];
            acc[dateStr].push(log);
            return acc;
        }, {});
    }, [logs]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-text-primary">Modification Logs</h1>
                <p className="text-sm text-text-muted">Audit detailed data changes across the entire system</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex bg-muted-bg/30 p-1 rounded-xl border border-border-default">
                    {['all', 'created', 'updated', 'deleted'].map((tab) => (
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

                <div className="flex items-center gap-3 flex-grow max-w-3xl">
                    <form onSubmit={handleSearch} className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                        <input
                            type="text"
                            placeholder="Search by table, ID or user..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-input border border-border-default rounded-xl py-2 pl-10 pr-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium text-sm"
                        />
                    </form>
                    <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={18} />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => { setSelectedDate(e.target.value); setCurrentPage(1); }}
                            className="bg-input border border-border-default rounded-xl py-2 pl-10 pr-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all appearance-none text-sm font-medium"
                        />
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
                        <BMSLoader message="Loading modifications..." size="small" />
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
                                            <th className="px-6 py-4 w-[25%]">USER DETAILS</th>
                                            <th className="px-6 py-4 w-[20%]">ACTIVITY</th>
                                            <th className="px-6 py-4 w-[25%]">DATA SCOPE</th>
                                            <th className="px-6 py-4 w-[20%] text-left">TIMESTAMP & IP</th>
                                            <th className="px-6 py-4 w-[10%] text-right">ACTION</th>
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
                                                                ID: {(log.user as any)?.staff?.staff_id || log.modified_by_user_id || '-'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${getActionColorClass(log.action)}`}>
                                                        {getActionIcon(log.action)}
                                                        {log.action}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary">
                                                            <Database size={12} className="text-primary-500/70" />
                                                            {log.table_name.toUpperCase()} (ID: {log.record_id})
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted">
                                                            <Building size={12} />
                                                            {(log.user as any)?.staff?.branch?.branch_name || 'HEAD OFFICE'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-1 text-left">
                                                        <div className="flex items-center gap-2">
                                                            <Clock size={12} className="text-primary-500" />
                                                            <p className="text-sm font-bold text-text-primary tracking-tight">
                                                                {formatTime(log.created_at)}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Globe size={11} className="text-text-muted" />
                                                            <p className="text-[10px] font-bold text-text-muted tracking-widest">{log.ip_address || '::1'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    {log.action === 'updated' && (
                                                        <button
                                                            onClick={() => { setSelectedLog(log); setIsDetailModalOpen(true); }}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-input border border-border-default text-text-primary rounded-lg transition-all shadow-sm font-bold text-[10px] uppercase tracking-wider hover:bg-primary-500 hover:text-white hover:border-primary-600 group"
                                                        >
                                                            <Eye size={12} className="group-hover:scale-110 transition-transform" />
                                                            Compare
                                                        </button>
                                                    )}
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
                        itemName="modification logs"
                    />
                </div>
            )}

            {isDetailModalOpen && selectedLog && (
                <ModificationLogDetailModal
                    log={selectedLog}
                    onClose={() => { setIsDetailModalOpen(false); setSelectedLog(null); }}
                />
            )}
        </div>
    );
};

export default ModificationLogs;

