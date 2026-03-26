import { API_BASE_URL, getHeaders } from './api.config';

// Types
export interface TempCashierRequestData {
    id: number;
    request_id: string;
    requested_by: number;
    requested_by_name: string;
    cashier_user_id: number;
    cashier_name: string;
    cashier_staff_id: string | null;
    cashier?: { id: number; name: string; user_name: string; staff_id?: string; full_name?: string };
    from_branch_id: number;
    from_branch_name: string;
    to_branch_id: number;
    to_branch_name: string;
    start_date: string;
    end_date: string;
    start_time: string;
    end_time: string;
    notes: string | null;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Expired';
    approved_by: number | null;
    approved_at: string | null;
    rejection_reason: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateTempCashierRequest {
    cashier_user_id: number;
    from_branch_id: number;
    to_branch_id?: number;
    start_date: string;
    end_date: string;
    start_time: string;
    end_time: string;
    notes?: string;
}

export interface TempCashierStats {
    my_requests: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
    };
    incoming_requests: {
        pending: number;
        approved: number;
        rejected: number;
    };
}

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'API request failed');
    }
    return data;
};

// Temp Cashier Service
export const tempCashierService = {
    // Get my requests (Request Cashier tab)
    getMyRequests: async (search?: string, status?: string): Promise<TempCashierRequestData[]> => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (status && status !== 'all') params.append('status', status);

        const url = `${API_BASE_URL}/temp-cashier/my-requests${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url, { headers: getHeaders() });
        const data = await handleResponse(response);
        return data.data;
    },

    // Get incoming requests (Accept Cashier tab)
    getIncomingRequests: async (search?: string, status?: string): Promise<TempCashierRequestData[]> => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (status && status !== 'all') params.append('status', status);

        const url = `${API_BASE_URL}/temp-cashier/incoming${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url, { headers: getHeaders() });
        const data = await handleResponse(response);
        return data.data;
    },

    // Create a new temp cashier request
    create: async (requestData: CreateTempCashierRequest): Promise<TempCashierRequestData> => {
        const response = await fetch(`${API_BASE_URL}/temp-cashier`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(requestData),
        });
        const data = await handleResponse(response);
        return data.data;
    },

    // Get request details
    getById: async (id: number): Promise<TempCashierRequestData> => {
        const response = await fetch(`${API_BASE_URL}/temp-cashier/${id}`, {
            headers: getHeaders(),
        });
        const data = await handleResponse(response);
        return data.data;
    },

    // Approve a request
    approve: async (id: number, note?: string): Promise<TempCashierRequestData> => {
        const response = await fetch(`${API_BASE_URL}/temp-cashier/${id}/approve`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ note })
        });
        const data = await handleResponse(response);
        return data.data;
    },

    // Reject a request
    reject: async (id: number, reason?: string): Promise<TempCashierRequestData> => {
        const response = await fetch(`${API_BASE_URL}/temp-cashier/${id}/reject`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ reason }),
        });
        const data = await handleResponse(response);
        return data.data;
    },

    // Cancel a request
    cancel: async (id: number): Promise<TempCashierRequestData> => {
        const response = await fetch(`${API_BASE_URL}/temp-cashier/${id}/cancel`, {
            method: 'POST',
            headers: getHeaders(),
        });
        const data = await handleResponse(response);
        return data.data;
    },

    // Get stats
    getStats: async (): Promise<TempCashierStats> => {
        const response = await fetch(`${API_BASE_URL}/temp-cashier/stats`, {
            headers: getHeaders(),
        });
        const data = await handleResponse(response);
        return data.data;
    },
};

export default tempCashierService;
