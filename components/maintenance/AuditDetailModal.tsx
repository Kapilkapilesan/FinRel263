'use client';

import React, { useState } from 'react';
import { X, Clock, User, Monitor, Globe, Tag, Database, ArrowRight, History, FileText, CheckCircle2, Edit } from 'lucide-react';
import { AuditLog } from '../../services/audit.service';
import { colors } from '@/themes/colors';

const formatDate = (dateString: string, formatStr: string = 'PPpp') => {
    const date = new Date(dateString);
    if (formatStr.includes('hh:mm')) {
        return date.toLocaleString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

interface AuditDetailModalProps {
    log: AuditLog;
    onClose: () => void;
}

export function AuditDetailModal({ log, onClose }: AuditDetailModalProps) {
    const [activeTab, setActiveTab] = useState<'summary' | 'old' | 'new'>(
        log.event === 'updated' ? 'summary' : 'new'
    );

    const isUpdate = log.event === 'updated';

    // Helper to format values for display
    const formatValue = (value: any) => {
        if (value === null) return <span className="text-text-muted italic">null</span>;
        if (value === undefined) return <span className="text-text-muted italic">undefined</span>;
        if (typeof value === 'boolean') return value ? 'True' : 'False';
        if (typeof value === 'object') return JSON.stringify(value, null, 2);
        return String(value);
    };

    // Get list of changed fields
    const changedFields = log.new_values ? Object.keys(log.new_values) : [];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-card w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-border-default flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-border-divider flex justify-between items-center bg-muted-bg/10">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${log.event === 'updated' ? 'bg-amber-500 text-white' :
                            log.event === 'created' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                            }`}>
                            <History className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-text-primary capitalize">{log.event} Activity Details</h2>
                            <p className="text-xs text-text-muted flex items-center gap-2 mt-0.5">
                                <Tag className="w-3 h-3" />
                                Audit ID: #{log.id} • {log.module_name} ID: {log.auditable_id}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-hover rounded-full text-text-muted hover:text-text-primary transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Info Bar */}
                <div className="px-6 py-4 bg-muted-bg/30 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-border-divider">
                    <div className="flex items-center gap-2.5">
                        <User className="w-4 h-4 text-primary-500" />
                        <div className="flex flex-col">
                            <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">User</span>
                            <span className="text-xs font-bold text-text-primary truncate">{log.user?.name || log.user?.user_name || 'System'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <div className="flex flex-col">
                            <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">Date & Time</span>
                            <span className="text-xs font-bold text-text-primary">{formatDate(log.created_at, 'dd MMM yyyy, hh:mm a')}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Globe className="w-4 h-4 text-emerald-500" />
                        <div className="flex flex-col">
                            <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">IP Address</span>
                            <span className="text-xs font-bold text-text-primary">{log.ip_address || '-'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Monitor className="w-4 h-4 text-purple-500" />
                        <div className="flex flex-col">
                            <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">Module</span>
                            <span className="text-xs font-bold text-text-primary italic">{log.module_name}</span>
                        </div>
                    </div>
                </div>

                {/* Tabs Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Inner Tabs for Updates */}
                    {isUpdate && (
                        <div className="px-6 pt-4 flex gap-2">
                            <button
                                onClick={() => setActiveTab('summary')}
                                className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 border shadow-sm ${activeTab === 'summary'
                                    ? 'bg-primary-600 text-white border-primary-700'
                                    : 'bg-card text-text-muted border-border-default hover:bg-hover'
                                    }`}
                            >
                                <Edit className="w-3.5 h-3.5" />
                                Modified Summary
                            </button>
                            <button
                                onClick={() => setActiveTab('old')}
                                className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 border shadow-sm ${activeTab === 'old'
                                    ? 'bg-rose-600 text-white border-rose-700'
                                    : 'bg-card text-text-muted border-border-default hover:bg-hover'
                                    }`}
                            >
                                <History className="w-3.5 h-3.5" />
                                Old Value
                            </button>
                            <button
                                onClick={() => setActiveTab('new')}
                                className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 border shadow-sm ${activeTab === 'new'
                                    ? 'bg-emerald-600 text-white border-emerald-700'
                                    : 'bg-card text-text-muted border-border-default hover:bg-hover'
                                    }`}
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                New Values
                            </button>
                        </div>
                    )}

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {activeTab === 'summary' && isUpdate && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-12 gap-2 pb-2 border-b border-border-divider text-[10px] font-black uppercase text-text-muted tracking-widest">
                                    <div className="col-span-3">Field Name</div>
                                    <div className="col-span-4">Previous Value</div>
                                    <div className="col-span-1 flex justify-center"></div>
                                    <div className="col-span-4">New Value</div>
                                </div>
                                {changedFields.map(field => (
                                    <div key={field} className="grid grid-cols-12 gap-2 items-center py-3 px-3 bg-muted-bg/10 rounded-xl hover:bg-muted-bg/20 transition-all border border-transparent hover:border-border-default group">
                                        <div className="col-span-3 font-bold text-xs text-primary-600 uppercase tracking-tighter truncate" title={field}>
                                            {field.replace(/_/g, ' ')}
                                        </div>
                                        <div className="col-span-4 text-xs text-rose-600 bg-rose-50 dark:bg-rose-900/10 px-3 py-2 rounded-lg border border-rose-100 dark:border-rose-900/30 break-all h-full flex items-center">
                                            {formatValue(log.old_values?.[field])}
                                        </div>
                                        <div className="col-span-1 flex justify-center">
                                            <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary-500 transition-all group-hover:translate-x-1" />
                                        </div>
                                        <div className="col-span-4 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 px-3 py-2 rounded-lg border border-emerald-100 dark:border-emerald-900/30 break-all h-full flex items-center font-bold">
                                            {formatValue(log.new_values?.[field])}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'old' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.entries(log.old_values || {}).map(([key, value]) => (
                                    <div key={key} className="p-3 bg-input border border-border-default rounded-xl flex flex-col gap-1">
                                        <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">{key.replace(/_/g, ' ')}</span>
                                        <div className="text-xs font-bold text-text-primary break-all">
                                            {formatValue(value)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'new' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.entries(log.new_values || {}).map(([key, value]) => {
                                    const isChanged = isUpdate && changedFields.includes(key);
                                    return (
                                        <div
                                            key={key}
                                            className={`p-3 border rounded-xl flex flex-col gap-1 transition-all ${isChanged
                                                ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800 shadow-sm scale-[1.02]'
                                                : 'bg-input border-border-default'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${isChanged ? 'text-emerald-600' : 'text-text-muted'}`}>
                                                    {key.replace(/_/g, ' ')}
                                                </span>
                                                {isChanged && (
                                                    <span className="px-1.5 py-0.5 bg-emerald-600 text-white text-[8px] font-black uppercase rounded shadow-sm">Modified</span>
                                                )}
                                            </div>
                                            <div className={`text-xs font-bold break-all ${isChanged ? 'text-emerald-700 dark:text-emerald-300' : 'text-text-primary'}`}>
                                                {formatValue(value)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border-divider bg-muted-bg/10 flex justify-between items-center">
                    <p className="text-[10px] text-text-muted max-w-[70%]">
                        Audit data is recorded automatically by the system middleware and cannot be modified or deleted.
                    </p>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-text-primary text-card hover:opacity-90 rounded-xl transition-all font-bold text-sm shadow-lg"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
}
