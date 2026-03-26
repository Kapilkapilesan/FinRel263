export interface ScheduleItem {
    day: string;
    time: string;
    date?: string;
}

export interface Center {
    id: string; // Backend likely returns 'id' as primary key
    CSU_id: string; // was centerNumber
    center_name: string; // was name
    branch_id: string; // was branch (expecting ID)
    product_id: string; // Required for ID generation
    address: string;
    location: string; // was locationType
    staff_id: string; // was contactPerson (expecting ID)
    // contactPhone removed
    allowedStaff?: string[]; // Backend doesn't seem to use this?
    group_count?: number;
    totalMembers?: number;
    totalLoans?: number;
    groups_count?: number; // From Laravel withCount
    customers_count?: number; // From Laravel withCount
    loans_count?: number; // From Laravel withCount
    created_at?: string; // was createdDate
    status: 'active' | 'inactive' | 'rejected' | 'disabled'; // status in backend
    rejection_reason?: string;
    open_days: ScheduleItem[]; // Array of schedule objects
    branch?: {
        id: number | string;
        branch_name: string;
        branch_id: string;
    };
    staff?: {
        staff_id: string;
        full_name: string;
        profile_image_url?: string;
    };
    product?: {
        id: number;
        product_name: string;
        product_code: string;
    };
}

export interface TemporaryAssignment {
    centerId: string;
    originalUser: string;
    temporaryUser: string;
    date: string;
    reason: string;
    type?: 'temporary' | 'permanent';
}

export interface CenterFormData {
    CSU_id: string;
    center_name: string;
    branch_id: string;
    product_id: string; // Required for ID generation
    staff_id?: string | null;
    address: string;
    location: string;
    status: 'active' | 'inactive' | 'rejected' | 'disabled';
    open_days: ScheduleItem[];
    // Keeping these as they might be handled by frontend only or passed for other reasons
    // But for the strict API call, we need to be careful.
    meetingTime?: string;
    contactPhone?: string;
}

export interface ApiResponse<T> {
    status: string;
    status_code: number;
    message: string;
    data: T;
    error?: string;
    errors?: Record<string, string[]>;
}
