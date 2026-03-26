import { Complaint, ComplaintFormData } from "@/types/complaint.types";
import { API_BASE_URL, getHeaders } from "./api.config";

export const complaintService = {
    getComplaints: async (search?: string, status?: string, page: number = 1, perPage: number = 10): Promise<{ data: Complaint[], meta: any }> => {
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('per_page', perPage.toString());
            if (search) params.append('search', search);
            if (status && status !== 'all') params.append('status', status);

            const response = await fetch(`${API_BASE_URL}/complaints?${params.toString()}`, {
                headers: getHeaders()
            });

            if (!response.ok) throw new Error('Failed to fetch complaints');

            const json = await response.json();

            const mappedData = json.data.map((item: any) => ({
                id: item.id.toString(),
                ticketNo: item.ticket_no,
                date: new Date(item.created_at).toISOString().split('T')[0], // Extract YYYY-MM-DD
                complainant: item.complainant_name,
                complainantType: item.complainant_type,
                branch: item.branch_name,
                category: item.category,
                subject: item.subject,
                description: item.description,
                priority: item.priority,
                status: item.status,
                assignedTo: item.assigned_to,
                resolution: item.resolution,
                assignerId: item.assigner_id,
                assignerName: item.assigner_name,
                assigneeId: item.assignee_id,
                assigneeName: item.assignee_name,
                feedback: item.feedback,
                complaintId: item.complaint_id,
                branch_id: item.branch_id,
            }));

            return { data: mappedData, meta: json.meta };
        } catch (error) {
            console.error(error);
            return { data: [], meta: {} };
        }
    },

    createComplaint: async (data: ComplaintFormData): Promise<Complaint | null> => {
        try {
            const payload = {
                complainant_name: data.complainant,
                complainant_type: data.complainantType,
                branch_name: data.branch,
                category: data.category,
                subject: data.subject,
                description: data.description,
                priority: data.priority,
                assigned_to: data.assignedTo,
                assignee_id: data.assigneeId,
                branch_id: data.branchId
            };

            const response = await fetch(`${API_BASE_URL}/complaints`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create complaint');
            }

            const json = await response.json();
            const item = json.data;

            return {
                id: item.id.toString(),
                ticketNo: item.ticket_no,
                date: new Date(item.created_at).toISOString().split('T')[0],
                complainant: item.complainant_name,
                complainantType: item.complainant_type as any,
                branch: item.branch_name,
                category: item.category,
                subject: item.subject,
                description: item.description,
                priority: item.priority as any,
                status: item.status as any,
                assignedTo: item.assigned_to,
                resolution: item.resolution,
                assignerId: item.assigner_id,
                assignerName: item.assigner_name,
                assigneeId: item.assignee_id,
                assigneeName: item.assignee_name,
                feedback: item.feedback,
                complaintId: item.complaint_id,
            };
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    updateStatus: async (id: string, status: string): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE_URL}/complaints/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ status })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update status');
            }
            return true;
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    updateComplaint: async (id: string, data: Partial<ComplaintFormData>): Promise<boolean> => {
        try {
            const payload = {
                complainant_name: data.complainant,
                complainant_type: data.complainantType,
                branch_name: data.branch,
                category: data.category,
                subject: data.subject,
                description: data.description,
                priority: data.priority,
                assigned_to: data.assignedTo,
                assignee_id: data.assigneeId,
                branch_id: data.branchId
            };

            const response = await fetch(`${API_BASE_URL}/complaints/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update complaint');
            }
            return true;
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    updateFeedback: async (id: string, feedback: string): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE_URL}/complaints/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ feedback })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update feedback');
            }
            return true;
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    deleteComplaint: async (id: string): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE_URL}/complaints/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete complaint');
            }
            return true;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
};
