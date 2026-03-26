'use client'
import { Bank, BankBranch, BankFormData, BankBranchFormData, BankWithBranches, ApiResponse } from '../types/bank.types';
import { API_BASE_URL, getHeaders } from './api.config';

const fetchOptions = {
    credentials: 'include' as RequestCredentials,
};

export const bankService = {
    // Get all banks with branch counts
    getBanks: async (search?: string): Promise<Bank[]> => {
        let url = `${API_BASE_URL}/system-config/banks`;
        if (search) url += `?search=${encodeURIComponent(search)}`;

        const response = await fetch(url, {
            ...fetchOptions,
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch banks: ${response.statusText}`);
        }

        const json: ApiResponse<Bank[]> = await response.json();
        return json.data;
    },

    // Get single bank
    getBank: async (id: number): Promise<Bank> => {
        const response = await fetch(`${API_BASE_URL}/system-config/banks/${id}`, {
            ...fetchOptions,
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch bank details');
        }

        const json: ApiResponse<Bank> = await response.json();
        return json.data;
    },

    // Create bank
    createBank: async (data: BankFormData): Promise<Bank> => {
        const response = await fetch(`${API_BASE_URL}/system-config/banks`, {
            method: 'POST',
            ...fetchOptions,
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        const json = await response.json();

        if (!response.ok) {
            if (response.status === 422) {
                const error = new Error(json.message || 'Validation failed');
                (error as any).errors = json.errors;
                throw error;
            }
            throw new Error(json.message || 'Failed to create bank');
        }

        return json.data;
    },

    // Update bank
    updateBank: async (id: number, data: Partial<BankFormData>): Promise<Bank> => {
        const response = await fetch(`${API_BASE_URL}/system-config/banks/${id}`, {
            method: 'PUT',
            ...fetchOptions,
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        const json = await response.json();

        if (!response.ok) {
            if (response.status === 422) {
                const error = new Error(json.message || 'Validation failed');
                (error as any).errors = json.errors;
                throw error;
            }
            throw new Error(json.message || 'Failed to update bank');
        }

        return json.data;
    },

    // Delete bank
    deleteBank: async (id: number): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/system-config/banks/${id}`, {
            method: 'DELETE',
            ...fetchOptions,
            headers: getHeaders()
        });

        if (!response.ok) {
            const json = await response.json().catch(() => ({}));
            throw new Error(json.message || 'Failed to delete bank');
        }
    },

    // Get branches for a bank
    getBankBranches: async (bankId: number, search?: string): Promise<BankWithBranches> => {
        let url = `${API_BASE_URL}/system-config/banks/${bankId}/branches`;
        if (search) url += `?search=${encodeURIComponent(search)}`;

        const response = await fetch(url, {
            ...fetchOptions,
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch bank branches: ${response.statusText}`);
        }

        const json: ApiResponse<BankWithBranches> = await response.json();
        return json.data;
    },

    // Create branch for a bank
    createBankBranch: async (bankId: number, data: BankBranchFormData): Promise<BankBranch> => {
        const response = await fetch(`${API_BASE_URL}/system-config/banks/${bankId}/branches`, {
            method: 'POST',
            ...fetchOptions,
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        const json = await response.json();

        if (!response.ok) {
            if (response.status === 422) {
                const error = new Error(json.message || 'Validation failed');
                (error as any).errors = json.errors;
                throw error;
            }
            throw new Error(json.message || 'Failed to create branch');
        }

        return json.data;
    },

    // Update bank branch
    updateBankBranch: async (bankId: number, branchId: number, data: Partial<BankBranchFormData>): Promise<BankBranch> => {
        const response = await fetch(`${API_BASE_URL}/system-config/banks/${bankId}/branches/${branchId}`, {
            method: 'PUT',
            ...fetchOptions,
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        const json = await response.json();

        if (!response.ok) {
            if (response.status === 422) {
                const error = new Error(json.message || 'Validation failed');
                (error as any).errors = json.errors;
                throw error;
            }
            throw new Error(json.message || 'Failed to update branch');
        }

        return json.data;
    },

    // Delete bank branch
    deleteBankBranch: async (bankId: number, branchId: number): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/system-config/banks/${bankId}/branches/${branchId}`, {
            method: 'DELETE',
            ...fetchOptions,
            headers: getHeaders()
        });

        if (!response.ok) {
            const json = await response.json().catch(() => ({}));
            throw new Error(json.message || 'Failed to delete branch');
        }
    },

    // Bulk Import Banks & Branches
    importBanks: async (file: File): Promise<any> => {
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('token');
        const headers: HeadersInit = {
            'Accept': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token.trim().replace(/[\n\r]/g, '')}`;
        }

        const response = await fetch(`${API_BASE_URL}/system-config/banks/import`, {
            method: 'POST',
            headers: headers,
            body: formData
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to import banks');
        }
        return data;
    },
};
