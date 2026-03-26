import { Customer } from './customer.types';
import { InvestmentProduct as BaseProduct } from './investment-product.types';

export interface Nominee {
    name: string;
    id_type: 'NIC' | 'BC';
    nic: string; // This will store either NIC or BC number
    relationship: string;
}

export interface Witness {
    staff_id?: string;
    name: string;
    nic: string;
    address: string;
}

export interface Investment {
    id: number;
    product_id: number;
    customer_id: number;
    amount: number;
    transaction_id: string;
    start_date: string;
    maturity_date: string;
    status: 'PENDING_APPROVAL' | 'APPROVED_AWAITING_PAYMENT' | 'APPROVED_AWAITING_ACTIVATION' | 'ACTIVE' | 'CLOSED' | 'RENEWED' | 'MATURED';
    print_count: number;
    is_reprint_authorized: boolean;
    reprint_requested: boolean;
    reprint_reason?: string;
    receipt_number?: string;

    // Snapshot fields
    snapshot_product_code: string;
    snapshot_product_name: string;
    snapshot_payout_type: 'MONTHLY' | 'MATURITY';
    snapshot_policy_term: number;
    snapshot_interest_rate_monthly: number;
    snapshot_interest_rate_maturity: number;
    snapshot_early_break_rate_monthly: number;
    snapshot_early_break_rate_maturity: number;
    snapshot_negotiation_rate: number;

    nominees: Nominee[];
    witnesses: Witness[];
    bank_details?: {
        bank_id?: string | number;
        bank_name: string;
        branch_id?: string | number;
        branch?: string;
        account_number: string;
        holder_name?: string;
    };
    time_stamp: string;
    created_at: string;

    // Relations
    customer?: Customer;
    product?: BaseProduct;
    branch?: { id: number; branch_name: string };
    created_by?: { name: string; user_name: string };
    activated_by?: { name: string; user_name: string };
}

export interface InvestmentFormData {
    product_id: string;
    customer_id: string;
    amount: string;
    policy_term: string;
    start_date: string;
    nominees: Nominee[];
    witnesses: Witness[];
    negotiation_rate: string;
    bank_details?: {
        bank_id?: string;
        bank_name: string;
        branch_id?: string;
        branch: string;
        account_number: string;
        holder_name: string;
    };
}
