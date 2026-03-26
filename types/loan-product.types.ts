export interface LoanProduct {
    id: number;
    product_code: string;
    product_name: string;
    product_type: 'micro_loan' | 'investor_loan' | 'staff_loan' | 'advance_loan';
    gender_type: 'male' | 'female' | 'both';
    product_details: string | null;
    term_type: string;
    regacine: string | null;
    interest_rate: number;
    loan_limited_amount: number | null;
    loan_amount: number;
    min_amount: number;
    max_amount: number;
    document_fees: number | null;
    product_terms: { id?: number; term: number; interest_rate: number }[];
    loan_term: number;
    customer_age_limited: number | null;
    customer_monthly_income: number | null;
    guarantor_monthly_income: number | null;
    status: 'pending_1st' | 'pending_2nd' | 'approved' | 'sent_back' | 'active' | 'inactive' | 'cancelled';
    approval_level: number;
    customer_id?: number;
    customer?: any;
    created_at: string;
    updated_at: string;
}

export interface LoanProductFormData {
    product_code: string;
    product_name: string;
    product_type: 'micro_loan' | 'investor_loan' | 'staff_loan' | 'advance_loan';
    gender_type: 'male' | 'female' | 'both';
    gender?: 'male' | 'female' | 'both';
    product_details?: string;
    term_type: string;
    regacine?: string;
    interest_rate?: number; // kept for compatibility or single value legacy
    min_amount: number;
    max_amount: number;
    document_fees: number;
    loan_limited_amount?: number; // legacy
    loan_amount?: number; // legacy
    loan_term?: number; // legacy
    product_terms: { term: number; interest_rate: number }[];
    customer_age_limited?: number;
    customer_monthly_income?: number;
    guarantor_monthly_income?: number;
}

export interface LoanProductFilters {
    product_name?: string;
    term_type?: string;
    min_interest_rate?: number;
    max_interest_rate?: number;
    min_loan_amount?: number;
    max_loan_amount?: number;
    status?: string;
}

export interface ApiResponse<T> {
    status: string;
    status_code: number;
    message: string;
    data: T;
}
