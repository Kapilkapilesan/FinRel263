import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { LoanStatus } from '@/types/loan-approval.types';

interface StatusBadgeProps {
    status: LoanStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    switch (status) {
        case 'Pending 1st':
            return <span className="px-2 py-1 bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 rounded text-[10px] font-bold uppercase tracking-wider">Pending 1st Approval</span>;
        case 'Pending 2nd':
            return <span className="px-2 py-1 bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 rounded text-[10px] font-bold uppercase tracking-wider">Pending 2nd Approval</span>;
        case 'Approved':
            return (
                <span className="px-2 py-1 bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 rounded text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />Approved
                </span>
            );
        case 'Sent Back':
            return (
                <span className="px-2 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                    <XCircle className="w-3 h-3" />Sent Back
                </span>
            );
        default:
            return <span className="px-2 py-1 bg-muted-bg text-text-secondary border border-border-divider rounded text-[10px] font-bold uppercase tracking-wider">{status}</span>;
    }
};
