import { API_BASE_URL, getHeaders } from './api.config';

export const investmentService = {
    getProducts: async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/investment-products`, { headers: getHeaders() });
            const data = await res.json();
            return Array.isArray(data.data) ? data.data : [];
        } catch (error) {
            console.error('Failed to fetch investment products:', error);
            return [];
        }
    },

    getInvestments: async (month?: number, year?: number, branchId?: number) => {
        try {
            const params = new URLSearchParams();
            if (month) params.append('month', month.toString());
            if (year) params.append('year', year.toString());
            if (branchId) params.append('branch_id', branchId.toString());
            const query = params.toString() ? `?${params.toString()}` : '';

            const res = await fetch(`${API_BASE_URL}/investments${query}`, { headers: getHeaders() });
            const data = await res.json();
            return Array.isArray(data.data) ? data.data : [];
        } catch (error) {
            console.error('Failed to fetch investments:', error);
            return [];
        }
    },

    getPayouts: async (month?: number, year?: number, branchId?: number) => {
        try {
            const params = new URLSearchParams();
            if (month) params.append('month', month.toString());
            if (year) params.append('year', year.toString());
            if (branchId) params.append('branch_id', branchId.toString());
            const query = params.toString() ? `?${params.toString()}` : '';

            const res = await fetch(`${API_BASE_URL}/investments/payouts${query}`, { headers: getHeaders() });
            const data = await res.json();
            return Array.isArray(data.data) ? data.data : [];
        } catch (error) {
            console.error('Failed to fetch payouts:', error);
            return [];
        }
    },

    createInvestment: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/investments`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        const responseData = await res.json();
        if (!res.ok) throw new Error(responseData.message || 'Failed to create investment');
        return responseData;
    },

    previewReturn: async (id: number, currentTerm?: number) => {
        const url = new URL(`${API_BASE_URL}/investments/${id}/preview-return`);
        if (currentTerm) url.searchParams.append('current_term', String(currentTerm));
        const res = await fetch(url.toString(), { headers: getHeaders() });
        const data = await res.json();
        return data.data;
    },

    initiatePayout: async (id: number, type: string, payoutMethod?: string, remarks?: string) => {
        const res = await fetch(`${API_BASE_URL}/investments/${id}/payout`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ payout_type: type, payout_method: payoutMethod, remarks })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to initiate payout');
        return data;
    },

    approvePayout: async (payoutId: number, note?: string) => {
        const res = await fetch(`${API_BASE_URL}/payouts/${payoutId}/approve`, {
            method: 'POST',
            headers: getHeaders(),
            body: note ? JSON.stringify({ note }) : undefined
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to approve payout');
        return data;
    },

    settlePayout: async (payoutId: number, referenceCode?: string, manualRefNo?: string, payoutMethod?: string) => {
        const res = await fetch(`${API_BASE_URL}/payouts/${payoutId}/settle`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ 
                reference_code: referenceCode, 
                manual_ref_no: manualRefNo,
                payout_method: payoutMethod 
            })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to settle payout');
        return data;
    },

    renewInvestment: async (id: number) => {
        const res = await fetch(`${API_BASE_URL}/investments/${id}/renew`, {
            method: 'POST',
            headers: getHeaders()
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to renew investment');
        return data;
    },

    approveInvestment: async (id: number, note?: string) => {
        const res = await fetch(`${API_BASE_URL}/investments/${id}/approve`, {
            method: 'POST',
            headers: getHeaders(),
            body: note ? JSON.stringify({ note }) : undefined
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to approve investment');
        return data;
    },

    rejectInvestment: async (id: number, note?: string) => {
        const res = await fetch(`${API_BASE_URL}/investments/${id}/reject`, {
            method: 'POST',
            headers: getHeaders(),
            body: note ? JSON.stringify({ note }) : undefined
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to reject investment');
        return data;
    },

    activateInvestment: async (id: number, receiptNumber: string) => {
        const res = await fetch(`${API_BASE_URL}/investments/${id}/activate`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ receipt_number: receiptNumber })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to activate investment');
        return data;
    },

    requestReprint: async (id: number, reason: string) => {
        const res = await fetch(`${API_BASE_URL}/investments/${id}/request-reprint`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ reason })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to request reprint');
        return data;
    },

    approveReprint: async (id: number) => {
        const res = await fetch(`${API_BASE_URL}/investments/${id}/approve-reprint`, {
            method: 'POST',
            headers: getHeaders()
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to approve reprint');
        return data;
    },

    issueReceipt: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/receipts`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        const responseData = await res.json();
        if (!res.ok) throw new Error(responseData.message || 'Failed to issue receipt');
        return responseData;
    },

    downloadReceipt: async (id: number) => {
        const res = await fetch(`${API_BASE_URL}/investments/${id}/download-receipt`, {
            headers: getHeaders()
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || 'Failed to download receipt');
        }
        return await res.blob();
    }
};
