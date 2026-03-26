export interface AttendanceRecord {
    id: string; // User ID
    name: string;
    role: string;
    avatar?: string;
    date: string;
    status: 'Present' | 'Absent' | 'Half Day' | 'Leave' | 'Not Marked';
    checkIn?: string; // HH:mm
    checkOut?: string; // HH:mm
    workedHours?: number;
    isOnline?: boolean;
    remarks?: string;
    staffCode?: string;
    logoutType?: string;
}

export interface AttendanceStats {
    totalStaff: number;
    present: number;
    absent: number;
    leave: number;
}