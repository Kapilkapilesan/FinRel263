import { API_BASE_URL, getHeaders } from './api.config';
import { DocumentRecord, DocumentUploadPayload } from '../types/document.types';

const getUploadHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token')?.trim().replace(/[\n\r]/g, '') : null;
    return {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

/** Build a user-friendly message from API error (supports Laravel validation errors). */
function getUploadErrorMessage(
    result: { message?: string; errors?: Record<string, string[]> },
    status?: number
): string {
    let msg: string;
    if (result.errors && typeof result.errors === 'object') {
        const firstMessages = Object.values(result.errors)
            .filter((arr): arr is string[] => Array.isArray(arr))
            .map(arr => arr[0])
            .filter(Boolean);
        msg = firstMessages.length > 0 ? firstMessages.join('. ') : (result.message || 'Failed to upload document');
    } else {
        msg = result.message || 'Failed to upload document';
    }
    // When server says "file failed to upload" it often means PHP rejected the file (size limits)
    if (
        (msg === 'The file failed to upload.' || msg.toLowerCase().includes('file failed to upload')) &&
        (status === 422 || status === 500)
    ) {
        msg += ' Try a smaller file (under 10 MB) or ask your admin to increase PHP upload_max_filesize and post_max_size.';
    }
    return msg;
}

export const documentService = {
    /**
     * Get all documents, optionally filtered by category or search
     */
    getDocuments: async (category?: string, search?: string): Promise<DocumentRecord[]> => {
        const url = new URL(`${API_BASE_URL}/documents`);
        if (category && category !== 'All Documents') url.searchParams.append('category', category);
        if (search) url.searchParams.append('search', search);

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: getHeaders()
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch documents');
        }

        return result.data;
    },

    /**
     * Get category statistics
     */
    getStats: async (): Promise<Record<string, number>> => {
        const response = await fetch(`${API_BASE_URL}/documents/stats`, {
            method: 'GET',
            headers: getHeaders()
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch stats');
        }

        return result.data;
    },

    /**
     * Upload a new document
     */
    uploadDocument: async (payload: DocumentUploadPayload): Promise<DocumentRecord> => {
        const formData = new FormData();
        formData.append('title', payload.title);
        formData.append('category', payload.category);
        formData.append('file_type', payload.file_type);
        formData.append('file', payload.file);
        if (payload.description) formData.append('description', payload.description);

        const response = await fetch(`${API_BASE_URL}/documents`, {
            method: 'POST',
            headers: getUploadHeaders(),
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            const message = getUploadErrorMessage(result, response.status);
            throw new Error(message);
        }

        return result.data;
    },

    /**
     * Download a document
     */
    downloadDocument: async (doc: DocumentRecord): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/documents/${doc.id}/download`, {
            method: 'GET',
            headers: getUploadHeaders() // Use upload headers (no json content type) for blob download just in case, though GET ignores body mostly.
        });

        if (!response.ok) {
            throw new Error('Failed to download document');
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = doc.title + '.' + doc.file_path.split('.').pop(); // Simple extension extraction fallback
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
    },

    /**
     * Get preview URL for a document
     */
    getPreviewUrl: (id: number): string => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token')?.trim().replace(/[\n\r]/g, '') : null;
        return `${API_BASE_URL}/documents/${id}/preview?token=${token}`; // Pass token as query param if needed for raw access or use fetch blob approach for secure preview
    },

    /**
     * Fetch blob for preview (more secure than just URL)
     */
    fetchPreviewBlob: async (id: number): Promise<Blob> => {
        const response = await fetch(`${API_BASE_URL}/documents/${id}/preview`, {
            method: 'GET',
            headers: getHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Failed to load preview: ${response.status} ${errorData.message || ''}`);
        }

        return await response.blob();
    },

    /**
     * Delete a document
     */
    deleteDocument: async (id: number): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || 'Failed to delete document');
        }
    }
};
