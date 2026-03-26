import { API_BASE_URL, getHeaders } from './api.config';

export const receiptService = {
    getReceipts: async (params?: any) => {
        try {
            const query = new URLSearchParams(params).toString();
            const res = await fetch(`${API_BASE_URL}/receipts${query ? `?${query}` : ''}`, {
                headers: getHeaders()
            });
            const data = await res.json();
            return data;
        } catch (error) {
            console.error('Failed to fetch receipts:', error);
            throw error;
        }
    },

    getPendingCancellations: async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/receipts/pending-cancellations`, {
                headers: getHeaders()
            });
            const data = await res.json();
            return data;
        } catch (error) {
            console.error('Failed to fetch pending cancellations:', error);
            throw error;
        }
    },

    requestCancellation: async (id: number, reason: string) => {
        const res = await fetch(`${API_BASE_URL}/receipts/${id}/cancel-request`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ reason })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to request cancellation');
        return data;
    },

    approveCancellation: async (id: number) => {
        const res = await fetch(`${API_BASE_URL}/receipts/${id}/approve-cancel`, {
            method: 'POST',
            headers: getHeaders()
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to approve cancellation');
        return data;
    },

    rejectCancellation: async (id: number) => {
        const res = await fetch(`${API_BASE_URL}/receipts/${id}/reject-cancel`, {
            method: 'POST',
            headers: getHeaders()
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to reject cancellation');
        return data;
    },

    issueReceipt: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/receipts`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        const responseData = await res.json();
        if (!res.ok) throw new Error(responseData.message || 'Failed to issue receipt');
        return responseData;
    },

    markPrinted: async (id: number) => {
        const res = await fetch(`${API_BASE_URL}/receipts/${id}/mark-printed`, {
            method: 'POST',
            headers: getHeaders()
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to mark as printed');
        return data;
    },

    reprintReceipt: async (id: number) => {
        const res = await fetch(`${API_BASE_URL}/receipts/${id}/reprint`, {
            method: 'POST',
            headers: getHeaders()
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to track reprint');
        return data;
    }
};
