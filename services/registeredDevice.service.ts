import { API_BASE_URL, getHeaders } from './api.config';

export interface RegisteredDevice {
    id: number;
    device_fingerprint: string;
    device_token: string;
    device_name: string;
    is_authorized: boolean;
    last_used_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface ApiResponse<T> {
    statusCode: number;
    message: string;
    data: T;
}

export const registeredDeviceService = {
    getMyDevices: async (): Promise<ApiResponse<RegisteredDevice[]>> => {
        const response = await fetch(`${API_BASE_URL}/maintenance/devices`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch your devices');
        return response.json();
    },

    getAllDevices: async (): Promise<ApiResponse<RegisteredDevice[]>> => {
        const response = await fetch(`${API_BASE_URL}/maintenance/devices/admin`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch all devices');
        return response.json();
    },

    register: async (device_fingerprint: string, device_name: string): Promise<ApiResponse<RegisteredDevice>> => {
        const response = await fetch(`${API_BASE_URL}/maintenance/devices`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ device_fingerprint, device_name })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to register device');
        return data;
    },

    authorize: async (id: number): Promise<ApiResponse<RegisteredDevice>> => {
        const response = await fetch(`${API_BASE_URL}/maintenance/devices/authorize/${id}`, {
            method: 'PUT',
            headers: getHeaders()
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to authorize device');
        return data;
    },

    revoke: async (id: number): Promise<ApiResponse<RegisteredDevice>> => {
        const response = await fetch(`${API_BASE_URL}/maintenance/devices/revoke/${id}`, {
            method: 'PUT',
            headers: getHeaders()
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to revoke device');
        return data;
    },

    delete: async (id: number): Promise<ApiResponse<void>> => {
        const response = await fetch(`${API_BASE_URL}/maintenance/devices/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to delete device');
        return response.json();
    }
};
