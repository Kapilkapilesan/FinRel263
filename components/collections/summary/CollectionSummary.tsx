'use client'

import React, { useState, useEffect } from 'react';
import { CollectionSummaryFilters } from './CollectionSummaryFilters';
import { CollectionStats } from './CollectionStats';
import { CollectionBranchTable } from './CollectionBranchTable';
import { BranchDetailsView } from './BranchDetailsView';
import { collectionSummaryService } from '../../../services/collectionSummary.service';
import { toast } from 'react-toastify';
import { BranchCollection, SummaryStats } from './types';

export function CollectionSummary() {
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        // Adjust for local timezone to ensure we don't get yesterday's date via UTC
        const offset = today.getTimezoneOffset();
        const localDate = new Date(today.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
    });
    const [viewType, setViewType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [isLoading, setIsLoading] = useState(true);
    const [branchCollections, setBranchCollections] = useState<BranchCollection[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<{ id: string, name: string } | null>(null);
    const [filteredBranchId, setFilteredBranchId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [selectedDate, viewType]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const data = await collectionSummaryService.getSummary(selectedDate, viewType);
            setBranchCollections(data);
        } catch (error) {
            console.error('Failed to load collection summary:', error);
            toast.error('Failed to load summary data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            await collectionSummaryService.exportSummary(selectedDate, viewType);
            toast.success('Export started');
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to export data');
        }
    };

    const handleImport = async (file: File) => {
        try {
            setIsLoading(true);
            const result = await collectionSummaryService.importCollections(file);

            if (result.status === 'success') {
                toast.success(result.message);
                if (result.errors && result.errors.length > 0) {
                    console.warn('Import errors:', result.errors);
                    toast.warning(`Imported with ${result.errors.length} errors. Check console for details.`);
                }
                loadData(); // Refresh data
            } else {
                toast.error(result.message || 'Import failed');
            }
        } catch (error: any) {
            console.error('Import failed:', error);
            toast.error(error.message || 'Failed to import collections');
        } finally {
            setIsLoading(false);
        }
    };

    // Filter data if a branch is selected
    const filteredCollections = filteredBranchId
        ? branchCollections.filter(b => b.branchId === filteredBranchId)
        : branchCollections;

    const filteredBranchName = branchCollections.find(b => b.branchId === filteredBranchId)?.branch;

    // Calculate aggregated stats from branch data using new structure
    const stats: SummaryStats = filteredCollections.reduce((acc, curr) => ({
        totalTarget: acc.totalTarget + curr.target,
        totalCollected: acc.totalCollected + curr.collected,
        totalVariance: acc.totalVariance + curr.variance,
        totalActiveCustomers: acc.totalActiveCustomers + curr.total_active_customers,
        totalDueCustomers: acc.totalDueCustomers + curr.due_customers,
        totalPaidCustomers: acc.totalPaidCustomers + curr.paid_customers,
        achievement: 0, // Will be calculated below
    }), {
        totalTarget: 0,
        totalCollected: 0,
        totalVariance: 0,
        totalActiveCustomers: 0,
        totalDueCustomers: 0,
        totalPaidCustomers: 0,
        achievement: 0
    });

    // Calculate achievement percentage
    stats.achievement = stats.totalTarget > 0
        ? parseFloat(((stats.totalCollected / stats.totalTarget) * 100).toFixed(1))
        : (stats.totalCollected > 0 ? 100 : 0);

    return (
        <div className="space-y-6">
            <CollectionSummaryFilters
                viewType={viewType}
                onViewTypeChange={setViewType}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onExport={handleExport}
                onImport={handleImport}
                isLoading={isLoading}
            />

            {selectedBranch ? (
                <BranchDetailsView
                    branchId={selectedBranch.id}
                    branchName={selectedBranch.name}
                    date={selectedDate}
                    viewType={viewType}
                    onClose={() => setSelectedBranch(null)}
                />
            ) : (
                <>
                    <CollectionStats
                        stats={stats}
                        isLoading={isLoading}
                        onClearFilter={() => setFilteredBranchId(null)}
                        filteredBranchName={filteredBranchName}
                    />

                    <CollectionBranchTable
                        branchCollections={branchCollections}
                        isLoading={isLoading}
                        selectedBranchId={filteredBranchId}
                        onBranchSelect={(id) => setFilteredBranchId(id)}
                        onViewDetails={(id, name) => setSelectedBranch({ id, name })}
                    />
                </>
            )}

        </div>
    );
}
