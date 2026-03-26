export interface Complaint {
    id: string;
    ticketNo: string;
    date: string;
    complainant: string;
    complainantType: 'Customer' | 'Staff' | 'Branch';
    branch: string;
    category: string;
    subject: string;
    description: string;
    priority: 'High' | 'Medium' | 'Low';
    status: 'Open' | 'In Progress' | 'Resolved' | 'Closed' | 'Rejected';
    assignedTo?: string;
    resolution?: string;
    assignerId?: string;
    assignerName?: string;
    assigneeId?: string;
    assigneeName?: string;
    feedback?: string;
    complaintId?: string;
    branch_id?: number | string;
}

export interface ComplaintFormData {
    complainantType: 'Customer' | 'Staff' | 'Branch';
    complainant: string;
    branch: string;
    category: string;
    priority: 'High' | 'Medium' | 'Low';
    assignedTo: string;
    assigneeId?: string;
    subject: string;
    description: string;
    branchId: string;
}
