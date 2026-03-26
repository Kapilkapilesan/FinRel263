import { API_BASE_URL, getHeaders } from './api.config';
import { BranchCollection } from '@/components/collections/summary/types';

class CollectionSummaryService {
    async getSummary(date: string, viewType: 'daily' | 'weekly' | 'monthly'): Promise<BranchCollection[]> {
        const url = new URL(`${API_BASE_URL}/collections/summary`);
        url.searchParams.append('date', date);
        url.searchParams.append('view_type', viewType);

        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: getHeaders()
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to fetch collection summary');
            }

            return result.data;
        } catch (error) {
            console.error('Failed to fetch collection summary:', error);
            throw error;
        }
    }

    async getBranchDetails(branchId: string, date: string, viewType: string): Promise<{ branch_name: string, data: BranchCollection[] }> {
        const url = new URL(`${API_BASE_URL}/collections/summary/branch-details`);
        url.searchParams.append('branch_id', branchId);
        url.searchParams.append('date', date);
        url.searchParams.append('view_type', viewType);

        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: getHeaders()
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to fetch branch details');
            }

            return result;
        } catch (error) {
            console.error('Failed to fetch branch details:', error);
            throw error;
        }
    }

    async exportSummary(date: string, viewType: string) {
        const url = new URL(`${API_BASE_URL}/collections/summary/export`);
        url.searchParams.append('date', date);
        url.searchParams.append('view_type', viewType);

        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to export summary');
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', `collection_summary_${viewType}_${date}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Failed to export summary:', error);
            throw error;
        }
    }

    async importCollections(file: File) {
        const formData = new FormData();
        formData.append('file', file);

        let token = localStorage.getItem('token');
        if (token) {
            token = token.trim().replace(/[\n\r]/g, '');
        }

        const headers: HeadersInit = {
            'Accept': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/collections/import`, {
                method: 'POST',
                headers: headers,
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to import collections');
            }

            return result;
        } catch (error) {
            console.error('Failed to import collections:', error);
            throw error;
        }
    }
}

export const collectionSummaryService = new CollectionSummaryService();
