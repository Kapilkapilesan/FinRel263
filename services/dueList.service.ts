import { API_BASE_URL, getHeaders } from './api.config';
import type { DueListSummary } from '@/components/collections/due-list/DueListStats';
import type { DuePayment } from '@/components/collections/due-list/DueListTable';

export const dueListService = {
    /**
     * Get due list for a specific date and optional center
     */
    getDueList: async (date: string, centerId?: string, showAll?: boolean, branchId?: string, dueWeek?: string): Promise<DuePayment[]> => {
        const url = new URL(`${API_BASE_URL}/due-list`);
        url.searchParams.append('date', date);

        if (branchId) {
            url.searchParams.append('branch_id', branchId);
        }

        if (centerId) {
            url.searchParams.append('center_id', centerId);
        }

        if (showAll) {
            url.searchParams.append('show_all', '1');
        }

        if (dueWeek && dueWeek !== 'all') {
            url.searchParams.append('due_week', dueWeek);
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: getHeaders(),
        });

        const result: {
            success: boolean;
            data: DuePayment[];
            message?: string;
        } = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch due list');
        }

        return result.data;
    },

    /**
     * Get due list summary statistics
     */
    getDueListSummary: async (): Promise<DueListSummary> => {
        const response = await fetch(`${API_BASE_URL}/due-list/summary`, {
            method: 'GET',
            headers: getHeaders(),
        });

        const result: {
            success: boolean;
            data: DueListSummary;
            message?: string;
        } = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch due list summary');
        }

        return result.data;
    },

    /**
     * Export due list to CSV
     */
    exportDueList: async (date: string, centerId?: string): Promise<void> => {
        const url = new URL(`${API_BASE_URL}/due-list/export`);
        url.searchParams.append('date', date);

        if (centerId) {
            url.searchParams.append('center_id', centerId);
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: getHeaders(),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || 'Failed to export due list');
        }

        const blob = await response.blob();
        const exportUrl = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = exportUrl;
        a.download = `due_list_${date}.csv`;

        document.body.appendChild(a);
        a.click();

        window.URL.revokeObjectURL(exportUrl);
        document.body.removeChild(a);
    },

    /**
     * Extend due date for a loan
     */
    extendDueDate: async (
        loanId: string,
        originalDate: string,
        newDate: string | null,
        reason: string,
        actionType: 'move' | 'skip' = 'move'
    ): Promise<void> => {
        const payload: any = {
            original_due_date: originalDate,
            reason,
            action_type: actionType
        };

        if (actionType === 'move' && newDate) {
            payload.new_due_date = newDate;
        }

        const response = await fetch(`${API_BASE_URL}/collections/loans/${loanId}/extend-due-date`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to update due date');
        }
    },

    /**
     * Get pending due dates with counts for checklist
     */
    getPendingDueDates: async (centerId: string, startDate: string, endDate: string): Promise<{ date: string; count: number; day_name: string }[]> => {
        const url = new URL(`${API_BASE_URL}/collections/pending-due-dates`);
        url.searchParams.append('center_id', centerId);
        url.searchParams.append('start_date', startDate);
        url.searchParams.append('end_date', endDate);

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: getHeaders(),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch pending due dates');
        }

        return result.data;
    },

    /**
     * Bulk skip due dates for a center (Multiple Dates)
     */
    bulkSkip: async (centerId: string, dates: string[], reason: string): Promise<{ count: number; message: string }> => {
        const response = await fetch(`${API_BASE_URL}/collections/bulk-skip`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                center_id: centerId,
                dates,
                reason
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to bulk skip due dates');
        }

        return result;
    },
};
