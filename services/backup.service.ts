import { API_BASE_URL, getHeaders } from './api.config';

export interface BackupStatus {
    database: {
        lastBackup: { size: string; date: string } | null;
        activeSchedules: number;
    };
    media: {
        lastBackup: { size: string; date: string } | null;
        activeSchedules: number;
    };
}

export interface BackupSchedule {
    id: number;
    type: 'database' | 'media';
    schedule_time: string;
    days_of_week: string[];
    is_active: boolean;
    created_at: string;
    creator?: { id: number; name: string };
}

export interface BackupActivity {
    id: number;
    type: 'database' | 'media';
    filename: string;
    path: string;
    size: string;
    status: 'success' | 'failed' | 'processing';
    trigger: 'manual' | 'scheduled' | 'auto_maintenance' | 'system_crash';
    error_message?: string;
    completed_at: string;
    created_at: string;
}

export interface ApiResponse<T> {
    statusCode: number;
    message: string;
    data: T;
}

export const backupService = {
    getStatus: async (): Promise<ApiResponse<BackupStatus>> => {
        const response = await fetch(`${API_BASE_URL}/maintenance/backup/status`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch backup status');
        return response.json();
    },

    getSchedules: async (type: 'database' | 'media'): Promise<ApiResponse<BackupSchedule[]>> => {
        const response = await fetch(`${API_BASE_URL}/maintenance/backup/schedules?type=${type}`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch schedules');
        return response.json();
    },

    saveSchedule: async (payload: any): Promise<ApiResponse<BackupSchedule>> => {
        const response = await fetch(`${API_BASE_URL}/maintenance/backup/schedules`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to save schedule');
        return data;
    },

    deleteSchedule: async (id: number): Promise<ApiResponse<void>> => {
        const response = await fetch(`${API_BASE_URL}/maintenance/backup/schedules/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to delete schedule');
        return response.json();
    },

    getActivity: async (type: 'database' | 'media'): Promise<ApiResponse<BackupActivity[]>> => {
        const response = await fetch(`${API_BASE_URL}/maintenance/backup/activity?type=${type}`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch activity');
        return response.json();
    },

    runBackup: async (type: 'database' | 'media'): Promise<ApiResponse<BackupActivity>> => {
        const response = await fetch(`${API_BASE_URL}/maintenance/backup/run`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ type })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to run backup');
        return data;
    },

    downloadBackup: async (id: number, filename: string) => {
        const response = await fetch(`${API_BASE_URL}/maintenance/backup/download/${id}`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || 'Failed to download backup');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    },

    restoreBackup: async (id: number): Promise<ApiResponse<void>> => {
        const response = await fetch(`${API_BASE_URL}/maintenance/backup/restore/${id}`, {
            method: 'POST',
            headers: getHeaders()
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to restore backup');
        return data;
    },

    deleteBackup: async (id: number): Promise<ApiResponse<void>> => {
        const response = await fetch(`${API_BASE_URL}/maintenance/backup/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete backup');
        return data;
    }

};
