import { useState, useMemo, useCallback, useEffect } from 'react';
import { LoanApprovalItem, LoanStatus } from '@/types/loan-approval.types';
import { loanService } from '@/services/loan.service';
import { branchService } from '@/services/branch.service';
import { Branch } from '@/types/branch.types';
import { toast } from 'react-toastify';
import {
    Loan,
    LOAN_STATUS_SENT_BACK,
    LOAN_STATUS_PENDING_1ST,
    LOAN_STATUS_PENDING_2ND,
    LOAN_STATUS_APPROVED,
    getLoanStatusLabel
} from '@/types/loan.types';

export function useLoanApproval() {
    const [loans, setLoans] = useState<LoanApprovalItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterBranchId, setFilterBranchId] = useState<string>('all');
    const [filterStaff, setFilterStaff] = useState<string>('all');
    const [branches, setBranches] = useState<Branch[]>([]);
    const [viewingLoan, setViewingLoan] = useState<LoanApprovalItem | null>(null);

    const [isProcessing, setIsProcessing] = useState(false);

    // Derive unique staff list from loans
    const availableStaff = useMemo(() => {
        const staffMap = new Map<string, string>();
        loans.forEach(loan => {
            if (loan.staff && loan.staff !== 'N/A') {
                staffMap.set(loan.staff, loan.staff);
            }
        });
        return Array.from(staffMap.values()).sort();
    }, [loans]);

    const mapLoanToApprovalItem = (l: Loan): LoanApprovalItem => {
        const approvalLevel = (l as any).approval_level || 0;
        const firstApprovalStatus = approvalLevel > 0 ? 'Approved' : (l.status === LOAN_STATUS_SENT_BACK ? 'Sent Back' : 'Pending');
        const secondApprovalStatus = approvalLevel > 1 ? 'Approved' : (approvalLevel === 1 ? 'Pending' : null);

        // Map backend status to frontend display status
        let displayStatus: LoanStatus = 'Pending 1st';
        if (l.status === LOAN_STATUS_PENDING_2ND) displayStatus = 'Pending 2nd';
        if (l.status === LOAN_STATUS_APPROVED) displayStatus = 'Approved';
        if (l.status === LOAN_STATUS_SENT_BACK) displayStatus = 'Sent Back';

        const createdAt = l.created_at ? new Date(l.created_at) : new Date();

        return {
            id: l.id.toString(),
            serialNo: l.id,
            contractNo: l.loan_id,
            customerName: l.customer?.full_name || 'N/A',
            nic: l.customer?.customer_code || 'N/A',
            loanAmount: Number(l.approved_amount || 0),
            staff: (l as any).staff?.full_name || (l as any).staff?.user_name || 'N/A',
            submittedDate: createdAt.toISOString().split('T')[0],
            submittedTime: createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            firstApproval: firstApprovalStatus as any,
            firstApprovalBy: l.approve_history?.first?.name,
            firstApprovalDate: l.approve_history?.first?.at ? new Date(l.approve_history.first.at).toLocaleDateString() : undefined,
            secondApproval: secondApprovalStatus as any,
            secondApprovalBy: l.approve_history?.second?.name,
            secondApprovalDate: l.approve_history?.second?.at ? new Date(l.approve_history.second.at).toLocaleDateString() : undefined,
            status: displayStatus,
            rejectionReason: (l as any).rejection_reason,
            loanDetails: {
                purpose: (l as any).loan_step || 'N/A',
                tenure: l.terms,
                interestRate: Number(l.interest_rate),
                center: l.center?.center_name || 'N/A',
                group: (l as any).group?.group_name || 'N/A',
                branchManager: (l as any).center?.branch?.manager?.full_name || l.center?.branch?.manager_name || (l as any).branch_manager || 'Branch Manager',
                branchName: (l as any).center?.branch?.branch_name || (l as any).center?.branch?.name || (l as any).branch_name || 'N/A',
                branchId: (l as any).center?.branch?.id || (l as any).branch_id || 'N/A'
            },
            bankDetails: l.borrower_bank_details ? {
                bankName: l.borrower_bank_details.bank_name,
                accountNumber: l.borrower_bank_details.account_number
            } : undefined,
            rawLoan: {
                ...l,
                documents: (l as any).documents || []
            }
        };
    };

    const fetchLoans = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch all loans explicitly asking for all statuses - no branch filter here to allow local filtering
            const response = await loanService.getLoans({ per_page: 100, status: 'all_statuses' } as any);
            // Filter only those that need approval
            const approvalNeeded = response.data.filter(l =>
                [LOAN_STATUS_PENDING_1ST, LOAN_STATUS_PENDING_2ND].includes(l.status)
            );
            setLoans(approvalNeeded.map(mapLoanToApprovalItem));
            setError(null);
        } catch (err) {
            setError('Failed to fetch loan approvals');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const fetchBranchesList = async () => {
            try {
                const data = await branchService.getBranchesDropdown();
                setBranches(data);
            } catch (err) {
                console.error('Failed to fetch branches:', err);
            }
        };
        fetchBranchesList();
    }, []);

    useEffect(() => {
        fetchLoans();
    }, [fetchLoans]);

    const filteredLoans = useMemo(() => {
        return loans.filter(loan => {
            const matchesSearch = loan.contractNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                loan.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                loan.nic.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = filterStatus === 'all' || loan.status === filterStatus;
            const matchesBranch = filterBranchId === 'all' || loan.loanDetails.branchId.toString() === filterBranchId.toString();
            const matchesStaff = filterStaff === 'all' || loan.staff === filterStaff;

            return matchesSearch && matchesStatus && matchesBranch && matchesStaff;
        });
    }, [loans, searchTerm, filterStatus, filterBranchId, filterStaff]);

    const handleFirstApproval = useCallback(async (loanId: string, action: 'approve' | 'sendback', reason: string = '') => {
        try {
            setIsProcessing(true);
            const backendAction = action === 'approve' ? 'approve' : 'send_back';
            await loanService.approveLoan(loanId, backendAction, reason);
            toast.success(action === 'approve' ? 'Loan approved successfully' : 'Loan sent back for correction');
            await fetchLoans();
            setViewingLoan(null);
        } catch (err) {
            console.error('Approval failed:', err);
            toast.error('Failed to process approval');
        } finally {
            setIsProcessing(false);
        }
    }, [fetchLoans]);

    const handleSecondApproval = useCallback(async (loanId: string, action: 'approve' | 'sendback', reason: string = '') => {
        try {
            setIsProcessing(true);
            const backendAction = action === 'approve' ? 'approve' : 'send_back';
            await loanService.approveLoan(loanId, backendAction, reason);
            toast.success(action === 'approve' ? 'Final approval successful' : 'Loan sent back for correction');
            await fetchLoans();
            setViewingLoan(null);
        } catch (err) {
            console.error('Approval failed:', err);
            toast.error('Failed to process approval');
        } finally {
            setIsProcessing(false);
        }
    }, [fetchLoans]);

    return {
        loans,
        isLoading,
        isProcessing,
        error,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        filterBranchId,
        setFilterBranchId,
        filterStaff,
        setFilterStaff,
        branches,
        availableStaff,
        viewingLoan,
        setViewingLoan,
        filteredLoans,
        handleFirstApproval,
        handleSecondApproval,
        refreshLoans: fetchLoans
    };
}
