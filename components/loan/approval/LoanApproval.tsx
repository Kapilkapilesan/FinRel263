'use client';

import React from 'react';
import { useLoanApproval } from '@/hooks/loan/useLoanApproval';
import { ApprovalFilters } from './ApprovalFilters';
import { ApprovalTable } from './ApprovalTable';
import { ApprovalModal } from './ApprovalModal';

import BMSLoader from '@/components/common/BMSLoader';

export function LoanApproval() {
    const {
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
        isLoading,
        isProcessing,
        error
    } = useLoanApproval();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <BMSLoader message="Loading approvals..." size="xsmall" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-danger-50 border border-danger-100 text-danger-600 px-4 py-3 rounded-lg">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Loan Approval</h1>
                    <p className="text-sm text-text-secondary mt-1">Review and approve loan applications</p>
                </div>
            </div>

            {/* Filters */}
            <ApprovalFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterStatus={filterStatus}
                onStatusChange={setFilterStatus}
                filterBranchId={filterBranchId}
                onBranchChange={setFilterBranchId}
                branches={branches}
                filterStaff={filterStaff}
                onStaffChange={setFilterStaff}
                availableStaff={availableStaff}
            />

            {/* Loans Table */}
            <ApprovalTable
                loans={filteredLoans}
                onView={setViewingLoan}
            />

            {/* View Loan Details Modal */}
            {viewingLoan && (
                <ApprovalModal
                    loan={viewingLoan}
                    onClose={() => setViewingLoan(null)}
                    onFirstApproval={handleFirstApproval}
                    onSecondApproval={handleSecondApproval}
                    isProcessing={isProcessing}
                />
            )}
        </div>
    );
}
