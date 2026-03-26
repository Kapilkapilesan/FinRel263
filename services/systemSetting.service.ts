import { API_BASE_URL, getHeaders } from './api.config';

export interface SystemSetting {
    id: number;
    key: string;
    value: string;
    description: string;
    created_at: string;
    updated_at: string;
}

export interface ApiResponse<T> {
    statusCode: number;
    message: string;
    data: T;
}

export const systemSettingService = {
    getAll: async (): Promise<ApiResponse<SystemSetting[]>> => {
        const response = await fetch(`${API_BASE_URL}/maintenance/system-settings`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch system settings');
        return response.json();
    },

    update: async (settings: { key: string, value: string }[]): Promise<ApiResponse<SystemSetting[]>> => {
        const response = await fetch(`${API_BASE_URL}/maintenance/system-settings`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ settings })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to update system settings');
        return data;
    }
};
