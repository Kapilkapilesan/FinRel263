import { API_BASE_URL, getHeaders } from './api.config';

export interface InvestmentWithAgreement {
    id: number;
    transaction_id: string;
    customer_id: number;
    product_id: number;
    amount: number;
    interest: number;
    status: string;
    start_date: string;
    maturity_date: string;
    policy_term: number;
    time_stamp: string;
    print_count: number;
    is_reprint_authorized: boolean;
    reprint_requested: boolean;
    reprint_reason: string | null;
    receipt_number: string | null;
    branch_id: number;
    created_by_id: number;
    approved_by_id: number | null;
    activated_by_id: number | null;
    approved_at: string | null;
    activated_at: string | null;
    closed_at: string | null;
    remarks: string | null;
    snapshot_product_code?: string;
    snapshot_product_name?: string;
    snapshot_payout_type?: 'MONTHLY' | 'MATURITY';
    snapshot_policy_term?: number;
    snapshot_interest_rate_monthly?: number;
    snapshot_interest_rate_maturity?: number;
    snapshot_early_break_rate_monthly?: number;
    snapshot_early_break_rate_maturity?: number;
    snapshot_negotiation_rate?: number;
    customer: {
        id: number;
        full_name: string;
        customer_code: string;
        nic?: string;
        contact_no?: string;
        address_line_1?: string;
        address_line_2?: string;
        address_line_3?: string;
        city?: string;
    };
    witnesses: {
        staff_id?: string;
        name: string;
        nic: string;
        address: string;
    }[];
    nominees: any[];
    product: {
        id: number;
        name: string;
        product_code: string;
    };
    branch?: {
        id: number;
        branch_name: string;
    };
    created_by?: {
        id: number;
        name: string;
    };
}


export interface InvestmentAgreementsResponse {
    status: string;
    data: InvestmentWithAgreement[];
    meta: {
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
    };
}

export const investmentAgreementService = {
    /**
     * Get all active/activated investments ready for agreement printing
     */
    getInvestments: async (params: {
        search?: string;
        print_status?: 'all' | 'printed' | 'not_printed' | 'pending_reprint';
        page?: number;
        per_page?: number;
    }): Promise<InvestmentAgreementsResponse> => {
        const query = new URLSearchParams();
        if (params.search) query.append('search', params.search);
        if (params.print_status && params.print_status !== 'all') query.append('print_status', params.print_status);
        if (params.page) query.append('page', params.page.toString());
        if (params.per_page) query.append('per_page', params.per_page.toString());

        const response = await fetch(`${API_BASE_URL}/investment-agreements?${query.toString()}`, {
            headers: getHeaders()
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to fetch investment agreements');
        return json;
    },

    /**
     * Get a single investment with full details for agreement
     */
    getInvestment: async (id: number | string): Promise<{ status: string; data: InvestmentWithAgreement }> => {
        const response = await fetch(`${API_BASE_URL}/investment-agreements/${id}`, {
            headers: getHeaders()
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to fetch investment details');
        return json;
    },

    /**
     * Mark the investment agreement as printed
     */
    markPrinted: async (id: number | string): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/investment-agreements/${id}/mark-printed`, {
            method: 'POST',
            headers: getHeaders()
        });

        if (!response.ok) {
            const json = await response.json().catch(() => ({}));
            throw new Error(json.message || 'Failed to record print status.');
        }
    },

    /**
     * Request reprint approval from manager
     */
    requestReprint: async (id: number | string, reason: string): Promise<{ status: string; message: string }> => {
        const response = await fetch(`${API_BASE_URL}/investment-agreements/${id}/request-reprint`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ reason })
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
    }): Promise<InvestmentAgreementsResponse> => {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page.toString());
        if (params.per_page) query.append('per_page', params.per_page.toString());

        const response = await fetch(`${API_BASE_URL}/investment-agreements/reprint/pending?${query.toString()}`, {
            headers: getHeaders()
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to fetch pending reprint requests');
        return json;
    },

    /**
     * Approve reprint request (Manager only)
     */
    approveReprint: async (id: number | string): Promise<{ status: string; message: string }> => {
        const response = await fetch(`${API_BASE_URL}/investment-agreements/${id}/approve-reprint`, {
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
    rejectReprint: async (id: number | string): Promise<{ status: string; message: string }> => {
        const response = await fetch(`${API_BASE_URL}/investment-agreements/${id}/reject-reprint`, {
            method: 'POST',
            headers: getHeaders()
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to reject reprint');
        return json;
    }
};
