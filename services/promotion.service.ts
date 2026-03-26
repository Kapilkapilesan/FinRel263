import { API_BASE_URL, getHeaders } from './api.config';

// Types
export interface Role {
    id: number;
    name: string;
    display_name: string;
    level: string;
    hierarchy: number;
}

export interface PromotionRequest {
    id: number;
    user_id: number;
    staff_id: string;
    staff_name: string;
    current_role_id: number;
    current_role_name: string;
    requested_role_id: number;
    requested_role_name: string;
    reason: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    admin_feedback: string | null;
    approved_by: number | null;
    approved_at: string | null;
    requested_at: string;
    created_at: string;
    updated_at: string;
    user?: {
        id: number;
        user_name: string;
    };
    approver?: {
        id: number;
        user_name: string;
    };
    current_role?: Role;
    requested_role?: Role;
}

export interface SalaryIncrementRequest {
    id: number;
    user_id: number;
    staff_id: string;
    staff_name: string;
    role_display: string | null;
    current_salary: number;
    requested_amount: number;
    new_salary: number;
    reason: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    admin_feedback: string | null;
    approved_by: number | null;
    approved_at: string | null;
    requested_at: string;
    created_at: string;
    updated_at: string;
    user?: {
        id: number;
        user_name: string;
    };
    approver?: {
        id: number;
        user_name: string;
    };
}

export interface CreatePromotionRequestData {
    requested_role_id: number;
    reason: string;
}

export interface CreateSalaryIncrementData {
    requested_amount: number;
    reason: string;
}

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'API request failed');
    }
    return data;
};

// Promotion Service
export const promotionService = {
    // Get all promotion requests (staff sees own, admin sees pending)
    getRequests: async (pendingOnly: boolean = false): Promise<PromotionRequest[]> => {
        const url = pendingOnly
            ? `${API_BASE_URL}/promotions?pending_only=true`
            : `${API_BASE_URL}/promotions`;
        const response = await fetch(url, { headers: getHeaders() });
        const data = await handleResponse(response);
        return data.data;
    },

    // Get available roles for promotion request
    getAvailableRoles: async (): Promise<{ roles: Role[]; current_role: Role | null }> => {
        const response = await fetch(`${API_BASE_URL}/promotions/available-roles`, {
            headers: getHeaders()
        });
        const data = await handleResponse(response);
        return {
            roles: data.data,
            current_role: data.current_role
        };
    },

    // Create a new promotion request
    createRequest: async (requestData: CreatePromotionRequestData): Promise<PromotionRequest> => {
        const response = await fetch(`${API_BASE_URL}/promotions`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(requestData)
        });
        const data = await handleResponse(response);
        return data.data;
    },

    // Get my promotion request history
    getMyHistory: async (): Promise<PromotionRequest[]> => {
        const response = await fetch(`${API_BASE_URL}/promotions/my-history`, {
            headers: getHeaders()
        });
        const data = await handleResponse(response);
        return data.data;
    },

    // Approve a promotion request (admin only)
    approve: async (id: number, feedback?: string): Promise<PromotionRequest> => {
        const response = await fetch(`${API_BASE_URL}/promotions/${id}/approve`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ feedback })
        });
        const data = await handleResponse(response);
        return data.data;
    },

    // Reject a promotion request (admin only)
    reject: async (id: number, reason: string): Promise<PromotionRequest> => {
        const response = await fetch(`${API_BASE_URL}/promotions/${id}/reject`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ reason })
        });
        const data = await handleResponse(response);
        return data.data;
    }
};

// Salary Increment Service
export const salaryIncrementService = {
    // Get all salary increment requests (staff sees own, admin sees pending)
    getRequests: async (pendingOnly: boolean = false): Promise<SalaryIncrementRequest[]> => {
        const url = pendingOnly
            ? `${API_BASE_URL}/salary-increments?pending_only=true`
            : `${API_BASE_URL}/salary-increments`;
        const response = await fetch(url, { headers: getHeaders() });
        const data = await handleResponse(response);
        return data.data;
    },

    // Get current salary info
    getCurrentSalary: async (): Promise<{
        current_salary: number;
        staff_name: string;
        staff_id: string;
        joining_date: string | null;
        role_name: string | null;
        role_display: string | null;
        department: string | null;
    }> => {
        const response = await fetch(`${API_BASE_URL}/salary-increments/current-salary`, {
            headers: getHeaders()
        });
        const data = await handleResponse(response);
        return data.data;
    },

    // Create a new salary increment request
    createRequest: async (requestData: CreateSalaryIncrementData): Promise<SalaryIncrementRequest> => {
        const response = await fetch(`${API_BASE_URL}/salary-increments`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(requestData)
        });
        const data = await handleResponse(response);
        return data.data;
    },

    // Get my salary increment request history
    getMyHistory: async (): Promise<SalaryIncrementRequest[]> => {
        const response = await fetch(`${API_BASE_URL}/salary-increments/my-history`, {
            headers: getHeaders()
        });
        const data = await handleResponse(response);
        return data.data;
    },

    // Approve a salary increment request (admin only)
    approve: async (id: number, feedback?: string): Promise<SalaryIncrementRequest> => {
        const response = await fetch(`${API_BASE_URL}/salary-increments/${id}/approve`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ feedback })
        });
        const data = await handleResponse(response);
        return data.data;
    },

    // Reject a salary increment request (admin only)
    reject: async (id: number, reason: string): Promise<SalaryIncrementRequest> => {
        const response = await fetch(`${API_BASE_URL}/salary-increments/${id}/reject`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ reason })
        });
        const data = await handleResponse(response);
        return data.data;
    }
};

export default { promotionService, salaryIncrementService };