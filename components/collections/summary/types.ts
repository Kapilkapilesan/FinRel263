export interface BranchCollection {
    branch: string;
    branchId: string;
    target: number;
    collected: number;
    variance: number;
    total_active_customers: number;
    due_customers: number;
    paid_customers: number;
    achievement: number;
}

export interface SummaryStats {
    totalTarget: number;
    totalCollected: number;
    totalVariance: number;
    totalActiveCustomers: number;
    totalDueCustomers: number;
    totalPaidCustomers: number;
    achievement: number;
}
