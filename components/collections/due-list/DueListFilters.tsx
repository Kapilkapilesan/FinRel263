'use client'

import React from 'react';
import { Calendar, Search, Filter } from 'lucide-react';
import { colors } from '@/themes/colors';
import { SearchableSelect } from '@/components/common/SearchableSelect';

export interface Center {
    id: string;
    center_name: string;
}

export interface Branch {
    id: string;
    branch_name: string;
}

interface DueListFiltersProps {
    selectedDate: string;
    onDateChange: (date: string) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    centerFilter: string;
    onCenterFilterChange: (centerId: string) => void;
    dueWeekFilter?: string;
    onDueWeekFilterChange?: (week: string) => void;
    branchFilter?: string;
    onBranchFilterChange?: (branchId: string) => void;
    branches?: Branch[];
    centers: Center[];
    isLoading?: boolean;
    showAllDates?: boolean;
    onShowAllDatesChange?: (show: boolean) => void;
    extraActions?: React.ReactNode;
}

export function DueListFilters({
    selectedDate,
    onDateChange,
    searchQuery,
    onSearchChange,
    centerFilter,
    onCenterFilterChange,
    dueWeekFilter = 'all',
    onDueWeekFilterChange,
    branchFilter,
    onBranchFilterChange,
    branches,
    centers,
    isLoading,
    showAllDates,
    onShowAllDatesChange,
    extraActions,
}: DueListFiltersProps) {

    const branchOptions = branches ? [
        { id: 'All', label: 'All Branches' },
        ...branches.map(b => ({ id: b.id, label: b.branch_name }))
    ] : [];

    const centerOptions = [
        { id: 'All', label: 'All Centers' },
        ...centers.map(c => ({ id: c.id, label: c.center_name }))
    ];

    const dueWeekOptions = [
        { id: 'this_week', label: "This Week's Dues" },
        { id: 'next_week', label: 'Next Week' },
        { id: 'overdue', label: 'Overdue Only' },
        { id: 'all', label: 'All Active Loans' },
    ];

    return (
        <div className="bg-card rounded-xl p-3.5 border border-border-default shadow-sm">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
                {/* Show All Toggle */}
                {onShowAllDatesChange && (
                    <div className="flex items-center gap-2">
                        <label className="text-[10px] font-black text-text-primary uppercase tracking-widest whitespace-nowrap">
                            Show All Dates
                        </label>
                        <button
                            onClick={() => onShowAllDatesChange(!showAllDates)}
                            className={`w-11 h-6 flex items-center rounded-full px-1 transition-colors ${!showAllDates ? 'bg-muted-bg' : ''}`}
                            style={{ backgroundColor: showAllDates ? colors.primary[600] : undefined }}
                        >
                            <div
                                className={`w-4 h-4 rounded-full bg-white transition-transform ${showAllDates ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                    </div>
                )}

                {/* Date Picker */}
                <div
                    className={`flex items-center gap-3 bg-input rounded-lg px-4 py-2 transition-colors focus-within:ring-2 ${showAllDates ? 'opacity-50 pointer-events-none' : ''}`}
                    style={{ '--tw-ring-color': `${colors.primary[500]}1A` } as any}
                >
                    <Calendar className="w-5 h-5 text-text-muted" />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => onDateChange(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm font-medium text-text-primary w-full dark:[color-scheme:dark]"
                    />
                </div>

                {/* Search Input */}
                <div className="flex-1 relative">
                    <Search className="w-5 h-5 text-text-muted absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by customer name or contract number..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-12 pr-4 py-2 bg-input border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-text-muted/40 text-text-primary"
                        style={{ '--tw-ring-color': `${colors.primary[500]}1A` } as any}
                    />
                </div>

                {/* Filter Week Dropdown */}
                {onDueWeekFilterChange && (
                    <div className="min-w-[180px]">
                        <SearchableSelect
                            options={dueWeekOptions}
                            value={dueWeekFilter}
                            onChange={(val) => onDueWeekFilterChange(val ? val.toString() : 'all')}
                            placeholder="Collection Timeline"
                            disabled={isLoading}
                        />
                    </div>
                )}

                {/* Branch Filter */}
                {branches && onBranchFilterChange && (
                    <div className="min-w-[200px]">
                        <SearchableSelect
                            options={branchOptions}
                            value={branchFilter}
                            onChange={(val) => onBranchFilterChange(val ? val.toString() : 'All')}
                            placeholder="All Branches"
                            disabled={isLoading}
                        />
                    </div>
                )}

                {/* Center Filter */}
                <div className="min-w-[200px]">
                    <SearchableSelect
                        options={centerOptions}
                        value={centerFilter}
                        onChange={(val) => onCenterFilterChange(val ? val.toString() : 'All')}
                        placeholder="All Centers"
                        disabled={isLoading}
                    />
                </div>

                {extraActions}
            </div>
        </div>
    );
}
