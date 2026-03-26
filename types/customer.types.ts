export interface Customer {
    id: string;
    customer_id?: string; // Generated ID: CN/MF/0001/0001

    // Product / Location Details
    branch_id?: number;
    center_id?: number;
    grp_id?: number;
    location?: string;
    product_type?: string;
    base_product?: string;
    pcsu_csu_code?: string;

    // Personal Details
    code_type: string;
    customer_code: string; // NIC
    gender: 'Male' | 'Female' | 'Other';
    age?: number;
    title: string;
    full_name: string;
    initials: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    civil_status: 'Single' | 'Married' | 'Divorced' | 'Widowed';
    religion: string;
    mobile_no_1: string;
    mobile_no_2?: string;
    ccl_mobile_no?: string;
    spouse_name?: string;
    health_info?: any;
    family_members_count?: number;
    customer_profile_image?: string;
    profile_image_url?: string;
    nic_copy_image?: string;
    nic_image_url?: string;
    monthly_income?: number;
    status: 'active' | 'blocked';

    // Address Details
    address_type: string;
    address_line_1: string;
    address_line_2?: string;
    address_line_3?: string;
    country: string;
    province: string;
    district: string;
    city: string;
    gs_division: string;
    gs_division_id?: number | null;
    telephone?: string;
    preferred_address?: boolean;

    // Business Details
    ownership_type?: string;
    register_number?: string;
    business_name?: string;
    business_email?: string;
    business_duration?: string;
    business_place?: string;
    handled_by?: string;
    no_of_employees?: number;
    market_reputation?: string;
    sector?: string;
    sub_sector?: string;

    // Metadata
    created_at?: string;
    updated_at?: string;

    // UI Fields (mapped from relations)
    group_name?: string;
    center_name?: string;
    branch_name?: string;
    branch_code?: string;
    phone_number?: string;
    active_loans_count?: number;

    // Relation Objects
    branch?: any;
    center?: any;
    group?: any;
    loans?: any[];
    gs_division_relation?: any; // or just use gs_division if you want to replace it
    gsDivisionDetail?: {
        id: number;
        name: string;
        mpa_code: string;
        province: string;
    };

    // Approval Flow
    edit_request_status?: 'pending' | 'approved' | 'rejected' | null;
    is_edit_locked?: boolean;
    is_out_of_scope?: boolean;
}

export interface CustomerStats {
    totalCustomers: number;
    activeCustomers: number;
    blockedCustomers: number;
    customersWithLoans: number;
    newThisMonth: number;
}

export interface CustomerFormData {
    // Product / Location Details
    branch_id?: number;
    center_id?: number;
    grp_id?: number;
    location?: string;
    product_type?: string;
    base_product?: string;
    pcsu_csu_code?: string;

    // Personal Details
    code_type: string;
    customer_code: string;
    customer_code_confirmation: string;
    gender: 'Male' | 'Female' | 'Other';
    title: string;
    full_name: string;
    initials: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    age?: number;
    civil_status: 'Single' | 'Married' | 'Divorced' | 'Widowed';
    religion: string;
    mobile_no_1: string;
    mobile_no_2?: string;
    ccl_mobile_no?: string;
    spouse_name?: string;
    health_info?: any;
    family_members_count?: number;
    customer_profile_image?: string;
    profile_image_url?: string;
    nic_copy_image?: string;
    nic_image_url?: string;
    monthly_income?: number;
    status?: 'active' | 'blocked';
    preferred_language?: string;

    // Address Details
    address_type: string;
    address_line_1: string;
    address_line_2?: string;
    address_line_3?: string;
    country: string;
    province: string;
    district: string;
    city: string;
    gs_division: string;
    gs_division_id?: number | null;
    telephone?: string;
    preferred_address?: boolean;

    // Business Details
    ownership_type?: string;
    register_number?: string;
    business_name?: string;
    business_email?: string;
    business_duration?: string;
    business_place?: string;
    handled_by?: string;
    no_of_employees?: number;
    market_reputation?: string;
    sector?: string;
    sub_sector?: string;
}
