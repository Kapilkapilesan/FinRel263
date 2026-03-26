import { CustomerRecord } from '@/types/loan.types';

export const STORAGE_KEYS = {
    DRAFT: 'loanCreationDraft',
    DRAFT_LIST: 'loanCreationDraftList',
} as const;

export const LOAN_LIMITS = {
    MAX_AMOUNT: 500000,
    MAX_DRAFT_COUNT: 10,
} as const;

export const RENTAL_TYPES = ['Weekly', 'Bi-Weekly', 'Monthly'] as const;

export const DOCUMENT_TYPES = [
    'NIC Copy',
    'Guardian NIC',
    'Bank Statement',
    'Customer sign',
    'Customer Photo',
    'Address Proof',
    'Income Proof',
    'Application Form',
    'Family Card',
] as const;

export const REQUIRED_DOCUMENTS = [
    'NIC Copy',
    'Guardian NIC',
    'Bank Statement',
    'Customer sign',
] as const;

export const CUSTOMER_RECORDS: CustomerRecord[] = [
    {
        id: 'CUST001',
        name: 'Nimal Perera',
        displayName: 'Nimal Perera - CUST001',
        nic: '198512345V',
        center: 'Colombo Central CSU',
        group: 'Colombo Group A',
        status: 'Active member with good payment history',
        previousLoans: '2 completed successfully',
    },
    {
        id: 'CUST002',
        name: 'Saman Kumara',
        displayName: 'Saman Kumara - CUST002',
        nic: '199023456V',
        center: 'Kandy CSU',
        group: 'Kandy Group B',
        status: 'Active member',
        previousLoans: 'No previous loans',
    },
    {
        id: 'CUST003',
        name: 'Dilini Silva',
        displayName: 'Dilini Silva - CUST003',
        nic: '199234567V',
        center: 'Galle CSU',
        group: 'Galle Group C',
        status: 'Active member',
        previousLoans: '1 completed successfully',
    },
    {
        id: 'CUST004',
        name: 'Kamala Fernando',
        displayName: 'Kamala Fernando - CUST004',
        nic: '198834567V',
        center: 'Negombo CSU',
        group: 'Negombo Group D',
        status: 'Active member',
        previousLoans: 'No previous loans',
    },
    {
        id: 'CUST005',
        name: 'Rajitha Bandara',
        displayName: 'Rajitha Bandara - CUST005',
        nic: '199445678V',
        center: 'Matara CSU',
        group: 'Matara Group E',
        status: 'Active member',
        previousLoans: '1 active loan',
    },
];

export const SRI_LANKAN_BANKS = [
    "Bank of Ceylon",
    "People's Bank",
    "Commercial Bank of Ceylon PLC",
    "Hatton National Bank PLC",
    "Sampath Bank PLC",
    "Seylan Bank PLC",
    "National Savings Bank",
    "Nations Trust Bank PLC",
    "Pan Asia Banking Corporation PLC",
    "DFCC Bank PLC",
    "Union Bank of Colombo PLC",
    "Amana Bank PLC",
    "National Development Bank PLC",
    "Regional Development Bank",
    "Sanasa Development Bank PLC",
    "HDFC Bank of Sri Lanka",
    "Cargills Bank Limited",
    "Lankaputhra Development Bank",
    "State Mortgage & Investment Bank"
] as const;


// Bank Account Validation Rules
// Based on common Sri Lankan bank account formats
export const BANK_VALIDATION_RULES: Record<string, { regex: RegExp; error: string; digits: string }> = {
    "Bank of Ceylon": {
        regex: /^\d{8,15}$/,
        error: "Bank of Ceylon accounts must be 8-15 digits",
        digits: "8-15"
    },
    "People's Bank": {
        regex: /^(\d{12}|\d{15})$/,
        error: "People's Bank accounts must be 12 or 15 digits",
        digits: "12 or 15"
    },
    "Commercial Bank of Ceylon PLC": {
        regex: /^\d{10}$/,
        error: "Commercial Bank accounts must be exactly 10 digits",
        digits: "10"
    },
    "Hatton National Bank PLC": {
        regex: /^\d{11}$/,
        error: "HNB accounts must be exactly 11 digits",
        digits: "11"
    },
    "Sampath Bank PLC": {
        regex: /^\d{12}$/,
        error: "Sampath Bank accounts must be exactly 12 digits",
        digits: "12"
    },
    "National Savings Bank": {
        regex: /^(\d{10}|\d{12})$/,
        error: "NSB accounts must be 10 or 12 digits",
        digits: "10 or 12"
    },
    "Seylan Bank PLC": {
        regex: /^\d{12}$/,
        error: "Seylan Bank accounts must be exactly 12 digits",
        digits: "12"
    },
    "Default": {
        regex: /^\d{6,20}$/,
        error: "Account number must be 6-20 digits",
        digits: "6-20"
    }
};
