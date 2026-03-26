import { Loan } from './loan.types';

export type ApprovalStatus = 'Pending' | 'Approved' | 'Sent Back' | null;
export type LoanStatus = 'Pending 1st' | 'Pending 2nd' | 'Approved' | 'Sent Back';

export interface LoanDetails {
    purpose: string;
    tenure: number;
    interestRate: number;
    center: string;
    group: string;
    branchManager: string;
    branchName: string;
    branchId: string | number;
}

export interface LoanApprovalItem {
    id: string;
    serialNo: number;
    contractNo: string;
    customerName: string;
    nic: string;
    loanAmount: number;
    staff: string;
    submittedDate: string;
    submittedTime: string;
    firstApproval: ApprovalStatus;
    firstApprovalBy?: string;
    firstApprovalDate?: string;
    secondApproval: ApprovalStatus;
    secondApprovalBy?: string;
    secondApprovalDate?: string;
    status: LoanStatus;
    rejectionReason?: string;
    loanDetails: LoanDetails;
    bankDetails?: {
        bankName: string;
        accountNumber: string;
    };
    rawLoan: Loan;
}

export interface LoanApprovalFilters {
    searchTerm: string;
    filterStatus: string;
}
