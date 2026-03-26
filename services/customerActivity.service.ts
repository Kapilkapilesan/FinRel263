import { API_BASE_URL, getHeaders } from './api.config';

export interface CustomerActivity {
    id: number;
    customer_id: number;
    staff_id: number;
    activity_type: string;
    description?: string;
    customer_behavior?: string;
    outcome?: string;
    activity_date: string;
    staff_name: string; // From backend transformation
    created_at: string;
}

export interface ActivityFormData {
    customer_id: number;
    activity_type: string;
    description: string;
    customer_behavior: string;
    outcome: string;
    activity_date: string;
}

export const customerActivityService = {
    // Get all activities for a customer
    getAll: async (customerId: number): Promise<CustomerActivity[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/customer-activities/customer/${customerId}`, {
                headers: getHeaders()
            });

            if (!response.ok) return [];

            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error("Error fetching customer activities", error);
            return [];
        }
    },

    // Create a new activity
    create: async (data: ActivityFormData) => {
        const response = await fetch(`${API_BASE_URL}/customer-activities`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        const resData = await response.json();

        if (!response.ok) {
            throw new Error(resData.message || 'Failed to create activity');
        }

        return resData.data;
    }
};
