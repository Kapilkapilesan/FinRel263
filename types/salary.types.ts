export interface SalaryPayment {
    id: string;
    employeeName: string;
    employeeId: string; // User ID or Staff ID
    month: string; // e.g., "January 2026"
    baseSalary: number;
    allowances: number;
    deductions: number;
    netPayable: number;
    paymentDate: string;
    status: 'Paid' | 'Processing' | 'Pending' | 'Approved' | 'Disbursed';
    paymentMethod: 'Bank Transfer' | 'Cash' | 'Cheque';
}

export interface SalaryStats {
    totalPayroll: number;
    processedCount: number;
    averageSalary: number;
    activeHeadcount: number;
    eligibleForPayroll: number; // For the "Eligible for payroll" count
    currentMonth?: string;
}

export interface PayrollMonth {
    label: string;
    value: string; // YYYY-MM format
}
