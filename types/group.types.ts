import { Customer } from './customer.types';

export interface GroupMember {
    id: string;
    name: string;
    customer_id: string;
    joined_date: string;
    status: 'active' | 'inactive';
}

export interface Group {
    id: number;
    group_code?: string;
    group_name: string;
    center_id: string;
    branch_id?: string;
    member_count?: number;
    customers_count?: number;
    loans_count?: number;
    created_at?: string;
    updated_at?: string;
    status: 'active' | 'inactive';

    // Relations (if populated by backend)
    center?: {
        id: number;
        center_name: string;
        CSU_id: string;
        branch_id?: number;
        branch?: {
            id: number;
            branch_id: string;
            branch_name: string;
        };
    };
    branch?: {
        id: number;
        branch_id: string;
        branch_name: string;
    };
    members?: GroupMember[];
    customers?: Customer[];
}

export interface GroupFormData {
    id?: number;
    group_name: string;
    center_id: string;
    branch_id?: string;
    status?: 'active' | 'inactive';
    customer_ids?: string[];
}

export interface GroupStats {
    totalGroups: number;
    activeGroups: number;
    totalMembers: number;
    avgMembersPerGroup: number;
}

// API Response Wrappers
export interface ApiResponse<T> {
    status: string;
    status_code?: number;
    message: string;
    data: T;
    error?: string;
    errors?: Record<string, string[]>;
}
