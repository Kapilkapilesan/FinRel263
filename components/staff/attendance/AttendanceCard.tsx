import React, { useEffect, useState } from 'react';
import { User as UserIcon, Clock, CheckCircle, XCircle, AlertCircle, Calendar, Activity } from 'lucide-react';
import { AttendanceRecord } from '../../../types/attendance.types';
import { colors } from '@/themes/colors';

interface AttendanceCardProps {
    record: AttendanceRecord;
    onChange: (id: string, updates: Partial<AttendanceRecord>) => void;
}

export const AttendanceCard: React.FC<AttendanceCardProps> = ({ record, onChange }) => {

    // Helper to format 24h time to 12h with AM/PM
    const formatTime12h = (time24?: string) => {
        if (!time24) return '--:--';
        const [hours, minutes] = time24.split(':');
        let h = parseInt(hours);
        const m = minutes;
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12;
        return `${h}:${m} ${ampm}`;
    };

    const statusConfig: Record<string, any> = {
        'Present': { color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-500/10', border: 'border-primary-500/20' },
        'Absent': { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
        'Half Day': { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        'Leave': {
            color: 'text-primary-600 dark:text-primary-400',
            bg: 'bg-primary-500/10',
            border: 'border-primary-500/20'
        },
        'Not Marked': { color: 'text-text-muted', bg: 'bg-muted-bg', border: 'border-border-default' }
    };

    return (
        <div
            className={`bg-card rounded-[2.5rem] border ${record.isOnline ? 'border-primary-500/50 shadow-2xl shadow-primary-500/10 animate-in fade-in zoom-in-95' : 'border-border-default/50'} p-8 shadow-xl hover:shadow-2xl transition-all relative overflow-hidden group`}
        >
            {record.isOnline && (
                <div
                    className="absolute top-0 right-0 px-6 py-2 bg-primary-500 text-white rounded-bl-[2.5rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 shadow-xl backdrop-blur-md"
                >
                    <Activity className="w-3 h-3 animate-pulse" /> Live Now
                </div>
            )}

            <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-5">
                    <div className="relative group-hover:scale-110 transition-transform">
                        <div
                            className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-xl border-2 border-border-default/50 shadow-inner overflow-hidden bg-card"
                        >
                            {record.avatar ? (
                                <img src={record.avatar} alt={record.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-primary-500 opacity-50">{record.name.substring(0, 1).toUpperCase()}</span>
                            )}
                        </div>
                        {record.isOnline && <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary-500 border-4 border-card rounded-full animate-pulse shadow-lg" />}
                    </div>
                    <div>
                        <h3 className="font-black text-text-primary text-lg tracking-tight uppercase">{record.name}</h3>
                        <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.1em] mt-1">
                            {record.name !== record.staffCode && `${record.staffCode} • `}{record.role}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <div
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest shadow-sm ${statusConfig[record.status]?.bg} ${statusConfig[record.status]?.color} ${statusConfig[record.status]?.border}`}
                    >
                        <div className={`w-2 h-2 rounded-full ${statusConfig[record.status]?.color.replace('text', 'bg')}`} />
                        {record.status}
                    </div>
                    <div className="mt-3 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                        {record.workedHours?.toFixed(1)}H total
                    </div>
                </div>
            </div>

            {/* Info Banner */}
            {record.status !== 'Leave' && !record.isOnline && (
                <div className="mb-6 px-6 py-3 bg-muted-bg/50 border border-border-default/30 rounded-2xl backdrop-blur-sm">
                    <p className="text-[10px] text-text-muted font-black flex items-center gap-3 leading-none uppercase tracking-widest">
                        <AlertCircle className="w-3.5 h-3.5 text-primary-500" />
                        AUTO: 7h+ Present | 4-7h Half Day
                    </p>
                </div>
            )}

            {/* Time Check-in/out */}
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2">Check In</label>
                    <div className="flex items-center gap-3 px-6 py-4 bg-input border border-border-default/50 rounded-2xl shadow-inner group-hover:border-primary-500/30 transition-colors">
                        <Clock className="w-4 h-4 text-primary-500" />
                        <span className="text-md font-black text-text-primary tracking-tight">{record.checkIn || '--:--'}</span>
                    </div>
                    <div className="text-[10px] font-black text-text-muted/50 ml-2 tracking-widest">
                        {formatTime12h(record.checkIn)}
                    </div>
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2">Check Out</label>
                    <div className="flex items-center gap-3 px-6 py-4 bg-input border border-border-default/50 rounded-2xl shadow-inner group-hover:border-primary-500/30 transition-colors">
                        <Clock className="w-4 h-4 text-primary-500" />
                        <span className="text-md font-black text-text-primary tracking-tight">{record.checkOut || '--:--'}</span>
                    </div>
                    <div className="text-[10px] font-black text-text-muted/50 ml-2 tracking-widest">
                        {formatTime12h(record.checkOut)}
                    </div>
                </div>
            </div>
        </div>
    );
};