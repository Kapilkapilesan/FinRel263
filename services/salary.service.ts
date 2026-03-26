import { SalaryPayment, SalaryStats } from '@/types/salary.types';
import { API_BASE_URL, getHeaders } from './api.config';

export const salaryService = {
    getStats: async (): Promise<SalaryStats> => {
        try {
            const response = await fetch(`${API_BASE_URL}/payroll/stats`, { headers: getHeaders() });

            if (!response.ok) {
                throw new Error(`Failed to fetch salary stats: ${response.statusText}`);
            }

            const json = await response.json();

            if (json.status === 'success' && json.data) {
                return {
                    totalPayroll: json.data.totalPayroll || 0,
                    processedCount: json.data.processedCount || 0,
                    averageSalary: json.data.averageSalary || 0,
                    activeHeadcount: json.data.activeHeadcount || 0,
                    eligibleForPayroll: json.data.eligibleForPayroll || 0,
                    currentMonth: json.data.currentMonth || undefined
                };
            }

            throw new Error('Invalid response format from salary stats API');
        } catch (error) {
            console.error("Error fetching salary stats", error);
            throw error;
        }
    },

    getHistory: async (month?: string, status?: string): Promise<SalaryPayment[]> => {
        try {
            const query = new URLSearchParams();
            if (month) query.append('month', month);
            if (status) query.append('status', status);

            const response = await fetch(`${API_BASE_URL}/payroll/history?${query.toString()}`, { headers: getHeaders() });

            if (!response.ok) {
                throw new Error(`Failed to fetch salary history: ${response.statusText}`);
            }

            const json = await response.json();

            if (json.status === 'success' && Array.isArray(json.data)) {
                return json.data;
            }

            throw new Error('Invalid response format from salary history API');
        } catch (error) {
            console.error("Error fetching salary history", error);
            throw error;
        }
    },

    processPayment: async (data: Partial<SalaryPayment>): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/payroll/process`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const json = await response.json();
            throw new Error(json.message || 'Failed to process payment');
        }
        return await response.json();
    }
};
