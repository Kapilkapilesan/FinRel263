import { API_BASE_URL, getHeaders } from './api.config';
import {
    BranchExpense,
    ExpenseFormData,
    FinanceApiResponse,
    FinanceOverviewData
} from '../types/finance.types';

export const financeService = {
    getFundTransactions: async (
        branchId?: number,
        date?: string,
        period: string = 'month'
    ): Promise<any> => {
        let url = `${API_BASE_URL}/finance/fund-transactions`;
        const params = new URLSearchParams();

        if (branchId) params.append('branch_id', branchId.toString());
        if (date) params.append('date', date);
        params.append('period', period);

        url += `?${params.toString()}`;

        const response = await fetch(url, {
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch fund transactions');
        }

        const json: FinanceApiResponse<any> = await response.json();
        return json.data;
    },

    getBranchTransactions: async (
        branchId?: number,
        date?: string,
        period: string = 'day'
    ): Promise<{ activities: BranchExpense[]; stats: any }> => {
        let url = `${API_BASE_URL}/finance/branch-transactions`;
        const params = new URLSearchParams();

        if (branchId) params.append('branch_id', branchId.toString());
        if (date) params.append('date', date);
        params.append('period', period);

        url += `?${params.toString()}`;

        const response = await fetch(url, {
            headers: getHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to fetch branch transactions');
        }

        const json: FinanceApiResponse<{
            activities: BranchExpense[];
            stats: any;
        }> = await response.json();

        return json.data;
    },

    recordExpense: async (data: any): Promise<BranchExpense> => {
        const response = await fetch(`${API_BASE_URL}/finance/expenses`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        const json: FinanceApiResponse<BranchExpense> = await response.json();

        if (!response.ok) {
            throw new Error(json.message || 'Failed to record activity');
        }

        return json.data;
    },

    getUnsettledReceipts: async (
        branchId?: number,
        status: string = 'active',
        page: number = 1,
        limit: number = 15,
        date?: string,
        period: string = 'day',
        staffId?: string,
        centerId?: string
    ): Promise<{ data: any[], meta: any }> => {
        let url = `${API_BASE_URL}/finance/unsettled-receipts`;
        const params = new URLSearchParams();

        if (branchId) params.append('branch_id', branchId.toString());
        params.append('status', status);
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (date) params.append('date', date);
        params.append('period', period);
        if (staffId) params.append('staff_id', staffId);
        if (centerId) params.append('center_id', centerId);


        url += `?${params.toString()}`;

        const response = await fetch(url, {
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch receipts');
        }

        const json: FinanceApiResponse<any> = await response.json();

        // Handle paginated response structure
        if (json.data && json.data.data && Array.isArray(json.data.data)) {
            return {
                data: json.data.data,
                meta: {
                    current_page: json.data.current_page,
                    last_page: json.data.last_page,
                    total: json.data.total,
                    per_page: json.data.per_page
                }
            };
        }

        // Fallback for non-paginated or unexpected structure (backward compatibility)
        return {
            data: Array.isArray(json.data) ? json.data : [],
            meta: { current_page: 1, last_page: 1, total: 0 }
        };
    },

    /**
     * Get field officers from the cashier's branch.
     */
    getBranchFieldOfficers: async (): Promise<{ staff_id: string; full_name: string; nic: string }[]> => {
        const response = await fetch(`${API_BASE_URL}/finance/branch-field-officers`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch branch field officers');
        }

        const json = await response.json();
        return json.data || [];
    },

    settleReceipt: async (
        receiptId: number,
        staffId: string
    ): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/finance/settle-receipt`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                receipt_id: receiptId,
                staff_id: staffId
            })
        });

        const json: FinanceApiResponse<any> = await response.json();

        if (!response.ok) {
            throw new Error(json.message || 'Failed to settle receipt');
        }

        return json.data;
    },

    bulkSettleReceipts: async (
        settlements: { receipt_id: number; staff_id: string }[]
    ): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/finance/bulk-settle-receipts`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ settlements })
        });

        const json: FinanceApiResponse<any> = await response.json();

        if (!response.ok) {
            throw new Error(json.message || 'Failed to bulk settle receipts');
        }

        return json.data;
    },

    getApprovedLoans: async (branchId?: number, date?: string, month?: number, year?: number): Promise<any[]> => {
        let url = `${API_BASE_URL}/finance/approved-loans`;
        const params = new URLSearchParams();
        if (branchId) params.append('branch_id', branchId.toString());
        if (date) params.append('date', date);
        if (month) params.append('month', month.toString());
        if (year) params.append('year', year.toString());

        url += `?${params.toString()}`;

        const response = await fetch(url, {
            headers: getHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || `API Error ${response.status}`;
            console.error('Failed to fetch approved loans:', errorMessage);
            throw new Error(errorMessage);
        }

        const json: FinanceApiResponse<any[]> = await response.json();
        return json.data;
    },

    disburseLoan: async (loanId: number, soapRefNo?: string): Promise<any> => {
        const response = await fetch(
            `${API_BASE_URL}/loans/${loanId}/disburse`,
            {
                method: 'POST',
                headers: getHeaders(),
                body: soapRefNo ? JSON.stringify({ soap_ref_no: soapRefNo }) : undefined
            }
        );

        const json: FinanceApiResponse<any> = await response.json();

        if (!response.ok) {
            throw new Error(json.message || 'Failed to disburse loan');
        }

        return json.data;
    },

    getLoanSettlementDetails: async (loanId: number): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/loans/${loanId}/settlement-details`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch settlement details');
        }

        const json: FinanceApiResponse<any> = await response.json();
        return json.data;
    },

    executeSettlement: async (loanId: number, soapRefNo: string): Promise<any> => {
        const response = await fetch(
            `${API_BASE_URL}/loans/${loanId}/execute-settlement`,
            {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ soap_ref_no: soapRefNo })
            }
        );

        const json: FinanceApiResponse<any> = await response.json();

        if (!response.ok) {
            throw new Error(json.message || 'Failed to execute settlement');
        }

        return json.data;
    },


    getSalaryApprovals: async (branchId?: number, date?: string, month?: number, year?: number): Promise<any[]> => {
        let url = `${API_BASE_URL}/finance/salary-approvals`;
        const params = new URLSearchParams();
        if (branchId) params.append('branch_id', branchId.toString());
        if (date) params.append('date', date);
        if (month) params.append('month', month.toString());
        if (year) params.append('year', year.toString());

        url += `?${params.toString()}`;

        const response = await fetch(url, {
            headers: getHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || `API Error ${response.status}`;
            console.error('Failed to fetch salary approvals:', errorMessage);
            throw new Error(errorMessage);
        }

        const json: FinanceApiResponse<any[]> = await response.json();
        return json.data;
    },

    approveSalary: async (salaryId: number): Promise<any> => {
        const response = await fetch(
            `${API_BASE_URL}/finance/salaries/${salaryId}/approve`,
            {
                method: 'POST',
                headers: getHeaders()
            }
        );

        const json: FinanceApiResponse<any> = await response.json();

        if (!response.ok) {
            throw new Error(json.message || 'Failed to approve salary');
        }

        return json.data;
    },

    bulkApproveSalaries: async (salaryIds: number[]): Promise<any> => {
        const response = await fetch(
            `${API_BASE_URL}/finance/salaries/bulk-approve`,
            {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ ids: salaryIds })
            }
        );

        const json: FinanceApiResponse<any> = await response.json();

        if (!response.ok) {
            throw new Error(json.message || 'Failed to bulk approve salaries');
        }

        return json.data;
    },

    getPendingSalaries: async (branchId?: number, date?: string, month?: number, year?: number): Promise<any[]> => {
        let url = `${API_BASE_URL}/finance/pending-salaries`;
        const params = new URLSearchParams();
        if (branchId) params.append('branch_id', branchId.toString());
        if (date) params.append('date', date);
        if (month) params.append('month', month.toString());
        if (year) params.append('year', year.toString());

        url += `?${params.toString()}`;

        const response = await fetch(url, {
            headers: getHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || `API Error ${response.status}`;
            console.error('Failed to fetch pending salaries:', errorMessage);
            throw new Error(errorMessage);
        }

        const json: FinanceApiResponse<any[]> = await response.json();
        return json.data;
    },

    disburseSalary: async (salaryId: number, soapRefNo?: string): Promise<any> => {
        const response = await fetch(
            `${API_BASE_URL}/finance/salaries/${salaryId}/disburse`,
            {
                method: 'POST',
                headers: getHeaders(),
                body: soapRefNo ? JSON.stringify({ soap_ref_no: soapRefNo }) : undefined
            }
        );

        const json: FinanceApiResponse<any> = await response.json();

        if (!response.ok) {
            throw new Error(json.message || 'Failed to disburse salary');
        }

        return json.data;
    },

    // ✅ From niranjan branch
    getTruncationSummary: async (
        date?: string,
        period: string = 'day',
        branchId?: number,
        page: number = 1,
        perPage: number = 15,
        tab: string = 'loans',
        search?: string
    ): Promise<{ stats: any; records: any }> => {
        let url = `${API_BASE_URL}/finance/truncation-summary`;
        const params = new URLSearchParams();

        if (date) params.append('date', date);
        params.append('period', period);
        if (branchId) params.append('branch_id', branchId.toString());
        params.append('page', page.toString());
        params.append('per_page', perPage.toString());
        params.append('tab', tab);
        if (search) params.append('search', search);

        url += `?${params.toString()}`;

        const response = await fetch(url, {
            headers: getHeaders()
        });

        const json: FinanceApiResponse<any> = await response.json();

        if (!response.ok) {
            throw new Error(
                json.message || 'Failed to fetch truncation summary'
            );
        }

        return json.data;
    },

    // ✅ From yana branch
    getOverview: async (): Promise<FinanceOverviewData> => {
        const response = await fetch(`${API_BASE_URL}/finance/overview`, {
            headers: getHeaders()
        });

        const json: FinanceApiResponse<FinanceOverviewData> =
            await response.json();

        if (!response.ok) {
            throw new Error(
                json.message || 'Failed to fetch finance overview'
            );
        }

        return json.data;
    },

    getBranchRequests: async (branchId?: number, status?: string, expenseType?: string, withoutReceipt: boolean = false): Promise<BranchExpense[]> => {
        let url = `${API_BASE_URL}/finance/branch-requests`;
        const params = new URLSearchParams();
        if (branchId) params.append('branch_id', branchId.toString());
        if (status) params.append('status', status);
        if (expenseType) params.append('expense_type', expenseType);
        if (withoutReceipt) params.append('without_receipt', '1');

        if (params.toString()) url += `?${params.toString()}`;

        const response = await fetch(url, {
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch requests');
        }

        const json: FinanceApiResponse<BranchExpense[]> = await response.json();
        return json.data;
    },

    getPendingBranchRequests: async (branchId?: number): Promise<BranchExpense[]> => {
        return financeService.getBranchRequests(branchId, 'Pending');
    },

    approveBranchRequest: async (id: number, note?: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/finance/branch-requests/${id}/approve`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ note })
        });

        const json: FinanceApiResponse<any> = await response.json();

        if (!response.ok) {
            throw new Error(json.message || 'Failed to approve request');
        }

        return json.data;
    },

    rejectBranchRequest: async (id: number, reason: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/finance/branch-requests/${id}/reject`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ reason })
        });

        const json: FinanceApiResponse<any> = await response.json();

        if (!response.ok) {
            throw new Error(json.message || 'Failed to reject request');
        }

        return json.data;
    },

    resendBranchActivityOtp: async (id: number): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/finance/branch-requests/${id}/resend-otp`, {
            method: 'POST',
            headers: getHeaders()
        });

        const json: FinanceApiResponse<any> = await response.json();

        if (!response.ok) {
            throw new Error(json.message || 'Failed to resend OTP');
        }

        return json.data;
    },

    disburseBranchActivity: async (id: number, otpCode: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/finance/branch-requests/${id}/disburse`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ otp_code: otpCode })
        });

        const json: FinanceApiResponse<any> = await response.json();

        if (!response.ok) {
            throw new Error(json.message || 'Payment verification failed');
        }

        return json.data;
    },

    getOtherBranchCollections: async (filters?: {
        branch_id?: number;
        customer_branch_id?: number;
        status?: string;
        without_receipt?: boolean;
        date?: string;
        period?: string;
    }): Promise<BranchExpense[]> => {
        let url = `${API_BASE_URL}/finance/other-branch-collections`;
        const params = new URLSearchParams();
        if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
        if (filters?.customer_branch_id) params.append('customer_branch_id', filters.customer_branch_id.toString());
        if (filters?.status) params.append('status', filters.status);
        if (filters?.without_receipt) params.append('without_receipt', '1');
        if (filters?.date) params.append('date', filters.date);
        if (filters?.period) params.append('period', filters.period);


        if (params.toString()) url += `?${params.toString()}`;

        const response = await fetch(url, { headers: getHeaders() });
        const json: FinanceApiResponse<BranchExpense[]> = await response.json();

        if (!response.ok) throw new Error(json.message || 'Failed to fetch collections');
        return json.data;
    },

    recordOtherBranchCollection: async (data: any): Promise<BranchExpense> => {
        const response = await fetch(`${API_BASE_URL}/finance/other-branch-collections`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        const json: FinanceApiResponse<BranchExpense> = await response.json();

        if (!response.ok) throw new Error(json.message || 'Failed to record collection');
        return json.data;
    },

    recordInterBranchCollection: async (data: any): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/finance/inter-branch-record-collection`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        const json: FinanceApiResponse<any> = await response.json();

        if (!response.ok) throw new Error(json.message || 'Failed to record collection');
        return json.data;
    },

    approveOtherBranchCollection: async (id: number, note?: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/finance/other-branch-collections/${id}/approve`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ note })
        });

        const json: FinanceApiResponse<any> = await response.json();

        if (!response.ok) throw new Error(json.message || 'Failed to approve collection');
        return json.data;
    },

    rejectOtherBranchCollection: async (id: number, reason: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/finance/other-branch-collections/${id}/reject`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ reason })
        });

        const json: FinanceApiResponse<any> = await response.json();

        if (!response.ok) throw new Error(json.message || 'Failed to reject collection');
        return json.data;
    }
};
