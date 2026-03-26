import { API_BASE_URL, getHeaders } from './api.config';

export interface MaintenanceStatus {
    is_active: boolean;
    start_time: string | null;
    end_time: string | null;
    message: string;
    server_time: string;
}

export interface ApiResponse<T> {
    statusCode: number;
    message: string;
    data: T;
}

export const maintenanceModeService = {
    getStatus: async (): Promise<ApiResponse<MaintenanceStatus>> => {
        const response = await fetch(`${API_BASE_URL}/maintenance/mode/status`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch maintenance status');
        return response.json();
    },

    updateSettings: async (payload: Partial<MaintenanceStatus>): Promise<ApiResponse<any>> => {
        const response = await fetch(`${API_BASE_URL}/maintenance/mode/update`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to update settings');
        return data;
    }
};
