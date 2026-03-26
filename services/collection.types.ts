export interface ScheduledPayment {
    id: string;
    customer: string;
    customerId: string;
    customerCode: string;
    contractNo: string;
    dueAmount: number;
    standardRental: number;
    arrears: number;
    suspense_balance: number;
    group: string;
    center_name: string;
    outstanding: number;
    rentel: number;
    address: string;
    nic?: string;
    center_id?: string;
    penalty?: number;
    breakdown?: Array<{
        date: string;
        type: string;
        amount: number;
        penalty: number;
    }>;
    can_collect?: boolean;
    totalPayable: number;
    unsettled_collection_amount?: number;
}

export interface CollectionStats {
    totalDue: number;
    collected: number;
    arrears: number;
    suspense: number;
}

export interface PaymentCollectionRequest {
    loan_id: string;
    amount: number;
    payment_date: string;
    receipt_number?: string;
}

export interface PaymentHistoryItem {
    id: number;
    last_payment_amount: number;
    last_payment_date: string;
    current_balance_amount: number;
    current_capital_balance: number;
    current_balance_interest: number;
    interest_amount: number;
    rental_amount: number;
    total_due: number;
    remained_due: number;
    arrears: number;
    arrears_age: number;
    receipt?: {
        id: number;
        receipt_id: string;
        status: string;
    };
}
