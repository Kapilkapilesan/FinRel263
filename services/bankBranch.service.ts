import { API_BASE_URL, getHeaders } from './api.config';

export interface BankBranchActivity {
    id: number;
    date: string;
    type: 'deposit' | 'withdrawal';
    branch_id: number;
    amount: number;
    description: string | null;
    receipt_number: string | null;
    document_path: string | null;
    status: 'pending' | 'manager_approved' | 'admin_approved' | 'waiting_document' | 'completed' | 'rejected';
    manager_approved_by: number | null;
    manager_approved_at: string | null;
    admin_approved_by: number | null;
    admin_approved_at: string | null;
    rejection_reason: string | null;
    rejected_by: number | null;
    created_by: number;
    created_at: string;
    updated_at: string;
    branch?: { id: number; branch_name: string };
    creator?: { id: number; name: string; full_name?: string; staff?: { full_name: string } };
    manager_approver?: { id: number; name: string; full_name?: string };
    admin_approver?: { id: number; name: string; full_name?: string };
    rejected_by_user?: { id: number; name: string; full_name?: string };
}

export const bankBranchService = {
    /**
     * Get all bank-branch activities (filtered).
     */
    getActivities: async (filters?: {
        type?: string;
        status?: string;
        branch_id?: number;
        month?: string;
        year?: string;
        search?: string;
    }): Promise<BankBranchActivity[]> => {
        let url = `${API_BASE_URL}/bank-branch`;
        const params = new URLSearchParams();
        if (filters?.type) params.append('type', filters.type);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
        if (filters?.month) params.append('month', filters.month);
        if (filters?.year) params.append('year', filters.year);
        if (filters?.search) params.append('search', filters.search);
        if (params.toString()) url += `?${params.toString()}`;

        const response = await fetch(url, { headers: getHeaders() });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to fetch activities');
        return json.data;
    },

    /**
     * Create a new bank-branch activity (deposit or withdrawal).
     */
    createActivity: async (data: {
        date: string;
        type: 'deposit' | 'withdrawal';
        branch_id: number;
        amount: number;
        description?: string;
        receipt_number?: string;
        document?: File;
    }): Promise<BankBranchActivity> => {
        const formData = new FormData();
        formData.append('date', data.date);
        formData.append('type', data.type);
        formData.append('branch_id', data.branch_id.toString());
        formData.append('amount', data.amount.toString());
        if (data.description) formData.append('description', data.description);
        if (data.receipt_number) formData.append('receipt_number', data.receipt_number);
        if (data.document) formData.append('document', data.document);

        // Use custom headers without Content-Type (browser sets it for FormData)
        const token = typeof window !== 'undefined' ? localStorage.getItem('token')?.trim().replace(/[\n\r]/g, '') : null;
        const activeBranchId = typeof window !== 'undefined' ? localStorage.getItem('activeBranchId') : null;

        const headers: Record<string, string> = {
            'Accept': 'application/json',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (activeBranchId) headers['X-Active-Branch-ID'] = activeBranchId;

        const response = await fetch(`${API_BASE_URL}/bank-branch`, {
            method: 'POST',
            headers,
            body: formData,
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to create activity');
        return json.data;
    },

    /**
     * Approve a bank activity (handles both manager and admin levels automatically on backend).
     */
    approveActivity: async (id: number, note?: string): Promise<BankBranchActivity> => {
        const response = await fetch(`${API_BASE_URL}/bank-branch/${id}/manager-approve`, {
            method: 'POST',
            headers: getHeaders(),
            body: note ? JSON.stringify({ note }) : undefined,
        });
        
        if (response.status === 403 || response.status === 400) {
             return bankBranchService.adminApprove(id, note);
        }

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to approve');
        return json.data;
    },

    /**
     * Manager approve a withdrawal request.
     */
    managerApprove: async (id: number, note?: string): Promise<BankBranchActivity> => {
        const response = await fetch(`${API_BASE_URL}/bank-branch/${id}/manager-approve`, {
            method: 'POST',
            headers: getHeaders(),
            body: note ? JSON.stringify({ note }) : undefined,
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to approve');
        return json.data;
    },

    /**
     * Admin approve a withdrawal request (2nd approval).
     */
    adminApprove: async (id: number, note?: string): Promise<BankBranchActivity> => {
        const response = await fetch(`${API_BASE_URL}/bank-branch/${id}/admin-approve`, {
            method: 'POST',
            headers: getHeaders(),
            body: note ? JSON.stringify({ note }) : undefined,
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to approve');
        return json.data;
    },

    /**
     * Reject a bank-branch activity.
     */
    rejectActivity: async (id: number, reason: string): Promise<BankBranchActivity> => {
        const response = await fetch(`${API_BASE_URL}/bank-branch/${id}/reject`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ reason }),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to reject');
        return json.data;
    },

    /**
     * Reject a bank-branch activity (legacy name).
     */
    reject: async (id: number, reason: string): Promise<BankBranchActivity> => {
        return bankBranchService.rejectActivity(id, reason);
    },

    /**
     * Upload document for an approved withdrawal.
     */
    uploadDocument: async (id: number, document: File, receiptNumber?: string): Promise<BankBranchActivity> => {
        const formData = new FormData();
        formData.append('document', document);
        if (receiptNumber) formData.append('receipt_number', receiptNumber);

        const token = typeof window !== 'undefined' ? localStorage.getItem('token')?.trim().replace(/[\n\r]/g, '') : null;
        const activeBranchId = typeof window !== 'undefined' ? localStorage.getItem('activeBranchId') : null;

        const headers: Record<string, string> = {
            'Accept': 'application/json',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (activeBranchId) headers['X-Active-Branch-ID'] = activeBranchId;

        const response = await fetch(`${API_BASE_URL}/bank-branch/${id}/upload-document`, {
            method: 'POST',
            headers,
            body: formData,
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to upload document');
        return json.data;
    },

    /**
     * Get completed bank-branch activities (for history/fund truncation page).
     */
    getHistory: async (filters?: {
        branch_id?: number;
        type?: string;
        date?: string;
        period?: string;
        search?: string;
    }): Promise<{ activities: BankBranchActivity[]; stats: any }> => {
        let url = `${API_BASE_URL}/bank-branch/history`;
        const params = new URLSearchParams();
        if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
        if (filters?.type) params.append('type', filters.type);
        if (filters?.date) params.append('date', filters.date);
        if (filters?.period) params.append('period', filters.period);
        if (filters?.search) params.append('search', filters.search);
        if (params.toString()) url += `?${params.toString()}`;

        const response = await fetch(url, { headers: getHeaders() });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to fetch history');
        return json.data;
    },
};
