import { User, Permission, Role, Staff } from '../types/staff.types';
import { API_BASE_URL, getHeaders } from './api.config';

export const staffService = {
    getUsers: async (type: 'admins' | 'staff' = 'admins', params?: any): Promise<User[]> => {
        try {
            let endpoint = type === 'admins' ? `${API_BASE_URL}/admins` : `${API_BASE_URL}/users`;

            if (params) {
                const query = new URLSearchParams(params).toString();
                endpoint += `?${query}`;
            }

            const response = await fetch(endpoint, { headers: getHeaders() });

            if (!response.ok) return [];

            const data = await response.json();

            // Safety check for null/undefined data
            let items = [];
            if (data?.data?.items && Array.isArray(data.data.items)) {
                items = data.data.items;
            } else if (data?.data && Array.isArray(data.data)) {
                items = data.data;
            } else if (data?.data?.data && Array.isArray(data.data.data)) {
                items = data.data.data;
            } else if (Array.isArray(data)) {
                items = data;
            }

            return items.map((u: any) => ({
                id: u.id,
                name: u.full_name || u.user_name || u.name || u.email,
                userName: u.user_name,
                staffId: u.user_name && /^ST\d+/.test(u.user_name) ? u.user_name : undefined,
                email: u.email,
                role: (u.roles && u.roles.length > 0) ? (u.roles[0].display_name || u.roles[0].name) : (u.role || 'N/A'),
                roleId: (u.roles && u.roles.length > 0) ? u.roles[0].id : (u.role_id || null),
                roleName: (u.roles && u.roles.length > 0) ? u.roles[0].name : (u.role_name || null),
                branch: u.branch?.name || (u.branch_id ? 'Branch ' + u.branch_id : '-'),
                branchId: u.branch_id || null,
                status: (u.is_active || u.status === 'Active' || u.status === 1) ? 'Active' : 'Inactive',
                is_locked: u.is_locked || false,
                locked_until: u.locked_until || null,
                avatar: u.avatar_url || u.profile_image_url || u.avatar || u.profile_image,
                today_session: u.today_session || null,
                phone: u.contact_no || u.phone || u.personal_mobile || u.office_mobile || 'N/A',
                is_blacklisted: u.is_blacklisted === 1 || u.is_blacklisted === true || false,
                basicSalary: u.basic_salary || null,
                centerId: u.center_id || u.CSU_id || null
            }));
        } catch (error) {
            console.error("Error fetching users", error);
            return [];
        }
    },

    checkAvailability: async (type: 'nic' | 'email' | 'contact' | 'personal_email' | 'personal_mobile', value: string, excludeId?: string): Promise<boolean> => {
        try {
            let endpoint = `${API_BASE_URL}/staffs/check-availability?type=${type}&value=${encodeURIComponent(value)}`;
            if (excludeId) endpoint += `&exclude_id=${excludeId}`;

            const response = await fetch(endpoint, { headers: getHeaders() });

            // If 409, it exists (not available)
            if (response.status === 409) return false;

            // If 200, it's available
            if (response.ok) return true;

            // other errors
            return true;
        } catch (error) {
            console.error("Error checking availability", error);
            return true; // assume true on error to avoid blocking user too aggressively
        }
    },

    /**
     * Check if a branch already has a manager assigned.
     * Returns the existing manager's name if found, or null if the branch is available.
     */
    checkBranchManager: async (branchId: string, excludeStaffId?: string): Promise<string | null> => {
        try {
            let endpoint = `${API_BASE_URL}/staffs/check-availability?type=branch_manager&value=${encodeURIComponent(branchId)}`;
            if (excludeStaffId) endpoint += `&exclude_id=${excludeStaffId}`;

            const response = await fetch(endpoint, { headers: getHeaders() });

            if (response.status === 409) {
                const data = await response.json();
                return data.message || 'This branch already has a manager.';
            }

            return null; // No manager found, branch is available
        } catch (error) {
            console.error("Error checking branch manager", error);
            return null; // assume available on error
        }
    },

    getStaffList: async (): Promise<Staff[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/staffs`, { headers: getHeaders() });
            if (!response.ok) return [];

            const json = await response.json();
            return json.data || [];
        } catch (error) {
            console.error("Error fetching staff list", error);
            return [];
        }
    },

    getStaffDropdownList: async (): Promise<Staff[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/staffs/list`, { headers: getHeaders() });
            if (!response.ok) return [];

            const json = await response.json();
            return json.data || [];
        } catch (error) {
            console.error("Error fetching staff dropdown list", error);
            return [];
        }
    },

    getUsersList: async (): Promise<any[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/list`, { headers: getHeaders() });
            if (!response.ok) return [];

            const json = await response.json();
            const data = json.data || [];

            return data.map((u: any) => ({
                id: u.id,
                name: `${u.name} (${u.user_name})`,
                role: u.role
            }));
        } catch (error) {
            console.error("Error fetching users list", error);
            return [];
        }
    },

    getStaffsByRole: async (role: string, branchId?: string | number): Promise<Staff[]> => {
        try {
            let endpoint = `${API_BASE_URL}/staffs/by-role/${role}`;
            if (branchId) endpoint += `?branch_id=${branchId}`;
            
            const response = await fetch(endpoint, { headers: getHeaders() });
            if (!response.ok) return [];

            const json = await response.json();
            return json.data || [];
        } catch (error) {
            console.error(`Error fetching staff by role ${role}`, error);
            return [];
        }
    },

    getWitnessCandidates: async (): Promise<Staff[]> => {
        try {
            // Try fetching by role to avoid permission issues with full list
            const roles = ['manager', 'field_officer', 'staff', 'cashier'];
            const promises = roles.map(role =>
                fetch(`${API_BASE_URL}/staffs/by-role/${role}`, { headers: getHeaders() })
                    .then(r => r.ok ? r.json() : { data: [] })
                    .catch(() => ({ data: [] }))
            );

            const results = await Promise.all(promises);

            // Flatten and verify uniqueness by staff_id
            const allStaff: Staff[] = [];
            const seenIds = new Set<string>();

            results.forEach(res => {
                if (res.data && Array.isArray(res.data)) {
                    res.data.forEach((s: any) => {
                        if (s.staff_id && !seenIds.has(s.staff_id)) {
                            seenIds.add(s.staff_id);
                            allStaff.push({
                                staff_id: s.staff_id,
                                full_name: s.full_name || s.name,
                                name_with_initial: s.name_with_initial || '',
                                email_id: s.email_id || '',
                                contact_no: s.contact_no || '',
                                address: s.address || '',
                                nic: s.nic || '',
                                gender: s.gender || 'Male',
                                age: s.age || 0,
                                is_blacklisted: s.is_blacklisted || false,
                                bond_signed: s.bond_signed || false,
                                work_info: s.work_info || { designation: 'Staff' }
                            } as Staff);
                        }
                    });
                }
            });

            return allStaff;
        } catch (error) {
            console.error("Error fetching witness candidates", error);
            return [];
        }
    },

    // getRoles: async (): Promise<Role[]> => {
    //     try {
    //         const response = await fetch(`${API_BASE_URL}/roles`, { headers: getHeaders() });

    //         if (!response.ok) {
    //             console.error(`Status: ${response.status}`);
    //             return [];
    //         }

    //         const data = await response.json();
    //         console.log('Roles API Response:', data); // Debug log

    //         if (!data) return [];

    //         // Handle BaseController.paginated format: { success: true, data: { items: [...], pagination: {...} } }
    //         if (data.data && data.data.items && Array.isArray(data.data.items)) {
    //             return data.data.items;
    //         }

    //         // Handle standard list format: { success: true, data: [...] }
    //         if (data.data && Array.isArray(data.data)) {
    //             return data.data;
    //         }

    //         // Handle standard pagination format: { success: true, data: { data: [...] } }
    //         if (data.data?.data && Array.isArray(data.data.data)) {
    //             return data.data.data;
    //         }

    //         console.warn('Roles data structure not recognized', data);
    //         return [];
    //     } catch (error) {
    //         console.error("Error fetching roles", error);
    //         return [];
    //     }
    // },

    getPermissions: async (): Promise<Permission[]> => {
        return [
            { module: 'Dashboard', view: true, create: true, edit: true, delete: false },
            { module: 'Customers', view: true, create: true, edit: true, delete: false },
            { module: 'Loans', view: true, create: true, edit: true, delete: false },
            { module: 'Collections', view: true, create: true, edit: false, delete: false },
            { module: 'Reports', view: true, create: false, edit: false, delete: false },
            { module: 'Finance', view: true, create: true, edit: true, delete: true },
            { module: 'Shareholders', view: true, create: true, edit: true, delete: true },
            { module: 'System Config', view: true, create: true, edit: true, delete: true }
        ];
    },

    createAdmin: async (userData: any): Promise<any> => {
        const isFormData = userData instanceof FormData;
        const headers: any = getHeaders();

        if (isFormData) {
            delete headers['Content-Type'];
        }

        const response = await fetch(`${API_BASE_URL}/admins`, {
            method: 'POST',
            headers: headers,
            body: isFormData ? userData : JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
            const msg = data.errors
                ? Object.values(data.errors).flat().join(', ')
                : (data.message || 'Failed to create admin');
            throw new Error(msg);
        }
        return data;
    },

    createUser: async (payload: any): Promise<any> => {
        const isFormData = payload instanceof FormData;
        const role = isFormData ? (payload.get('role_name') as string || '') : (payload.role?.toLowerCase() || '');

        // If it's an admin and NOT using FormData (legacy or simple user), route to createAdmin
        if (!isFormData && (role.includes('admin') || role === 'super_admin')) {
            return staffService.createAdmin(payload);
        }

        // Prepare headers: If FormData, omit Content-Type so browser sets boundary
        const headers: any = getHeaders();
        if (isFormData) {
            delete headers['Content-Type'];
        }

        const response = await fetch(`${API_BASE_URL}/staffs`, {
            method: 'POST',
            headers: headers,
            body: isFormData ? payload : JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            const msg = data.errors
                ? Object.values(data.errors).flat().join(', ')
                : (data.message || 'Failed to create staff');
            const error: any = new Error(msg);
            error.validationErrors = data.errors;
            throw error;
        }
        return data;
    },
    getAllRoles: async (): Promise<Role[]> => {
        const response = await fetch(`${API_BASE_URL}/roles/all`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            console.error(`Error fetching roles: ${response.status} ${response.statusText}`);
            throw new Error(`Failed to fetch roles: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.data;
    },


    updateUser: async (id: number | string, payload: any): Promise<any> => {
        const isFormData = payload instanceof FormData;
        const role = isFormData ? (payload.get('role') as string || '') : (payload.role?.toLowerCase() || '');
        const staffId = isFormData ? payload.get('staffId') : payload.staffId;

        // Routing logic
        const isAdmin = role.includes('admin') || role.includes('super');
        const useStaffEndpoint = !isAdmin && !!staffId;

        const endpoint = useStaffEndpoint
            ? `${API_BASE_URL}/staffs/${staffId || id}`
            : `${API_BASE_URL}/admins/${id}`;

        const headers: any = getHeaders();
        if (isFormData) {
            delete headers['Content-Type'];
        }

        // FormData doesn't support PUT directly in some PHP environments unless using _method
        const method = 'POST';
        if (isFormData && !payload.has('_method')) {
            payload.append('_method', 'PUT');
        }

        const response = await fetch(endpoint, {
            method: isFormData ? method : 'PUT',
            headers: headers,
            body: isFormData ? payload : JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            const msg = data.errors
                ? Object.values(data.errors).flat().join(', ')
                : (data.message || 'Failed to update user');
            throw new Error(msg);
        }
        return data;
    },

    getStaffDetails: async (staffId: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/staffs/${staffId}`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            // It might be 404 if it's an admin or not found, but let's handle gracefullly
            return null;
        }

        const data = await response.json();
        return data.data;
    },

    deleteUser: async (id: number | string): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || 'Failed to delete user');
        }
    }
};