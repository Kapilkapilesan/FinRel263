import { Center, CenterFormData, ApiResponse } from '../types/center.types';
import { API_BASE_URL, getHeaders } from './api.config';

const fetchOptions = {
    credentials: 'include' as RequestCredentials,
};

async function handleResponse<T>(response: Response): Promise<T> {
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
        if (data && (response.status === 422 || response.status === 409)) {
            const error = new Error(data.error || data.message || 'Validation failed');
            (error as any).errors = data.errors;
            throw error;
        }

        const errorMessage = (data && (data.error || data.message)) || response.statusText;
        throw new Error(errorMessage);
    }

    return (data as ApiResponse<T>).data;
}

export const centerService = {
    // Get all centers
    getCenters: async (options?: { scope?: 'own' | 'branch' }): Promise<Center[]> => {
        try {
            const url = new URL(`${API_BASE_URL}/centers`);
            if (options?.scope) {
                url.searchParams.append('scope', options.scope);
            }

            const response = await fetch(url.toString(), {
                ...fetchOptions,
                headers: getHeaders()
            });
            return handleResponse<Center[]>(response);
        } catch (error) {
            console.error('Error fetching centers:', error);
            return [];
        }
    },

    // Get centers for dropdowns (uses non-permissioned route)
    getCentersList: async (status?: string): Promise<Center[]> => {
        try {
            const url = new URL(`${API_BASE_URL}/centers/list`);
            if (status) {
                url.searchParams.append('status', status);
            }
            const response = await fetch(url.toString(), {
                ...fetchOptions,
                headers: getHeaders()
            });
            return await handleResponse<Center[]>(response);
        } catch (error) {
            console.error('Error fetching centers list:', error);
            return [];
        }
    },

    // Get single center
    getCenterById: async (id: string): Promise<Center> => {
        const response = await fetch(`${API_BASE_URL}/centers/${id}`, {
            ...fetchOptions,
            headers: getHeaders()
        });
        return handleResponse<Center>(response);
    },

    // Create new center
    createCenter: async (data: CenterFormData): Promise<Center> => {
        const response = await fetch(`${API_BASE_URL}/centers`, {
            method: 'POST',
            ...fetchOptions,
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse<Center>(response);
    },

    // Update center
    updateCenter: async (id: string, data: CenterFormData): Promise<Center> => {
        const response = await fetch(`${API_BASE_URL}/centers/${id}`, {
            method: 'PUT',
            ...fetchOptions,
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse<Center>(response);
    },

    // Delete center
    deleteCenter: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/centers/${id}`, {
            method: 'DELETE',
            ...fetchOptions,
            headers: getHeaders()
        });

        if (!response.ok) {
            const isJson = response.headers.get('content-type')?.includes('application/json');
            const data = isJson ? await response.json() : null;
            const errorMessage = (data && data.message) || response.statusText;
            throw new Error(`Delete failed ${response.status}: ${errorMessage}`);
        }
    },

    // Approve center
    approveCenter: async (id: string, note?: string): Promise<Center> => {
        const response = await fetch(`${API_BASE_URL}/centers/${id}/approve`, {
            method: 'PATCH',
            ...fetchOptions,
            headers: getHeaders(),
            body: JSON.stringify({ note })
        });
        return handleResponse<Center>(response);
    },

    // Reject center
    rejectCenter: async (id: string, reason?: string): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/centers/${id}/reject`, {
            method: 'POST',
            ...fetchOptions,
            headers: getHeaders(),
            body: JSON.stringify({ rejection_reason: reason })
        });

        if (!response.ok) {
            const isJson = response.headers.get('content-type')?.includes('application/json');
            const data = isJson ? await response.json() : null;
            const errorMessage = (data && data.message) || response.statusText;
            throw new Error(`Rejection failed ${response.status}: ${errorMessage}`);
        }
    },

    // Toggle Center Status (active <-> disabled)
    toggleCenterStatus: async (id: string, currentStatus: string): Promise<Center> => {
        // Toggle between 'active' and 'disabled' (not 'inactive' which is for pending approval)
        const newStatus = currentStatus.toLowerCase() === 'active' ? 'disabled' : 'active';
        const response = await fetch(`${API_BASE_URL}/centers/${id}`, {
            method: 'PUT',
            ...fetchOptions,
            headers: getHeaders(),
            body: JSON.stringify({ status: newStatus })
        });
        return handleResponse<Center>(response);
    },

    // Check for duplicate center name in branch (real-time validation)
    checkDuplicate: async (centerName: string, branchId: string, excludeId?: string): Promise<{ exists: boolean; message: string }> => {
        const response = await fetch(`${API_BASE_URL}/centers/check-duplicate`, {
            method: 'POST',
            ...fetchOptions,
            headers: getHeaders(),
            body: JSON.stringify({
                center_name: centerName,
                branch_id: branchId,
                exclude_id: excludeId
            })
        });
        const data = await response.json();
        if (response.ok && data.status === 'success') {
            return { exists: data.exists, message: data.message };
        }
        return { exists: false, message: '' };
    },

    // Assign Staff (Temporary or Permanent)
    assignStaff: async (centerId: string, params: {
        staff_id: string;
        type: 'temporary' | 'permanent';
        date?: string;
        reason?: string;
    }): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/centers/${centerId}/assign`, {
            method: 'POST',
            ...fetchOptions,
            headers: getHeaders(),
            body: JSON.stringify(params)
        });
        return handleResponse<any>(response);
    }
};
