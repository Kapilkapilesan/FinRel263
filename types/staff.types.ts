export interface TodaySession {
    id: number;
    date: string;
    login_at: string | null;
    logout_at: string | null;
    logout_type: string | null;
    status: 'OPEN' | 'CLOSED';
    worked_minutes: number;
    attendance_status: 'PRESENT' | 'PENDING' | 'APPROVED' | 'REJECTED';
    auto_logged_out: boolean;
    remarks: string | null;
    approved_by: number | null;
    approved_at: string | null;
}

export interface User {
    id: string;
    name: string;
    userName?: string; // System-generated ID (AD0001, ST0001, etc.)
    staffId?: string; // Staff ID for staff members (e.g., ST0001)
    email: string;
    role: string;
    roleId?: number | string | null;
    roleName?: string;
    branch: string;
    branchId?: number | string | null;
    status: 'Active' | 'Inactive' | 'Blocked';
    // Session-related fields
    is_locked?: boolean;
    locked_until?: string | null;
    avatar?: string;
    today_session?: TodaySession | null;
    phone?: string;
    is_blacklisted?: boolean;
    hierarchy?: number;
    centerId?: number | string | null;
}

export interface Staff {
    staff_id: string; // Primary Key
    full_name: string;
    name_with_initial: string;
    email_id: string;
    contact_no: string;
    address: string;
    nic: string;
    gender: 'Male' | 'Female' | 'Other';
    age: number;
    profile_image?: string;
    basic_salary?: number;
    branch_id?: number;

    // New HR Fields
    date_of_birth?: string;
    nationality?: string;
    marital_status?: string;
    preferred_language?: string;
    mailing_address?: string;
    personal_mobile?: string;
    personal_email?: string;
    department?: string;
    employee_type?: string;
    joining_date?: string;
    permanent_date?: string;
    confirmation_date?: string;
    is_blacklisted: boolean;
    bond_signed: boolean;
    bond_period_from?: string;
    bond_period_to?: string;
    branch_code?: string;
    office_mobile?: string;
    office_email?: string;

    education_info?: {
        highest_qualification: string;
        certifications: string;
        skills: string;
        languages: string;
    };

    experience_info?: {
        bms_experience: string;
        total_experience: string;
        previous_company: string;
        last_designation: string;
        responsibilities: string;
    };

    benefits_info?: {
        allowances: string;
        incentives: string;
        benefits: string;
    };

    bank_name?: string;
    account_holder_name?: string;
    bank_account_number?: string;
    bank_branch?: string;

    emergency_contact?: {
        name: string;
        relationship: string;
        phone: string;
    };

    leave_balance_info?: {
        previous_leave: string;
        balance: string;
    };

    work_info: {
        designation: string;
        department?: string;
    };
}

export interface Role {
    id: number;
    name: string;
    display_name: string;
    description: string;
    level: string;
}

export interface Permission {
    module: string;
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
}

export interface StaffStats {
    totalUsers: number;
    activeUsers: number;
    totalRoles: number;
}

// Session Summary for enhanced attendance tracking
export interface SessionSummary {
    user_id: number;
    total_logins: number;
    total_logins_this_month: number;
    total_logins_this_week: number;
    total_worked_minutes_this_month: number;
    total_worked_hours_this_month: number;
    average_session_duration_minutes: number;
    average_session_duration_hours: number;
    last_login_at: string | null;
    last_logout_at: string | null;
    is_currently_logged_in: boolean;
    current_session_duration_minutes: number;
    month_period: {
        start: string;
        end: string;
    };
}

// Session history item for detailed login/logout records
export interface SessionHistoryItem {
    id: number;
    user_id: number;
    date: string;
    login_at: string | null;
    logout_at: string | null;
    logout_type: 'LOGOUT' | 'ON_WORK' | 'STAY_IN_OFFICE' | 'AUTO_LOGOUT' | null;
    auto_logged_out: boolean;
    status: 'OPEN' | 'CLOSED';
    worked_minutes: number;
    worked_hours: number;
    attendance_status: 'PRESENT' | 'PENDING' | 'APPROVED' | 'REJECTED';
    approved_by: number | null;
    approved_at: string | null;
    remarks: string | null;
    login_ip: string | null;
}

// Session history response with pagination
export interface SessionHistoryResponse {
    user: {
        id: number;
        user_name: string;
        full_name: string;
    };
    sessions: SessionHistoryItem[];
    pagination: {
        total: number;
        offset: number;
        limit: number;
        has_more: boolean;
    };
    period_summary: {
        total_sessions: number;
        total_worked_minutes: number;
        total_worked_hours: number;
    };
}
