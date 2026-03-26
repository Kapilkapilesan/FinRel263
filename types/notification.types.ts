export interface Notification {
    id: string;
    type: string;
    action: string;
    title: string;
    message: string;
    loan_id?: number | null;
    loan_code?: string | null;
    customer_id?: number | null;
    customer_name?: string | null;
    new_status?: string | null;
    reason?: string | null;
    manager_id?: number | null;
    manager_name?: string | null;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
    time_ago: string;
}

export interface NotificationResponse {
    status: string;
    data: Notification[];
    meta: {
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        unread_count: number;
    };
}

export interface UnreadCountResponse {
    status: string;
    data: {
        unread_count: number;
    };
}
