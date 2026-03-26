'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Activity,
    Building2,
    DollarSign,
    Calendar,
    Search,
    Clock,
    ArrowLeftRight,
    Wallet,
    TrendingUp,
    TrendingDown,
    ChevronDown,
    User,
    Phone,
    FileText,
    CheckCircle,
    XCircle,
    ShieldCheck,
    Plus,
} from 'lucide-react';
import { DocumentPreviewModal } from '@/components/common/DocumentPreviewModal';
import { branchService } from '@/services/branch.service';
import { staffService } from '@/services/staff.service';
import { financeService } from '@/services/finance.service';
import { staffIouService, StaffIouRequest } from '@/services/staffIou.service';
import { authService } from '@/services/auth.service';
import { centerService } from '@/services/center.service';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import OtherBranchCollectionPage from './OtherBranchCollectionPage';
import { ActionConfirmModal } from '@/components/common/ActionConfirmModal';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { Pagination } from '@/components/common/Pagination';
import { bankBranchService, BankBranchActivity } from '@/services/bankBranch.service';
import { API_BASE_URL } from '@/services/api.config';

// Types
interface BranchOption {
    id: number;
    branch_id: string;
    branch_name: string;
}

interface StaffOption {
    id: string;
    name: string;
    staffId?: string;
    nic?: string;
    phone?: string;
    branchName?: string;
}

type BranchActivityTab = 'branch-daily-activity' | 'other-branch-collection' | 'loan-due-payment' | 'staff-request-iou-pay' | 'bank-branch';

// SearchableSelect component removed as it is now imported from @/components/common/SearchableSelect

const BranchActivityPage: React.FC = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<BranchActivityTab>('branch-daily-activity');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [period, setPeriod] = useState<'day' | 'month' | 'year' | 'all'>('month');

    // Staff IOU Payouts state
    const [iouPayouts, setIouPayouts] = useState<StaffIouRequest[]>([]);
    const [otpModal, setOtpModal] = useState<{ isOpen: boolean; request: StaffIouRequest | null }>({ isOpen: false, request: null });
    const [otpValue, setOtpValue] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [iouApprovals, setIouApprovals] = useState<StaffIouRequest[]>([]);
    const [isApproving, setIsApproving] = useState<number | null>(null);
    const [isRejecting, setIsRejecting] = useState<number | null>(null);
    const [activityOtpModal, setActivityOtpModal] = useState<{ isOpen: boolean; activity: any | null }>({ isOpen: false, activity: null });
    const [activityOtpValue, setActivityOtpValue] = useState('');
    const [isActivityVerifying, setIsActivityVerifying] = useState(false);
    const [resendingOtp, setResendingOtp] = useState(false);

    // Form state
    const [type, setType] = useState<'Inflow' | 'Outflow'>('Inflow');
    const [branchId, setBranchId] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [staffPhone, setStaffPhone] = useState('');

    // Field options
    const [branches, setBranches] = useState<BranchOption[]>([]);
    const [staffs, setStaffs] = useState<StaffOption[]>([]);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [loadingStaffs, setLoadingStaffs] = useState(false);
    const [branchFieldOfficers, setBranchFieldOfficers] = useState<StaffOption[]>([]);
    const [loadingFo, setLoadingFo] = useState(false);
    const [filterStaffId, setFilterStaffId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [recentActivities, setRecentActivities] = useState<any[]>([]);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);

    // Activity Table Pagination
    const [activityPage, setActivityPage] = useState(1);
    const [activityItemsPerPage, setActivityItemsPerPage] = useState(10);

    // Initial load for current user and their branch
    useEffect(() => {
        const user = authService.getCurrentUser();
        setCurrentUser(user);

        // Auto-set branch if user has one assigned
        const userBranchId = user?.branch_id || user?.branch?.id;
        if (userBranchId) {
            setBranchId(userBranchId.toString());
        }
    }, []);

    // Loan Dues state
    const [loanDues, setLoanDues] = useState<any[]>([]);
    const [collectionStatus, setCollectionStatus] = useState<'active' | 'settled'>('active');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [settlingId, setSettlingId] = useState<number | null>(null);

    // Confirmation Modals State
    const [settleConfirm, setSettleConfirm] = useState<{ isOpen: boolean; receiptId: number | null; staffId: string | null }>({
        isOpen: false,
        receiptId: null,
        staffId: null
    });
    const [selectedReceipts, setSelectedReceipts] = useState<number[]>([]);
    const [isBulkSettling, setIsBulkSettling] = useState(false);
    const [bulkSettleConfirm, setBulkSettleConfirm] = useState({
        isOpen: false,
        count: 0,
        totalAmount: 0,
        settlements: [] as { receipt_id: number; staff_id: string }[]
    });
    const [iouApproveConfirm, setIouApproveConfirm] = useState<{ isOpen: boolean; id: number | null }>({
        isOpen: false,
        id: null
    });
    const [rejectionModal, setRejectionModal] = useState<{ isOpen: boolean; id: number | null }>({
        isOpen: false,
        id: null
    });
    const [rejectionReason, setRejectionReason] = useState('');

    // Hierarchical Loan Due View State
    const [loanDueView, setLoanDueView] = useState<'officers' | 'collections'>('officers');
    const [selectedOfficerId, setSelectedOfficerId] = useState<string | null>(null);
    const [officerSummaries, setOfficerSummaries] = useState<any[]>([]);
    const [centers, setCenters] = useState<any[]>([]);
    const [filterCenterId, setFilterCenterId] = useState('');
    const [loadingCenters, setLoadingCenters] = useState(false);

    // Bank & Branch Activity state
    const [bankActivities, setBankActivities] = useState<BankBranchActivity[]>([]);
    const [loadingBankActivities, setLoadingBankActivities] = useState(false);
    const [bankActivityType, setBankActivityType] = useState<'deposit' | 'withdrawal'>('deposit');
    const [bankActivityAmount, setBankActivityAmount] = useState('');
    const [bankActivityDescription, setBankActivityDescription] = useState('');
    const [bankActivityReceiptNumber, setBankActivityReceiptNumber] = useState('');
    const [bankActivityDocument, setBankActivityDocument] = useState<File | null>(null);
    const [isSubmittingBank, setIsSubmittingBank] = useState(false);
    const [bankFilterType, setBankFilterType] = useState<string>('');
    const [previewDoc, setPreviewDoc] = useState<{ url: string; type: string } | null>(null);
    const [bankApproveModal, setBankApproveModal] = useState<{ isOpen: boolean; activity: BankBranchActivity | null }>({ isOpen: false, activity: null });
    const [bankRejectModal, setBankRejectModal] = useState<{ isOpen: boolean; activity: BankBranchActivity | null }>({ isOpen: false, activity: null });
    const [bankRejectionReason, setBankRejectionReason] = useState('');
    const [isBankApproving, setIsBankApproving] = useState<number | null>(null);
    const [isBankRejecting, setIsBankRejecting] = useState<number | null>(null);
    const [uploadModal, setUploadModal] = useState<{ isOpen: boolean; activity: BankBranchActivity | null }>({ isOpen: false, activity: null });
    const [uploadReceiptNumber, setUploadReceiptNumber] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchCenters = async () => {
        setLoadingCenters(true);
        try {
            const data = await centerService.getCentersList();
            setCenters(data);
        } catch (err) {
            console.error('Error fetching centers', err);
        } finally {
            setLoadingCenters(false);
        }
    };

    useEffect(() => {
        fetchBranches();
        fetchStaffs();
        fetchBranchFieldOfficers();
        fetchCenters();
    }, []);

    useEffect(() => {
        fetchRecentActivities();
        setActivityPage(1); // Reset page on filter change
    }, [date, period, branchId]);

    useEffect(() => {
        if (activeTab === 'loan-due-payment') {
            if (loanDueView === 'officers') {
                fetchOfficerSummaries();
            } else {
                fetchLoanDues();
            }
        } else if (activeTab === 'staff-request-iou-pay') {
            fetchIouPayouts();
            if (authService.hasPermission('finance.branch_truncation_view')) {
                fetchIouApprovals();
            }
        } else if (activeTab === 'bank-branch') {
            fetchBankActivities();
        }
    }, [activeTab, collectionStatus, currentPage, branchId, date, period, filterStaffId, loanDueView, selectedOfficerId, filterCenterId, bankFilterType]);


    const fetchIouPayouts = async () => {
        try {
            setLoadingActivities(true);
            const data = await staffIouService.getPendingPayouts(true, false, date, period);
            setIouPayouts(data);
        } catch (err) {
            console.error('Error fetching IOU payouts', err);
        } finally {
            if (!authService.hasPermission('finance.branch_truncation_view')) {
                setLoadingActivities(false);
            }
        }
    };


    const fetchIouApprovals = async () => {
        try {
            setLoadingActivities(true);
            const data = await staffIouService.getPendingApprovals(date, period);
            setIouApprovals(data);
        } catch (err) {
            console.error('Error fetching IOU approvals', err);
        } finally {
            setLoadingActivities(false);
        }
    };

    const fetchBankActivities = async () => {
        setLoadingBankActivities(true);
        try {
            const data = await bankBranchService.getActivities({
                type: bankFilterType,
                branch_id: branchId ? parseInt(branchId) : undefined,
            });
            setBankActivities(data);
        } catch (err) {
            console.error('Error fetching bank activities', err);
            toast.error('Failed to fetch bank activities');
        } finally {
            setLoadingBankActivities(false);
        }
    };

    const handleBankActivitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bankActivityAmount || !branchId) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmittingBank(true);
        try {
            await bankBranchService.createActivity({
                date: date,
                type: bankActivityType,
                branch_id: parseInt(branchId),
                amount: parseFloat(bankActivityAmount),
                description: bankActivityDescription,
                receipt_number: bankActivityReceiptNumber,
                document: bankActivityDocument || undefined,
            });

            toast.success(bankActivityType === 'deposit' ? 'Deposit recorded successfully' : 'Withdrawal request submitted');
            
            // Reset form
            setBankActivityAmount('');
            setBankActivityDescription('');
            setBankActivityReceiptNumber('');
            setBankActivityDocument(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            
            fetchBankActivities();
        } catch (err: any) {
            console.error('Error submitting bank activity', err);
            toast.error(err.message || 'Failed to submit activity');
        } finally {
            setIsSubmittingBank(false);
        }
    };

    const handleWithdrawalDocumentUpload = async (id: number, file: File, receiptNumber?: string) => {
        try {
            setIsUploading(true);
            await bankBranchService.uploadDocument(id, file, receiptNumber);
            toast.success('Document uploaded and withdrawal completed successfully');
            fetchBankActivities();
            setUploadModal({ isOpen: false, activity: null });
            setUploadFile(null);
            setUploadReceiptNumber('');
        } catch (err: any) {
            toast.error(err.message || 'Failed to upload document');
        } finally {
            setIsUploading(false);
        }
    };

    const confirmApproveBank = async (note?: string) => {
        if (!bankApproveModal.activity) return;
        try {
            setIsBankApproving(bankApproveModal.activity.id);
            await bankBranchService.approveActivity(bankApproveModal.activity.id, note);
            toast.success('Activity approved successfully');
            fetchBankActivities();
            setBankApproveModal({ isOpen: false, activity: null });
        } catch (err: any) {
            toast.error(err.message || 'Failed to approve activity');
        } finally {
            setIsBankApproving(null);
        }
    };

    const confirmRejectBank = async () => {
        if (!bankRejectModal.activity || !bankRejectionReason.trim()) {
            toast.error('Rejection reason is required');
            return;
        }
        try {
            setIsBankRejecting(bankRejectModal.activity.id);
            await bankBranchService.rejectActivity(bankRejectModal.activity.id, bankRejectionReason);
            toast.success('Activity rejected');
            fetchBankActivities();
            setBankRejectModal({ isOpen: false, activity: null });
            setBankRejectionReason('');
        } catch (err: any) {
            toast.error(err.message || 'Failed to reject activity');
        } finally {
            setIsBankRejecting(null);
        }
    };


    const handleApproveIou = (id: number) => {
        setIouApproveConfirm({ isOpen: true, id });
    };

    const confirmApproveIou = async (note?: string) => {
        if (!iouApproveConfirm.id) return;
        try {
            setIsApproving(iouApproveConfirm.id);
            await staffIouService.approveRequest(iouApproveConfirm.id, note);
            toast.success('Request approved successfully');
            fetchIouApprovals();
            fetchIouPayouts();
        } catch (err: any) {
            toast.error(err.message || 'Failed to approve request');
            throw err;
        } finally {
            setIsApproving(null);
            setIouApproveConfirm({ isOpen: false, id: null });
        }
    };

    const handleRejectIou = (id: number) => {
        setRejectionModal({ isOpen: true, id });
        setRejectionReason('');
    };

    const confirmRejectIou = async () => {
        if (!rejectionModal.id || !rejectionReason.trim()) {
            toast.error('Rejection reason is required');
            return;
        }

        try {
            setIsRejecting(rejectionModal.id);
            await staffIouService.rejectRequest(rejectionModal.id, rejectionReason);
            toast.success('Request rejected');
            fetchIouApprovals();
            setRejectionModal({ isOpen: false, id: null });
        } catch (err: any) {
            toast.error(err.message || 'Failed to reject request');
        } finally {
            setIsRejecting(null);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otpModal.request || !otpValue) return;

        try {
            setIsVerifying(true);
            await staffIouService.disburseRequest(otpModal.request.id, otpValue);
            toast.success('Funds disbursed successfully');

            // Redirect to receipt generation page
            const requestId = otpModal.request.id;

            setOtpModal({ isOpen: false, request: null });
            setOtpValue('');
            fetchIouPayouts();
            fetchRecentActivities(); // Refresh stats too

            // Proactive redirection to Receipt Generation
            router.push(`/cashier/receipts?type=STAFF_IOU&id=${requestId}`);
        } catch (err: any) {
            toast.error(err.message || 'Invalid OTP');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleVerifyActivityOtp = async () => {
        if (!activityOtpModal.activity || !activityOtpValue) return;

        try {
            setIsActivityVerifying(true);
            await financeService.disburseBranchActivity(activityOtpModal.activity.id, activityOtpValue);
            toast.success('Funds disbursed successfully');

            const activityId = activityOtpModal.activity.id;

            setActivityOtpModal({ isOpen: false, activity: null });
            setActivityOtpValue('');
            fetchRecentActivities();

            // Redirect to receipt generation page
            router.push(`/cashier/receipts?type=BRANCH_ACTIVITY&id=${activityId}`);
        } catch (err: any) {
            toast.error(err.message || 'Invalid OTP');
        } finally {
            setIsActivityVerifying(false);
        }
    };

    const handleResendActivityOtp = async () => {
        if (!activityOtpModal.activity) return;

        try {
            setResendingOtp(true);
            await financeService.resendBranchActivityOtp(activityOtpModal.activity.id);
            toast.success('OTP resent successfully');
        } catch (err: any) {
            toast.error(err.message || 'Failed to resend OTP');
        } finally {
            setResendingOtp(false);
        }
    };

    const fetchOfficerSummaries = async () => {
        try {
            setLoadingActivities(true);
            const response = await financeService.getUnsettledReceipts(
                branchId ? parseInt(branchId) : undefined,
                collectionStatus,
                1,
                500,
                date,
                period,
                undefined,
                filterCenterId || undefined
            );

            const grouped = response.data.reduce((acc: any, curr: any) => {
                const staffId = curr.staff?.user_name || curr.staff_id;
                if (!acc[staffId]) {
                    acc[staffId] = {
                        staffId,
                        name: curr.staff?.staff?.full_name || curr.staff?.name || 'N/A',
                        employeeId: curr.staff?.staff?.staff_id || 'N/A',
                        count: 0,
                        totalAmount: 0,
                        branch: curr.center?.center_name || curr.branch?.branch_name || 'N/A',
                        settlements: [] as { receipt_id: number; staff_id: string }[]
                    };
                }
                acc[staffId].count += 1;
                acc[staffId].totalAmount += Number(curr.current_due_amount || 0);
                acc[staffId].settlements.push({
                    receipt_id: curr.id,
                    staff_id: curr.staff?.user_name || curr.staff_id
                });
                return acc;
            }, {});

            setOfficerSummaries(Object.values(grouped));
        } catch (err) {
            console.error('Error fetching officer summaries', err);
        } finally {
            setLoadingActivities(false);
        }
    };

    const fetchLoanDues = async () => {
        try {
            setLoadingActivities(true);
            const response = await financeService.getUnsettledReceipts(
                branchId ? parseInt(branchId) : undefined,
                collectionStatus,
                currentPage,
                15,
                date,
                period,
                selectedOfficerId || filterStaffId || undefined,
                filterCenterId || undefined
            );
            setLoanDues(response.data);
            setPagination(response.meta);
        } catch (err) {
            console.error('Error fetching loan dues', err);
        } finally {
            setLoadingActivities(false);
        }
    };
    const handleSettle = (receiptId: number, staffId: string) => {
        if (!staffId) {
            toast.error('Collector information is missing for this receipt');
            return;
        }
        setSettleConfirm({ isOpen: true, receiptId, staffId });
    };

    const confirmSettle = async () => {
        if (!settleConfirm.receiptId || !settleConfirm.staffId) return;

        try {
            setSettlingId(settleConfirm.receiptId);
            await financeService.settleReceipt(settleConfirm.receiptId, settleConfirm.staffId);
            toast.success('Receipt settled successfully');
            fetchLoanDues();
            fetchRecentActivities();
        } catch (err: any) {
            toast.error(err.message || 'Failed to settle receipt');
            throw err;
        } finally {
            setSettlingId(null);
            setSettleConfirm({ isOpen: false, receiptId: null, staffId: null });
        }
    };

    const toggleReceiptSelection = (id: number) => {
        setSelectedReceipts(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        const currentlySettling = loanDues.filter(r => r.status === 'active').map(r => r.id);
        if (selectedReceipts.length === currentlySettling.length && currentlySettling.length > 0) {
            setSelectedReceipts([]);
        } else {
            setSelectedReceipts(currentlySettling);
        }
    };

    const handleBulkSettle = () => {
        const selectedData = loanDues.filter(r => selectedReceipts.includes(r.id));
        const total = selectedData.reduce((sum, r) => sum + Number(r.current_due_amount || 0), 0);
        const settlements = selectedData.map(r => ({
            receipt_id: r.id,
            staff_id: r.staff?.user_name
        }));
        setBulkSettleConfirm({
            isOpen: true,
            count: selectedReceipts.length,
            totalAmount: total,
            settlements
        });
    };

    const confirmBulkSettle = async () => {
        if (bulkSettleConfirm.settlements.length === 0) return;

        try {
            setIsBulkSettling(true);
            await financeService.bulkSettleReceipts(bulkSettleConfirm.settlements);
            toast.success(`${bulkSettleConfirm.count} receipts settled successfully`);
            setSelectedReceipts([]);

            if (loanDueView === 'officers') {
                fetchOfficerSummaries();
            } else {
                fetchLoanDues();
            }
            fetchRecentActivities();
        } catch (err: any) {
            toast.error(err.message || 'Failed to settle receipts');
        } finally {
            setIsBulkSettling(false);
            setBulkSettleConfirm({ isOpen: false, count: 0, totalAmount: 0, settlements: [] });
        }
    };

    const fetchRecentActivities = async () => {
        try {
            setLoadingActivities(true);
            const data = await financeService.getBranchTransactions(branchId ? parseInt(branchId) : undefined, date, period);
            setRecentActivities(data.activities);
            setStats(data.stats);
        } catch (err: any) {
            console.error('Error fetching recent activities', err);
            toast.error(err.message || 'Failed to fetch branch activities');
        } finally {
            setLoadingActivities(false);
        }
    };

    const fetchBranches = async () => {
        setLoadingBranches(true);
        try {
            const data = await branchService.getBranchesDropdown();
            setBranches(data.map((b: any) => ({
                id: b.id,
                branch_id: b.branch_id,
                branch_name: b.branch_name
            })));
        } catch (err) {
            console.error('Error fetching branches', err);
        } finally {
            setLoadingBranches(false);
        }
    };

    const fetchStaffs = async () => {
        setLoadingStaffs(true);
        try {
            // Updated to use the generic staff list which includes more details
            const data = await staffService.getStaffList();
            setStaffs(data.map((s: any) => ({
                id: s.user_name || s.staff_id, // Use user_name as it's required by the backend
                name: s.full_name || s.name,
                staffId: s.staff_id,
                nic: s.nic,
                phone: s.contact_no || s.personal_mobile || s.office_mobile
            })));
        } catch (err) {
            console.error('Error fetching staffs', err);
        } finally {
            setLoadingStaffs(false);
        }
    };

    const fetchBranchFieldOfficers = async () => {
        setLoadingFo(true);
        try {
            const data = await financeService.getBranchFieldOfficers();
            setBranchFieldOfficers(data.map((s: any) => ({
                id: s.staff_id,
                name: s.full_name,
                staffId: s.staff_id,
                nic: s.nic,
                branchName: s.branch?.branch_name
            })));
        } catch (err) {
            console.error('Error fetching branch FOs', err);
        } finally {
            setLoadingFo(false);
        }
    };

    // Auto-fetch phone when staff is selected
    useEffect(() => {
        if (selectedStaffId) {
            const staff = staffs.find(s => s.id === selectedStaffId);
            if (staff) {
                setStaffPhone(staff.phone || 'N/A');
            }
        } else {
            setStaffPhone('');
        }
    }, [selectedStaffId, staffs]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!branchId || !amount || !selectedStaffId) {
            toast.error('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            const isOutflow = type === 'Outflow';

            const payload = {
                date,
                type: type.toLowerCase(),
                branch_id: parseInt(branchId),
                staff_id: selectedStaffId, // This is user_name now
                amount: parseFloat(amount),
                description,
                expense_type: 'Branch Activity', // Required field
                medium: 'Cash', // Required field
            };

            await financeService.recordExpense(payload);

            if (isOutflow) {
                toast.success('Branch activity request submitted for approval');
            } else {
                toast.success('Branch activity recorded successfully');
            }

            // Reset form
            setAmount('');
            setDescription('');
            setSelectedStaffId('');
            setStaffPhone('');

            // Refresh activities
            fetchRecentActivities();
        } catch (err: any) {
            toast.error(err.message || 'Failed to process activity');
        } finally {
            setSubmitting(false);
        }
    };

    const tabs: { id: BranchActivityTab; label: string; icon: React.ReactNode }[] = [
        { id: 'branch-daily-activity', label: 'Branch Activity', icon: <Activity size={16} /> },
        { id: 'other-branch-collection', label: 'Branch Collection', icon: <ArrowLeftRight size={16} /> },
        { id: 'loan-due-payment', label: 'Loan Due Payments', icon: <DollarSign size={16} /> },
        { id: 'staff-request-iou-pay', label: 'Staff Request IOU', icon: <Wallet size={16} /> },
        { id: 'bank-branch', label: 'Branch & Bank', icon: <Building2 size={16} /> },
    ];

    const branchOptions = branches.map(b => ({
        id: b.id.toString(),
        label: b.branch_name,
        subLabel: b.branch_id
    }));

    const staffOptions = staffs.map(s => ({
        id: s.id,
        label: s.name,
        subLabel: `${s.staffId} • NIC: ${s.nic || 'N/A'}`
    }));

    const foOptions = [
        { id: '', label: 'All Staff' },
        ...branchFieldOfficers.map(s => ({
            id: s.id,
            label: s.name,
            subLabel: `${s.staffId} • ${s.branchName || 'No Branch'} • NIC: ${s.nic || 'N/A'}`
        }))
    ];

    const typeOptions = [
        { id: 'Inflow', label: 'Inflow (Money Received)' },
        { id: 'Outflow', label: 'Outflow (Money Sent)' }
    ];

    const centerOptions = [
        { id: '', label: 'All Centers' },
        ...centers.map(c => ({
            id: c.id.toString(),
            label: c.center_name,
            subLabel: c.center_id
        }))
    ];

    const renderBankBranchContent = () => {
        return (
            <div className="flex flex-col gap-8">
                {/* Form Section */}
                <div className="bg-card rounded-3xl border border-border-default p-6 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                    
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 shadow-inner">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-text-primary tracking-tight">Branch & Bank Activity</h2>
                            <p className="text-sm text-text-muted">Record deposits or request bank withdrawals</p>
                        </div>
                    </div>

                    <form onSubmit={handleBankActivitySubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Activity Type</label>
                            <div className="flex bg-app-background p-1 rounded-xl border border-border-default shadow-inner">
                                <button
                                    type="button"
                                    onClick={() => setBankActivityType('deposit')}
                                    className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${bankActivityType === 'deposit' ? 'bg-primary-500 text-white shadow-lg' : 'text-text-muted hover:text-text-primary'}`}
                                >
                                    Deposit to Bank
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBankActivityType('withdrawal')}
                                    className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${bankActivityType === 'withdrawal' ? 'bg-primary-500 text-white shadow-lg' : 'text-text-muted hover:text-text-primary'}`}
                                >
                                    Withdrawal from Bank
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Date</label>
                            <div className="relative group">
                                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary-500 transition-colors" />
                                <input
                                    type="date"
                                    value={date}
                                    readOnly
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border-default bg-muted/20 text-text-muted text-sm focus:outline-none cursor-not-allowed font-medium"
                                />
                            </div>
                        </div>

                        {currentUser?.branch_id || currentUser?.branch ? (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Branch</label>
                                <div className="relative group">
                                    <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                    <div className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border-default bg-muted/20 text-text-muted text-sm font-medium">
                                        {currentUser?.branch?.branch_name || currentUser?.branch?.name || 'Assigned Branch'}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <SearchableSelect
                                label="Branch"
                                placeholder="Select a branch"
                                options={branchOptions}
                                value={branchId}
                                onChange={(val) => setBranchId(val as string)}
                                isLoading={loadingBranches}
                            />
                        )}

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Amount (LKR)</label>
                            <div className="relative group">
                                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary-500 transition-colors" />
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter amount"
                                    value={bankActivityAmount}
                                    onChange={(e) => setBankActivityAmount(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-border-default bg-app-background text-text-primary text-sm font-black focus:outline-none focus:border-primary-500 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {bankActivityType === 'deposit' && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Receipt/Ref Number</label>
                                <div className="relative group">
                                    <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Enter reference number"
                                        value={bankActivityReceiptNumber}
                                        onChange={(e) => setBankActivityReceiptNumber(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-border-default bg-app-background text-text-primary text-sm font-bold focus:outline-none focus:border-primary-500 transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {bankActivityType === 'deposit' && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Upload Bank Document</label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={(e) => setBankActivityDocument(e.target.files?.[0] || null)}
                                    className="w-full px-3 py-1.5 rounded-xl border border-border-default bg-app-background text-text-primary text-xs focus:outline-none file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-primary-500/10 file:text-primary-500 hover:file:bg-primary-500/20 transition-all shadow-inner"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                />
                            </div>
                        )}

                        <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-3">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Description (Optional)</label>
                            <textarea
                                placeholder="Enter any additional details about this transaction..."
                                value={bankActivityDescription}
                                onChange={(e) => setBankActivityDescription(e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl border-2 border-border-default bg-app-background text-text-primary text-sm focus:outline-none focus:border-primary-500 min-h-[100px] transition-all resize-none shadow-inner"
                            />
                        </div>

                        <div className="lg:col-span-3 flex justify-end mt-4">
                            <button
                                type="submit"
                                disabled={isSubmittingBank}
                                className={`px-12 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-2xl active:scale-95 ${bankActivityType === 'deposit'
                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
                                        : 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-900/20'
                                    } disabled:opacity-50 flex items-center gap-3`}
                            >
                                {isSubmittingBank ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    bankActivityType === 'deposit' ? <ShieldCheck size={18} /> : <TrendingDown size={18} />
                                )}
                                {bankActivityType === 'deposit' ? 'Record Deposit' : 'Request Withdrawal'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* History Section */}
                <div className="bg-card rounded-3xl border border-border-default overflow-hidden shadow-sm">
                    <div className="px-8 py-5 border-b border-border-default flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/5">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-text-primary/5 flex items-center justify-center text-text-primary">
                                <Clock size={18} />
                            </div>
                            <h3 className="font-black text-text-primary tracking-tight">Recent Bank & Branch Activity</h3>
                        </div>
                        
                        <div className="flex bg-app-background p-1.5 rounded-xl border border-border-default shadow-sm">
                            <button
                                onClick={() => setBankFilterType('')}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${bankFilterType === '' ? 'bg-primary-500 text-white shadow-md' : 'text-text-muted hover:text-text-primary'}`}
                            >
                                All Activities
                            </button>
                            <button
                                onClick={() => setBankFilterType('deposit')}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${bankFilterType === 'deposit' ? 'bg-emerald-600 text-white shadow-md' : 'text-text-muted hover:text-text-primary'}`}
                            >
                                Deposits
                            </button>
                            <button
                                onClick={() => setBankFilterType('withdrawal')}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${bankFilterType === 'withdrawal' ? 'bg-blue-600 text-white shadow-md' : 'text-text-muted hover:text-text-primary'}`}
                            >
                                Withdrawals
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border-default bg-table-header">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase text-text-muted tracking-widest whitespace-nowrap">Date & Reference</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase text-text-muted tracking-widest whitespace-nowrap">Branch Info</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase text-text-muted tracking-widest whitespace-nowrap">Transaction Details</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase text-text-muted tracking-widest whitespace-nowrap text-right">Amount (LKR)</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase text-text-muted tracking-widest whitespace-nowrap text-center">Current Status</th>
                                    <th className="px-8 py-5 text-right w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-default/50">
                                {loadingBankActivities ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={6} className="px-8 py-5"><div className="h-12 bg-muted/10 rounded-2xl" /></td>
                                        </tr>
                                    ))
                                ) : bankActivities.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center text-text-muted italic text-sm">
                                            <div className="flex flex-col items-center gap-4 opacity-30">
                                                <Building2 size={40} />
                                                <p className="font-bold">No bank activities found matching your filters</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    bankActivities.map((activity) => (
                                        <tr key={activity.id} className="hover:bg-primary-500/[0.02] transition-colors group">
                                            <td className="px-8 py-5 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-text-primary">{format(new Date(activity.date), 'MMM dd, yyyy')}</span>
                                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">ID: #{activity.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${activity.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                        {activity.branch?.branch_name?.charAt(0) || 'B'}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-text-primary uppercase">{activity.branch?.branch_name}</span>
                                                        <span className={`text-[9px] font-black uppercase tracking-widest ${activity.type === 'deposit' ? 'text-emerald-500' : 'text-blue-500'}`}>
                                                            {activity.type === 'deposit' ? 'Bank Deposit' : 'Bank Withdrawal'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col max-w-xs gap-1">
                                                    <span className="text-xs text-text-secondary font-medium line-clamp-1">{activity.description || 'No additional details provided'}</span>
                                                    {activity.receipt_number && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-muted/30 text-[9px] font-black text-text-muted border border-border-default/50 w-fit">
                                                            REF: {activity.receipt_number}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right whitespace-nowrap">
                                                <span className={`font-black text-base ${activity.status === 'completed' ? 'text-emerald-500' : (activity.type === 'deposit' ? 'text-emerald-500' : 'text-rose-500')}`}>
                                                    {activity.type === 'deposit' ? '+ ' : '- '}LKR {Number(activity.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-center whitespace-nowrap">
                                                {activity.status === 'completed' ? (
                                                    <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase text-[9px] font-black tracking-widest px-3 py-1 rounded-full inline-block">Completed</span>
                                                ) : activity.status === 'pending' ? (
                                                    <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase text-[9px] font-black tracking-widest px-3 py-1 rounded-full animate-pulse inline-block">Pending Approval</span>
                                                ) : activity.status === 'manager_approved' ? (
                                                    <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase text-[9px] font-black tracking-widest px-3 py-1 rounded-full animate-pulse inline-block">Awaiting Head Office</span>
                                                ) : activity.status === 'waiting_document' ? (
                                                    <span className="bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 uppercase text-[9px] font-black tracking-widest px-3 py-1 rounded-full inline-block">Waiting document</span>
                                                ) : activity.status === 'rejected' ? (
                                                    <span className="bg-rose-500/10 text-rose-500 border border-rose-500/20 uppercase text-[9px] font-black tracking-widest px-3 py-1 rounded-full inline-block">Rejected</span>
                                                ) : (
                                                    <span className="bg-muted text-text-muted border-none uppercase text-[9px] font-black tracking-widest px-3 py-1 rounded-full inline-block">{activity.status}</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {activity.receipt_number && (
                                                        <span className="mr-2 text-[10px] font-black text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10">
                                                            Ref: {activity.receipt_number}
                                                        </span>
                                                    )}
                                                    {activity.status === 'waiting_document' && (
                                                        <button 
                                                            onClick={() => {
                                                                setUploadModal({ isOpen: true, activity });
                                                                setUploadReceiptNumber('');
                                                                setUploadFile(null);
                                                            }}
                                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/10 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-wider shadow-sm active:scale-95"
                                                        >
                                                            <Plus size={14} />
                                                            Upload
                                                        </button>
                                                    )}
                                                    {activity.document_path && (
                                                        <button
                                                            onClick={() => setPreviewDoc({
                                                                url: `${API_BASE_URL.replace('/api', '')}/storage/${activity.document_path}`,
                                                                type: activity.type === 'deposit' ? 'Bank Deposit Receipt' : 'Bank Withdrawal Document'
                                                            })}
                                                            className="p-2.5 rounded-xl bg-text-primary/5 text-text-primary hover:bg-text-primary hover:text-white transition-all shadow-sm active:scale-95"
                                                            title="View Document"
                                                        >
                                                            <FileText size={18} />
                                                        </button>
                                                    )}
                                                    
                                                    {(activity.status === 'pending' || activity.status === 'manager_approved') && 
                                                     (authService.hasPermission('finance.bank_branch_approve') || authService.isSuperAdmin()) && (
                                                        <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-border-default/50">
                                                            <button 
                                                                onClick={() => setBankApproveModal({ isOpen: true, activity })}
                                                                className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-90"
                                                                title="Approve"
                                                            >
                                                                <CheckCircle size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => setBankRejectModal({ isOpen: true, activity })}
                                                                className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-90"
                                                                title="Reject"
                                                            >
                                                                <XCircle size={16} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'bank-branch':
                return renderBankBranchContent();
            case 'branch-daily-activity':
                return (
                    <div className="flex flex-col gap-8">
                        {/* Recording Form */}
                        <div className="bg-card rounded-3xl border border-border-default p-5 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                                    <Plus size={16} />
                                </div>
                                <div>
                                    <h2 className="text-base font-black text-text-primary uppercase tracking-tight">Record Branch Activity</h2>
                                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Enter details for new branch money activity</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">


                                <div className="flex flex-col gap-1">
                                    <SearchableSelect
                                        label="Type"
                                        placeholder="Select type"
                                        options={typeOptions}
                                        value={type}
                                        onChange={(val) => setType(val as any)}
                                    />
                                </div>

                                {/* Branch Selection / Auto-fetch */}
                                {currentUser?.branch_id || currentUser?.branch ? (
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <Building2 size={14} className="text-text-muted" />
                                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Branch</label>
                                        </div>
                                        <div className="w-full px-3 py-1.5 rounded-xl border border-border-default bg-muted/30 text-text-secondary text-sm focus:outline-none cursor-not-allowed font-medium">
                                            {currentUser?.branch?.branch_name || currentUser?.branch?.name || 'Assigned Branch'}
                                        </div>
                                    </div>
                                ) : (
                                    <SearchableSelect
                                        label="Branch"
                                        placeholder="Select a branch"
                                        options={branchOptions}
                                        value={branchId}
                                        onChange={(val) => setBranchId(val as string)}
                                        isLoading={loadingBranches}
                                    />
                                )}

                                {/* Amount */}
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <DollarSign size={14} className="text-text-muted" />
                                        <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Amount (LKR)</label>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Enter amount"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full px-3 py-1.5 rounded-xl border border-border-default bg-app-background text-text-primary text-sm focus:outline-none focus:border-primary-500"
                                    />
                                </div>

                                {/* Staff (Searchable) - User Requirement 1 */}
                                <SearchableSelect
                                    label="Select Staff"
                                    placeholder="Search by Name, ID or NIC"
                                    options={staffOptions}
                                    value={selectedStaffId}
                                    onChange={(val) => setSelectedStaffId(val as string)}
                                    isLoading={loadingStaffs}
                                />

                                {/* Mobile No (Auto-fetch) - User Requirement 2 */}
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <Phone size={14} className="text-text-muted" />
                                        <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Mobile Number</label>
                                    </div>
                                    <input
                                        type="text"
                                        readOnly
                                        value={staffPhone}
                                        placeholder="Auto-fetched on staff selection"
                                        className="w-full px-3 py-1.5 rounded-xl border border-border-default bg-muted/30 text-text-secondary text-sm focus:outline-none cursor-not-allowed"
                                    />
                                </div>

                                {/* Description */}
                                <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <FileText size={14} className="text-text-muted" />
                                        <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Description</label>
                                    </div>
                                    <textarea
                                        rows={2}
                                        placeholder="Describe the activity..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-border-default bg-app-background text-text-primary text-sm focus:outline-none focus:border-primary-500 resize-none"
                                    />
                                </div>

                                {/* Submit Button */}
                                <div className="col-span-1 md:col-span-2 flex justify-end mt-1">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-6 py-2 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 transition-all shadow-lg shadow-primary-900/20 disabled:opacity-50"
                                    >
                                        {submitting ? 'Creating...' : 'Create Activity'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Recent Activities List */}
                        <div className="bg-card rounded-3xl border border-border-default overflow-hidden">
                            <div className="px-6 py-4 border-b border-border-default flex justify-between items-center bg-app-background/30">
                                <h3 className="font-black text-text-primary uppercase tracking-tight">Recent Branch Activities</h3>
                                <div className="flex items-center gap-4">
                                    {recentActivities.some(a => a.status === 'Pending') && (
                                        <button
                                            onClick={() => router.push('/cashier/branch-activity-request')}
                                            className="text-[10px] font-black bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-lg hover:bg-amber-500/20 transition-all uppercase tracking-tighter flex items-center gap-2"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                            Go to Approvals
                                        </button>
                                    )}
                                    <button
                                        onClick={() => router.push('/cashier/branch-activity-request')}
                                        className="text-xs font-bold text-primary-500 hover:text-primary-600 transition-colors uppercase tracking-wider"
                                    >
                                        View All Request
                                    </button>
                                </div>
                            </div>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border-default bg-table-header">
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">#</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Staff</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Activity Type</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingActivities ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-text-muted text-xs">
                                                Loading activities...
                                            </td>
                                        </tr>
                                    ) : recentActivities.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-text-muted text-xs">
                                                No recent activities found for this date
                                            </td>
                                        </tr>
                                    ) : (
                                        (() => {
                                            const startIndex = (activityPage - 1) * activityItemsPerPage;
                                            const paginated = recentActivities.slice(startIndex, startIndex + activityItemsPerPage);
                                            return paginated.map((activity, idx) => (
                                                <tr key={activity.id} className="border-b border-border-default hover:bg-hover transition-colors">
                                                    <td className="px-6 py-4 text-xs font-bold text-text-primary">{startIndex + idx + 1}</td>
                                                    <td className="px-6 py-4 text-xs text-text-primary">
                                                        {activity.date ? format(new Date(activity.date), 'dd MMM yyyy') : 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-text-primary">
                                                        <div className="flex flex-col">
                                                            <span className="font-black uppercase tracking-tight">{activity.requested_by_user?.name || activity.transaction?.user_name || 'N/A'}</span>
                                                            <span className="text-[10px] text-text-muted uppercase tracking-tighter">{activity.requested_by_user?.user_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full w-fit mb-1 ${activity.type === 'inflow' ? 'bg-primary-500/10 text-primary-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                                {activity.type}
                                                            </span>
                                                            <span className="text-xs text-text-muted">{activity.expense_type}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-extrabold text-text-primary">
                                                        LKR {Number(activity.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${activity.status === 'Approved' ? 'bg-primary-500/10 text-primary-500' :
                                                            activity.status === 'Paid' ? 'bg-primary-500 text-white' :
                                                                activity.status === 'Pending' ? 'bg-amber-500/10 text-amber-500' :
                                                                    'bg-rose-500/10 text-rose-500'
                                                            }`}>
                                                            {activity.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {activity.status === 'Approved' && activity.type === 'outflow' ? (
                                                            <button
                                                                onClick={() => setActivityOtpModal({ isOpen: true, activity })}
                                                                className="px-4 py-1.5 rounded-lg bg-primary-600 text-white text-[10px] font-bold uppercase hover:bg-primary-500 transition-all shadow-lg shadow-primary-500/20"
                                                            >
                                                                Pay Now
                                                            </button>
                                                        ) : activity.status === 'Paid' ? (
                                                            <button
                                                                onClick={() => router.push(`/cashier/receipts?type=BRANCH_ACTIVITY&id=${activity.id}`)}
                                                                className="text-[10px] font-bold text-primary-500 hover:text-primary-600 transition-colors uppercase"
                                                            >
                                                                Receipt
                                                            </button>
                                                        ) : null}
                                                    </td>
                                                </tr>
                                            ));
                                        })()
                                    )}
                                </tbody>
                            </table>
                            {recentActivities.length > 0 && (
                                <Pagination
                                    currentPage={activityPage}
                                    totalItems={recentActivities.length}
                                    itemsPerPage={activityItemsPerPage}
                                    onPageChange={setActivityPage}
                                    onItemsPerPageChange={(val) => {
                                        setActivityItemsPerPage(val);
                                        setActivityPage(1);
                                    }}
                                    itemName="activities"
                                />
                            )}
                        </div>
                    </div>
                );

            case 'other-branch-collection':
                return <OtherBranchCollectionPage date={date} period={period} />;


            case 'loan-due-payment':
                return (
                    <div className="flex flex-col gap-6">
                        {/* Tab Header with Back Button if in collection view */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {loanDueView === 'collections' && (
                                    <button
                                        onClick={() => {
                                            setLoanDueView('officers');
                                            setSelectedOfficerId(null);
                                        }}
                                        className="p-2 rounded-xl bg-card border border-border-default hover:bg-hover transition-all text-text-primary group"
                                    >
                                        <ArrowLeftRight size={20} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                                    </button>
                                )}
                                <div>
                                    <h2 className="text-xl font-black text-text-primary uppercase tracking-tight">
                                        {loanDueView === 'officers' ? 'Field Officer Collections' : `Collections for ${officerSummaries.find(o => o.staffId === selectedOfficerId)?.name || 'Staff'}`}
                                    </h2>
                                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                        {loanDueView === 'officers' ? 'Select an officer to view detailed receipts' : 'Manage individual receipts for this officer'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="min-w-[200px]">
                                    <SearchableSelect
                                        label="Filter by Center"
                                        placeholder="All Centers"
                                        options={centerOptions}
                                        value={filterCenterId}
                                        onChange={(val) => {
                                            setFilterCenterId(val as string);
                                            setCurrentPage(1);
                                        }}
                                        isLoading={loadingCenters}
                                    />
                                </div>



                                <div className={`flex bg-app-background p-1 rounded-xl border border-border-default h-fit mt-5`}>
                                    {[
                                        { id: 'active', label: 'PENDING DUES' },
                                        { id: 'settled', label: 'SETTLED HISTORY' }
                                    ].map((s) => (
                                        <button
                                            key={s.id}
                                            onClick={() => {
                                                setCollectionStatus(s.id as any);
                                                setCurrentPage(1);
                                            }}
                                            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${collectionStatus === s.id ? 'bg-primary-500 text-white shadow-lg' : 'text-text-muted hover:text-text-primary'}`}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {loanDueView === 'officers' ? (
                            /* Grid of Officers replaced with Table (List View) */
                            <div className="bg-card rounded-3xl border border-border-default overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-border-default bg-table-header">

                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-text-muted tracking-widest whitespace-nowrap">Field Officer</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-text-muted tracking-widest whitespace-nowrap">Branch / Center</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-text-muted tracking-widest whitespace-nowrap text-center">Receipts</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-text-muted tracking-widest whitespace-nowrap text-right">Total Due</th>

                                            <th className="px-6 py-4 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-default/50">
                                        {loadingActivities ? (
                                            Array(5).fill(0).map((_, i) => (
                                                <tr key={i} className="animate-pulse">
                                                    <td colSpan={5} className="px-6 py-4"><div className="h-10 bg-muted/10 rounded-xl" /></td>
                                                </tr>
                                            ))
                                        ) : officerSummaries.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-16 text-center text-text-muted">
                                                    <div className="flex flex-col items-center gap-2 opacity-40">
                                                        <User size={32} />
                                                        <p className="font-bold text-xs">No officers with {collectionStatus} dues found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            officerSummaries.map((officer) => (
                                                <tr
                                                    key={officer.staffId}
                                                    onClick={() => {
                                                        setSelectedOfficerId(officer.staffId);
                                                        setLoanDueView('collections');
                                                        setCurrentPage(1);
                                                    }}
                                                    className={`hover:bg-primary-500/5 cursor-pointer transition-colors group`}
                                                >

                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 font-black text-xs">
                                                                {officer.name.charAt(0)}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-black text-text-primary text-sm tracking-tight group-hover:text-primary-500 transition-colors uppercase">{officer.name}</span>
                                                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">{officer.employeeId}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 text-text-primary font-bold text-xs uppercase tracking-tight">
                                                            <Building2 size={14} className="text-text-muted" />
                                                            {officer.branch}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-app-background border border-border-default text-xs font-black text-text-primary min-w-[32px]">
                                                            {officer.count}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="font-black text-primary-500 text-sm">LKR {Number(officer.totalAmount).toLocaleString()}</span>
                                                    </td>

                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-center text-primary-500 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">
                                                            <ArrowLeftRight size={16} className="rotate-180" />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            /* Existing Table View but with refinements */
                            <div className="flex flex-col gap-6">
                                <div className="bg-card rounded-3xl border border-border-default overflow-hidden shadow-sm">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-border-default bg-table-header">

                                                <th className="px-6 py-4 w-10">
                                                    {collectionStatus === 'active' && loanDues.length > 0 && (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedReceipts.length === loanDues.filter(r => r.status === 'active').length && loanDues.length > 0}
                                                            onChange={toggleSelectAll}
                                                            className="w-4 h-4 rounded border-border-default text-primary-500 focus:ring-primary-500/20"
                                                        />
                                                    )}
                                                </th>
                                                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Receipt ID</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Customer</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Center</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Amount</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Actions</th>

                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loadingActivities ? (
                                                <tr>
                                                    <td colSpan={8} className="px-6 py-12 text-center text-text-muted text-xs italic">
                                                        Loading loan dues...
                                                    </td>
                                                </tr>
                                            ) : loanDues.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} className="px-6 py-16 text-center text-text-muted">
                                                        <div className="flex flex-col items-center gap-3 opacity-40">
                                                            <DollarSign size={48} />
                                                            <p className="font-bold text-sm">No {collectionStatus} dues found for this officer</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                loanDues.map((record) => (
                                                    <tr key={record.id} className={`border-b border-border-default hover:bg-hover transition-colors group ${selectedReceipts.includes(record.id) ? 'bg-primary-500/5' : ''}`}>
                                                        <td className="px-6 py-4">
                                                            {record.status === 'active' && (
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedReceipts.includes(record.id)}
                                                                    onChange={() => toggleReceiptSelection(record.id)}
                                                                    className="w-4 h-4 rounded border-border-default text-primary-500 focus:ring-primary-500/20"
                                                                />
                                                            )}
                                                        </td>

                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-black text-text-primary">#{record.receipt_id}</span>
                                                                <span className="text-[10px] text-text-muted">{record.loan?.loan_id || record.loan_id}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-black text-text-primary uppercase tracking-tight">
                                                                    {record.customer?.full_name ||
                                                                        record.loan?.customer?.full_name ||
                                                                        record.loan?.customer_name ||
                                                                        record.customer_name ||
                                                                        'N/A'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-[0.1em]">
                                                            {record.center?.center_name || record.branch?.branch_name || 'N/A'}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="text-xs font-black text-text-primary">
                                                                LKR {Number(record.current_due_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-xs text-text-muted">
                                                            {format(new Date(record.created_at), 'dd MMM yyyy')}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${record.status === 'settled' ? 'bg-primary-500/10 text-primary-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                                {record.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            {record.status === 'active' ? (
                                                                <button
                                                                    onClick={() => handleSettle(record.id, record.staff?.user_name)}
                                                                    disabled={settlingId === record.id}
                                                                    className="px-6 py-2 rounded-xl bg-primary-600 text-white font-black text-[10px] uppercase tracking-wider hover:bg-primary-500 transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50"
                                                                >
                                                                    {settlingId === record.id ? 'SETTLING...' : 'SETTLE NOW'}
                                                                </button>
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-text-muted uppercase">Processed</span>
                                                            )}
                                                        </td>

                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <Pagination
                                    currentPage={currentPage}
                                    totalItems={pagination.total}
                                    itemsPerPage={15}
                                    onPageChange={setCurrentPage}
                                    onItemsPerPageChange={() => { }}
                                    itemName="receipts"
                                />
                            </div>
                        )}
                    </div>
                );

            case 'staff-request-iou-pay':
                const canApprove = authService.hasPermission('finance.branch_truncation_view');
                return (
                    <div className="flex flex-col gap-10">

                        {/* 1. APPROVAL SECTION (Only for Managers/Admins) */}
                        {canApprove && (
                            <div className="bg-card rounded-3xl border border-border-default overflow-hidden animate-in slide-in-from-top-4 duration-500">
                                <div className="px-6 py-4 border-b border-border-default bg-primary-500/5 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-500">
                                            <ShieldCheck size={18} />
                                        </div>
                                        <h3 className="font-black text-text-primary uppercase tracking-tight">Requests Pending Your Approval</h3>
                                    </div>
                                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Review and approve fund requests from branch staff</p>
                                </div>
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-border-default bg-table-header">
                                            <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Employee</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Reason</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Amount</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingActivities && iouApprovals.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="w-6 h-6 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
                                                        <span className="text-xs font-bold">Checking for pending approvals...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : iouApprovals.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <CheckCircle size={32} className="opacity-20" />
                                                        <span className="text-xs font-bold">No requests currently pending your approval</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            iouApprovals.map((req) => (
                                                <tr key={req.id} className="border-b border-border-default hover:bg-hover transition-colors group">
                                                    <td className="px-6 py-4 text-sm text-text-primary">{format(new Date(req.created_at), 'MMM dd, yyyy')}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-text-primary">{req.user?.name}</span>
                                                            <span className="text-[10px] text-text-muted uppercase font-black">{req.user?.user_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-text-muted italic">"{req.reason}"</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-sm font-black text-primary-500">LKR {Number(req.amount).toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleRejectIou(req.id)}
                                                                disabled={isRejecting === req.id || isApproving === req.id}
                                                                className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50"
                                                                title="Reject Request"
                                                            >
                                                                {isRejecting === req.id ? <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" /> : <XCircle size={18} />}
                                                            </button>
                                                            <button
                                                                onClick={() => handleApproveIou(req.id)}
                                                                disabled={isApproving === req.id || isRejecting === req.id}
                                                                className="p-2 rounded-lg bg-primary-500/10 text-primary-500 hover:bg-primary-500 hover:text-white transition-all disabled:opacity-50"
                                                                title="Approve Request"
                                                            >
                                                                {isApproving === req.id ? <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /> : <ShieldCheck size={18} />}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* 2. PAYOUT SECTION (For Cashiers/Managers) */}
                        <div className="bg-card rounded-3xl border border-border-default overflow-hidden">
                            <div className="px-6 py-4 border-b border-border-default bg-primary-500/5 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-500">
                                        <CheckCircle size={18} />
                                    </div>
                                    <h3 className="font-black text-text-primary uppercase tracking-tight">Approved IOU Payouts Waiting for Cash</h3>
                                </div>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Process approved fund requests with OTP verification</p>
                            </div>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border-default bg-table-header">
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Request ID</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Employee</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Reason</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Amount</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-center">Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingActivities && iouPayouts.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-text-muted">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-6 h-6 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
                                                    <span className="text-xs font-bold">Checking for payouts...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : iouPayouts.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-text-muted italic text-sm">
                                                No pending payouts found
                                            </td>
                                        </tr>
                                    ) : (
                                        iouPayouts.map((req) => (
                                            <tr key={req.id} className="border-b border-border-default hover:bg-hover transition-colors">
                                                <td className="px-6 py-4 text-sm text-text-primary">{format(new Date(req.created_at), 'MMM dd, yyyy')}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 rounded bg-hover text-[10px] font-bold text-text-primary">{req.request_id}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-text-primary">{req.user?.name}</span>
                                                        <span className="text-[10px] text-text-muted uppercase font-black">{req.user?.user_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${req.request_type === 'reimbursement' ? 'bg-primary-500/10 text-primary-500' : 'bg-primary-500/10 text-primary-500'}`}>
                                                        {req.request_type === 'reimbursement' ? 'Reimbursement' : req.request_type === 'fixed_category' ? 'Fixed Category' : 'IOU Request'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-text-muted">
                                                    {req.category ? `[${req.category.name}] ` : ''}
                                                    {req.reason}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-sm font-black text-primary-500">LKR {Number(req.amount).toLocaleString()}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="px-3 py-1 rounded-full bg-primary-500/10 text-primary-500 text-[10px] font-black uppercase tracking-wider">Approved</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => setOtpModal({ isOpen: true, request: req })}
                                                        className="px-6 py-2 rounded-xl bg-primary-600/10 text-primary-500 text-xs font-black hover:bg-primary-600 hover:text-white transition-all shadow-inner"
                                                    >
                                                        Process Request
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* OTP Modal */}
                        {otpModal.isOpen && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setOtpModal({ isOpen: false, request: null })} />
                                <div className="relative bg-card border border-border-default w-full max-w-md rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95 duration-200 overflow-hidden">
                                    {/* Decorative background element */}
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-primary-500/5 rounded-full -mr-20 -mt-20 blur-3xl" />

                                    <div className="flex flex-col items-center text-center gap-8 relative z-10">
                                        <div className="w-20 h-20 rounded-[2rem] bg-primary-500/10 flex items-center justify-center text-primary-500 shadow-inner">
                                            <ShieldCheck size={40} />
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight">Confirm Disbursement</h2>
                                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-4 leading-relaxed">
                                                Enter the OTP to confirm the disbursement of <span className="text-primary-500 font-black">LKR {Number(otpModal.request?.amount).toLocaleString()}</span> for {otpModal.request?.user?.name || otpModal.request?.user?.user_name}
                                            </p>
                                        </div>

                                        <div className="flex flex-col gap-4 w-full bg-app-background/50 p-8 rounded-[2rem] border border-border-default/50">
                                            <div className="flex flex-col gap-3">
                                                <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em]">One-Time Password (OTP)</label>
                                                <div className="flex justify-center">
                                                    <input
                                                        type="text"
                                                        maxLength={6}
                                                        value={otpValue}
                                                        onChange={(e) => setOtpValue(e.target.value.replace(/[^0-9]/g, ''))}
                                                        autoFocus
                                                        className="w-full text-center text-4xl font-black tracking-[1rem] py-5 rounded-2xl bg-card border-2 border-border-default focus:border-primary-500 focus:outline-none transition-all text-text-primary shadow-inner"
                                                        placeholder="------"
                                                    />
                                                </div>
                                                <p className="text-[10px] text-text-muted font-bold opacity-60">Enter 6-Digit Security Code provided to the staff</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 w-full">
                                            <button
                                                onClick={() => setOtpModal({ isOpen: false, request: null })}
                                                className="px-6 py-4 rounded-2xl text-text-muted font-bold text-sm hover:bg-hover transition-all active:scale-95"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleVerifyOtp}
                                                disabled={isVerifying || otpValue.length < 6}
                                                className="px-6 py-4 rounded-2xl bg-primary-600 text-white font-black text-sm hover:bg-primary-700 transition-all shadow-xl shadow-primary-900/20 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                {isVerifying ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        Verifying...
                                                    </>
                                                ) : (
                                                    'Confirm & Disburse'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col gap-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-text-primary uppercase tracking-tight">Branch Truncation</h1>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Manage branch activity and loan collections</p>
                </div>

                {/* Date Filters / Grouping */}
                <div className="flex items-center gap-4">
                    <div className="flex bg-card p-1 rounded-xl border border-border-default shadow-sm">
                        {['day', 'month', 'year', 'all'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p as any)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${period === p ? 'bg-primary-500 text-white shadow-lg' : 'text-text-muted hover:text-text-primary'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="pl-9 pr-3 py-2 text-xs font-bold bg-card border border-border-default rounded-xl text-text-primary focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Cards Section - Match Image */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card rounded-2xl border border-border-default p-4 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-primary-500 uppercase tracking-wider">Total Income ({period})</p>
                            <TrendingUp size={16} className="text-primary-500" />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <p className="text-[10px] text-text-muted font-bold">LKR</p>
                            <p className="text-xl font-black text-text-primary tracking-tight">
                                {stats ? Number(stats.total_income).toLocaleString() : '0'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-2xl border border-border-default p-4 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Total Expense ({period})</p>
                            <TrendingDown size={16} className="text-rose-500" />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <p className="text-[10px] text-text-muted font-bold">LKR</p>
                            <p className="text-xl font-black text-text-primary tracking-tight">
                                {stats ? Number(stats.total_expense).toLocaleString() : '0'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-2xl border border-border-default p-4 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Net Flow (Cumulative)</p>
                            <Wallet size={16} className="text-blue-500" />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <p className="text-[10px] text-text-muted font-bold">LKR</p>
                            <p className="text-xl font-black text-text-primary tracking-tight">
                                {stats ? Number(stats.net_flow).toLocaleString() : '0'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-2xl border border-border-default p-4 shadow-sm relative overflow-hidden group border-r-primary-500/50">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">Total Branch Truncation ({period})</p>
                            <Activity size={16} className="text-purple-500" />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <p className="text-[10px] text-text-muted font-bold">LKR</p>
                            <p className="text-xl font-black text-text-primary tracking-tight">
                                {stats ? Number(stats.total_truncation).toLocaleString() : '0'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation Section */}
            <div className="flex items-center justify-center gap-12 border-b border-border-default pb-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`text-sm font-bold transition-all relative pb-4 ${activeTab === tab.id
                            ? 'text-primary-500'
                            : 'text-text-muted hover:text-text-primary'
                            }`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500 rounded-full animate-in fade-in slide-in-from-bottom-2" />
                        )}
                    </button>
                ))}
            </div>

            {/* Content Section */}
            <div className="min-h-[400px]">
                {renderTabContent()}
            </div>

            {/* OTP Verification Modal for Branch Activity */}
            {activityOtpModal.isOpen && activityOtpModal.activity && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActivityOtpModal({ isOpen: false, activity: null })} />
                    <div className="relative bg-card border border-border-default rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-8 flex flex-col items-center text-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center">
                                <ShieldCheck size={32} className="text-primary-500" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">Verify Branch Activity Payment</h3>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                    Please enter the 6-digit OTP sent to the staff member who requested this activity.
                                </p>
                            </div>

                            <div className="w-full flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-xs font-bold text-text-muted uppercase">OTP Code</label>
                                        <button
                                            onClick={handleResendActivityOtp}
                                            disabled={resendingOtp}
                                            className="text-xs font-bold text-primary-500 hover:underline disabled:opacity-50"
                                        >
                                            {resendingOtp ? 'Resending...' : 'Resend OTP'}
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={activityOtpValue}
                                        onChange={(e) => setActivityOtpValue(e.target.value.replace(/\D/g, ''))}
                                        placeholder="······"
                                        className="w-full text-center text-2xl font-black tracking-[1em] py-4 rounded-2xl border border-border-default bg-app-background focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all placeholder:text-text-muted/30"
                                    />
                                </div>
                                <button
                                    onClick={handleVerifyActivityOtp}
                                    disabled={isActivityVerifying || activityOtpValue.length !== 6}
                                    className="w-full py-4 rounded-2xl bg-primary-600 text-white font-black text-sm uppercase tracking-wider hover:bg-primary-500 transition-all shadow-lg shadow-primary-900/20 disabled:opacity-50"
                                >
                                    {isActivityVerifying ? 'Verifying...' : 'Verify & Disburse'}
                                </button>
                                <button
                                    onClick={() => setActivityOtpModal({ isOpen: false, activity: null })}
                                    className="w-full py-3 text-sm font-bold text-text-muted hover:text-text-primary transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ActionConfirmModal
                isOpen={settleConfirm.isOpen}
                onClose={() => setSettleConfirm({ isOpen: false, receiptId: null, staffId: null })}
                onConfirm={confirmSettle}
                title="CONFIRM SETTLEMENT"
                message="Are you sure you want to settle this receipt? This action will record the collection as received by the branch."
                confirmLabel="SETTLE NOW"
                variant="primary"
            />

            <ActionConfirmModal
                isOpen={bulkSettleConfirm.isOpen}
                onClose={() => setBulkSettleConfirm({ isOpen: false, count: 0, totalAmount: 0, settlements: [] })}
                onConfirm={confirmBulkSettle}
                title="CONFIRM BULK SETTLEMENT"
                message={`Are you sure you want to settle ${bulkSettleConfirm.count} collections totaling LKR ${bulkSettleConfirm.totalAmount.toLocaleString()}? All selected records will be marked as received.`}
                confirmLabel={isBulkSettling ? 'PROCESSING...' : 'SETTLE ALL NOW'}
                variant="primary"
            />
            <ActionConfirmModal
                isOpen={iouApproveConfirm.isOpen}
                onClose={() => setIouApproveConfirm({ isOpen: false, id: null })}
                onConfirm={confirmApproveIou}
                title="APPROVE REQUEST"
                message="Are you sure you want to approve this fund request? Once approved, it will be available for payout."
                confirmLabel="APPROVE"
                variant="primary"
                showNoteInput={true}
            />

            {/* Bank Activity Approval Modal */}
            <ActionConfirmModal
                isOpen={bankApproveModal.isOpen}
                onClose={() => setBankApproveModal({ isOpen: false, activity: null })}
                onConfirm={confirmApproveBank}
                title="Authorize Bank Activity"
                message={`Are you sure you want to authorize this ${bankApproveModal.activity?.type} of LKR ${Number(bankApproveModal.activity?.amount).toLocaleString()}?`}
                confirmLabel="Authorize"
                variant="primary"
                showNoteInput={true}
                notePlaceholder="Enter approval note..."
            />

            {/* Bank Activity Rejection Modal */}
            {bankRejectModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setBankRejectModal({ isOpen: false, activity: null })} />
                    <div className="relative bg-card border border-border-default rounded-[3rem] shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-10 flex flex-col items-center text-center gap-8">
                            <div className="w-20 h-20 rounded-[2rem] bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-inner">
                                <XCircle size={40} />
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-text-primary tracking-tight">Reject Request</h3>
                                <p className="text-sm text-text-muted">Please provide a reason for rejecting this bank activity request.</p>
                            </div>

                            <textarea
                                className="w-full px-5 py-4 rounded-2xl border-2 border-border-default bg-app-background text-text-primary text-sm focus:outline-none focus:border-rose-500 min-h-[120px] resize-none font-medium transition-all shadow-inner"
                                placeholder="Enter rejection reason..."
                                value={bankRejectionReason}
                                onChange={(e) => setBankRejectionReason(e.target.value)}
                            />

                            <div className="grid grid-cols-2 gap-4 w-full">
                                <button
                                    onClick={() => setBankRejectModal({ isOpen: false, activity: null })}
                                    className="px-6 py-4 rounded-2xl text-text-muted font-black text-xs uppercase tracking-widest hover:bg-hover transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmRejectBank}
                                    disabled={isBankRejecting === bankRejectModal.activity?.id || !bankRejectionReason.trim()}
                                    className="px-6 py-4 rounded-2xl bg-rose-600 text-white font-black text-xs uppercase tracking-widest hover:bg-rose-500 transition-all shadow-lg shadow-rose-900/40 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isBankRejecting === bankRejectModal.activity?.id ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <XCircle size={16} />
                                    )}
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Document Modal */}
            {uploadModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isUploading && setUploadModal({ isOpen: false, activity: null })} />
                    <div className="relative bg-card border border-border-default rounded-[3.5rem] shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                        
                        <div className="p-10 flex flex-col gap-8 relative z-10">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-[2rem] bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-inner">
                                    <FileText size={32} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <h3 className="text-2xl font-black text-text-primary tracking-tight uppercase">Upload Bank Receipt</h3>
                                    <p className="text-xs text-text-muted font-bold opacity-60 uppercase tracking-wider">Finalizing LKR {Number(uploadModal.activity?.amount).toLocaleString()} Withdrawal</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Bank Receipt Number</label>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-indigo-500 transition-colors">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <input
                                            type="text"
                                            className="w-full pl-14 pr-5 py-5 rounded-2xl border-2 border-border-default bg-app-background text-text-primary text-base font-black focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                                            placeholder="e.g. REC-10293"
                                            value={uploadReceiptNumber}
                                            onChange={(e) => setUploadReceiptNumber(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Document Evidence</label>
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`w-full border-2 border-dashed rounded-[2.5rem] p-10 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer hover:bg-indigo-500/5 group ${uploadFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-border-default hover:border-indigo-500/50'}`}
                                    >
                                        <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-all ${uploadFile ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-muted/10 text-text-muted group-hover:bg-indigo-500 group-hover:text-white shadow-indigo-500/20'}`}>
                                            {uploadFile ? <CheckCircle size={28} /> : <Plus size={28} />}
                                        </div>
                                        <div className="text-center">
                                            <p className={`text-base font-black tracking-tight ${uploadFile ? 'text-emerald-600' : 'text-text-primary'}`}>
                                                {uploadFile ? uploadFile.name : 'Click to select document'}
                                            </p>
                                            <p className="text-[10px] font-bold text-text-muted mt-1 uppercase tracking-wider opacity-60">PDF, JPG or PNG (Max 5MB)</p>
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                            accept=".jpg,.jpeg,.png,.pdf"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => !isUploading && setUploadModal({ isOpen: false, activity: null })}
                                    className="px-6 py-5 rounded-2xl text-text-muted font-black text-xs uppercase tracking-widest hover:bg-hover transition-all active:scale-95 disabled:opacity-50"
                                    disabled={isUploading}
                                >
                                    Go Back
                                </button>
                                <button
                                    onClick={() => uploadModal.activity && uploadFile && handleWithdrawalDocumentUpload(uploadModal.activity.id, uploadFile, uploadReceiptNumber)}
                                    disabled={isUploading || !uploadFile || !uploadReceiptNumber.trim()}
                                    className="px-6 py-5 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-900/40 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {isUploading ? (
                                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <CheckCircle size={18} />
                                    )}
                                    Finalize Withdrawal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {/* Rejection Modal */}
            {rejectionModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setRejectionModal({ isOpen: false, id: null })} />
                    <div className="relative bg-card border border-border-default w-full max-w-md rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/5 rounded-full -mr-20 -mt-20 blur-3xl" />

                        <div className="flex flex-col items-center text-center gap-8 relative z-10">
                            <div className="w-20 h-20 rounded-[2rem] bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-inner">
                                <XCircle size={40} />
                            </div>

                            <div className="flex flex-col gap-2">
                                <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight">Reject Request</h2>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-4 leading-relaxed">
                                    Please provide a reason for rejecting this fund request. This will be visible to the staff member.
                                </p>
                            </div>

                            <div className="w-full bg-app-background/50 p-6 rounded-[2rem] border border-border-default/50">
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Enter rejection reason..."
                                    className="w-full min-h-[120px] p-4 bg-card border-2 border-border-default rounded-2xl text-sm text-text-primary focus:border-rose-500 focus:outline-none transition-all resize-none shadow-inner"
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full">
                                <button
                                    onClick={() => setRejectionModal({ isOpen: false, id: null })}
                                    className="px-6 py-4 rounded-2xl text-text-muted font-bold text-sm hover:bg-hover transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmRejectIou}
                                    disabled={isRejecting !== null || !rejectionReason.trim()}
                                    className="px-6 py-4 rounded-2xl bg-rose-600 text-white font-black text-sm hover:bg-rose-700 transition-all shadow-xl shadow-rose-900/20 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {isRejecting !== null ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : null}
                                    Confirm Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Floating Action Bar for Bulk Selection */}
            {selectedReceipts.length > 0 && activeTab === 'loan-due-payment' && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[90] animate-in slide-in-from-bottom-8 duration-300">
                    <div className="bg-text-primary text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-10 border border-white/10 backdrop-blur-xl">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-black uppercase text-white/50 tracking-[0.2em]">SELECTED COLLECTIONS</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">{selectedReceipts.length} UNITS</span>
                        </div>
                        <div className="w-[1px] h-8 bg-white/20" />
                        <div className="flex flex-col gap-0.5" >
                            <span className="text-[10px] font-black uppercase text-white/50 tracking-[0.2em]">TOTAL AMOUNT</span>
                            <span className="text-xl font-black">LKR {loanDues
                                .filter(r => selectedReceipts.includes(r.id))
                                .reduce((sum, r) => sum + Number(r.current_due_amount || 0), 0)
                                .toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSelectedReceipts([])}
                                className="px-6 py-3 rounded-2xl text-[10px] font-black hover:bg-white/10 transition-all uppercase tracking-widest text-white/70"
                            >
                                CLEAR
                            </button>
                            <button
                                onClick={handleBulkSettle}
                                disabled={isBulkSettling}
                                className="bg-primary-500 hover:bg-primary-600 px-8 py-3 rounded-2xl text-xs font-black transition-all uppercase tracking-wider flex items-center gap-2"
                            >
                                {isBulkSettling ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <CheckCircle size={16} />
                                )}
                                SETTLE SELECTED
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BranchActivityPage;

