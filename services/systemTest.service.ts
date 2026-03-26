import { API_BASE_URL, getHeaders } from './api.config';

export interface DiagnosticResult {
    phone_number?: string;
    email?: string;
    status: 'success' | 'failed';
    message?: string;
    error?: string;
}

export interface ApiResponse<T> {
    statusCode: number;
    message: string;
    data: T;
}

export const systemTestService = {
    sendTestSms: async (tests: { phone_number: string; message: string }[]): Promise<ApiResponse<DiagnosticResult[]>> => {
        const response = await fetch(`${API_BASE_URL}/maintenance/system-test/sms`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ tests })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to send test SMS');
        return data;
    },

    sendTestEmail: async (payload: { recipients: string[]; subject: string; message: string }): Promise<ApiResponse<DiagnosticResult[]>> => {
        const response = await fetch(`${API_BASE_URL}/maintenance/system-test/email`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to send test email');
        return data;
    }
};
