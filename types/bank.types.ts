// Types for Bank & Branch management (external banking partners)

export interface Bank {
    id: number;
    bank_name: string;
    bank_code: string;
    status: 'active' | 'inactive';
    branches_count: number;
    created_at?: string;
    updated_at?: string;
}

export interface BankBranch {
    id: number;
    bank_id: number;
    branch_name: string;
    branch_code: string | null;
    address: string | null;
    phone: string | null;
    status: 'active' | 'inactive';
    created_at?: string;
    updated_at?: string;
}

export interface BankFormData {
    bank_name: string;
    bank_code: string;
}

export interface BankBranchFormData {
    branch_name: string;
    branch_code?: string;
    address?: string;
    phone?: string;
}

export interface BankWithBranches {
    bank: Bank;
    branches: BankBranch[];
}

export interface ApiResponse<T> {
    status: string;
    status_code: number;
    message: string;
    data: T;
    error?: string;
    errors?: Record<string, string[]>;
}
