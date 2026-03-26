import React, { useState, useEffect, useMemo } from 'react';
import { DueListFilters, Center, Branch } from './DueListFilters';
import { DueListTable, DuePayment } from './DueListTable';
import { DueListStats, DueListSummary } from './DueListStats';
import { ExtendDueDateModal } from './ExtendDueDateModal';
import { dueListService } from '@/services/dueList.service';
import { centerService } from '@/services/center.service';
import { branchService } from '@/services/branch.service';
import { toast } from 'react-toastify';
import { CalendarOff } from 'lucide-react';
import { BulkSkipModal } from './BulkSkipModal';
import { Pagination } from '@/components/common/Pagination';

interface ExtendedCenter extends Center {
    branch_id: string; // Add branch_id for filtering
}

export function DueList() {
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [branchFilter, setBranchFilter] = useState('All');
    const [centerFilter, setCenterFilter] = useState('All');
    const [dueWeekFilter, setDueWeekFilter] = useState('all');
    const [showAllDates, setShowAllDates] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [branches, setBranches] = useState<Branch[]>([]);
    const [allCenters, setAllCenters] = useState<ExtendedCenter[]>([]); // Store all centers
    const [filteredCenters, setFilteredCenters] = useState<ExtendedCenter[]>([]); // Store filtered centers

    const [payments, setPayments] = useState<DuePayment[]>([]);
    const [isLoadingPayments, setIsLoadingPayments] = useState(true);

    // Extension Modal State
    const [extensionPayment, setExtensionPayment] = useState<DuePayment | null>(null);
    const [showBulkSkipModal, setShowBulkSkipModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [summary, setSummary] = useState<DueListSummary | null>(null);
    const [isLoadingSummary, setIsLoadingSummary] = useState(true);

    // Load branches and centers on mount
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [branchesData, centersData] = await Promise.all([
                    branchService.getBranchesAll(),
                    centerService.getCentersList('active')
                ]);

                setBranches(branchesData.map(b => ({
                    id: String(b.id),
                    branch_name: b.branch_name
                })));

                const mappedCenters = centersData.map((c) => ({
                    id: c.id,
                    center_name: c.center_name,
                    branch_id: String(c.branch_id || c.branch?.id || '')
                }));
                setAllCenters(mappedCenters);
                setFilteredCenters(mappedCenters);

            } catch (error) {
                console.error('Failed to load initial data:', error);
            }
        };
        loadInitialData();
    }, []);

    // Filter centers when branch changes
    useEffect(() => {
        if (branchFilter === 'All') {
            setFilteredCenters(allCenters);
        } else {
            setFilteredCenters(allCenters.filter(c => c.branch_id === branchFilter));
        }
        // Reset center filter if the selected center is not in the new branch
        if (centerFilter !== 'All') {
            const isCenterValid = branchFilter === 'All' ||
                allCenters.find(c => c.id === centerFilter)?.branch_id === branchFilter;

            if (!isCenterValid) {
                setCenterFilter('All');
            }
        }
    }, [branchFilter, allCenters]);



    // Load payments when date, branch or center changes
    useEffect(() => {
        const loadPayments = async () => {
            try {
                setIsLoadingPayments(true);
                const paymentsData = await dueListService.getDueList(
                    selectedDate,
                    centerFilter !== 'All' ? centerFilter : undefined,
                    showAllDates,
                    branchFilter !== 'All' ? branchFilter : undefined,
                    dueWeekFilter
                );
                setPayments(paymentsData);
            } catch (error) {
                console.error('Failed to load payments:', error);
            } finally {
                setIsLoadingPayments(false);
            }
        };

        const loadSummary = async () => {
            try {
                setIsLoadingSummary(true);
                const summaryData = await dueListService.getDueListSummary();
                setSummary(summaryData);
            } catch (error) {
                console.error('Failed to load summary:', error);
            } finally {
                setIsLoadingSummary(false);
            }
        };

        loadPayments();
        loadSummary();
    }, [selectedDate, centerFilter, branchFilter, showAllDates, dueWeekFilter, refreshTrigger]);

    // Reset page when filters or itemsPerPage change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedDate, centerFilter, branchFilter, showAllDates, dueWeekFilter, searchQuery, itemsPerPage]);

    // Filter payments based on search query
    const filteredPayments = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return payments;

        return payments.filter(
            (p) =>
                p.customer.toLowerCase().includes(query) ||
                p.contractNo.toLowerCase().includes(query) ||
                p.customerId.toLowerCase().includes(query)
        );
    }, [payments, searchQuery]);

    const paginatedPayments = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredPayments.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredPayments, currentPage, itemsPerPage]);

    const handlePaymentClick = (payment: DuePayment) => {
        // Navigate to payment details or open a modal
        console.log('Payment clicked:', payment);
    };

    const handleExtendClick = (payment: DuePayment) => {
        setExtensionPayment(payment);
    };

    const handleExtensionSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const handleBulkSkipConfirm = async (centerId: string, dates: string[], reason: string) => {
        try {
            const result = await dueListService.bulkSkip(centerId, dates, reason);
            toast.success(result.message);
            setRefreshTrigger(prev => prev + 1);
        } catch (error: any) {
            toast.error(error.message || 'Failed to skip payments.');
        }
    };

    return (
        <div className="space-y-3">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-text-primary uppercase tracking-tight">DUE LIST</h1>
                <p className="text-sm text-text-muted mt-1 uppercase">
                    VIEW SCHEDULED PAYMENTS AND COLLECTIONS
                </p>
            </div>

            {summary && (
                <DueListStats summary={summary} isLoading={isLoadingSummary} />
            )}



            {/* Filter Section */}
            <DueListFilters
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                centerFilter={centerFilter}
                onCenterFilterChange={setCenterFilter}
                dueWeekFilter={dueWeekFilter}
                onDueWeekFilterChange={setDueWeekFilter}
                branchFilter={branchFilter}
                onBranchFilterChange={setBranchFilter}
                branches={branches}
                centers={filteredCenters}
                isLoading={isLoadingPayments}
                showAllDates={showAllDates}
                onShowAllDatesChange={setShowAllDates}
                extraActions={
                    <button
                        onClick={() => setShowBulkSkipModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition-colors shadow-sm whitespace-nowrap"
                        title="Bulk Skip Due Dates"
                    >
                        <CalendarOff size={18} />
                        <span className="font-bold text-xs uppercase tracking-widest">Bulk Skip</span>
                    </button>
                }
            />

            {/* Due Payments Table */}
            <DueListTable
                payments={paginatedPayments}
                selectedDate={selectedDate}
                isLoading={isLoadingPayments}
                onPaymentClick={handlePaymentClick}
                onExtendClick={handleExtendClick}
            />

            <Pagination
                currentPage={currentPage}
                totalItems={filteredPayments.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                itemName="PAYMENTS"
            />

            <ExtendDueDateModal
                isOpen={!!extensionPayment}
                onClose={() => setExtensionPayment(null)}
                onSuccess={handleExtensionSuccess}
                payment={extensionPayment}
                originalDate={extensionPayment?.dueDate || selectedDate}
            />

            <BulkSkipModal
                isOpen={showBulkSkipModal}
                onClose={() => setShowBulkSkipModal(false)}
                onConfirm={handleBulkSkipConfirm}
                centers={allCenters}
            />
        </div>
    );
}
