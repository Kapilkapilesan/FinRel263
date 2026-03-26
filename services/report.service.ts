import { API_BASE_URL, getHeaders } from './api.config';
import { ReportRow, ReportStats, ExportPayload, ReportColumn, REPORT_COLUMNS } from '../types/report.types';

export const reportService = {
    /**
     * Get report data with optional filters
     */
    getReportData: async (filters?: Record<string, string>): Promise<ReportRow[]> => {
        const url = new URL(`${API_BASE_URL}/reports`);

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value) {
                    url.searchParams.append(key, value);
                }
            });
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: getHeaders()
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch report data');
        }

        return result.data;
    },

    /**
     * Get report statistics
     */
    getReportStats: async (): Promise<ReportStats> => {
        const response = await fetch(`${API_BASE_URL}/reports/stats`, {
            method: 'GET',
            headers: getHeaders()
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch report stats');
        }

        return result.data;
    },

    /**
     * Get available columns for export
     */
    getAvailableColumns: (): ReportColumn[] => {
        return REPORT_COLUMNS;
    },

    /**
     * Export report to CSV
     */
    exportReport: async (payload: ExportPayload): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/reports/export`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Failed to export report');
        }

        // Get the blob and trigger download
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `loan_report_${new Date().toISOString().split('T')[0]}.csv`;

        document.body.appendChild(a);
        a.click();

        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
    }
};
