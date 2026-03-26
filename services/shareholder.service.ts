import { API_BASE_URL, getHeaders } from './api.config';
import { Shareholder, ShareholdersResponse, ShareholderSystemInfo, CalculationPreview } from '@/types/shareholder.types';

export const shareholderService = {
    async getAll(month?: number, year?: number, branchId?: number): Promise<ShareholdersResponse> {
        const params = new URLSearchParams();
        if (month) params.append('month', month.toString());
        if (year) params.append('year', year.toString());
        if (branchId) params.append('branch_id', branchId.toString());
        const query = params.toString() ? `?${params.toString()}` : '';

        const response = await fetch(`${API_BASE_URL}/shareholders${query}`, {
            headers: getHeaders(),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || `API Error ${response.status}`;
            console.error('Failed to fetch shareholders:', errorMessage);
            throw new Error(errorMessage);
        }

        const result = await response.json();
        return result.data;
    },

    async getSystemInfo(): Promise<ShareholderSystemInfo> {
        const response = await fetch(`${API_BASE_URL}/shareholders/system-info`, {
            headers: getHeaders(),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch system info');
        }

        const result = await response.json();
        return result.data;
    },

    async previewCalculation(investmentAmount: number, excludeShareholderId?: string): Promise<CalculationPreview> {
        const response = await fetch(`${API_BASE_URL}/shareholders/preview-calculation`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                investment_amount: investmentAmount,
                exclude_shareholder_id: excludeShareholderId ? parseInt(excludeShareholderId) : undefined,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to preview calculation');
        }

        const result = await response.json();
        return result.data;
    },

    async getById(id: string): Promise<Shareholder> {
        const response = await fetch(`${API_BASE_URL}/shareholders/${id}`, {
            headers: getHeaders(),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch shareholder');
        }

        const result = await response.json();
        return result.data;
    },

    async create(data: { name: string; total_investment: number; nic: string; contact?: string; address?: string }): Promise<Shareholder> {
        const response = await fetch(`${API_BASE_URL}/shareholders`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create shareholder');
        }

        const result = await response.json();
        return result.data;
    },

    async update(id: string, data: Partial<{ name: string; total_investment: number; nic: string; contact?: string; address?: string }>): Promise<Shareholder> {
        const response = await fetch(`${API_BASE_URL}/shareholders/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update shareholder');
        }

        const result = await response.json();
        return result.data;
    },

    async delete(id: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/shareholders/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });

        if (!response.ok) {
            throw new Error('Failed to delete shareholder');
        }
    },
};

