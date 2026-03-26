export interface DashboardStats {
    activeLoansCount: number;
    totalDisbursementsAmount: number;
    pendingApprovalsCount: number;
    todayCollectionAmount: number;
}

export interface BranchPerformanceData {
    branch_id: number;
    branch_name: string;
    branch_code: string;
    manager_name: string;
    total_staff: number;
    location: string;
    phone?: string;

    // Pending Requests
    pending_loan_requests: PendingRequest[];
    pending_center_requests: PendingRequest[];
    pending_promotion_requests: PendingRequest[];
    pending_increment_requests: PendingRequest[];
    pending_center_change_requests: PendingRequest[];
    pending_customer_edit_requests: PendingRequest[];
    pending_leave_requests: PendingRequest[];
    pending_activation_requests: PendingRequest[];
    pending_disbursement_requests: PendingRequest[];
    pending_salary_requests: PendingRequest[];
    pending_attendance_requests: PendingRequest[];
    pending_receipt_requests: PendingRequest[];
    pending_iou_requests: PendingRequest[];
    pending_expense_requests: PendingRequest[];
    pending_investment_requests: PendingRequest[];

    // Approval Requests
    approved_loan_requests: ApprovedRequest[];
    approved_center_requests: ApprovedRequest[];
    approved_promotion_requests: ApprovedRequest[];
    approved_increment_requests: ApprovedRequest[];
    approved_center_change_requests: ApprovedRequest[];
    approved_customer_edit_requests: ApprovedRequest[];
    approved_leave_requests: ApprovedRequest[];
    approved_salary_requests: ApprovedRequest[];
    approved_iou_requests: ApprovedRequest[];
    approved_expense_requests: ApprovedRequest[];
    approved_investment_requests: ApprovedRequest[];

    // Staff Data (will vary based on day/month/year filter)
    staff_attendance: (StaffAttendanceRecord | StaffMonthlyAttendance)[];
}

export interface PendingRequest {
    id: number;
    type: 'loan' | 'center' | 'promotion' | 'increment' | 'center_change' | 'customer_edit' | 'leave' | 'loan_activation' | 'disbursement' | 'salary' | 'attendance' | 'receipt_cancellation' | 'staff_iou' | 'branch_expense' | 'investment';
    request_date: string;
    amount?: number;
    loan_id?: string;
    contract_number?: string;
    customer_name?: string;
    center_name?: string;
    staff_name?: string;
    role_change?: string;
    change_detail?: string;
    leave_type?: string;
    duration?: string;
    status: string;
}

export interface ApprovedRequest {
    id: number;
    type: 'loan' | 'center' | 'promotion' | 'increment' | 'center_change' | 'customer_edit' | 'leave' | 'salary' | 'staff_iou' | 'branch_expense' | 'investment';
    request_date: string;
    approved_date: string;
    amount?: number;
    loan_id?: string;
    contract_number?: string;
    customer_name?: string;
    center_name?: string;
    staff_name?: string;
    role_change?: string;
    change_detail?: string;
    leave_type?: string;
    duration?: string;
}

export interface StaffAttendanceRecord {
    staff_id: string;
    staff_name: string;
    status: 'present' | 'absent' | 'half day' | 'leave' | 'not marked';
    check_in_time?: string;
    check_out_time?: string;
    avatar?: string;
}

export interface StaffMonthlyAttendance {
    staff_id: string;
    staff_name: string;
    avatar?: string;
    present_count: number;
    absent_count: number;
    half_day_count: number;
    leave_count: number;
    not_marked_count: number;
}

export type AttendanceFilter = 'all' | 'present' | 'absent' | 'half day' | 'leave' | 'not marked';
export type DateFilter = 'day' | 'month' | 'year' | 'custom';

export interface BranchSummary {
    id: number;
    branch_id: string;
    branch_name: string;
    branch_code: string;
    manager_name: string;
    location: string;
    phone?: string;
    total_staff: number;
    pending_requests_count: number;
    approved_requests_count: number;
}

export interface StaffCollectionEfficiency {
    staff_id: string;
    staff_name: string;
    monthly_target: number;
    total_collection: number;
    efficiency_percentage: number;
    status: 'Critical' | 'Good' | 'Excellent';
    color: 'Red' | 'Yellow' | 'Green';
    message: string;
}
