export interface Transaction {
    id: number;
    staff_id: string;
    user_name?: string;
    amount: string;
    type: 'inflow' | 'outflow';
    category: string;
    status: string;
    soap_ref_no?: string;
    timestamp: string;
    staff?: {
        full_name: string;
    };
    created_at: string;
}

export interface BranchExpense {
    id: number;
    request_id?: string;
    branch_id: number;
    transaction_id?: number;
    type: 'inflow' | 'outflow';
    date: string;
    expense_type: string;
    medium: string;
    description: string;
    amount: string;
    status: 'Approved' | 'Pending' | 'Rejected' | 'Cancelled';
    approved_by?: number;
    approved_at?: string;
    rejection_reason?: string;
    transaction?: Transaction;
    requested_by_user?: {
        user_name: string;
        staff_id?: string;
    };
    approver?: {
        user_name: string;
    };
    branch?: {
        branch_name: string;
    };
    created_at: string;
}

export interface ExpenseFormData {
    branch_id: number;
    staff_id: string;
    amount: number;
    type: string;
    expense_type: string;
    medium: string;
    date: string;
    description?: string;
}

export interface FinanceOverviewStats {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    incomeChange: number;
    expenseChange: number;
    profitChange: number;
}

export interface BreakdownItem {
    name: string;
    value: number;
    color: string;
    [key: string]: any;
}

export interface FinanceOverviewData {
    stats: FinanceOverviewStats;
    incomeBreakdown: BreakdownItem[];
    expenseBreakdown: BreakdownItem[];
    recentTransactions: any[]; // Using flexible type for now to match UI specific table row
}

export interface FinanceApiResponse<T> {
    statusCode: number;
    message: string;
    data: T;
}
