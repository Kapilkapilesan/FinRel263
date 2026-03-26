import { API_BASE_URL, getHeaders } from './api.config';

export interface CenterChangeRequest {
    id: number;
    customer_id: number;
    current_center_id: number;
    requested_center_id: number;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    requested_by: number;
    approved_by?: number;
    approved_at?: string;
    remarks?: string;
    created_at: string;
    customer?: {
        id: number;
        full_name: string;
        customer_code: string;
    };
    current_center?: {
        id: number;
        center_name: string;
        branch_id: number;
        branch_name: string;
    };
    requested_center?: {
        id: number;
        center_name: string;
        branch_id: number;
        branch_name: string;
    };
    requester?: {
        id: number;
        user_name: string;
        email: string;
    };
    approver?: {
        id: number;
        user_name: string;
    };
}

export const centerRequestService = {
    /**
     * Get all center change requests
     */
    getRequests: async (status?: string): Promise<CenterChangeRequest[]> => {
        try {
            const params = new URLSearchParams();
            if (status) params.append('status', status);

            const queryString = params.toString();
            const url = `${API_BASE_URL}/center-requests${queryString ? `?${queryString}` : ''}`;

            const response = await fetch(url, { headers: getHeaders() });

            if (!response.ok) {
                console.error("Fetch failed", response.status, response.statusText);
                return [];
            }

            const data = await response.json();
            return data.data?.data || [];
        } catch (error) {
            console.error("Error fetching requests in service", error);
            throw error; // Propagate error to let component handle it
        }
    },

    /**
     * Create a new center change request
     */
    createRequest: async (data: { customer_id: number, requested_center_id: number, reason: string }): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/center-requests`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to create request');
        }

        return result;
    },

    /**
     * Approve a request
     */
    approveRequest: async (id: number, remarks?: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/center-requests/${id}/approve`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ remarks })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to approve request');
        }

        return result;
    },

    /**
     * Reject a request
     */
    rejectRequest: async (id: number, remarks?: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/center-requests/${id}/reject`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ remarks })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to reject request');
        }

        return result;
    }
};
