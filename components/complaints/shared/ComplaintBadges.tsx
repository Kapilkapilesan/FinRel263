import React from 'react';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

interface StatusBadgeProps {
    status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Open': return <AlertCircle className="w-4 h-4" />;
            case 'In Progress': return <Clock className="w-4 h-4" />;
            case 'Resolved': return <CheckCircle className="w-4 h-4" />;
            case 'Closed': return <CheckCircle className="w-4 h-4" />;
            case 'Rejected': return <XCircle className="w-4 h-4" />;
            default: return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
            case 'In Progress': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
            case 'Resolved': return 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20';
            case 'Closed': return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20';
            case 'Rejected': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20';
            default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20';
        }
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getStatusColor(status)} shadow-sm`}>
            {getStatusIcon(status)}
            {status}
        </span>
    );
};

export const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'High': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
            case 'Medium': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
            case 'Low': return 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20';
            default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20';
        }
    };

    return (
        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getPriorityColor(priority)} shadow-sm`}>
            {priority}
        </span>
    );
};
