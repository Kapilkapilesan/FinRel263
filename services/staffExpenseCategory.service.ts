import { API_BASE_URL, getHeaders } from './api.config';

export interface StaffExpenseCategory {
    id: number;
    name: string;
    fixed_amount: number;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

const handleResponse = async (response: Response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'API request failed');
    }
    return data;
};

export const staffExpenseCategoryService = {
    getAll: async (): Promise<StaffExpenseCategory[]> => {
        const response = await fetch(`${API_BASE_URL}/system-config/staff-expense-categories`, { headers: getHeaders() });
        const data = await handleResponse(response);
        return data;
    },

    create: async (data: Partial<StaffExpenseCategory>): Promise<StaffExpenseCategory> => {
        const response = await fetch(`${API_BASE_URL}/system-config/staff-expense-categories`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        const responseData = await handleResponse(response);
        return responseData;
    },

    update: async (id: number, data: Partial<StaffExpenseCategory>): Promise<StaffExpenseCategory> => {
        const response = await fetch(`${API_BASE_URL}/system-config/staff-expense-categories/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        const responseData = await handleResponse(response);
        return responseData;
    },

    delete: async (id: number): Promise<{ message: string }> => {
        const response = await fetch(`${API_BASE_URL}/system-config/staff-expense-categories/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        const data = await handleResponse(response);
        return data;
    }
};
