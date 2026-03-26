import { API_BASE_URL, getHeaders } from './api.config';

export interface DocumentPrintLogEntry {
    id: number;
    user_id: number;
    staff_id: string | null;
    document_type: string;
    document_id: string | null;
    branch_id: number | null;
    action: string;
    status: string;
    ip_address: string | null;
    user_agent: string | null;
    metadata: Record<string, any> | null;
    print_count: number | null;
    created_at: string;
    updated_at: string;
    user?: {
        id: number;
        name: string;
        user_name: string;
        full_name: string;
        staff_id: string;
        staff?: {
            staff_id: string;
            branch_id: number;
            branch?: {
                id: number;
                branch_name: string;
                branch_code: string;
            };
        };
    };
    branch?: {
        id: number;
        name: string;
        branch_name: string;
    };
}

export interface PrintLogStats {
    total_prints_today: number;
    successful_prints: number;
    failed_prints: number;
}

export interface PrintLogPaginatedResponse {
    current_page: number;
    data: DocumentPrintLogEntry[];
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

export type DocumentType = 'loan_agreement' | 'investment_agreement' | 'report' | 'repayment' | 'loan_list' | 'document';

export const documentPrintLogService = {
    /**
     * Fetch paginated print logs for a document type.
     */
    getLogs: async (params: {
        document_type: DocumentType;
        search?: string;
        date_from?: string;
        date_to?: string;
        status?: string;
        branch_id?: number;
        per_page?: number;
        page?: number;
    }): Promise<PrintLogPaginatedResponse> => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== '' && value !== null) {
                searchParams.append(key, String(value));
            }
        });

        const response = await fetch(
            `${API_BASE_URL}/system-config/document-print-logs?${searchParams.toString()}`,
            { headers: getHeaders() }
        );

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch print logs');
        }
        return data.data;
    },

    /**
     * Fetch stats for a given document type.
     */
    getStats: async (document_type: DocumentType, branch_id?: number): Promise<PrintLogStats> => {
        const searchParams = new URLSearchParams({ document_type });
        if (branch_id) {
            searchParams.append('branch_id', String(branch_id));
        }

        const response = await fetch(
            `${API_BASE_URL}/system-config/document-print-logs/stats?${searchParams.toString()}`,
            { headers: getHeaders() }
        );

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch stats');
        }
        return data.data;
    },

    /**
     * Record a print/download log.
     */
    recordLog: async (params: {
        document_type: DocumentType;
        document_id?: string;
        action?: 'print' | 'download';
        status?: 'success' | 'failed';
        metadata?: Record<string, any>;
        print_count?: number;
    }): Promise<DocumentPrintLogEntry> => {
        const response = await fetch(
            `${API_BASE_URL}/system-config/document-print-logs`,
            {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(params),
            }
        );

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to record print log');
        }
        return data.data;
    },

    /**
     * Export logs for a given document type.
     */
    exportLogs: async (params: {
        document_type: DocumentType;
        date_from?: string;
        date_to?: string;
        branch_id?: number;
    }): Promise<DocumentPrintLogEntry[]> => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== '' && value !== null) {
                searchParams.append(key, String(value));
            }
        });

        const response = await fetch(
            `${API_BASE_URL}/system-config/document-print-logs/export?${searchParams.toString()}`,
            { headers: getHeaders() }
        );

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to export logs');
        }
        return data.data;
    },
};
