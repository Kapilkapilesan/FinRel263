import { API_BASE_URL, getHeaders } from './api.config';
import {
    AdminDashboardStats,
    BranchCollectionEfficiency,
    MonthlyCollectionData,
    MonthlyFinancialData,
    Branch
} from '@/types/admin-dashboard.types';

const fetchOptions = {
    credentials: 'include' as RequestCredentials,
};

export const adminDashboardService = {
    // Get Admin Dashboard Statistics
    getAdminStats: async (month?: number, year?: number): Promise<AdminDashboardStats> => {
        try {
            const params = new URLSearchParams();
            if (month) params.append('month', month.toString());
            if (year) params.append('year', year.toString());

            const response = await fetch(`${API_BASE_URL}/admin-dashboard/stats?${params.toString()}`, {
                ...fetchOptions,
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch admin dashboard stats: ${response.status}`);
            }

            const json = await response.json();
            return json.data || json;
        } catch (error) {
            console.error('Error fetching admin dashboard stats:', error);
            return {
                shareholdersTotalPersistentCapital: 0,
                investmentTotal: 0,
                totalIncome: 0,
                totalExpense: 0,
                netFlow: 0,
                totalFundTruncation: 0,
            };
        }
    },

    // Get All Branches
    getBranches: async (): Promise<Branch[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin-dashboard/branches`, {
                ...fetchOptions,
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch branches: ${response.status}`);
            }

            const json = await response.json();
            return json.data || json || [];
        } catch (error) {
            console.error('Error fetching branches:', error);
            return [];
        }
    },

    // Get Collection Efficiency for a Branch
    getCollectionEfficiency: async (branchId: number, month?: number, year?: number): Promise<BranchCollectionEfficiency | null> => {
        try {
            const params = new URLSearchParams();
            if (month) params.append('month', month.toString());
            if (year) params.append('year', year.toString());

            const response = await fetch(`${API_BASE_URL}/admin-dashboard/collection-efficiency/${branchId}?${params.toString()}`, {
                ...fetchOptions,
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch collection efficiency: ${response.status}`);
            }

            const json = await response.json();
            return json.data || json;
        } catch (error) {
            console.error('Error fetching collection efficiency:', error);
            return null;
        }
    },

    // Get Monthly Collections (all branches or specific branch)
    getMonthlyCollections: async (branchId?: number | null, year?: number): Promise<MonthlyCollectionData[]> => {
        try {
            const params = new URLSearchParams();
            if (branchId) params.append('branch_id', branchId.toString());
            if (year) params.append('year', year.toString());

            const response = await fetch(`${API_BASE_URL}/admin-dashboard/monthly-collections?${params.toString()}`, {
                ...fetchOptions,
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch monthly collections: ${response.status}`);
            }

            const json = await response.json();
            return json.data || json || [];
        } catch (error) {
            console.error('Error fetching monthly collections:', error);
            return [];
        }
    },

    // Get Financial Performance (Income vs Disbursements)
    getFinancialPerformance: async (year?: number): Promise<MonthlyFinancialData[]> => {
        try {
            const params = new URLSearchParams();
            if (year) params.append('year', year.toString());

            const response = await fetch(`${API_BASE_URL}/admin-dashboard/financial-performance?${params.toString()}`, {
                ...fetchOptions,
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch financial performance: ${response.status}`);
            }

            const json = await response.json();
            return json.data || json || [];
        } catch (error) {
            console.error('Error fetching financial performance:', error);
            return [];
        }
    },

    // Get Monthly Income (all branches or specific branch)
    getMonthlyIncome: async (branchId?: number | null, year?: number): Promise<MonthlyCollectionData[]> => {
        try {
            const params = new URLSearchParams();
            if (branchId) params.append('branch_id', branchId.toString());
            if (year) params.append('year', year.toString());

            const response = await fetch(`${API_BASE_URL}/admin-dashboard/monthly-income?${params.toString()}`, {
                ...fetchOptions,
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch monthly income: ${response.status}`);
            }

            const json = await response.json();
            return json.data || json || [];
        } catch (error) {
            console.error('Error fetching monthly income:', error);
            return [];
        }
    },

    // Get Monthly Disbursements (all branches or specific branch)
    getMonthlyDisbursements: async (branchId?: number | null, year?: number): Promise<MonthlyCollectionData[]> => {
        try {
            const params = new URLSearchParams();
            if (branchId) params.append('branch_id', branchId.toString());
            if (year) params.append('year', year.toString());

            const response = await fetch(`${API_BASE_URL}/admin-dashboard/monthly-disbursements?${params.toString()}`, {
                ...fetchOptions,
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch monthly disbursements: ${response.status}`);
            }

            const json = await response.json();
            return json.data || json || [];
        } catch (error) {
            console.error('Error fetching monthly disbursements:', error);
            return [];
        }
    },
};
