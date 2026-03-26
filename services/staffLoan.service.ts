import { API_BASE_URL, getHeaders } from './api.config';

export interface StaffLoan {
    id: number;
    staff_id: string;
    purpose: string;
    loan_duration: number;
    witness_staff_id: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected' | 'disbursed';
    rejection_reason?: string;
    payment_reference?: string;
    disbursed_at?: string;
    created_at: string;
    staff?: {
        full_name: string;
        staff_id: string;
        nic: string;
        address: string;
        contact_no: string;
        branch?: {
            branch_name: string;
        };
        user?: {
            roles?: Array<{
                name: string;
            }>;
        };
    };
    witness?: {
        full_name: string;
        staff_id: string;
    };
}

export const staffLoanService = {
    getMyDetails: async () => {
        const response = await fetch(`${API_BASE_URL}/staff-loans/my-details`, {
            headers: getHeaders()
        });
        return response.json();
    },

    getAvailableProducts: async () => {
        const response = await fetch(`${API_BASE_URL}/staff-loans/available-products`, {
            headers: getHeaders()
        });
        return response.json();
    },

    getAll: async (params?: { status?: string; scope?: string; month?: string; year?: string; branch_id?: number }) => {
        const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
        const response = await fetch(`${API_BASE_URL}/staff-loans${query}`, {
            headers: getHeaders()
        });
        return response.json();
    },

    create: async (data: any) => {
        const response = await fetch(`${API_BASE_URL}/staff-loans`, {
            method: 'POST',
            headers: {
                ...getHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    updateStatus: async (id: number, status: 'approved' | 'rejected', reason?: string) => {
        const response = await fetch(`${API_BASE_URL}/staff-loans/${id}/status`, {
            method: 'PATCH',
            headers: {
                ...getHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status,
                rejection_reason: reason,
                note: reason
            })
        });
        return response.json();
    },

    disburse: async (id: number, paymentReference: string) => {
        const response = await fetch(`${API_BASE_URL}/staff-loans/${id}/disburse`, {
            method: 'POST',
            headers: {
                ...getHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ payment_reference: paymentReference })
        });
        return response.json();
    }
};
