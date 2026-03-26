import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, RotateCcw, ChevronDown, CheckCircle, XCircle, LogOut, Briefcase, Minus } from 'lucide-react';
import { SessionSummary, SessionHistoryItem, SessionHistoryResponse } from '../../types/staff.types';
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
        if (status === 'OPEN') return <Clock className="w-4 h-4 text-green-500" />;
        if (type === 'LOGOUT' || type === 'AUTO_LOGOUT') return <LogOut className="w-4 h-4 text-gray-500" />;
        if (type === 'ON_WORK' || type === 'STAY_IN_OFFICE') return <Briefcase className="w-4 h-4 text-blue-500" />;
        return <Minus className="w-4 h-4 text-gray-400" />;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Activity History</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Viewing session logs for {userName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('summary')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'summary'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        Overview Statistics
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        Detailed Log
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-gray-900/30">
                    {loading && history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <RotateCcw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                            <p className="text-gray-500">Loading activity data...</p>
                        </div>
                    ) : (
                        <>
                            {/* Summary View */}
                            {activeTab === 'summary' && summary && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Total Stats */}
                                        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                    <RotateCcw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Total Activity</h3>
                                            </div>
                                            <div className="mt-4 space-y-1">
                                                <div className="text-3xl font-bold text-gray-900 dark:text-white">{summary.total_logins}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">Total sessions all time</div>
                                            </div>
                                        </div>

                                        {/* This Month Stats */}
                                        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                                    <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                                </div>
                                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">This Month</h3>
                                            </div>
                                            <div className="mt-4 flex justify-between items-end">
                                                <div>
                                                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{summary.total_logins_this_month}</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">Sessions</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xl font-bold text-gray-900 dark:text-white">{summary.total_worked_hours_this_month}h</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">Hours Worked</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Current Status */}
                                        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className={`p-2 rounded-lg ${summary.is_currently_logged_in ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                                    <Clock className={`w-5 h-5 ${summary.is_currently_logged_in ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`} />
                                                </div>
                                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Current Status</h3>
                                            </div>
                                            <div className="mt-4">
                                                {summary.is_currently_logged_in ? (
                                                    <div>
                                                        <div className="text-xl font-bold text-green-600 dark:text-green-400">Online</div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            Active for {formatDuration(summary.current_session_duration_minutes)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="text-xl font-bold text-gray-600 dark:text-gray-400">Offline</div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            Last seen: {summary.last_logout_at ? new Date(summary.last_logout_at).toLocaleString() : 'N/A'}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Monthly Averages */}
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30 text-center">
                                        <p className="text-blue-800 dark:text-blue-300 text-sm">
                                            <span className="font-semibold">Insight:</span> Average session duration is <span className="font-bold">{summary.average_session_duration_hours} hours</span>.
                                            User has logged in <span className="font-bold">{summary.total_logins_this_week} times</span> this week.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Detailed History History View */}
                            {activeTab === 'history' && (
                                <div className="flex flex-col h-full">
                                    {/* Filters */}
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-4 flex flex-wrap gap-3 items-end">
                                        <div className="flex-1 min-w-[200px]">
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">From Date</label>
                                            <input
                                                type="date"
                                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                                                value={dateFilter.startDate}
                                                onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-[200px]">
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">To Date</label>
                                            <input
                                                type="date"
                                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                                                value={dateFilter.endDate}
                                                onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleApplyFilter}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                                            >
                                                Apply
                                            </button>
                                            {(dateFilter.startDate || dateFilter.endDate) && (
                                                <button
                                                    onClick={handleClearFilter}
                                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* History List */}
                                    <div className="space-y-3">
                                        {history.map((session) => (
                                            <div key={session.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${session.status === 'OPEN'
                                                                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400'
                                                            }`}>
                                                            {getStatusIcon(session.logout_type, session.status)}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold text-gray-900 dark:text-white">{formatDate(session.date)}</span>
                                                                <span className={`text-xs px-2 py-0.5 rounded-full ${session.status === 'OPEN'
                                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                                                    }`}>
                                                                    {session.status === 'OPEN' ? 'Active' : 'Completed'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {formatDuration(session.worked_minutes)}
                                                                </span>
                                                                <span>•</span>
                                                                <span>{formatTime(session.login_at)} - {session.logout_at ? formatTime(session.logout_at) : 'Now'}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="text-right">
                                                        {session.attendance_status !== 'PRESENT' && (
                                                            <div className={`text-xs font-semibold px-2 py-1 rounded inline-block mb-1 ${session.attendance_status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                                    session.attendance_status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                                        'bg-yellow-100 text-yellow-700'
                                                                }`}>
                                                                {session.attendance_status}
                                                            </div>
                                                        )}
                                                        <div className="text-xs text-gray-400 dark:text-gray-500 max-w-[150px] truncate">
                                                            {session.logout_type || 'Active Session'}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Remarks or Auto-Logout visualization */}
                                                {(session.remarks || session.auto_logged_out) && (
                                                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50 text-xs text-gray-500 dark:text-gray-400 flex items-start gap-2">
                                                        {session.auto_logged_out && <span className="text-orange-500 font-medium">⚠️ System Auto-Logout</span>}
                                                        {session.remarks && <span>{session.remarks}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {history.length === 0 && (
                                            <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                                                <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                                <p className="text-gray-500">No session history found for this period</p>
                                            </div>
                                        )}

                                        {pagination.hasMore && (
                                            <div className="pt-4 text-center">
                                                <button
                                                    onClick={() => loadHistory(false)}
                                                    disabled={loadingMore}
                                                    className="px-6 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition disabled:opacity-50 flex items-center gap-2 mx-auto"
                                                >
                                                    {loadingMore ? (
                                                        <>
                                                            <RotateCcw className="w-4 h-4 animate-spin" />
                                                            Loading more...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown className="w-4 h-4" />
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