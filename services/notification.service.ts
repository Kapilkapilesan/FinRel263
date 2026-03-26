import { API_BASE_URL, getHeaders } from './api.config';
import { NotificationResponse, UnreadCountResponse, Notification } from '../types/notification.types';

export const notificationService = {
    /**
     * Get all notifications
     */
    getAll: async (page = 1, perPage = 15, filter: 'all' | 'unread' | 'read' = 'all') => {
        const query = new URLSearchParams({
            page: page.toString(),
            per_page: perPage.toString(),
            filter
        });

        const response = await fetch(`${API_BASE_URL}/notifications?${query.toString()}`, {
            headers: getHeaders()
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to fetch notifications');
        return json;
    },

    /**
     * Get unread notifications count
     */
    getUnreadCount: async () => {
        const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
            headers: getHeaders()
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to fetch unread count');
        return json;
    },

    /**
     * Get sidebar badges counts for pending requests
     */
    getSidebarCounts: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/sidebar-counts`, {
                headers: getHeaders()
            });

            // Log response details for debugging
            console.log('Sidebar counts response status:', response.status);

            const text = await response.text();
            let json;
            try {
                json = text ? JSON.parse(text) : {};
            } catch (parseError) {
                console.error('Failed to parse response:', text.substring(0, 500));
                throw new Error('Invalid JSON response from server');
            }

            if (!response.ok) {
                console.error('Sidebar counts error:', response.status, json);
                throw new Error(json.message || json.error || `API error: ${response.status}`);
            }
            return json;
        } catch (error) {
            console.error('Sidebar counts fetch error:', error);
            throw error;
        }
    },

    /**
     * Mark a notification as read
     */
    markAsRead: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
            method: 'PATCH',
            headers: getHeaders()
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to mark as read');
        return json;
    },

    /**
     * Mark all notifications as read
     */
    markAllAsRead: async () => {
        const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
            method: 'PATCH',
            headers: getHeaders()
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to mark all as read');
        return json;
    },

    /**
     * Delete a notification
     */
    delete: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to delete notification');
        return json;
    },

    /**
     * Delete all notifications
     */
    deleteAll: async () => {
        const response = await fetch(`${API_BASE_URL}/notifications`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to delete all notifications');
        return json;
    }
};
