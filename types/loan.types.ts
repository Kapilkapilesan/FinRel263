// ============================================
// LOAN STATUS CONSTANTS
// ============================================
// Approval Workflow Statuses
export const LOAN_STATUS_PENDING_1ST = 'pending_1st';      // Awaiting 1st level approval
export const LOAN_STATUS_PENDING_2ND = 'pending_2nd';      // Awaiting 2nd level approval (for loans >= 200,000)
export const LOAN_STATUS_APPROVED = 'approved';            // Fully approved, ready for activation
export const LOAN_STATUS_ACTIVATED = 'activated';          // Activated at branch, ready for payout request
export const LOAN_STATUS_AWAITING_TRANSFER = 'awaiting_transfer'; // Payout requested, waiting for admin bank transfer
export const LOAN_STATUS_SENT_BACK = 'sent_back';          // Returned to field officer for corrections

// Loan Lifecycle Statuses
export const LOAN_STATUS_ACTIVE = 'Active';                // Disbursed and currently being collected
export const LOAN_STATUS_COMPLETED = 'Completed';          // Fully paid off
export const LOAN_STATUS_REJECTED = 'Rejected';            // Permanently rejected

// All Possible Statuses
export const LOAN_STATUSES = [
    LOAN_STATUS_PENDING_1ST,
    LOAN_STATUS_PENDING_2ND,
    LOAN_STATUS_APPROVED,
    LOAN_STATUS_ACTIVATED,
    LOAN_STATUS_AWAITING_TRANSFER,
    LOAN_STATUS_SENT_BACK,
    LOAN_STATUS_ACTIVE,
    LOAN_STATUS_COMPLETED,
    LOAN_STATUS_REJECTED,
] as const;

// Statuses considered "active" (loan is ongoing)
export const LOAN_ACTIVE_STATUSES = [
    LOAN_STATUS_PENDING_1ST,
    LOAN_STATUS_PENDING_2ND,
    LOAN_STATUS_APPROVED,
    LOAN_STATUS_SENT_BACK,
    LOAN_STATUS_ACTIVE,
] as const;

// Statuses considered "closed" (loan is finished)
export const LOAN_CLOSED_STATUSES = [
    LOAN_STATUS_COMPLETED,
    LOAN_STATUS_REJECTED,
] as const;

// Status display labels for UI
export const LOAN_STATUS_LABELS: Record<string, string> = {
    [LOAN_STATUS_PENDING_1ST]: 'Pending 1st Approval',
    [LOAN_STATUS_PENDING_2ND]: 'Pending 2nd Approval',
    [LOAN_STATUS_APPROVED]: 'Approved',
    [LOAN_STATUS_ACTIVATED]: 'Activated',
    [LOAN_STATUS_AWAITING_TRANSFER]: 'Awaiting Transfer',
    [LOAN_STATUS_SENT_BACK]: 'Sent Back',
    [LOAN_STATUS_ACTIVE]: 'Active',
    [LOAN_STATUS_COMPLETED]: 'Completed',
    [LOAN_STATUS_REJECTED]: 'Rejected',
};

// Utility function to get display label
export const getLoanStatusLabel = (status: string): string => {
    return LOAN_STATUS_LABELS[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Utility function to check if loan is active/ongoing
export const isLoanActive = (status: string): boolean => {
    return (LOAN_ACTIVE_STATUSES as readonly string[]).includes(status);
};

// Utility function to check if loan is closed
export const isLoanClosed = (status: string): boolean => {
    return (LOAN_CLOSED_STATUSES as readonly string[]).includes(status);
};

// Type for loan status
export type LoanStatus = typeof LOAN_STATUSES[number];

export interface LoanFormData {
    center: string;
    group: string;
    customer: string;
    nic: string;
    loanProduct: string;
    loanAmount: string;
    requestedAmount: string;
    interestRate: string;
    rentalType: 'Weekly' | 'Bi-Weekly' | 'Monthly';
    tenure: string;
    processingFee: string;
    documentationFee: string;
    insuranceFee: string;
    remarks: string;
    status: 'draft' | 'pending' | 'approved' | 'rejected';
    guardian_nic: string;
    guardian_name: string;
    guardian_relationship: string;
    guardian_address: string;
    guardian_phone: string;
    guardian_secondary_phone: string;
    guardian_dob: string;
    guardianSource?: 'auto' | 'manual';
    guarantor1_name: string;
    guarantor1_nic: string;
    guarantor1_address: string;
    guarantor2_name: string;
    guarantor2_nic: string;
    guarantor2_address: string;
    witness1_id: string;
    witness2_id: string;
    bankName: string;
    bankId: string;
    bankBranch: string;
    bankBranchId: string;
    accountNumber: string;
    monthly_income: string;
    monthly_expenses: string;
    reloan_deduction_amount?: number;
    originalLoanProductId?: string;
    calculated_rental?: number;
    documents: Record<string, File | null>;
    existingDocuments?: LoanDocument[];
}

export interface CustomerRecord {
    id: string;
    name: string;
    displayName: string;
    nic: string;
    center: string;
    group: string;
    groupId?: string;
    branch?: string;
    status: string;
    previousLoans: string;
    activeLoanAmount?: number;
    totalLoanCount?: number;
    profileImage?: string;
    nicImage?: string;
    gender?: string;
    age?: number;
    phone?: string;
    monthly_income?: number;
    address?: string;
    reloan_eligibility?: {
        isEligible: boolean;
        progress: number;
        paid_weeks?: number;
        total_weeks?: number;
        balance?: number;
    } | null;
}

export interface LoanStep {
    number: number;
    title: string;
    description: string;
    icon: React.ReactNode;
}

export interface DraftItem {
    id: string;
    name: string;
    savedAt: string;
    formData: LoanFormData;
    currentStep: number;
}

export interface DraftPayload {
    formData: LoanFormData;
    currentStep: number;
}

export interface Loan {
    id: number;
    loan_id: string;
    contract_number?: string;
    customer_id: number;
    customer?: {
        id: number;
        full_name: string;
        customer_code: string;
        customer_id: string;
        nic?: string;
    };
    product?: {
        id: number;
        product_name: string;
        term_type: string;
    };
    approved_amount: number;
    center?: {
        id: number;
        center_name: string;
        CSU_id?: string;
        branch?: {
            id: number;
            branch_name: string;
            manager_name: string;
        };
    };
    request_amount?: number;
    loan_step?: string;
    service_charge?: number;
    document_charge?: number;
    outstanding_amount: number;
    interest_rate: number;
    terms: number;
    term_type?: string;
    status: LoanStatus | 'cancelled' | 'cancellation_pending' | 'Defaulted' | 'rejected' | 'Active';
    agreement_date: string;
    activation_date?: string;
    payout_requested_at?: string;
    end_term: string;
    created_at: string;
    amount?: number; // Alias for approved_amount in some contexts
    g1_details?: { name: string; nic: string; address?: string };
    g2_details?: { name: string; nic: string; address?: string };
    w1_details?: { staff_id: string; name: string };
    w2_details?: { staff_id: string; name: string };
    guardian_nic?: string;
    guardian_name?: string;
    guardian_relationship?: string;
    guardian_address?: string;
    guardian_phone?: string;
    guardian_secondary_phone?: string;
    guardian_dob?: string;
    monthly_income?: number;
    monthly_expenses?: number;
    bank_id?: number;
    bank_branch_id?: number;
    notes?: string;
    rentel?: number;
    staff?: {
        id: number;
        full_name: string;
        user_name: string;
    };
    group?: {
        id: number;
        group_name: string;
    };
    rejection_reason?: string;
    approve_history?: {
        first?: { id: number; name: string; at: string };
        second?: { id: number; name: string; at: string };
    };
    borrower_bank_details?: {
        bank_name: string;
        bank_id?: number;
        branch?: string;
        branch_id?: number;
        account_number: string;
    };
    reloan_deduction_amount?: number;
    reloan_eligibility?: {
        isEligible: boolean;
        progress: number;
        paid_weeks: number;
        total_weeks: number;
        balance: number;
    };
    documents?: LoanDocument[];
    full_amount?: number;
    cancellation_reason_staff?: string;
    cancellation_reason_manager?: string;
}

export interface LoanDocument {
    id: number;
    loan_id: number;
    type: string;
    file_path: string;
    file_name: string;
    file_size: number;
    url: string;
    created_at: string;
}

export interface LoanStats {
    total_count: number;
    active_count: number;
    completed_count: number;
    total_disbursed: number;
    total_outstanding: number;
}
