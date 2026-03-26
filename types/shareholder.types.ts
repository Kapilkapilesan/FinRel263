export interface Shareholder {
    id: string;
    name: string;
    shares: number;
    percentage: number;
    total_investment: number;
    nic?: string;
    contact?: string;
    address?: string;
    created_at?: string;
    updated_at?: string;
}

export interface NewShareholder {
    name: string;
    totalInvestment: string; // Only editable field - used in form state
    nic: string;
    contact: string;
    address: string;
}

// System constants - these are fixed values from backend
export interface ShareholderSystemInfo {
    total_company_investment: number; // LKR 20,000,000
    total_shares: number; // 100
    total_invested: number;
    remaining_capacity: number;
    total_percentage_allocated?: number;
    total_shares_allocated?: number;
    available_percentage?: number;
    available_shares?: number;
}

// Response from getAll API
export interface ShareholdersResponse {
    shareholders: Shareholder[];
    system_info: ShareholderSystemInfo;
}

// Preview calculation for real-time updates
export interface CalculationPreview {
    investment_amount: number;
    percentage: number;
    shares: number;
    remaining_capacity: number;
    is_valid: boolean;
    error_message: string | null;
}

