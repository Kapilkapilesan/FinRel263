import { API_BASE_URL, getHeaders } from './api.config';

export interface User {
    id: number;
    name: string;
    email: string;
    user_name: string;
    role: string;
    avatar?: string;
    avatar_url?: string;
    full_name?: string;
    display_name?: string;
    role_name?: string;
    staff_id?: string;
    phone?: string;
    address?: string;
    branch?: {
        id: number;
        name: string;
        branch_name?: string;
    };
    branch_id?: number;
    staff_detail?: {
        phone?: string;
        address?: string;
        designation?: string;
        department?: string;
    };
    // Add other user fields as needed
    hierarchy?: number;
}

export interface SessionInfo {
    id: number;
    date: string;
    login_at: string;
    status: string;
}

export interface LoginResponse {
    token: string;
    user: User;
    session?: SessionInfo;
    message?: string;
    status: number;
}

export type LogoutType = 'LOGOUT' | 'ON_WORK' | 'STAY_IN_OFFICE';

export interface VerifyUsernameResponse {
    statusCode: number;
    message: string;
    data?: {
        display_name: string;
        avatar_url?: string;
        username: string;
    };
}

export const authService = {
    /**
     * Verify username exists (Step 1 of two-step login)
     */
    verifyUsername: async (username: string): Promise<VerifyUsernameResponse> => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/verify-username`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ username })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Username verification failed');
            }

            return data;
        } catch (error) {
            console.error('Username verification error:', error);
            throw error;
        }
    },

    login: async (username: string, password: string): Promise<LoginResponse> => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ login: username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Store session
            if (data.statusCode === 2000 && data.data) {
                const { access_token, user, roles, permissions, session } = data.data;

                if (access_token) {
                    localStorage.setItem('token', access_token);
                    localStorage.setItem('user', JSON.stringify(user));
                    localStorage.setItem('roles', JSON.stringify(roles));
                    localStorage.setItem('permissions', JSON.stringify(permissions));

                    if (data.data.has_temporary_promotion) {
                        localStorage.setItem('temporary_promotion', JSON.stringify(data.data.temporary_promotion));
                    } else {
                        localStorage.removeItem('temporary_promotion');
                    }

                    // Store session info if available
                    if (session) {
                        localStorage.setItem('session', JSON.stringify(session));
                    }
                }

                return data;
            }

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    /**
     * Logout with optional logout type
     * @param logoutType - 'LOGOUT' (end day), 'ON_WORK' (field work), 'STAY_IN_OFFICE' (idle)
     * @param remarks - Optional notes
     */
    logout: async (logoutType: LogoutType = 'LOGOUT', remarks?: string): Promise<void> => {
        try {
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    logout_type: logoutType,
                    remarks
                })
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Always clear local storage for all logout types
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('roles');
            localStorage.removeItem('permissions');
            localStorage.removeItem('session');
            localStorage.removeItem('activeBranchId');
            localStorage.removeItem('activeBranchUserId');
            localStorage.removeItem('temporary_promotion');
        }
    },

    /**
     * Get current session from localStorage
     */
    getCurrentSession: (): SessionInfo | null => {
        if (typeof window === 'undefined') return null;
        const sessionStr = localStorage.getItem('session');
        if (sessionStr) {
            try {
                return JSON.parse(sessionStr);
            } catch (e) {
                return null;
            }
        }
        return null;
    },

    getCurrentUser: (): User | null => {
        if (typeof window === 'undefined') return null;
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch (e) {
                return null;
            }
        }
        return null;
    },

    isAuthenticated: (): boolean => {
        if (typeof window === 'undefined') return false;
        return !!localStorage.getItem('token');
    },

    hasPermission: (permission: string): boolean => {
        if (typeof window === 'undefined') return false;

        const permissionsStr = localStorage.getItem('permissions');
        if (!permissionsStr) return false;

        try {
            const permissions = JSON.parse(permissionsStr);
            if (!Array.isArray(permissions)) return false;

            // Handle both string arrays and permission objects
            return permissions.some((p: any) => {
                if (typeof p === 'string') {
                    return p === permission;
                }
                return p.name === permission;
            });
        } catch (e) {
            console.error('Error parsing permissions from localStorage', e);
            return false;
        }
    },

    hasAnyPermission: (permissions: string[]): boolean => {
        return permissions.some(p => authService.hasPermission(p));
    },

    // Check if user possesses any permission in a module matching an action suffix
    hasModulePermission: (module: string, action: string): boolean => {
        if (typeof window === 'undefined') return false;
        if (authService.hasPermission('data.view_all')) return true;

        const permissionsStr = localStorage.getItem('permissions');
        if (!permissionsStr) return false;

        try {
            const permissions = JSON.parse(permissionsStr);
            if (!Array.isArray(permissions)) return false;

            return permissions.some((p: any) => {
                const isSameModule = p.module === module || (!p.module && module === 'System');
                const isActionMatch = p.name.endsWith('.' + action) || p.name === action;
                return isSameModule && isActionMatch;
            });
        } catch (e) {
            return false;
        }
    },

    hasRole: (roleName: string): boolean => {
        if (typeof window === 'undefined') return false;
        const rolesStr = localStorage.getItem('roles');
        if (!rolesStr) return false;

        try {
            const roles = JSON.parse(rolesStr);
            return Array.isArray(roles) && roles.some((r: any) => r.name === roleName);
        } catch (e) {
            console.error('Error parsing roles from localStorage', e);
            return false;
        }
    },

    isSuperAdmin: (): boolean => {
        return authService.hasRole('super_admin');
    },
    refreshProfile: async (): Promise<void> => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: getHeaders()
            });
            const data = await response.json();
            if (response.ok && data.statusCode === 2000) {
                const { user, roles, permissions } = data.data;
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('roles', JSON.stringify(roles));
                localStorage.setItem('permissions', JSON.stringify(permissions));

                if (data.data.has_temporary_promotion) {
                    localStorage.setItem('temporary_promotion', JSON.stringify(data.data.temporary_promotion));
                } else {
                    localStorage.removeItem('temporary_promotion');
                }

                // Dispatch event so UI can re-render
                window.dispatchEvent(new CustomEvent('security:updated'));
            }
        } catch (error) {
            console.error('Failed to refresh profile', error);
        }
    },

    getProfile: async (): Promise<User> => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: getHeaders()
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch profile');
            }
            return data.data.user;
        } catch (error) {
            console.error('Get profile error:', error);
            throw error;
        }
    },

    updateProfile: async (formData: FormData): Promise<any> => {
        try {
            const headers = getHeaders();
            // Remove Content-Type to allow browser to set boundary for FormData
            const { 'Content-Type': _, ...restHeaders } = headers;

            const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                method: 'POST', // Using POST for file uploads
                headers: restHeaders,
                body: formData
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to update profile');
            }
            return data;
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    },

    changePassword: async (userId: number, currentPassword: string, newPassword: string, confirmPassword: string): Promise<any> => {
        try {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const isSelf = currentUser.id === userId;

            // Use specialized profile endpoint if changing own password
            const endpoint = isSelf ? `${API_BASE_URL}/auth/change-password` : `${API_BASE_URL}/users/${userId}/change-password`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                    new_password_confirmation: confirmPassword
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to change password');
            }
            return data;
        } catch (error) {
            console.error('Change password error:', error);
            throw error;
        }
    },

    forgotPassword: async (email: string): Promise<any> => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/password/email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to send reset link');
            return data;
        } catch (error) {
            throw error;
        }
    },

    resetPassword: async (data: any): Promise<any> => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/password/reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const responseData = await response.json();
            if (!response.ok) throw new Error(responseData.message || 'Failed to reset password');
            return responseData;
        } catch (error) {
            throw error;
        }
    },

    getHighestHierarchy: (): number => {
        if (typeof window === 'undefined') return 1000;
        const rolesStr = localStorage.getItem('roles');
        if (!rolesStr) return 1000;
        try {
            const roles = JSON.parse(rolesStr);
            if (!Array.isArray(roles) || roles.length === 0) return 1000;

            // Try to find the actual hierarchy first
            const hierarchies = roles
                .map((r: any) => r.hierarchy)
                .filter((h: any) => h !== undefined && h !== null);

            if (hierarchies.length > 0) {
                return Math.min(...hierarchies);
            }

            // Fallback for legacy sessions (pre-hierarchy sync)
            if (roles.some((r: any) => r.name === 'super_admin')) return 1;
            if (roles.some((r: any) => r.name === 'admin')) return 10;
            if (roles.some((r: any) => r.name === 'manager')) return 100;

            return 1000;
        } catch (e) {
            return 1000;
        }
    },

    getTemporaryPromotion: (): { target_role_name: string, end_date: string } | null => {
        if (typeof window === 'undefined') return null;
        const promoStr = localStorage.getItem('temporary_promotion');
        if (!promoStr) return null;
        try {
            return JSON.parse(promoStr);
        } catch (e) {
            return null;
        }
    }
};
