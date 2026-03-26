'use client'
import { API_BASE_URL, getHeaders } from './api.config';
import {
    DashboardStats,
    BranchPerformanceData,
    BranchSummary,
    StaffCollectionEfficiency
} from '../types/dashboard.types';

const fetchOptions = {
    credentials: 'include' as RequestCredentials,
};

export const dashboardService = {
    // Get Dashboard Statistics
    getDashboardStats: async (branchId?: number, month?: number, year?: number): Promise<DashboardStats> => {
        try {
            const params = new URLSearchParams();
            if (branchId) params.append('branch_id', branchId.toString());
            if (month) params.append('month', month.toString());
            if (year) params.append('year', year.toString());

            const url = `${API_BASE_URL}/dashboard/stats?${params.toString()}`;

            console.log('Fetching dashboard stats from:', url);
            const response = await fetch(url, {
                ...fetchOptions,
                headers: getHeaders()
            });

            console.log('Dashboard stats response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Dashboard stats error response:', errorText);
                throw new Error(`Failed to fetch dashboard stats: ${response.status}`);
            }

            const json = await response.json();
            console.log('Dashboard stats data:', json);

            // Check if data is in the expected format
            if (json.data) {
                return json.data;
            } else if (json.activeLoansCount !== undefined) {
                // Data might be at root level
                return json;
            }

            throw new Error('Invalid response format for dashboard stats');
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            // Return default values on error
            return {
                activeLoansCount: 0,
                totalDisbursementsAmount: 0,
                pendingApprovalsCount: 0,
                todayCollectionAmount: 0,
            };
        }
    },

    // Get All Branch Summaries for Admin Dashboard
    getBranchSummaries: async (): Promise<BranchSummary[]> => {
        try {
            console.log('Fetching branch summaries from:', `${API_BASE_URL}/dashboard/branches/summary`);
            const response = await fetch(`${API_BASE_URL}/dashboard/branches/summary`, {
                ...fetchOptions,
                headers: getHeaders()
            });

            console.log('Branch summaries response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Branch summaries error response:', errorText);
                throw new Error(`Failed to fetch branch summaries: ${response.status}`);
            }

            const json = await response.json();
            console.log('Branch summaries raw response:', json);

            // Check if data is in the expected format
            if (json.data) {
                console.log('Branch summaries data array:', json.data);
                return json.data;
            } else if (Array.isArray(json)) {
                // Data might be at root level
                console.log('Branch summaries is array at root:', json);
                return json;
            }

            console.warn('Unexpected branch summaries format:', json);
            return [];
        } catch (error) {
            console.error('Error fetching branch summaries:', error);
            return [];
        }
    },

    // Get Branch Performance Details
    getBranchPerformance: async (
        branchId: number,
        filterType: 'day' | 'month' | 'year' | 'custom',
        date?: string,
        startDate?: string,
        endDate?: string
    ): Promise<BranchPerformanceData | null> => {
        try {
            const params = new URLSearchParams();
            params.append('filter_type', filterType);

            if (date) params.append('date', date);
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);

            const response = await fetch(
                `${API_BASE_URL}/dashboard/branches/${branchId}/performance?${params.toString()}`,
                {
                    ...fetchOptions,
                    headers: getHeaders()
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch branch performance');
            }

            const json = await response.json();
            return json.data;
        } catch (error) {
            console.error('Error fetching branch performance:', error);
            return null;
        }
    },

    // Get Staff Attendance for Branch (Day view)
    getBranchStaffAttendance: async (branchId: number, date: string) => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/dashboard/branches/${branchId}/staff-attendance?date=${date}`,
                {
                    ...fetchOptions,
                    headers: getHeaders()
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch staff attendance');
            }

            const json = await response.json();
            return json.data;
        } catch (error) {
            console.error('Error fetching staff attendance:', error);
            return [];
        }
    },

    // Get Staff Monthly/Yearly Summary
    getBranchStaffSummary: async (
        branchId: number,
        filterType: 'month' | 'year',
        date: string
    ) => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/dashboard/branches/${branchId}/staff-summary?filter_type=${filterType}&date=${date}`,
                {
                    ...fetchOptions,
                    headers: getHeaders()
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch staff summary');
            }

            const json = await response.json();
            return json.data;
        } catch (error) {
            console.error('Error fetching staff summary:', error);
            return [];
        }
    },
    // Get Staff Collection Efficiency
    getStaffCollectionEfficiency: async (
        staffId?: string,
        month?: number,
        year?: number
    ): Promise<StaffCollectionEfficiency | null> => {
        try {
            const params = new URLSearchParams();
            if (staffId) params.append('staff_id', staffId);
            if (month) params.append('month', month.toString());
            if (year) params.append('year', year.toString());

            const response = await fetch(
                `${API_BASE_URL}/dashboard/collection-efficiency/staff?${params.toString()}`,
                {
                    ...fetchOptions,
                    headers: getHeaders()
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch staff collection efficiency');
            }

            const json = await response.json();
            return json.data;
        } catch (error) {
            console.error('Error fetching staff collection efficiency:', error);
            return null;
        }
    },
};
