import { API_BASE_URL, getHeaders } from './api.config';

/**
 * Backend logout types (use these when calling the API)
 */
export type LogoutType = 'LOGOUT' | 'ON_WORK' | 'STAY_IN_OFFICE';

/**
 * Frontend work status (used for display and UI state)
 */
export type WorkStatus = 'office_work' | 'on_field' | 'logged_out';

/**
 * Session status from backend
 */
export type SessionStatus = 'OPEN' | 'CLOSED';

/**
 * Attendance status from backend
 */
export type AttendanceStatus = 'PRESENT' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface StaffSession {
    id: number;
    user_id: number;
    date: string;
    login_at: string;
    logout_at: string | null;
    logout_type: LogoutType | null;
    auto_logged_out: boolean;
    status: SessionStatus;
    worked_minutes: number;
    worked_hours: number;
    attendance_status: AttendanceStatus;
    approved_by: number | null;
    approved_at: string | null;
    remarks: string | null;
    login_ip: string | null;
}

export interface SessionResponse {
    success: boolean;
    message: string;
    data: {
        session: StaffSession | null;
        should_show_midnight_warning?: boolean;
        is_locked?: boolean;
    };
}

export interface TodaySessionsResponse {
    success: boolean;
    message: string;
    data: {
        sessions: StaffSession[];
        total_worked_minutes: number;
        total_worked_hours: number;
        should_show_midnight_warning: boolean;
    };
}

/**
 * Maps frontend work status to backend logout type
 */
export const workStatusToLogoutType = (status: WorkStatus): LogoutType => {
    switch (status) {
        case 'office_work':
            return 'STAY_IN_OFFICE';
        case 'on_field':
            return 'ON_WORK';
        case 'logged_out':
            return 'LOGOUT';
        default:
            return 'LOGOUT';
    }
};

/**
 * Maps backend logout type to frontend work status
 */
export const logoutTypeToWorkStatus = (type: LogoutType | null): WorkStatus => {
    switch (type) {
        case 'STAY_IN_OFFICE':
            return 'office_work';
        case 'ON_WORK':
            return 'on_field';
        case 'LOGOUT':
            return 'logged_out';
        default:
            return 'office_work'; // Default for active sessions with no logout type
    }
};

/**
 * Gets user-friendly label for work status
 */
export const getWorkStatusLabel = (status: WorkStatus): string => {
    switch (status) {
        case 'office_work':
            return 'Office Work';
        case 'on_field':
            return 'On Field';
        case 'logged_out':
            return 'Logged Out';
        default:
            return status;
    }
};

/**
 * Gets CSS classes for work status badge
 */
export const getWorkStatusColor = (status: WorkStatus): string => {
    switch (status) {
        case 'office_work':
            return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
        case 'on_field':
            return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
        case 'logged_out':
            return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
        default:
            return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
};

export const sessionService = {
    /**
     * Get the current open session for the logged-in user
     */
    getCurrentSession: async (): Promise<SessionResponse> => {
        try {
            const response = await fetch(`${API_BASE_URL}/sessions/current`, {
                method: 'GET',
                headers: getHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch current session');
            }

            return data;
        } catch (error) {
            console.error('Get current session error:', error);
            throw error;
        }
    },

    /**
     * End the current session with a specific logout type
     * @param logoutType - Backend logout type: 'LOGOUT', 'ON_WORK', or 'STAY_IN_OFFICE'
     * @param remarks - Optional notes
     */
    endSession: async (logoutType: LogoutType, remarks?: string): Promise<SessionResponse> => {
        try {
            const response = await fetch(`${API_BASE_URL}/sessions/end`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    logout_type: logoutType,
                    remarks
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to end session');
            }

            return data;
        } catch (error) {
            console.error('End session error:', error);
            throw error;
        }
    },

    /**
     * Resume session after temporary logout (ON_WORK or STAY_IN_OFFICE)
     */
    resumeSession: async (): Promise<SessionResponse> => {
        try {
            const response = await fetch(`${API_BASE_URL}/sessions/resume`, {
                method: 'POST',
                headers: getHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to resume session');
            }

            return data;
        } catch (error) {
            console.error('Resume session error:', error);
            throw error;
        }
    },

    /**
     * Get today's sessions for the logged-in user
     */
    getTodaySessions: async (): Promise<TodaySessionsResponse> => {
        try {
            const response = await fetch(`${API_BASE_URL}/sessions/today`, {
                method: 'GET',
                headers: getHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch today sessions');
            }

            return data;
        } catch (error) {
            console.error('Get today sessions error:', error);
            throw error;
        }
    },

    /**
     * Check if midnight warning should be displayed
     */
    checkMidnightWarning: async (): Promise<{ should_show_warning: boolean; warning_message: string | null }> => {
        try {
            const response = await fetch(`${API_BASE_URL}/sessions/midnight-warning`, {
                method: 'GET',
                headers: getHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to check midnight warning');
            }

            return data.data;
        } catch (error) {
            console.error('Check midnight warning error:', error);
            throw error;
        }
    },

    /**
     * Midnight timeout - discard session and lock account
     * Called when user doesn't logout within the countdown period
     */
    midnightTimeoutLock: async (): Promise<{ success: boolean; message: string }> => {
        try {
            const response = await fetch(`${API_BASE_URL}/sessions/midnight-timeout`, {
                method: 'POST',
                headers: getHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to process midnight timeout');
            }

            return data;
        } catch (error) {
            console.error('Midnight timeout error:', error);
            throw error;
        }
    },

    /**
     * Get attendance summary for a date range
     */
    getAttendanceSummary: async (startDate: string, endDate: string): Promise<any> => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/sessions/attendance-summary?start_date=${startDate}&end_date=${endDate}`,
                {
                    method: 'GET',
                    headers: getHeaders()
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch attendance summary');
            }

            return data;
        } catch (error) {
            console.error('Get attendance summary error:', error);
            throw error;
        }
    },

    /**
     * Helper: Get current work status from session
     */
    getCurrentWorkStatus: (session: StaffSession | null): WorkStatus => {
        if (!session) return 'logged_out';
        if (session.status === 'CLOSED') return 'logged_out';
        return logoutTypeToWorkStatus(session.logout_type);
    },

    /**
     * Format worked time as human-readable string
     */
    formatWorkedTime: (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    },

    // ==================== MANAGER ACTIONS ====================

    /**
     * Unlock a user's account (for managers)
     */
    unlockUserAccount: async (userId: number): Promise<{ success: boolean; message: string }> => {
        try {
            const response = await fetch(`${API_BASE_URL}/sessions/user/${userId}/unlock`, {
                method: 'POST',
                headers: getHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to unlock user account');
            }

            return data;
        } catch (error) {
            console.error('Unlock user account error:', error);
            throw error;
        }
    },

    /**
     * Lock a user's account manually (for managers)
     */
    lockUserAccount: async (userId: number): Promise<{ success: boolean; message: string }> => {
        try {
            // Using a new endpoint for manual locking
            const response = await fetch(`${API_BASE_URL}/sessions/user/${userId}/lock`, {
                method: 'POST',
                headers: getHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to lock user account');
            }

            return data;
        } catch (error) {
            console.error('Lock user account error:', error);
            throw error;
        }
    },

    /**
     * Approve attendance for a session (for managers)
     */
    approveAttendance: async (sessionId: number, remarks?: string): Promise<any> => {
        try {
            const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/approve`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ remarks })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to approve attendance');
            }

            return data;
        } catch (error) {
            console.error('Approve attendance error:', error);
            throw error;
        }
    },

    /**
     * Reject attendance for a session (for managers)
     */
    rejectAttendance: async (sessionId: number, remarks: string): Promise<any> => {
        try {
            const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/reject`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ remarks })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to reject attendance');
            }

            return data;
        } catch (error) {
            console.error('Reject attendance error:', error);
            throw error;
        }
    },

    /**
     * Get pending attendance list (for managers)
     */
    getPendingAttendance: async (): Promise<any> => {
        try {
            const response = await fetch(`${API_BASE_URL}/sessions/pending-attendance`, {
                method: 'GET',
                headers: getHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch pending attendance');
            }

            return data;
        } catch (error) {
            console.error('Get pending attendance error:', error);
            throw error;
        }
    },

    /**
     * Get sessions for a specific user (for managers)
     */
    getUserSessions: async (userId: number, startDate?: string, endDate?: string): Promise<any> => {
        try {
            let url = `${API_BASE_URL}/sessions/user/${userId}`;
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            if (params.toString()) url += `?${params.toString()}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: getHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch user sessions');
            }

            return data;
        } catch (error) {
            console.error('Get user sessions error:', error);
            throw error;
        }
    },
    /**
     * Get user session summary (login counts, duration, etc.)
     */
    getUserSessionSummary: async (userId: number): Promise<any> => {
        try {
            const response = await fetch(`${API_BASE_URL}/sessions/user/${userId}/summary`, {
                method: 'GET',
                headers: getHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch user session summary');
            }

            return data.data;
        } catch (error) {
            console.error('Get user session summary error:', error);
            throw error;
        }
    },

    /**
     * Get user session history with pagination and filtering
     */
    getUserSessionHistory: async (userId: number, filters: { startDate?: string, endDate?: string, limit?: number, offset?: number } = {}): Promise<any> => {
        try {
            const params = new URLSearchParams();
            if (filters.startDate) params.append('start_date', filters.startDate);
            if (filters.endDate) params.append('end_date', filters.endDate);
            if (filters.limit) params.append('limit', filters.limit.toString());
            if (filters.offset !== undefined) params.append('offset', filters.offset.toString());

            const response = await fetch(`${API_BASE_URL}/sessions/user/${userId}/history?${params.toString()}`, {
                method: 'GET',
                headers: getHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch user session history');
            }

            return data.data;
        } catch (error) {
            console.error('Get user session history error:', error);
            throw error;
        }
    }
};
