import { API_BASE_URL, getHeaders } from './api.config';

// Types
export interface TemporaryPromotion {
    id: number;
    user_id: number;
    staff_id: string;
    staff_name: string;
    original_role_id: number;
    original_role_name: string;
    original_branch_id: number | null;
    original_branch_name: string | null;
    target_role_id: number;
    target_role_name: string;
    target_branch_id: number | null;
    target_branch_name: string | null;
    start_date: string;
    end_date: string;
    reason: string;
    status: 'Active' | 'Completed' | 'Cancelled';
    cancelled_by: number | null;
    cancelled_at: string | null;
    cancellation_reason: string | null;
    created_by: number;
    created_at: string;
    updated_at: string;
    user?: {
        id: number;
        user_name: string;
    };
    staff?: {
        staff_id: string;
        full_name: string;
    };
    original_role?: {
        id: number;
        name: string;
        display_name: string;
    };
    target_role?: {
        id: number;
        name: string;
        display_name: string;
    };
    original_branch?: {
        id: number;
        name: string;
    };
    target_branch?: {
        id: number;
        name: string;
    };
    creator?: {
        id: number;
        user_name: string;
    };
    canceller?: {
        id: number;
        user_name: string;
    };
}

export interface TemporaryPromotionStats {
    active: number;
    currently_active: number;
    completed: number;
    cancelled: number;
    total: number;
    expiring_soon: number;
}

export interface StaffForPromotion {
    staff_id: string;
    staff_name: string;
    user_id: number;
    branch_id: number | null;
    branch_name: string | null;
    current_role_id: number;
    current_role_name: string;
    current_role_hierarchy: number;
    has_active_temp_promotion: boolean;
}

export interface RoleOption {
    id: number;
    name: string;
    display_name: string;
    level: string;
    hierarchy: number;
}

export interface BranchOption {
    id: number;
    name: string;
    branch_code: string;
}

export interface CreateTemporaryPromotionData {
    user_id: number;
    target_role_id: number;
    target_branch_id?: number | null;
    start_date: string;
    end_date: string;
    reason: string;
}

export interface TemporaryPromotionFilters {
    status?: 'Active' | 'Completed' | 'Cancelled' | 'all';
    user_id?: number;
    staff_id?: string;
    from_date?: string;
    to_date?: string;
    search?: string;
}

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'API request failed');
    }
    return data;
};

// Temporary Promotion Service
export const temporaryPromotionService = {
    // Get all temporary promotions with optional filters
    getAll: async (filters?: TemporaryPromotionFilters): Promise<TemporaryPromotion[]> => {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, String(value));
                }
            });
        }
        const url = `${API_BASE_URL}/temporary-promotions${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url, { headers: getHeaders() });
        const data = await handleResponse(response);
        return data.data;
    },

    // Get statistics for dashboard cards
    getStats: async (): Promise<TemporaryPromotionStats> => {
        const response = await fetch(`${API_BASE_URL}/temporary-promotions/stats`, {
            headers: getHeaders()
        });
        const data = await handleResponse(response);
        return data.data;
    },

    // Get available staff for temporary promotion
    getAvailableStaff: async (): Promise<StaffForPromotion[]> => {
        const response = await fetch(`${API_BASE_URL}/temporary-promotions/available-staff`, {
            headers: getHeaders()
        });
        const data = await handleResponse(response);
        return data.data;
    },

    // Get available roles for a staff member (all roles for temp promotion)
    getAvailableRoles: async (currentHierarchy?: number): Promise<RoleOption[]> => {
        const hierarchyParam = currentHierarchy !== undefined ? `?current_hierarchy=${currentHierarchy}&include_all=true` : '?include_all=true';
        const response = await fetch(
            `${API_BASE_URL}/temporary-promotions/available-roles${hierarchyParam}`,
            { headers: getHeaders() }
        );
        const data = await handleResponse(response);
        return data.data;
    },

    // Get all branches
    getBranches: async (): Promise<BranchOption[]> => {
        const response = await fetch(`${API_BASE_URL}/temporary-promotions/branches`, {
            headers: getHeaders()
        });
        const data = await handleResponse(response);
        return data.data;
    },

    // Create a new temporary promotion
    create: async (promotionData: CreateTemporaryPromotionData): Promise<TemporaryPromotion> => {
        const response = await fetch(`${API_BASE_URL}/temporary-promotions`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(promotionData)
        });
        const data = await handleResponse(response);
        return data.data;
    },

    // Update an existing temporary promotion
    update: async (id: number, promotionData: Partial<CreateTemporaryPromotionData>): Promise<TemporaryPromotion> => {
        const response = await fetch(`${API_BASE_URL}/temporary-promotions/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(promotionData)
        });
        const data = await handleResponse(response);
        return data.data;
    },

    // Get a single temporary promotion by ID
    getById: async (id: number): Promise<TemporaryPromotion> => {
        const response = await fetch(`${API_BASE_URL}/temporary-promotions/${id}`, {
            headers: getHeaders()
        });
        const data = await handleResponse(response);
        return data.data;
    },

    // Cancel a temporary promotion
    cancel: async (id: number, reason: string): Promise<TemporaryPromotion> => {
        const response = await fetch(`${API_BASE_URL}/temporary-promotions/${id}/cancel`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ reason })
        });
        const data = await handleResponse(response);
        return data.data;
    },

    // Complete a temporary promotion manually
    complete: async (id: number): Promise<TemporaryPromotion> => {
        const response = await fetch(`${API_BASE_URL}/temporary-promotions/${id}/complete`, {
            method: 'POST',
            headers: getHeaders()
        });
        const data = await handleResponse(response);
        return data.data;
    },

    // Process expired promotions (admin utility)
    processExpired: async (): Promise<{ processed_count: number }> => {
        const response = await fetch(`${API_BASE_URL}/temporary-promotions/process-expired`, {
            method: 'POST',
            headers: getHeaders()
        });
        const data = await handleResponse(response);
        return data.data;
    },

    // Get effective permissions for the current user
    getEffectivePermissions: async (): Promise<{
        permissions: string[];
        has_temporary_promotion: boolean;
        temporary_promotion: {
            id: number;
            target_role_name: string;
            target_branch_name: string | null;
            start_date: string;
            end_date: string;
            remaining_days: number;
        } | null;
    }> => {
        const response = await fetch(
            `${API_BASE_URL}/temporary-promotions/me/effective-permissions`,
            { headers: getHeaders() }
        );
        const data = await handleResponse(response);
        return data.data;
    },

    // Get effective branches for the current user
    getEffectiveBranches: async (): Promise<Array<{
        id: number;
        name: string;
        type: 'original' | 'temporary';
    }>> => {
        const response = await fetch(
            `${API_BASE_URL}/temporary-promotions/me/effective-branches`,
            { headers: getHeaders() }
        );
        const data = await handleResponse(response);
        return data.data;
    }
};

export default temporaryPromotionService;
