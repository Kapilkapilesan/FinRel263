import { API_BASE_URL, getHeaders } from './api.config';

export interface StaffIouRequest {
    id: number;
    request_id: string;
    branch_id: number;
    user_id: number;
    amount: number;
    reason: string;
    request_type?: string;
    category_id?: number | null;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Paid';
    approved_by?: number;
    approved_at?: string;
    rejected_by?: number;
    rejected_at?: string;
    rejection_reason?: string;
    paid_by?: number;
    paid_at?: string;
    created_at: string;
    user?: {
        id: number;
        name: string;
        user_name: string;
    };
    branch?: {
        id: number;
        branch_name: string;
    };
    category?: {
        id: number;
        name: string;
        fixed_amount: number;
    };
}

export interface StaffExpenseCategory {
    id: number;
    name: string;
    fixed_amount: number;
    is_active: boolean;
}

export interface StaffIouStats {
    my_requests: {
        total: number;
        pending: number;
        disbursed: number;
    };
    branch_approvals?: {
        pending: number;
        disbursed: number;
    };
    branch_payouts?: {
        pending: number;
        disbursed: number;
    };
}

const handleResponse = async (response: Response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'API request failed');
    }
    return data;
};

export const staffIouService = {
    getMyRequests: async (status?: string): Promise<StaffIouRequest[]> => {
        const params = status ? `?status=${status}` : '';
        const response = await fetch(`${API_BASE_URL}/staff-iou/my-requests${params}`, { headers: getHeaders() });
        const data = await handleResponse(response);
        return data.data;
    },

    getCategories: async (): Promise<StaffExpenseCategory[]> => {
        const response = await fetch(`${API_BASE_URL}/staff-iou/categories`, { headers: getHeaders() });
        const data = await handleResponse(response);
        return data.data;
    },

    submitRequest: async (requestData: { amount: number; reason: string; request_type?: string; category_id?: number | null }): Promise<StaffIouRequest> => {
        const response = await fetch(`${API_BASE_URL}/staff-iou`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(requestData)
        });
        const data = await handleResponse(response);
        return data.data;
    },

    getPendingApprovals: async (date?: string, period: string = 'day'): Promise<StaffIouRequest[]> => {
        let params = '';
        if (date) params = `?date=${date}&period=${period}`;
        const response = await fetch(`${API_BASE_URL}/staff-iou/pending-approvals${params}`, { headers: getHeaders() });
        const data = await handleResponse(response);
        return data.data;
    },

    getPendingPayouts: async (onlyPending: boolean = true, disbursedOnly: boolean = false, date?: string, period: string = 'day'): Promise<StaffIouRequest[]> => {
        const queryParams = new URLSearchParams();
        if (onlyPending) queryParams.append('only_pending', '1');
        else if (disbursedOnly) queryParams.append('disbursed_only', '1');
        if (date) queryParams.append('date', date);
        queryParams.append('period', period);

        const response = await fetch(`${API_BASE_URL}/staff-iou/pending-payouts?${queryParams.toString()}`, { headers: getHeaders() });
        const data = await handleResponse(response);
        return data.data;
    },


    approveRequest: async (id: number, note?: string): Promise<StaffIouRequest> => {
        const response = await fetch(`${API_BASE_URL}/staff-iou/${id}/approve`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ note })
        });
        const data = await handleResponse(response);
        return data.data;
    },

    rejectRequest: async (id: number, reason: string): Promise<StaffIouRequest> => {
        const response = await fetch(`${API_BASE_URL}/staff-iou/${id}/reject`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ reason })
        });
        const data = await handleResponse(response);
        return data.data;
    },

    disburseRequest: async (id: number, otp: string): Promise<StaffIouRequest> => {
        const response = await fetch(`${API_BASE_URL}/staff-iou/${id}/disburse`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ otp })
        });
        const data = await handleResponse(response);
        return data.data;
    },

    resendOtp: async (id: number): Promise<StaffIouRequest> => {
        const response = await fetch(`${API_BASE_URL}/staff-iou/${id}/resend-otp`, {
            method: 'POST',
            headers: getHeaders(),
        });
        const data = await handleResponse(response);
        return data.data;
    },

    getStats: async (): Promise<StaffIouStats> => {
        const response = await fetch(`${API_BASE_URL}/staff-iou/stats`, { headers: getHeaders() });
        const data = await handleResponse(response);
        return data.data;
    }
};

export default staffIouService;
