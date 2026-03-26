import { API_BASE_URL, getHeaders } from './api.config';

export interface AuthLog {
    id: number;
    user_id: number | string;
    date: string;
    login_at: string;
    logout_at: string | null;
    logout_type: string | null;
    status: string;
    login_ip: string | null;
    user_agent: string | null;
    user?: {
        id: number;
        name: string;
        user_name: string;
        staff?: {
            staff_id: string;
            branch?: {
                branch_name: string;
            }
        };
        roles?: {
            display_name: string;
        }[];
    };
}

export interface AuthLogResponse {
    success: boolean;
    data: AuthLog[];
    meta: {
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
    };
}

export const authLogService = {
    getLoginLogs: async (params: { search?: string; date?: string; page?: number; limit?: number }): Promise<AuthLogResponse> => {
        const queryParams = new URLSearchParams();
        if (params.search) queryParams.append('search', params.search);
        if (params.date) queryParams.append('date', params.date);
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());

        const response = await fetch(`${API_BASE_URL}/maintenance/auth-logs/login?${queryParams.toString()}`, {
            headers: getHeaders(),
        });

        const json = await response.json();
        if (!json.success) throw new Error(json.message || 'Failed to fetch login logs');
        return json;
    },

    getLogoutLogs: async (params: { search?: string; date?: string; page?: number; limit?: number }): Promise<AuthLogResponse> => {
        const queryParams = new URLSearchParams();
        if (params.search) queryParams.append('search', params.search);
        if (params.date) queryParams.append('date', params.date);
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());

        const response = await fetch(`${API_BASE_URL}/maintenance/auth-logs/logout?${queryParams.toString()}`, {
            headers: getHeaders(),
        });

        const json = await response.json();
        if (!json.success) throw new Error(json.message || 'Failed to fetch logout logs');
        return json;
    },
};
