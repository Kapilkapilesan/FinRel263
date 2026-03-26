export interface LeaveRequestFormData {
    leaveType: string;
    dayType: 'Full Day' | 'Half Day';
    startDate?: string;
    endDate?: string;
    leaveDates?: string[]; // Array of selected dates
    totalDays?: number;
    reason: string;
}

export interface LeaveRequest extends LeaveRequestFormData {
    id: string;
    userId: string;
    userName: string;
    userRole: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    createdAt: string;
}
