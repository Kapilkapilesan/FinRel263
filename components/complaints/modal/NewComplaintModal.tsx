import React, { useState, useEffect } from 'react';
import { Complaint, ComplaintFormData } from '@/types/complaint.types';
import { branchService } from '@/services/branch.service';
import { staffService } from '@/services/staff.service';
import { authService } from '@/services/auth.service';
import { toast } from 'react-toastify';
import { SearchableSelect } from '@/components/common/SearchableSelect';

interface NewComplaintModalProps {
    onClose: () => void;
    onSubmit: (data: ComplaintFormData) => Promise<void>;
    initialData?: Complaint;
}

const CATEGORIES = [
    'Loan Processing',
    'System Issue',
    'HR Issue',
    'Service Quality',
    'Other'
];

export const NewComplaintModal: React.FC<NewComplaintModalProps> = ({ onClose, onSubmit, initialData }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<ComplaintFormData>({
        complainantType: initialData?.complainantType || 'Customer',
        complainant: initialData?.complainant || '',
        branch: initialData?.branch || '',
        category: initialData?.category || '',
        priority: initialData?.priority || 'Medium',
        assignedTo: initialData?.assignedTo || '',
        assigneeId: initialData?.assigneeId || '',
        subject: initialData?.subject || '',
        description: initialData?.description || '',
        branchId: initialData?.branch_id ? String(initialData.branch_id) : ''
    });

    const [branches, setBranches] = useState<any[]>([]);
    const [staffList, setStaffList] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [fetchedBranches, fetchedUsers] = await Promise.all([
                    branchService.getBranchesDropdown(),
                    staffService.getUsersList() // Use new lightweight dropdown endpoint
                ]);
                setBranches(fetchedBranches);
                setStaffList(fetchedUsers);
            } catch (error) {
                console.error("Failed to load dropdown data", error);
            }
        };
        loadData();
    }, []);

    const handleSubmit = async () => {
        if (!formData.complainant.trim() || !formData.subject.trim() || !formData.description.trim() || !formData.branchId || !formData.category) {
            toast.warning('Please fill in all required fields');
            return;
        }
        
        setIsSubmitting(true);
        try {
            await onSubmit(formData);
        } finally {
            setIsSubmitting(false);
        }
    };

    const complainantTypeOptions = [
        { id: 'Customer', label: 'Customer' },
        { id: 'Staff', label: 'Staff' },
        { id: 'Branch', label: 'Branch' }
    ];

    const branchOptions = branches.map(b => ({
        id: String(b.id),
        label: b.branch_name
    }));

    const categoryOptions = CATEGORIES.map(cat => ({
        id: cat,
        label: cat
    }));

    const priorityOptions = [
        { id: 'Low', label: 'Low' },
        { id: 'Medium', label: 'Medium' },
        { id: 'High', label: 'High' }
    ];

    const staffOptions = staffList
        .filter(user => user.id !== authService.getCurrentUser()?.id)
        .map(user => ({
            id: String(user.id),
            label: user.name
        }));

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-border-default">

                {/* Header: Distinctive Gradient Border */}
                <div className="p-6 border-b border-border-divider bg-table-header">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-black text-text-primary flex items-center gap-3">
                                <span className="p-2.5 bg-primary-600 rounded-xl text-white shadow-lg">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </span>
                                {initialData ? 'Update Complaint Details' : 'Register New Complaint'}
                            </h2>
                            <p className="text-sm text-text-muted mt-2 ml-14 font-medium italic">
                                {initialData ? `Editing ticket #${initialData.ticketNo}` : 'Provide details to log a formal ticket in the system.'}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-hover rounded-full transition-colors text-text-muted">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* Body: Organized Sections */}
                <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">

                    {/* Section 1: Source & Identity */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-primary-600 rounded-full" />
                            Origin Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <SearchableSelect
                                    label="Complainant Type"
                                    options={complainantTypeOptions}
                                    value={formData.complainantType}
                                    onChange={(val) => setFormData({ ...formData, complainantType: val as any })}
                                    placeholder="Select Type"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Complainant Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. John Doe"
                                    value={formData.complainant}
                                    onChange={(e) => setFormData({ ...formData, complainant: e.target.value })}
                                    className="w-full px-4 py-3 bg-input border border-border-input rounded-xl focus:ring-2 transition-all outline-none text-sm font-bold text-text-primary placeholder:text-text-muted/40"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Classification */}
                    <div className="space-y-4 pt-2">
                        <h3 className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-primary-600 rounded-full" />
                            Categorization
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <SearchableSelect
                                    label="Branch"
                                    options={branchOptions}
                                    value={formData.branchId}
                                    onChange={(val) => {
                                        const selectedId = val ? String(val) : '';
                                        const selectedBranch = branches.find(b => String(b.id) === selectedId);
                                        setFormData({
                                            ...formData,
                                            branchId: selectedId,
                                            branch: selectedBranch ? selectedBranch.branch_name : ''
                                        });
                                    }}
                                    placeholder="Select Branch"
                                />
                            </div>
                            <div>
                                <SearchableSelect
                                    label="Category"
                                    options={categoryOptions}
                                    value={formData.category}
                                    onChange={(val) => setFormData({ ...formData, category: val ? String(val) : '' })}
                                    placeholder="Select Category"
                                />
                            </div>
                            <div>
                                <SearchableSelect
                                    label="Priority"
                                    options={priorityOptions}
                                    value={formData.priority}
                                    onChange={(val) => setFormData({ ...formData, priority: val as any })}
                                    placeholder="Select Priority"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Content */}
                    <div className="space-y-4 pt-2">
                        <h3 className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-primary-600 rounded-full" />
                            Assignment & Message
                        </h3>
                        <div className="space-y-5">
                            {authService.hasPermission('complaints.assign') && (
                                <div>
                                    <SearchableSelect
                                        label="Assign To Personnel"
                                        options={staffOptions}
                                        value={formData.assigneeId || ''}
                                        onChange={(val) => {
                                            const selectedId = val ? String(val) : '';
                                            const selectedUser = staffList.find(u => String(u.id) === selectedId);
                                            setFormData({ ...formData, assigneeId: selectedId, assignedTo: selectedUser ? selectedUser.name : '' });
                                        }}
                                        placeholder="Select Internal Staff Member"
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Subject</label>
                                <input
                                    type="text"
                                    placeholder="Enter a descriptive headline"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full px-4 py-3 bg-input border border-border-input rounded-xl focus:ring-2 transition-all outline-none text-sm font-bold text-text-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Detailed Description</label>
                                <textarea
                                    rows={4}
                                    placeholder="Explain the issue in detail..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-5 py-4 bg-input border border-border-input rounded-2xl focus:ring-2 transition-all outline-none text-sm font-medium text-text-primary resize-none placeholder:italic"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer: Floating Effect */}
                <div className="p-6 bg-table-header border-t border-border-divider flex gap-4 justify-end items-center">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-text-muted font-black text-xs uppercase tracking-widest hover:text-text-primary transition-colors"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`px-8 py-3 bg-primary-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary-500/20 hover:bg-primary-700 hover:-translate-y-0.5 transition-all active:scale-95 ${isSubmitting ? 'opacity-70 cursor-not-allowed grayscale' : ''}`}
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Processing...</span>
                            </div>
                        ) : (
                            initialData ? 'Update Ticket' : 'Register Complaint'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
