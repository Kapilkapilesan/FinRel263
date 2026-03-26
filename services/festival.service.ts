import { API_BASE_URL, getHeaders } from './api.config';

export interface Festival {
    id: number;
    name: string;
    celebration_date: string;
    message_template: string;
    created_at?: string;
    updated_at?: string;
}

export const festivalService = {
    getFestivals: async (): Promise<Festival[]> => {
        const response = await fetch(`${API_BASE_URL}/system-config/festivals`, {
            method: 'GET',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch festivals');
        return response.json();
    },

    createFestival: async (data: Omit<Festival, 'id' | 'created_at' | 'updated_at'>): Promise<{ message: string, festival: Festival }> => {
        const response = await fetch(`${API_BASE_URL}/system-config/festivals`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to create festival');
        return response.json();
    },

    updateFestival: async (id: number, data: Omit<Festival, 'id' | 'created_at' | 'updated_at'>): Promise<{ message: string, festival: Festival }> => {
        const response = await fetch(`${API_BASE_URL}/system-config/festivals/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update festival');
        return response.json();
    },

    deleteFestival: async (id: number): Promise<{ message: string }> => {
        const response = await fetch(`${API_BASE_URL}/system-config/festivals/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to delete festival');
        return response.json();
    },
};
