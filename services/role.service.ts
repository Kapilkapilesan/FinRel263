import { API_BASE_URL, getHeaders } from './api.config';
import { Role, Permission, Privilege, PermissionGroup } from '../types/role.types';

export const roleService = {
    // Get all roles
    getRoles: async (): Promise<Role[]> => {
        try {
            // Using /roles/all which returns direct list
            const response = await fetch(`${API_BASE_URL}/roles/all`, {
                headers: getHeaders()
            });

            if (!response.ok) throw new Error('Failed to fetch roles');

            const data = await response.json();
            const rawRoles = data.data || [];

            // Fetch details for each role to get permissions
            const rolesWithPermissions = await Promise.all(
                rawRoles.map(async (role: any) => {
                    const detailResponse = await fetch(`${API_BASE_URL}/roles/${role.id}`, {
                        headers: getHeaders()
                    });
                    if (!detailResponse.ok) return role;
                    const detail = await detailResponse.json();
                    return detail.data;
                })
            );

            return rolesWithPermissions.map(r => roleService.mapBackendRoleToFrontend(r));
        } catch (error) {
            console.error('Error fetching roles:', error);
            return [];
        }
    },

    // Get all available permissions grouped by module
    getAvailablePermissions: async (): Promise<any[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/permissions?per_page=1000`, {
                headers: getHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch permissions');
            const data = await response.json();
            return data.data.items || [];
        } catch (error) {
            console.error('Error fetching permissions:', error);
            return [];
        }
    },

    // Get all permission groups
    getPermissionGroups: async (): Promise<PermissionGroup[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/permission-groups`, {
                headers: getHeaders()
            });
            if (!response.ok) {
                console.warn(`Permission groups fetch returned status ${response.status}`);
                return [];
            }
            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('Error fetching permission groups:', error);
            return [];
        }
    },

    // Create Permission
    createPermission: async (data: { name: string, description: string }): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/permissions`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to create permission');
        }

        return result.data;
    },

    // Create Role
    createRole: async (roleData: any): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/roles`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                name: roleData.name.toLowerCase().replace(/\s+/g, '_'),
                display_name: roleData.display_name || roleData.name,
                description: roleData.description,
                level: roleData.level || 'staff',
                hierarchy: roleData.hierarchy || 100,
                is_default: roleData.is_default || false,
                is_editable: roleData.is_editable ?? true,
                restrictions: roleData.restrictions || null,
                permissions: roleData.permissionIds || []
            })
        });
        const data = await response.json();
        if (!response.ok) {
            const msg = data.errors
                ? Object.values(data.errors).flat().join(', ')
                : (data.message || 'Failed to create role');
            throw new Error(msg);
        }
        return data.data;
    },

    // Update Role
    updateRole: async (id: string, roleData: any): Promise<any> => {
        // Convert permission matrix to a simple array of {module, action} pairs for backend
        const permissionMatrix: Array<{ module: string, action: string }> = [];

        if (roleData.permissionMatrix) {
            // Already formatted
            permissionMatrix.push(...roleData.permissionMatrix);
        } else if (Array.isArray(roleData.permissions) && roleData.permissions.length > 0 && typeof roleData.permissions[0] === 'object' && 'module' in roleData.permissions[0]) {
            // It's a matrix format from the frontend modal
            roleData.permissions.forEach((row: any) => {
                Object.entries(row.permissions || {}).forEach(([action, value]) => {
                    if (value) {
                        permissionMatrix.push({ module: row.module, action });
                    }
                });
            });
        }

        const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({
                display_name: roleData.display_name || roleData.name,
                description: roleData.description,
                level: roleData.level,
                hierarchy: roleData.hierarchy,
                is_default: roleData.is_default,
                is_editable: roleData.is_editable,
                restrictions: roleData.restrictions,
                permission_matrix: permissionMatrix // Send matrix for dynamic permission creation
            })
        });
        const data = await response.json();
        if (!response.ok) {
            const msg = data.errors
                ? Object.values(data.errors).flat().join(', ')
                : (data.message || 'Failed to update role');
            throw new Error(msg);
        }
        return data.data;
    },

    // Delete Role
    deleteRole: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to delete role');
        }
    },

    // Mapping Helpers
    mapBackendRoleToFrontend: (backendRole: any): Role => {
        const moduleMap: Record<string, Record<string, boolean>> = {};

        backendRole.permissions?.forEach((p: any) => {
            const module = p.module || 'System';
            const action = p.name.split('.').pop() || p.name;

            if (!moduleMap[module]) moduleMap[module] = {};
            moduleMap[module][action] = true;
        });

        const permissions: Permission[] = Object.entries(moduleMap).map(([module, perms]) => ({
            module,
            permissions: perms
        }));

        return {
            id: backendRole.id.toString(),
            name: backendRole.name,
            display_name: backendRole.display_name,
            description: backendRole.description || '',
            userCount: backendRole.users_count || 0,
            level: backendRole.level || 'staff',
            hierarchy: backendRole.hierarchy || 100,
            is_system: backendRole.is_system || false,
            is_default: backendRole.is_default || false,
            is_editable: backendRole.is_editable ?? true,
            restrictions: backendRole.restrictions || null,
            permissions
        };
    },

    // Map Frontend Matrix back to Permission IDs
    getPermissionIdsFromMatrix: (matrix: Permission[], allPermissions: any[]): number[] => {
        const ids: number[] = [];
        matrix.forEach(modulePerm => {
            Object.entries(modulePerm.permissions).forEach(([action, value]) => {
                if (value) {
                    // Find all permissions that match this module and action
                    // Supports exact match: 'users.view' 
                    // Supports nested matches: 'users.roles.manage' -> matches action 'manage' for module 'users'
                    const matches = allPermissions.filter(p => {
                        const isSameModule = p.module === modulePerm.module || (!p.module && modulePerm.module === 'System');
                        const isActionMatch = p.name.endsWith('.' + action) || p.name === action;
                        return isSameModule && isActionMatch;
                    });

                    matches.forEach(match => ids.push(match.id));
                }
            });
        });
        return [...new Set(ids)];
    },

    // Delete Permission
    deletePermission: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/permissions/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to delete permission');
        }
    }
};
