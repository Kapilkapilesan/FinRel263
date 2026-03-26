import { API_BASE_URL, getHeaders } from './api.config';

export interface FieldOfficer {
    id: number;
    name: string;
    user_name: string;
    staff_id: string;
}

export interface DinoCenter {
    id: number;
    CSU_id: string;
    center_name: string;
}

export interface CenterCollection {
    center_id: number;
    CSU_id: string;
    center_name: string;
    amount: number;
    np_count: number;
    np_amount: number;
    up_count: number;
    up_amount: number;
}

export interface CollectionDataResponse {
    centers: CenterCollection[];
    totals: {
        total_amount: number;
        total_np_count: number;
        total_np_amount: number;
        total_up_count: number;
        total_up_amount: number;
    };
}

export const dinoService = {
    /**
     * Get field officers for dropdown
     */
    getFieldOfficers: async (): Promise<FieldOfficer[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/dino/field-officers`, {
                method: 'GET',
                headers: getHeaders()
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to fetch field officers');
            }

            return result.data || [];
        } catch (error) {
            console.error('Failed to fetch field officers:', error);
            throw error;
        }
    },

    /**
     * Get centers for a specific field officer
     */
    getCenters: async (fieldOfficerId: number): Promise<DinoCenter[]> => {
        try {
            const url = new URL(`${API_BASE_URL}/dino/centers`);
            url.searchParams.append('field_officer_id', fieldOfficerId.toString());

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: getHeaders()
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to fetch centers');
            }

            return result.data || [];
        } catch (error) {
            console.error('Failed to fetch centers:', error);
            throw error;
        }
    },

    /**
     * Get collection data for selected centers on a date
     */
    getCollectionData: async (centerIds: number[], date: string): Promise<CollectionDataResponse> => {
        try {
            const response = await fetch(`${API_BASE_URL}/dino/collection-data`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    center_ids: centerIds,
                    date: date,
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to fetch collection data');
            }

            return result.data;
        } catch (error) {
            console.error('Failed to fetch collection data:', error);
            throw error;
        }
    },
};
