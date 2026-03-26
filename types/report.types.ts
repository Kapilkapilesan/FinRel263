// Report Types for Reports Export Feature

export interface ReportColumn {
    key: string;
    label: string;
    width?: number;
}

export interface ReportRow {
    id: string;
    csu_no: string;
    agreement_no: string;
    agreement_date: string;
    borrower_full_name: string;
    borrower_nic_no: string;
    mobile_number: string;
    age: number | null;
    loan_amount: number;
    rental: number;
    borrower_full_address: string;
    borrower_bank_name: string;
    borrower_bank_branch: string;
    borrower_bank_account_no: string;
    bank_transfer_amount: number;
    full_balance: number;
    arrears: number;
    arrears_age: number;
    payment_balance: number;
    center_name: string;
    branch: string;
    loan_disbursement_date: string;
    last_payment_date: string;
    last_payment_amount: number;
    csu_officer: string;
    contract_status: string;
    product_code: string;
    monthly_collect_amount: number;
    total_collect_amount: number;
}

export interface ReportStats {
    total_reports: number;
    downloads_this_month: number;
    scheduled_reports: number;
    last_generated: string;
}

export interface ReportFilter {
    column: string;
    value: string;
}

export interface ExportPayload {
    rowIds?: string[];
    columns: string[];
    filters?: Record<string, string>;
}

// All 27 report columns definition
export const REPORT_COLUMNS: ReportColumn[] = [
    { key: 'csu_no', label: 'CSU NO', width: 100 },
    { key: 'agreement_no', label: 'AGREEMENT NO', width: 140 },
    { key: 'agreement_date', label: 'AGREEMENT DATE', width: 130 },
    { key: 'borrower_full_name', label: 'BORROWER FULL NAME', width: 180 },
    { key: 'borrower_nic_no', label: 'BORROWER NIC NO', width: 140 },
    { key: 'mobile_number', label: 'MOBILE NUMBER', width: 130 },
    { key: 'age', label: 'AGE', width: 60 },
    { key: 'loan_amount', label: 'LOAN AMOUNT', width: 120 },
    { key: 'rental', label: 'RENTAL', width: 100 },
    { key: 'borrower_full_address', label: 'BORROWER FULL ADDRESS', width: 250 },
    { key: 'borrower_bank_name', label: 'BORROWER BANK NAME', width: 160 },
    { key: 'borrower_bank_branch', label: 'BORROWER BANK BRANCH', width: 160 },
    { key: 'borrower_bank_account_no', label: 'BORROWER BANK ACCOUNT NO', width: 180 },
    { key: 'bank_transfer_amount', label: 'BANK TRANSFER AMOUNT', width: 160 },
    { key: 'full_balance', label: 'FULL BALANCE', width: 120 },
    { key: 'arrears', label: 'ARREARS', width: 100 },
    { key: 'arrears_age', label: 'ARREARS AGE', width: 100 },
    { key: 'payment_balance', label: 'PAYMENT BALANCE', width: 130 },
    { key: 'center_name', label: 'CENTER NAME', width: 140 },
    { key: 'branch', label: 'BRANCH', width: 120 },
    { key: 'loan_disbursement_date', label: 'LOAN DISBURSEMENT DATE', width: 170 },
    { key: 'last_payment_date', label: 'LAST PAYMENT DATE', width: 150 },
    { key: 'last_payment_amount', label: 'LAST PAYMENT AMOUNT', width: 160 },
    { key: 'csu_officer', label: 'CSU OFFICER', width: 140 },
    { key: 'contract_status', label: 'CONTRACT STATUS', width: 130 },
    { key: 'product_code', label: 'PRODUCT CODE', width: 120 },
    { key: 'monthly_collect_amount', label: 'MONTHLY COLLECTION AMOUNT', width: 170 },
    { key: 'total_collect_amount', label: 'TOTAL COLLECTION AMOUNT', width: 170 },
];
