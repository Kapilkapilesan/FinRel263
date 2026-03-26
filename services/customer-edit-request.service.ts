import { API_BASE_URL, getHeaders } from './api.config';

export const customerEditRequestService = {
    getPendingRequests: async () => {
        const response = await fetch(`${API_BASE_URL}/customer-edit-requests`, {
            headers: getHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch pending requests');
        }

        return data;
    },

    approveRequest: async (id: number) => {
        const response = await fetch(`${API_BASE_URL}/customer-edit-requests/${id}/approve`, {
            method: 'POST',
            headers: getHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to approve request');
        }

        return data;
    },

    rejectRequest: async (id: number, reason: string) => {
        const response = await fetch(`${API_BASE_URL}/customer-edit-requests/${id}/reject`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ reason })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to reject request');
        }

        return data;
    }
};
