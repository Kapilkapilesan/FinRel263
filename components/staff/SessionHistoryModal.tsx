import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, RotateCcw, ChevronDown, CheckCircle, XCircle, LogOut, Briefcase, Minus } from 'lucide-react';
import { SessionSummary, SessionHistoryItem, SessionHistoryResponse } from '../../types/staff.types';
import BMSLoader from '../common/BMSLoader';
import { sessionService } from '../../services/session.service';
import { toast } from 'react-toastify';

interface SessionHistoryModalProps {
    userId: string;
    userName: string;
    onClose: () => void;
}

export function SessionHistoryModal({ userId, userName, onClose }: SessionHistoryModalProps) {
    const [activeTab, setActiveTab] = useState<'summary' | 'history'>('summary');
    const [summary, setSummary] = useState<SessionSummary | null>(null);
    const [history, setHistory] = useState<SessionHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState({
        startDate: '',
        endDate: ''
    });

    // Pagination state
    const [pagination, setPagination] = useState({
        offset: 0,
        limit: 10,
        hasMore: true,
        total: 0
    });
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        loadSummary();
        loadHistory(true);
    }, [userId]);

    const loadSummary = async () => {
        try {
            const data = await sessionService.getUserSessionSummary(Number(userId));
            setSummary(data);
        } catch (error) {
            console.error('Failed to load session summary', error);
            toast.error('Failed to load session summary');
        }
    };

    const loadHistory = async (reset = false) => {
        if (reset) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const currentOffset = reset ? 0 : pagination.offset;
            const data: SessionHistoryResponse = await sessionService.getUserSessionHistory(Number(userId), {
                startDate: dateFilter.startDate || undefined,
                endDate: dateFilter.endDate || undefined,
                limit: pagination.limit,
                offset: currentOffset
            });

            if (reset) {
                setHistory(data.sessions);
            } else {
                setHistory(prev => [...prev, ...data.sessions]);
            }

            setPagination(prev => ({
                ...prev,
                offset: currentOffset + data.sessions.length,
                hasMore: data.pagination.has_more,
                total: data.pagination.total
            }));

        } catch (error) {
            console.error('Failed to load history', error);
            toast.error('Failed to load history');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleApplyFilter = () => {
        loadHistory(true);
    };

    const handleClearFilter = () => {
        setDateFilter({ startDate: '', endDate: '' });
        // Need to trigger reload after state update, using timeout solely to ensure state is set
        // Better pattern: pass empty object directly to loadHistory logic or use effect on filter change?
        // Let's just call loadHistory with empty filter params manually to be safe immediately
        // Actually, let's just use effect on dateFilter? No, user has to click Apply. 
        // So for Clear, we update state AND call load immediately.

        // But the state update is async. Let's just reset local var.
        setLoading(true);
        sessionService.getUserSessionHistory(Number(userId), { limit: 10, offset: 0 })
            .then((data: SessionHistoryResponse) => {
                setHistory(data.sessions);
                setPagination({
                    offset: data.sessions.length,
                    limit: 10,
                    hasMore: data.pagination.has_more,
                    total: data.pagination.total
                });
                setLoading(false);
            })
            .catch(() => {
                toast.error('Failed to reset history');
                setLoading(false);
            });
    };

    const formatDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (timeStr: string | null) => {
        if (!timeStr) return '--:--';
        return new Date(timeStr).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusIcon = (type: string | null, status: string) => {
        if (status === 'OPEN') return <Clock className="w-4 h-4 text-primary-500" />;
        if (type === 'LOGOUT' || type === 'AUTO_LOGOUT') return <LogOut className="w-4 h-4 text-gray-500" />;
        if (type === 'ON_WORK' || type === 'STAY_IN_OFFICE') return <Briefcase className="w-4 h-4 text-blue-500" />;
        return <Minus className="w-4 h-4 text-gray-400" />;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-300">
            <div className="bg-card rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-border-default/50">
                {/* Header */}
                <div className="px-6 py-6 border-b border-border-default flex items-center justify-between bg-table-header/30">
                    <div>
                        <h2 className="text-2xl font-black text-text-primary tracking-tight">Activity History</h2>
                        <p className="text-sm text-text-muted font-medium mt-0.5">Viewing session logs for {userName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-muted-bg text-text-muted hover:text-text-primary rounded-2xl transition-all active:scale-95 bg-muted-bg/50"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 bg-table-header/20 border-b border-border-default gap-2">
                    <button
                        onClick={() => setActiveTab('summary')}
                        className={`flex-1 py-3 px-6 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'summary'
                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                            : 'text-text-muted hover:text-text-primary hover:bg-muted-bg'
                            }`}
                    >
                        Overview Statistics
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-3 px-6 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'history'
                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                            : 'text-text-muted hover:text-text-primary hover:bg-muted-bg'
                            }`}
                    >
                        Detailed Log
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-app-background/50">
                    {loading && history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <BMSLoader message="Loading activity data..." size="small" />
                        </div>
                    ) : (
                        <>
                            {/* Summary View */}
                            {activeTab === 'summary' && summary && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Total Stats */}
                                        <div className="bg-card p-6 rounded-3xl border border-border-default shadow-sm group hover:border-primary-500/30 transition-all">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="p-3 bg-primary-500/10 text-primary-500 rounded-2xl group-hover:scale-110 transition-transform">
                                                    <RotateCcw className="w-6 h-6" />
                                                </div>
                                                <h3 className="text-sm font-black text-text-primary uppercase tracking-widest">Total Activity</h3>
                                            </div>
                                            <div className="mt-4 space-y-1">
                                                <div className="text-4xl font-black text-text-primary tracking-tight">{summary.total_logins}</div>
                                                <div className="text-xs text-text-muted font-bold uppercase tracking-widest">Total sessions all time</div>
                                            </div>
                                        </div>

                                        {/* This Month Stats */}
                                        <div className="bg-card p-6 rounded-3xl border border-border-default shadow-sm group hover:border-indigo-500/30 transition-all">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl group-hover:scale-110 transition-transform">
                                                    <Calendar className="w-6 h-6" />
                                                </div>
                                                <h3 className="text-sm font-black text-text-primary uppercase tracking-widest">This Month</h3>
                                            </div>
                                            <div className="mt-4 flex justify-between items-end">
                                                <div>
                                                    <div className="text-4xl font-black text-text-primary tracking-tight">{summary.total_logins_this_month}</div>
                                                    <div className="text-xs text-text-muted font-bold uppercase tracking-widest">Sessions</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-black text-text-primary tracking-tight">{summary.total_worked_hours_this_month}h</div>
                                                    <div className="text-xs text-text-muted font-bold uppercase tracking-widest">Hours Worked</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Current Status */}
                                        <div className="bg-card p-6 rounded-3xl border border-border-default shadow-sm group hover:border-primary-500/30 transition-all">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className={`p-3 rounded-2xl group-hover:scale-110 transition-transform ${summary.is_currently_logged_in ? 'bg-primary-500/10 text-primary-500' : 'bg-muted-bg text-text-muted'}`}>
                                                    <Clock className="w-6 h-6" />
                                                </div>
                                                <h3 className="text-sm font-black text-text-primary uppercase tracking-widest">Current Status</h3>
                                            </div>
                                            <div className="mt-4">
                                                {summary.is_currently_logged_in ? (
                                                    <div>
                                                        <div className="text-2xl font-black text-primary-500 uppercase tracking-widest">Online</div>
                                                        <div className="text-xs text-text-muted font-bold uppercase tracking-widest mt-1">
                                                            Active for {formatDuration(summary.current_session_duration_minutes)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="text-2xl font-black text-text-muted uppercase tracking-widest">Offline</div>
                                                        <div className="text-xs text-text-muted font-bold uppercase tracking-widest mt-1">
                                                            Last seen: {summary.last_logout_at ? new Date(summary.last_logout_at).toLocaleString() : 'N/A'}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Monthly Averages */}
                                    <div className="bg-primary-500/10 p-6 rounded-3xl border border-primary-500/20 text-center">
                                        <p className="text-primary-600 dark:text-primary-300 text-sm font-medium">
                                            <span className="font-black uppercase tracking-widest text-xs mr-2">Insight:</span>
                                            Average session duration is <span className="font-black">{summary.average_session_duration_hours} hours</span>.
                                            User has logged in <span className="font-black">{summary.total_logins_this_week} times</span> this week.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Detailed History History View */}
                            {activeTab === 'history' && (
                                <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
                                    {/* Filters */}
                                    <div className="bg-card p-4 rounded-2xl border border-border-default mb-6 flex flex-wrap gap-4 items-end shadow-sm">
                                        <div className="flex-1 min-w-[150px]">
                                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 px-1">From Date</label>
                                            <input
                                                type="date"
                                                className="w-full px-4 py-2.5 bg-muted-bg border border-border-default rounded-xl text-sm font-black text-text-primary focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                                                value={dateFilter.startDate}
                                                onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-[150px]">
                                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 px-1">To Date</label>
                                            <input
                                                type="date"
                                                className="w-full px-4 py-2.5 bg-muted-bg border border-border-default rounded-xl text-sm font-black text-text-primary focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                                                value={dateFilter.endDate}
                                                onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleApplyFilter}
                                                className="px-6 py-2.5 bg-primary-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary-500/20 hover:bg-primary-600 transition-all active:scale-95"
                                            >
                                                Apply
                                            </button>
                                            {(dateFilter.startDate || dateFilter.endDate) && (
                                                <button
                                                    onClick={handleClearFilter}
                                                    className="px-6 py-2.5 border border-border-default text-text-muted hover:text-text-primary rounded-xl text-xs font-black uppercase tracking-widest hover:bg-muted-bg transition-all active:scale-95"
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* History List */}
                                    <div className="space-y-4">
                                        {history.map((session) => (
                                            <div key={session.id} className="bg-card p-5 rounded-3xl border border-border-default shadow-sm hover:border-primary-500/30 transition-all group">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-5">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${session.status === 'OPEN'
                                                            ? 'bg-primary-500/10 text-primary-600'
                                                            : 'bg-muted-bg text-text-muted'
                                                            }`}>
                                                            {getStatusIcon(session.logout_type, session.status)}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-black text-text-primary tracking-tight">{formatDate(session.date)}</span>
                                                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border ${session.status === 'OPEN'
                                                                    ? 'bg-primary-500/10 text-primary-600 border-primary-500/20'
                                                                    : 'bg-muted-bg text-text-muted border-border-default'
                                                                    }`}>
                                                                    {session.status === 'OPEN' ? 'Active' : 'Completed'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-text-muted uppercase tracking-widest">
                                                                <span className="flex items-center gap-1.5">
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                    {formatDuration(session.worked_minutes)}
                                                                </span>
                                                                <span className="opacity-30">•</span>
                                                                <span>{formatTime(session.login_at)} - {session.logout_at ? formatTime(session.logout_at) : 'Now'}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="text-right">
                                                        {session.attendance_status !== 'PRESENT' && (
                                                            <div className={`text-[10px] font-black px-2.5 py-1 rounded-lg inline-block mb-1 uppercase tracking-widest border ${session.attendance_status === 'APPROVED' ? 'bg-primary-500/10 text-primary-600 border-primary-500/20' :
                                                                session.attendance_status === 'REJECTED' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                                                                    'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                                }`}>
                                                                {session.attendance_status}
                                                            </div>
                                                        )}
                                                        <div className="text-[10px] font-black text-text-muted uppercase tracking-widest max-w-[150px] truncate block mt-1">
                                                            {session.logout_type || 'Active Session'}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Remarks or Auto-Logout visualization */}
                                                {(session.remarks || session.auto_logged_out) && (
                                                    <div className="mt-4 pt-4 border-t border-border-divider text-xs text-text-muted font-medium flex items-start gap-3">
                                                        {session.auto_logged_out && <span className="text-rose-500 font-black uppercase tracking-widest text-[10px]">⚠️ System Auto-Logout</span>}
                                                        {session.remarks && <span className="italic">"{session.remarks}"</span>}
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {history.length === 0 && (
                                            <div className="text-center py-16 bg-card rounded-3xl border-2 border-dashed border-border-default">
                                                <Clock className="w-16 h-16 text-text-muted/20 mx-auto mb-4" />
                                                <p className="text-text-muted font-black uppercase tracking-widest text-sm">No session history found</p>
                                            </div>
                                        )}

                                        {pagination.hasMore && (
                                            <div className="pt-8 text-center">
                                                <button
                                                    onClick={() => loadHistory(false)}
                                                    disabled={loadingMore}
                                                    className="px-8 py-3 bg-card border border-border-default rounded-2xl text-xs font-black uppercase tracking-widest text-text-muted hover:text-text-primary hover:bg-muted-bg shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3 mx-auto"
                                                >
                                                    {loadingMore ? (
                                                        <>
                                                            <RotateCcw className="w-4 h-4 animate-spin text-primary-500" />
                                                            Loading more...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown className="w-4 h-4 text-primary-500" />
                                                            Load More History
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
