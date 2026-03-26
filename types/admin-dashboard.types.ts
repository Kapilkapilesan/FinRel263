export interface AdminDashboardStats {
    shareholdersTotalPersistentCapital: number;
    investmentTotal: number;
    totalIncome: number;
    totalExpense: number;
    netFlow: number;
    totalFundTruncation: number;
}

export interface Branch {
    id: number;
    branch_name: string;
    branch_code: string;
}

export interface BranchCollectionEfficiency {
    branch_id: number;
    branch_name: string;
    monthly_target: number;
    total_collection: number;
    efficiency_percentage: number;
    status: 'Critical' | 'Good' | 'Excellent';
    message: string;
}

export interface MonthlyCollectionData {
    month: string;
    amount: number;
}

export interface MonthlyFinancialData {
    month: string;
    income: number;
    disbursements: number;
}
