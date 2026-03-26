import { API_BASE_URL, getHeaders } from './api.config';
import { AttendanceRecord, AttendanceStats } from '../types/attendance.types';

export const attendanceService = {
    getDailyAttendance: async (date: string): Promise<AttendanceRecord[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/sessions/attendance-report?date=${date}`, {
                headers: getHeaders()
            });

            if (!response.ok) return [];

            const data = await response.json();
            const rawReport = data.data.report || [];
            const report = Array.isArray(rawReport) ? rawReport : Object.values(rawReport);

            // Map backend report to frontend AttendanceRecord
            return report.map((item: any) => {
                // Parse check-in/out times safely
                const parseTime = (timeStr: string | null) => {
                    if (!timeStr) return undefined;
                    try {
                        // Extract HH:mm from various formats (timestamp or time string)
                        const match = timeStr.match(/(\d{2}):(\d{2})/);
                        return match ? `${match[1]}:${match[2]}` : undefined;
                    } catch (e) {
                        return undefined;
                    }
                };

                return {
                    id: item.user_id.toString(),
                    name: item.full_name,
                    avatar: item.avatar,
                    isOnline: item.is_online,
                    role: 'Staff',
                    date: date,
                    status: mapStatus(item.attendance_status, item.total_worked_hours, item.is_online),
                    checkIn: parseTime(item.first_login),
                    checkOut: parseTime(item.last_logout),
                    workedHours: item.total_worked_hours,
                    staffCode: item.user_name,
                    logoutType: item.logout_type,
                };
            });

        } catch (error) {
            console.error("Error fetching daily attendance", error);
            return [];
        }
    },

    markAttendance: async (data: { id: string; status?: string; checkIn?: string; checkOut?: string; date: string; remarks?: string }): Promise<any> => {
        try {
            const response = await fetch(`${API_BASE_URL}/sessions/mark-attendance`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    user_id: data.id,
                    date: data.date,
                    status: data.status,
                    checkIn: data.checkIn,
                    checkOut: data.checkOut,
                    remarks: data.remarks
                })
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to mark attendance');
            }
            return result;
        } catch (error) {
            console.error("Error marking attendance", error);
            throw error;
        }
    },


    getAttendanceHistory: async (userId: string, startDate?: string, endDate?: string): Promise<any> => {
        try {
            let url = `${API_BASE_URL}/sessions/user/${userId}/history`;
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            if (params.toString()) url += `?${params.toString()}`;

            const response = await fetch(url, { headers: getHeaders() });
            if (!response.ok) return { sessions: [] };

            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error("Error fetching attendance history", error);
            return { sessions: [] };
        }
    }
};

const mapStatus = (backendStatus: string, hours: number, isOnline?: boolean): AttendanceRecord['status'] => {
    // If they are online right now, they are Present (at least for the day's record)
    if (isOnline) return 'Present';

    if (backendStatus === 'APPROVED' || backendStatus === 'PRESENT') {
        return hours >= 7 ? 'Present' : (hours >= 4 ? 'Half Day' : 'Absent');
    }
    if (backendStatus === 'PENDING') return 'Not Marked';
    if (backendStatus === 'REJECTED') return 'Absent';
    if (backendStatus === 'LEAVE') return 'Leave';
    return 'Not Marked';
};
