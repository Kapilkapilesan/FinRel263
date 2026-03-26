import { API_BASE_URL, getHeaders } from './api.config';

export interface IpWhitelistEntry {
    id: number;
    ip_address: string;
    description: string;
    added_by: number;
    user_id: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    adder?: {
        id: number;
        name: string;
        user_name: string;
    };
    user?: {
        id: number;
        name: string;
        user_name: string;
    };
}

export interface ApiResponse<T> {
    statusCode: number;
    message: string;
    data: T;
}

export const ipWhitelistService = {
    getAll: async (): Promise<ApiResponse<IpWhitelistEntry[]>> => {
        const response = await fetch(`${API_BASE_URL}/maintenance/ip-whitelist`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch IP whitelist');
        return response.json();
    },

    add: async (ip_address: string, description: string, is_active: boolean = true, user_id: number | null = null): Promise<ApiResponse<IpWhitelistEntry>> => {
        const response = await fetch(`${API_BASE_URL}/maintenance/ip-whitelist`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ ip_address, description, is_active, user_id })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to add IP address');
        return data;
    },

    update: async (id: number, payload: Partial<IpWhitelistEntry>): Promise<ApiResponse<IpWhitelistEntry>> => {
        const response = await fetch(`${API_BASE_URL}/maintenance/ip-whitelist/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to update IP address');
        return data;
    },

    delete: async (id: number): Promise<ApiResponse<void>> => {
        const response = await fetch(`${API_BASE_URL}/maintenance/ip-whitelist/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to delete IP address');
        return response.json();
    }
};
