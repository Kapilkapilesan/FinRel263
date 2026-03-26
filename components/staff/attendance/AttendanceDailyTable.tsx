import React from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Edit2, RotateCcw, Activity } from 'lucide-react';
import { AttendanceRecord } from '@/types/attendance.types';
import { colors } from '@/themes/colors';

interface AttendanceDailyTableProps {
    records: AttendanceRecord[];
    onUpdate: (id: string, updates: Partial<AttendanceRecord>) => void;
}

export const AttendanceDailyTable: React.FC<AttendanceDailyTableProps> = ({ records, onUpdate }) => {

    // Helper to format 24h time to 12h with AM/PM
    const formatTime12h = (time24?: string) => {
        if (!time24) return '--:--';
        const [hours, minutes] = time24.split(':');
        let h = parseInt(hours);
        const m = minutes;
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12; // the hour '0' should be '12'
        return `${h}:${m} ${ampm}`;
    };

    const statusConfig: Record<string, any> = {
        'Present': { icon: CheckCircle, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-500/10', border: 'border-primary-500/20' },
        'Absent': { icon: XCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
        'Half Day': { icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        'Leave': {
            icon: Edit2,
            color: 'text-primary-600 dark:text-primary-400',
            bg: 'bg-primary-500/10',
            border: 'border-primary-500/20'
        },
        'Not Marked': { icon: AlertCircle, color: 'text-text-muted', bg: 'bg-muted-bg', border: 'border-border-default' }
    };

    return (
        <div className="bg-card rounded-[2.5rem] border border-border-default/50 shadow-2xl overflow-hidden animate-in fade-in duration-700">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-table-header/30 border-b border-border-default shadow-sm relative z-10">
                            <th className="px-8 py-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Staff Member</th>
                            <th className="px-8 py-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Status</th>
                            <th className="px-8 py-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Check In</th>
                            <th className="px-8 py-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Check Out</th>
                            <th className="px-8 py-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Worked Duration</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default/50">
                        {records.map((record, index) => {
                            const config = statusConfig[record.status] || statusConfig['Not Marked'];
                            const StatusIcon = config.icon;

                            return (
                                <tr
                                    key={record.id}
                                    className="transition-all hover:bg-muted-bg/30 group animate-in slide-in-from-bottom-2"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    {/* Staff Name & ID */}
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-5">
                                            <div className="relative group-hover:scale-110 transition-transform">
                                                <div
                                                    className="w-12 h-12 rounded-[1rem] flex items-center justify-center font-black text-sm overflow-hidden border-2 border-border-default/50 bg-card shadow-lg shadow-black/5"
                                                >
                                                    {record.avatar ? (
                                                        <img src={record.avatar} alt={record.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-primary-500 opacity-50">{record.name.substring(0, 1).toUpperCase()}</span>
                                                    )}
                                                </div>
                                                {record.isOnline && (
                                                    <span className="absolute bottom-[-2px] right-[-2px] w-4 h-4 bg-primary-500 border-4 border-card rounded-full shadow-lg animate-pulse" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-sm font-black text-text-primary tracking-tight uppercase leading-none">{record.name}</p>
                                                    {record.isOnline && (
                                                        <span className="bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[8px] px-2 py-0.5 rounded-lg font-black uppercase tracking-[0.1em] flex items-center gap-1.5 border border-primary-500/20">
                                                            <Activity className="w-2.5 h-2.5" /> Online
                                                        </span>
                                                    )}
                                                </div>
                                                {record.name !== record.staffCode && (
                                                    <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mt-1 opacity-50">{record.staffCode}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Daily Status */}
                                    <td className="px-8 py-6">
                                        <div className="relative inline-block">
                                            <div
                                                className={`px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm ${config.bg} ${config.color} ${config.border}`}
                                            >
                                                <StatusIcon className="w-3.5 h-3.5" />
                                                {record.status}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Check In */}
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-3 px-4 py-2 bg-input border border-border-default/50 rounded-2xl shadow-inner group-hover:border-primary-500/30 transition-colors">
                                                <Clock className="w-4 h-4 text-primary-500" />
                                                <span className="text-xs font-black text-text-primary tracking-tight">{record.checkIn || '--:--'}</span>
                                            </div>
                                            <span className="text-[9px] font-black text-text-muted/50 pl-2 uppercase tracking-[0.15em]">
                                                {formatTime12h(record.checkIn)}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Check Out */}
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-3 px-4 py-2 bg-input border border-border-default/50 rounded-2xl shadow-inner group-hover:border-primary-500/30 transition-colors">
                                                <Clock className="w-4 h-4 text-primary-500" />
                                                <span className="text-xs font-black text-text-primary tracking-tight">{record.checkOut || '--:--'}</span>
                                            </div>
                                            <span className="text-[9px] font-black text-text-muted/50 pl-2 uppercase tracking-[0.15em]">
                                                {formatTime12h(record.checkOut)}
                                            </span>

                                        </div>
                                    </td>

                                    {/* Duration */}
                                    <td className="px-8 py-6">
                                        {record.isOnline ? (
                                            <div className="flex flex-col">
                                                <span className="text-md font-black flex items-center gap-2 text-primary-500 tracking-tighter">
                                                    {record.workedHours?.toFixed(1)}H LOAD
                                                    <span className="flex h-2 w-2 relative">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                                                    </span>
                                                </span>
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500/50">ACTIVE PROCESS</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col">
                                                <span className={`text-md font-black tracking-tighter ${record.workedHours && record.workedHours >= 7 ? 'text-primary-500' : 'text-text-primary'}`}>
                                                    {record.workedHours ? `${record.workedHours.toFixed(1)}H TOTAL` : 'NULL'}
                                                </span>
                                                {record.workedHours && <span className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] opacity-30 mt-1">COMPLETED LOG</span>}
                                            </div>
                                        )}
                                    </td>

                                    <td className="px-8 py-6 text-right"></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {records.length === 0 && (
                <div className="py-40 text-center bg-card">
                    <div className="w-20 h-20 bg-muted-bg rounded-[2.5rem] flex items-center justify-center mx-auto mb-8">
                        <AlertCircle className="w-10 h-10 text-text-muted opacity-20" />
                    </div>
                    <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">Zero Records Identified</h3>
                    <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] mt-4">No staff records found for this date.</p>
                </div>
            )}
        </div>
    );
};
