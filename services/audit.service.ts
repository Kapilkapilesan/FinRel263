import { API_BASE_URL, getHeaders } from "./api.config";

export interface AuditLog {
    id: number;
    user_type: string;
    user_id: string;
    event: string;
    auditable_type: string;
    auditable_id: number;
    old_values: Record<string, any>;
    new_values: Record<string, any>;
    url: string;
    ip_address: string;
    user_agent: string;
    tags: string | null;
    created_at: string;
    updated_at: string;
    user?: {
        id: number;
        name: string;
        user_name: string;
        branch?: {
            name: string;
            branch_name?: string;
        }
    };
    module_name: string;
}

export interface AuditSummary {
    date: string;
    total: number;
    created_count: number;
    updated_count: number;
    deleted_count: number;
}

export const auditService = {
    getLogs: async (params: {
        date?: string;
        month?: string;
        search?: string;
        action?: string;
        page?: number;
        per_page?: number;
    }) => {
        const query = new URLSearchParams();
        if (params.date) query.append("date", params.date);
        if (params.month) query.append("month", params.month);
        if (params.search) query.append("search", params.search);
        if (params.action) query.append("action", params.action);
        if (params.page) query.append("page", params.page.toString());
        if (params.per_page) query.append("per_page", params.per_page.toString());

        const response = await fetch(
            `${API_BASE_URL}/maintenance/audit-logs?${query.toString()}`,
            {
                headers: getHeaders(),
            }
        );
        const data = await response.json();
        if (data.statusCode !== 2000) {
            throw new Error(data.message || "Failed to fetch audit logs");
        }
        return data.data;
    },

    getSummary: async (month?: string) => {
        const query = new URLSearchParams();
        if (month) query.append("month", month);

        const response = await fetch(
            `${API_BASE_URL}/maintenance/audit-logs/summary?${query.toString()}`,
            {
                headers: getHeaders(),
            }
        );
        const data = await response.json();
        if (data.statusCode !== 2000) {
            throw new Error(data.message || "Failed to fetch audit summary");
        }
        return data.data;
    },
};
