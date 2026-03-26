import { API_BASE_URL, getHeaders } from './api.config';

export interface LoanAgreement {
    id: number;
    loan_id: number;
    is_printed: boolean;
    printed_at: string | null;
    printed_by: number | null;
    print_count: number;
    reprint_requested: boolean;
    reprint_requested_at: string | null;
    reprint_requested_by: number | null;
    reprint_reason: string | null;
    reprint_approved: boolean;
    reprint_approved_at: string | null;
    reprint_approved_by: number | null;
    is_locked: boolean;
    locked_at: string | null;
    acknowledgement_printed: boolean;
    agreement_printed: boolean;
    acknowledgement_reprint_requested: boolean;
    agreement_reprint_requested: boolean;
    created_at: string;
    updated_at: string;
    printed_by_user?: {
        id: number;
        full_name: string;
    };
    reprint_requested_by_user?: {
        id: number;
        full_name: string;
    };
    reprint_approved_by_user?: {
        id: number;
        full_name: string;
    };
}

export interface LoanWithAgreement {
    id: number;
    loan_id: string;
    contract_number: string;
    agreement_date: string;
    approved_amount: number;
    request_amount: number;
    terms: number;
    rentel: number;
    status: string;
    customer: {
        id: number;
        customer_id: string;
        full_name: string;
        customer_code: string;
        address_line_1?: string;
        address_line_2?: string;
        city?: string;
    };
    center: {
        id: number;
        csu_id: string;
        name: string;
        branch?: {
            id: number;
            name: string;
            branch_code: string;
        };
    };
    staff: {
        id: number;
        full_name: string;
    };
    product: {
        id: number;
        name: string;
        product_code: string;
        document_fees?: number;
    };
    agreement: LoanAgreement | null;
    guardian_name?: string;
    guardian_nic?: string;
    guardian_address?: string;
    interest_rate?: number;
    interest_rate_annum?: number;
    service_charge?: number;
    document_charge?: number;
    g1_details?: any;
    g2_details?: any;
    w1_details?: any;
    w2_details?: any;
}

export interface LoanAgreementsResponse {
    status: string;
    data: LoanWithAgreement[];
    meta: {
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
    };
}

export interface ReprintRequestsResponse {
    status: string;
    data: (LoanAgreement & { loan: LoanWithAgreement })[];
    meta: {
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
    };
}

export const loanAgreementService = {
    /**
     * Get all approved loans ready for agreement printing
     */
    getLoans: async (params: {
        search?: string;
        print_status?: 'all' | 'printed' | 'not_printed' | 'pending_reprint';
        page?: number;
        per_page?: number;
    }): Promise<LoanAgreementsResponse> => {
        const query = new URLSearchParams();
        if (params.search) query.append('search', params.search);
        if (params.print_status && params.print_status !== 'all') query.append('print_status', params.print_status);
        if (params.page) query.append('page', params.page.toString());
        if (params.per_page) query.append('per_page', params.per_page.toString());

        const response = await fetch(`${API_BASE_URL}/loan-agreements?${query.toString()}`, {
            headers: getHeaders()
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to fetch loan agreements');
        return json;
    },

    /**
     * Get a single loan with full details for agreement
     */
    getLoan: async (id: number | string): Promise<{ status: string; data: LoanWithAgreement }> => {
        const response = await fetch(`${API_BASE_URL}/loan-agreements/${id}`, {
            headers: getHeaders()
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to fetch loan details');
        return json;
    },

    /**
     * Mark the loan agreement as printed
     */
    markPrinted: async (id: number | string, section?: string): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/loan-agreements/${id}/mark-printed`, {
            method: 'POST',
            headers: getHeaders(),
            body: section ? JSON.stringify({ section }) : undefined
        });

        if (!response.ok) {
            const json = await response.json().catch(() => ({}));
            throw new Error(json.message || 'Failed to record print status. It may be locked or require approval.');
        }
    },

    /**
     * Request reprint approval from manager
     */
    requestReprint: async (id: number | string, reason: string, section?: string): Promise<{ status: string; message: string; data: LoanAgreement }> => {
        const response = await fetch(`${API_BASE_URL}/loan-agreements/${id}/request-reprint`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ reason, section })
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to request reprint');
        return json;
    },

    /**
     * Get pending reprint requests (Manager only)
     */
    getPendingReprints: async (params: {
        page?: number;
        per_page?: number;
    }): Promise<ReprintRequestsResponse> => {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page.toString());
        if (params.per_page) query.append('per_page', params.per_page.toString());

        const response = await fetch(`${API_BASE_URL}/loan-agreements/reprint/pending?${query.toString()}`, {
            headers: getHeaders()
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to fetch pending reprint requests');
        return json;
    },

    /**
     * Approve reprint request (Manager only)
     */
    approveReprint: async (id: number | string): Promise<{ status: string; message: string; data: LoanAgreement }> => {
        const response = await fetch(`${API_BASE_URL}/loan-agreements/${id}/approve-reprint`, {
            method: 'POST',
            headers: getHeaders()
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to approve reprint');
        return json;
    },

    /**
     * Reject reprint request (Manager only)
     */
    rejectReprint: async (id: number | string): Promise<{ status: string; message: string; data: LoanAgreement }> => {
        const response = await fetch(`${API_BASE_URL}/loan-agreements/${id}/reject-reprint`, {
            method: 'POST',
            headers: getHeaders()
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to reject reprint');
        return json;
    }
};
