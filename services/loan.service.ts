import { Loan, LoanStats } from '../types/loan.types';
import { API_BASE_URL, getHeaders } from './api.config';

export interface LoansResponse {
    status: string;
    data: Loan[];
    meta: {
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        stats: LoanStats;
    };
}

export const loanService = {
    getLoans: async (params: { search?: string; status?: string; branchId?: string | number; centerId?: string | number; page?: number; per_page?: number; startDate?: string; endDate?: string }): Promise<LoansResponse> => {
        const query = new URLSearchParams();
        if (params.search) query.append('search', params.search);
        if (params.status) query.append('status', params.status);
        if (params.branchId) query.append('branch_id', params.branchId.toString());
        if (params.centerId) query.append('center_id', params.centerId.toString());
        if (params.startDate) query.append('start_date', params.startDate);
        if (params.endDate) query.append('end_date', params.endDate);
        if (params.page) query.append('page', params.page.toString());
        if (params.per_page) query.append('per_page', params.per_page.toString());

        const response = await fetch(`${API_BASE_URL}/loans?${query.toString()}`, {
            headers: getHeaders()
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to fetch loans');
        return json;
    },

    /**
     * Fetch branch-wide approved loans ready for activation
     */
    getActivationQueue: async (params: { search?: string; page?: number; per_page?: number }): Promise<LoansResponse> => {
        const query = new URLSearchParams();
        if (params.search) query.append('search', params.search);
        if (params.page) query.append('page', params.page.toString());
        if (params.per_page) query.append('per_page', params.per_page.toString());

        const response = await fetch(`${API_BASE_URL}/loans/activation-queue?${query.toString()}`, {
            headers: getHeaders()
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to fetch activation queue');
        return json;
    },

    createLoan: async (data: any): Promise<Loan> => {
        const response = await fetch(`${API_BASE_URL}/loans`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        const json = await response.json();
        if (!response.ok) {
            let errorMessage = json.message || 'Failed to submit loan application';
            if (json.errors) {
                const details = Object.values(json.errors).flat().join(', ');
                errorMessage += `: ${details}`;
            }
            throw new Error(errorMessage);
        }
        return json.data;
    },

    getLoanById: async (id: number | string): Promise<Loan> => {
        const response = await fetch(`${API_BASE_URL}/loans/${id}`, {
            headers: getHeaders()
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to fetch loan details');
        return json.data;
    },

    approveLoan: async (id: number | string, action: 'approve' | 'send_back', reason?: string): Promise<Loan> => {
        const response = await fetch(`${API_BASE_URL}/loans/${id}/approve`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ action, reason })
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to approve loan');
        return json.data;
    },

    /**
     * Export loans to CSV
     */
    exportLoans: async (): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/loans/export`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || 'Failed to export loans');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `loans_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    },

    /**
     * Import loans from CSV
     */
    importLoans: async (file: File): Promise<any> => {
        const formData = new FormData();
        formData.append('file', file);

        let token = localStorage.getItem('token');
        // Sanitize token to prevent "The string did not match the expected pattern" (InvalidCharacterError)
        if (token) {
            token = token.trim().replace(/[\n\r]/g, '');
        }

        const headers: HeadersInit = {
            'Accept': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/loans/import`, {
            method: 'POST',
            headers: headers,
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to import loans');
        }

        return data;
    },

    uploadDocument: async (loanId: number | string, type: string, file: File): Promise<any> => {
        const formData = new FormData();
        formData.append('loan_id', loanId.toString());
        formData.append('type', type);
        formData.append('file', file);

        let token = localStorage.getItem('token');
        if (token) {
            token = token.trim().replace(/[\n\r]/g, '');
        }

        const headers: HeadersInit = {
            'Accept': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/loan-documents`, {
            method: 'POST',
            headers: headers,
            body: formData
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to upload document');
        }
        return data;
    },

    /**
     * Lookup Joint Borrower details by NIC
     * Used for auto-filling the joint borrower section in loan creation
     */
    lookupJointBorrower: async (nic: string): Promise<{
        found: boolean;
        data?: {
            guardian_nic: string;
            guardian_name: string;
            guardian_relationship: string;
            guardian_address: string;
            guardian_phone: string;
            guardian_secondary_phone: string;
        };
        source?: string;
        source_loan_id?: string;
    }> => {
        const response = await fetch(`${API_BASE_URL}/loans/lookup-joint-borrower?nic=${encodeURIComponent(nic)}`, {
            headers: getHeaders()
        });

        const json = await response.json();
        if (!response.ok) {
            // Return not found rather than throwing for user-friendly UX
            return { found: false };
        }
        return json;
    },

    /**
     * Delete a loan that has been sent back for corrections
     * Only field officers can delete sent-back loans
     */
    deleteLoan: async (id: number | string): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/loans/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        const json = await response.json();
        if (!response.ok) {
            throw new Error(json.message || 'Failed to delete loan');
        }
    },

    activateLoan: async (id: number | string): Promise<Loan> => {
        const response = await fetch(`${API_BASE_URL}/loans/${id}/activate`, {
            method: 'POST',
            headers: getHeaders()
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to activate loan');
        return json.data;
    },

    requestDisbursement: async (id: number | string): Promise<Loan> => {
        const response = await fetch(`${API_BASE_URL}/loans/${id}/disbursement-request`, {
            method: 'POST',
            headers: getHeaders()
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to request disbursement');
        return json.data;
    },

    // ==================== DRAFT MANAGEMENT ====================

    getDrafts: async (): Promise<any[]> => {
        const response = await fetch(`${API_BASE_URL}/loan-drafts`, {
            headers: getHeaders()
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to fetch drafts');
        return json.data;
    },

    saveDraft: async (data: { name?: string; form_data: any; current_step: number; draft_id?: string }): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/loan-drafts`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to save draft');
        return json.data;
    },

    deleteDraft: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/loan-drafts/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to delete draft');
    },

    // ==================== LOAN CARD PRINTING ====================

    getCardData: async (id: number | string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/loans/${id}/card-data`, {
            headers: getHeaders()
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to fetch card data');
        return json.data;
    },

    recordCardPrint: async (id: number | string, printType: string = 'full'): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/loans/${id}/card-print`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ print_type: printType })
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to record print');
        return json.data;
    },

    getCardPrints: async (id: number | string): Promise<any[]> => {
        const response = await fetch(`${API_BASE_URL}/loans/${id}/card-prints`, {
            headers: getHeaders()
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to fetch print history');
        return json.data;
    },

    // ==================== CANCELLATION WORKFLOW ====================
    requestCancellation: async (id: number | string, reason: string): Promise<Loan> => {
        const response = await fetch(`${API_BASE_URL}/loans/${id}/request-cancellation`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ reason })
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to request cancellation');
        return json.data;
    },

    approveCancellation: async (id: number | string, reason: string): Promise<Loan> => {
        const response = await fetch(`${API_BASE_URL}/loans/${id}/approve-cancellation`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ reason })
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to approve cancellation');
        return json.data;
    },

    getPendingCancellations: async (params: { search?: string; page?: number; per_page?: number }): Promise<LoansResponse> => {
        const query = new URLSearchParams();
        if (params.search) query.append('search', params.search);
        if (params.page) query.append('page', params.page.toString());
        if (params.per_page) query.append('per_page', params.per_page.toString());

        const response = await fetch(`${API_BASE_URL}/loans/cancellations/pending?${query.toString()}`, {
            headers: getHeaders()
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to fetch pending cancellations');
        return json;
    },
};
