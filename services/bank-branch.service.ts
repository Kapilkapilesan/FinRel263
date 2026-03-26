import { API_BASE_URL, getHeaders } from './api.config';
import { BranchExpense, FinanceApiResponse } from '../types/finance.types';

export const bankBranchService = {
    /**
     * Get bank branch activities (history)
     */
    getHistory: async (params: {
        branch_id?: number;
        period?: string;
        date?: string;
    }): Promise<{ activities: BranchExpense[]; stats: any }> => {
        const query = new URLSearchParams();
        if (params.branch_id) query.append('branch_id', params.branch_id.toString());
        if (params.period) query.append('period', params.period);
        if (params.date) query.append('date', params.date);

        const response = await fetch(`${API_BASE_URL}/finance/branch-transactions?${query.toString()}`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to fetch bank branch history');
        }

        const json: FinanceApiResponse<{
            activities: BranchExpense[];
            stats: any;
        }> = await response.json();

        return json.data;
    }
};
