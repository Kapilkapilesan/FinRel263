'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { Download, LayoutList } from 'lucide-react';
import BMSLoader from '@/components/common/BMSLoader';
import { CollectionStats } from './CollectionStats';
import { CollectionFilters, DateMode } from './CollectionFilters';
import { ScheduledPaymentsTable } from './ScheduledPaymentsTable';
import { PaymentModal } from './PaymentModal';
import { ReceiptPreviewModal } from './ReceiptPreviewModal';
import { PaymentHistoryModal } from './PaymentHistoryModal';
import { ScheduledPayment, CollectionStats as StatsType } from '../../services/collection.types';
import { collectionService } from '../../services/collection.service';
import { authService } from '../../services/auth.service';
import { useBranches, useCenters } from '../../hooks/useSharedData';
import { useDuePayments, useGroupsByCenter } from '../../hooks/useCollections';
import { toast } from 'react-toastify';

export function CollectionScreen() {
    const { data: globalBranches = [] } = useBranches();
    const { data: globalCenters = [] } = useCenters();
    const branches = globalBranches;

    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedCenter, setSelectedCenter] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [dateMode, setDateMode] = useState<DateMode>('today');
    const [isAdHoc, setIsAdHoc] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showReceiptPreview, setShowReceiptPreview] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<ScheduledPayment | null>(null);
    const [receiptData, setReceiptData] = useState<any>(null);

    // Auto-select if only one branch (Field Officer case)
    useEffect(() => {
        if (!selectedBranch && branches.length === 1) {
            setSelectedBranch(String(branches[0].id));
        }
    }, [branches, selectedBranch]);

    // Derived Centers Calculation
    const centers = useMemo(() => {
        if (!selectedBranch) return [];
        return globalCenters.filter((c: any) =>
            String(c.branch_id) === selectedBranch &&
            c.status === 'active'
        );
    }, [globalCenters, selectedBranch]);

    // Handle resetting invalid selections dynamically
    useEffect(() => {
        if (selectedCenter && !centers.find((c: any) => String(c.id) === selectedCenter)) {
            setSelectedCenter('');
        }
    }, [centers, selectedCenter]);

    // Groups logic via hook
    const { data: groupsData } = useGroupsByCenter(selectedCenter);
    const groups = groupsData || [];

    useEffect(() => {
        if (selectedGroup && !groups.find((g: any) => String(g.id) === selectedGroup)) {
            setSelectedGroup('');
        }
    }, [groups, selectedGroup]);

    // Fetch payments automatically from React Query via hook
    const paymentMode = isAdHoc ? 'adhoc' : (dateMode === 'all' ? 'all' : undefined);
    const { data: paymentsData, isLoading, refetch } = useDuePayments(
        selectedBranch, 
        selectedCenter || undefined, 
        selectedDate, 
        paymentMode
    );

    const payments = paymentsData?.payments || [];
    const stats: StatsType = paymentsData?.stats || {
        totalDue: 0,
        collected: 0,
        arrears: 0,
        suspense: 0
    };


    // Filter payments by selectedGroup locally
    const filteredPayments = useMemo(() => {
        let result = payments;
        if (selectedGroup) {
            const groupObj = groups.find(g => String(g.id) === selectedGroup);
            if (groupObj) {
                result = result.filter(p => p.group === groupObj.group_name);
            }
        }
        return result;
    }, [payments, selectedGroup, groups]);

    const handleCollectPayment = (customer: ScheduledPayment) => {
        setSelectedCustomer(customer);
        setShowPaymentModal(true);
    };

    const handleShowHistory = (customer: ScheduledPayment) => {
        setSelectedCustomer(customer);
        setShowHistoryModal(true);
    };

    const handlePrintHistoryReceipt = async (payment: any) => {
        if (!payment.receipt) return;
        try {
            // We need full receipt details including branch, center, etc.
            // Let's assume we can fetch it or we already have enough in receiptData state if we update it.
            // For now, let's just trigger the preview modal with what we have.
            setReceiptData({
                payment: payment,
                receipt: payment.receipt,
                // We'll need to make sure the preview modal can handle missing branch/staff info or fetch it.
            });
            setShowReceiptPreview(true);
        } catch (error) {
            toast.error("Failed to prepare receipt for printing");
        }
    };

    const handleProcessPayment = async (amount: string, type: 'full' | 'partial', method: string, remarks: string) => {
        if (!selectedCustomer) return;

        try {
            setIsProcessing(true);

            // Store original due and arrears for receipt logic
            const originalDue = selectedCustomer.dueAmount;
            const originalArrears = selectedCustomer.arrears;
            const originalTotalPayable = selectedCustomer.totalPayable;

            const paymentData = {
                loan_id: selectedCustomer.id,
                amount: parseFloat(amount),
                payment_date: selectedDate,
                receipt_number: `RCP-${Date.now()}-${selectedCustomer.id}`
            };

            const result = await collectionService.collectPayment(paymentData);

            toast.success('Payment collected successfully!');

            // Add total context to receipt data for arrears logic
            setReceiptData({
                ...result,
                originalDue: originalDue,
                originalArrears: originalArrears,
                originalTotalPayable: originalTotalPayable
            });

            setShowPaymentModal(false);
            setShowReceiptPreview(true);

            // Refresh payment list via react query
            refetch();

        } catch (error: any) {
            console.error('Failed to collect payment', error);
            toast.error(error.message || 'Failed to collect payment');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePrintReceipt = () => {
        window.print();
        setShowReceiptPreview(false);
        setReceiptData(null);
    };

    const handleExportSummary = async () => {
        if (!selectedBranch) return;
        try {
            await collectionService.exportCollections(
                selectedBranch,
                selectedCenter || undefined,
                selectedDate
            );
            toast.success('Collection summary exported successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to export collection summary');
        }
    };

    const getCenterName = () => {
        if (!selectedCenter) {
            const branch = branches.find(b => String(b.id) === selectedBranch);
            return branch ? branch.branch_name : '';
        }
        const center = centers.find(c => String(c.id) === selectedCenter);
        return center ? center.center_name : '';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary uppercase tracking-tight">COLLECTION SCREEN</h1>
                    <p className="text-sm text-text-muted mt-1 uppercase">COLLECT PAYMENTS AND GENERATE RECEIPTS</p>
                </div>
                {selectedBranch && authService.hasPermission('collections.export') && (
                    <button
                        onClick={handleExportSummary}
                        className="flex items-center gap-2 px-6 py-2.5 bg-card border border-border-default text-text-primary rounded-2xl hover:bg-muted-bg transition-shadow shadow-sm active:scale-95"
                    >
                        <Download className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-widest">Export Summary</span>
                    </button>
                )}
            </div>

            {/* Filter Section */}
            <CollectionFilters
                branches={branches}
                centers={centers as any[]}
                groups={groups}
                selectedBranch={selectedBranch}
                selectedCenter={selectedCenter}
                selectedGroup={selectedGroup}
                onBranchChange={(branchId) => {
                    setSelectedBranch(branchId);
                    setSelectedCenter('');
                    setSelectedGroup('');
                }}
                onCenterChange={(centerId) => {
                    setSelectedCenter(centerId);
                    setSelectedGroup('');
                }}
                onGroupChange={setSelectedGroup}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                dateMode={dateMode}
                onDateModeChange={setDateMode}
                isAdHoc={isAdHoc}
                onAdHocChange={setIsAdHoc}
            />

            {selectedBranch && (
                <>
                    {/* Statistics Cards */}
                    <CollectionStats stats={stats} />

                    {/* Scheduled Payments Table */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20 bg-card rounded-3xl border border-border-default">
                            <BMSLoader message="Loading payments..." size="xsmall" />
                        </div>
                    ) : (
                        <ScheduledPaymentsTable
                            payments={filteredPayments}
                            selectedCenter={getCenterName()}
                            onCollectPayment={handleCollectPayment}
                            onShowHistory={handleShowHistory}
                            selectedDate={selectedDate}
                        />
                    )}
                </>
            )}

            {/* Payment Modal */}
            <PaymentModal
                isOpen={showPaymentModal}
                customer={selectedCustomer}
                onClose={() => setShowPaymentModal(false)}
                onProcessPayment={handleProcessPayment}
                isProcessing={isProcessing}
            />

            {/* Payment History Modal */}
            <PaymentHistoryModal
                isOpen={showHistoryModal}
                customer={selectedCustomer}
                onClose={() => setShowHistoryModal(false)}
                onPrintReceipt={handlePrintHistoryReceipt}
            />

            {/* Receipt Preview Modal */}
            <ReceiptPreviewModal
                isOpen={showReceiptPreview}
                customer={selectedCustomer}
                paymentAmount={receiptData?.payment?.last_payment_amount?.toString() || '0'}
                receiptData={receiptData}
                onClose={() => {
                    setShowReceiptPreview(false);
                    setReceiptData(null);
                }}
                onPrint={handlePrintReceipt}
            />
        </div>
    );
}
