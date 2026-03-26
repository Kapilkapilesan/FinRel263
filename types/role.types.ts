export interface PermissionGroup {
    id: number;
    name: string;
    slug: string;
    description: string;
    icon?: string;
    color?: string;
}

export interface Privilege {
    id: string;
    name: string;
    description: string;
    display_name?: string;
    module?: string;
    permission_group_id?: number;
    is_core?: boolean;
    group?: PermissionGroup;
}

export interface Permission {
    module: string;
    permissions: { [key: string]: boolean };
}

export interface Role {
    id: string;
    name: string;
    display_name?: string;
    description: string;
    userCount: number;
    level: string;
    hierarchy: number;
    is_system: boolean;
    is_default: boolean;
    is_editable: boolean;
    restrictions?: any;
    permissions: Permission[];
}
