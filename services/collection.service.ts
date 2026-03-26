import { API_BASE_URL, getHeaders } from './api.config';
import {
    ScheduledPayment,
    CollectionStats,
    PaymentCollectionRequest,
    PaymentHistoryItem
} from './collection.types';

export const collectionService = {
    /**
     * Get due payments for a branch and date
     */
    getDuePayments: async (branchId: string, csuId?: string, date?: string, mode?: string) => {
        const url = new URL(`${API_BASE_URL}/collections/due`);
        url.searchParams.append('branch_id', branchId);

        if (csuId) {
            url.searchParams.append('CSU_id', csuId);
        }

        if (date) {
            url.searchParams.append('date', date);
        }

        if (mode) {
            url.searchParams.append('mode', mode);
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: getHeaders()
        });

        const result: {
            success: boolean;
            data: {
                payments: ScheduledPayment[];
                stats: CollectionStats;
            };
            message?: string;
        } = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch due payments');
        }

        return result.data;
    },

    /**
     * Get due payments for a specific customer
     */
    getCustomerDues: async (customerId: string, date?: string) => {
        const url = new URL(`${API_BASE_URL}/collections/customer/${customerId}/due`);
        if (date) {
            url.searchParams.append('date', date);
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: getHeaders()
        });

        const result: {
            success: boolean;
            data: {
                payments: ScheduledPayment[];
                stats: CollectionStats;
            };
            message?: string;
        } = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch customer dues');
        }

        return result.data;
    },

    /**
     * Get due payments for a specific customer in ANOTHER branch
     */
    getOtherBranchCustomerDues: async (customerId: string, date?: string) => {
        const url = new URL(`${API_BASE_URL}/collections/other-branch/customer/${customerId}/due`);
        if (date) {
            url.searchParams.append('date', date);
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: getHeaders()
        });

        const result: {
            success: boolean;
            data: {
                payments: ScheduledPayment[];
                stats: CollectionStats;
            };
            message?: string;
        } = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch customer dues');
        }

        return result.data;
    },

    /**
     * Collect payment for a loan
     */
    collectPayment: async (paymentData: PaymentCollectionRequest) => {
        const response = await fetch(`${API_BASE_URL}/collections/collect`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(paymentData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to collect payment');
        }

        return result.data;
    },

    /**
     * Get payment history for a loan
     */
    getPaymentHistory: async (loanId: string): Promise<PaymentHistoryItem[]> => {
        const response = await fetch(`${API_BASE_URL}/collections/history/${loanId}`, {
            method: 'GET',
            headers: getHeaders()
        });

        const result: {
            success: boolean;
            data: PaymentHistoryItem[];
            message?: string;
        } = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch payment history');
        }

        return result.data;
    },

    /**
     * Request cancellation of a receipt
     */
    requestReceiptCancellation: async (id: number, reason: string) => {
        const response = await fetch(`${API_BASE_URL}/receipts/${id}/cancel-request`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ reason })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to request cancellation');
        }

        return result.data;
    },

    /**
     * Approve cancellation of a receipt
     */
    approveReceiptCancellation: async (id: number) => {
        const response = await fetch(`${API_BASE_URL}/receipts/${id}/approve-cancel`, {
            method: 'POST',
            headers: getHeaders()
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to approve cancellation');
        }

        return result.data;
    },

    /**
     * Reject cancellation of a receipt
     */
    rejectReceiptCancellation: async (id: number) => {
        const response = await fetch(`${API_BASE_URL}/receipts/${id}/reject-cancel`, {
            method: 'POST',
            headers: getHeaders()
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to reject cancellation');
        }

        return result.data;
    },

    /**
     * Get all pending cancellation requests
     */
    getPendingCancellations: async (): Promise<any[]> => {
        const response = await fetch(`${API_BASE_URL}/receipts/pending-cancellations`, {
            method: 'GET',
            headers: getHeaders()
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch pending cancellations');
        }

        return result.data;
    },

    /**
     * Export Collection Summary to CSV
     */
    exportCollections: async (branchId: string, csuId?: string, date?: string): Promise<void> => {
        const url = new URL(`${API_BASE_URL}/collections/export`);
        url.searchParams.append('branch_id', branchId);

        if (csuId) {
            url.searchParams.append('CSU_id', csuId);
        }

        if (date) {
            url.searchParams.append('date', date);
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: getHeaders()
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || 'Failed to export collections');
        }

        const blob = await response.blob();
        const exportUrl = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = exportUrl;
        a.download = `collection_summary_${date || new Date().toISOString().split('T')[0]}.csv`;

        document.body.appendChild(a);
        a.click();

        window.URL.revokeObjectURL(exportUrl);
        document.body.removeChild(a);
    }
};
