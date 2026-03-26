import { API_BASE_URL, getHeaders } from './api.config';
import { LeaveRequestFormData, LeaveRequest } from '../types/leave.types';

export const leaveService = {
    submitLeaveRequest: async (data: LeaveRequestFormData): Promise<any> => {
        try {
            const response = await fetch(`${API_BASE_URL}/leaves`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to submit leave request');
            return result;
        } catch (error) {
            console.error('Submit leave error:', error);
            throw error;
        }
    },

    getAllLeaveRequests: async (status?: string): Promise<LeaveRequest[]> => {
        try {
            const query = status && status !== 'all' ? `?status=${status}` : '';
            const response = await fetch(`${API_BASE_URL}/leaves${query}`, {
                headers: getHeaders()
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to fetch leave requests');
            return result.data;
        } catch (error) {
            console.error('Get all leave error:', error);
            throw error;
        }
    },

    getMyLeaveRequests: async (): Promise<LeaveRequest[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/leaves/my-requests`, {
                headers: getHeaders()
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to fetch my leave requests');
            return result.data;
        } catch (error) {
            console.error('Get my leave error:', error);
            throw error;
        }
    },

    updateLeaveRequestStatus: async (id: string, status: 'Approved' | 'Rejected', reason?: string): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE_URL}/leaves/${id}/status`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({
                    status,
                    rejection_reason: reason
                })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to update leave request status');
            return true;
        } catch (error) {
            console.error('Update leave status error:', error);
            throw error;
        }
    },

    updateLeaveRequest: async (id: string, data: LeaveRequestFormData): Promise<any> => {
        try {
            const response = await fetch(`${API_BASE_URL}/leaves/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to update leave request');
            return result;
        } catch (error) {
            console.error('Update leave error:', error);
            throw error;
        }
    },

    deleteLeaveRequest: async (id: string): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE_URL}/leaves/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to delete leave request');
            return true;
        } catch (error) {
            console.error('Delete leave error:', error);
            throw error;
        }
    }
};
