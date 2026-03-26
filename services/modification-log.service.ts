import { API_BASE_URL, getHeaders } from "./api.config";

export interface ModificationLog {
    id: number;
    table_name: string;
    record_id: string;
    modified_by_user_id: number | null;
    action: 'created' | 'updated' | 'deleted';
    ip_address: string;
    old_values: any | null;
    new_values: any | null;
    created_at: string;
    updated_at: string;
    user?: {
        id: number;
        name: string;
        user_name: string;
        staff?: any;
        ID?: string | number; // Assuming ID is a string or number, based on the usage example
        roles?: any[];
    };
}

export interface ModificationLogResponse {
    data: ModificationLog[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export const modificationLogService = {
    getLogs: async (params: {
        date?: string;
        month?: string;
        table?: string;
        record_id?: string;
        search?: string;
        action?: string;
        page?: number;
        per_page?: number;
    }) => {
        const query = new URLSearchParams();
        if (params.date) query.append("date", params.date);
        if (params.month) query.append("month", params.month);
        if (params.table) query.append("table", params.table);
        if (params.record_id) query.append("record_id", params.record_id);
        if (params.search) query.append("search", params.search);
        if (params.action) query.append("action", params.action);
        if (params.page) query.append("page", params.page.toString());
        if (params.per_page) query.append("per_page", params.per_page.toString());

        const response = await fetch(`${API_BASE_URL}/maintenance/modification-logs?${query.toString()}`, {
            headers: getHeaders(),
        });
        const data = await response.json();
        if (data.statusCode !== 2000) {
            throw new Error(data.message || "Failed to fetch modification logs");
        }
        return data.data;
    },

    getLogDetails: async (id: number) => {
        const response = await fetch(`${API_BASE_URL}/maintenance/modification-logs/${id}`, {
            headers: getHeaders(),
        });
        const data = await response.json();
        if (data.statusCode !== 2000) {
            throw new Error(data.message || "Failed to fetch log details");
        }
        return data.data;
    },

    getTables: async () => {
        const response = await fetch(`${API_BASE_URL}/maintenance/modification-logs/tables`, {
            headers: getHeaders(),
        });
        const data = await response.json();
        if (data.statusCode !== 2000) {
            throw new Error(data.message || "Failed to fetch tables");
        }
        return data.data;
    }
};

