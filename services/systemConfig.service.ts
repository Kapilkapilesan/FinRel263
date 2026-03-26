import { API_BASE_URL, getHeaders } from './api.config';

export interface WelcomeGreetingsParams {
    staff_welcome_sms?: string;
    customer_welcome_sms?: string;
}

export const systemConfigService = {
    getWelcomeGreetings: async (): Promise<WelcomeGreetingsParams> => {
        const response = await fetch(`${API_BASE_URL}/system-config/welcome-greetings`, {
            method: 'GET',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch welcome greetings');
        return response.json();
    },

    updateWelcomeGreetings: async (data: WelcomeGreetingsParams): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/system-config/welcome-greetings`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update welcome greetings');
        return response.json();
    },
};
