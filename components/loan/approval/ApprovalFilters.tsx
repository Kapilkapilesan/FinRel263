import React from 'react';
import { Search } from 'lucide-react';
import { SearchableSelect } from '@/components/common/SearchableSelect';

interface ApprovalFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    filterStatus: string;
    onStatusChange: (value: string) => void;
    filterBranchId: string;
    onBranchChange: (value: string) => void;
    branches: any[];
    filterStaff: string;
    onStaffChange: (value: string) => void;
    availableStaff: string[];
}

export const ApprovalFilters: React.FC<ApprovalFiltersProps> = ({
    searchTerm,
    onSearchChange,
    filterStatus,
    onStatusChange,
    filterBranchId,
    onBranchChange,
    branches,
    filterStaff,
    onStaffChange,
    availableStaff
}) => {
    // Map branches to Options for SearchableSelect
    const branchOptions = [
        { id: 'all', label: 'All Branches' },
        ...branches.map(branch => ({
            id: branch.id.toString(),
            label: branch.branch_name,
            subLabel: branch.branch_code
        }))
    ];

    // Map status to Options
    const statusOptions = [
        { id: 'all', label: 'All Pending' },
        { id: 'Pending 1st', label: 'Pending 1st Approval' },
        { id: 'Pending 2nd', label: 'Pending 2nd Approval' }
    ];

    // Map staff to Options
    const staffOptions = [
        { id: 'all', label: 'All Staff' },
        ...availableStaff.map(staff => ({
            id: staff,
            label: staff
        }))
    ];

    return (
        <div className="bg-card rounded-3xl p-3.5 shadow-sm border border-border-default mb-4 transition-all">
            <div className="flex flex-col lg:flex-row items-end gap-4 w-full">
                {/* Search Bar - Flex 1 to take remaining space */}
                <div className="flex-1 w-full order-1 lg:order-none space-y-1">
                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-1">
                        Search Applications
                    </label>
                    <div className="relative group/search">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <Search className="w-5 h-5 text-primary-500 transition-colors group-focus-within/search:scale-110" />
                        </div>
                        <input
                            type="text"
                            placeholder="CONTRACT NO, NAME, OR NIC..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-14 pr-6 py-2.5 bg-muted-bg/30 border-2 border-transparent focus:bg-card focus:border-primary-500/30 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all text-sm font-bold text-text-primary placeholder:text-text-muted/40 uppercase tracking-tight"
                        />
                    </div>
                </div>

                {/* Filters Group - Flex Row on Medium Screens */}
                <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto items-end">
                    {/* Status Filter */}
                    <SearchableSelect
                        options={statusOptions}
                        value={filterStatus}
                        onChange={(val) => onStatusChange(val as string)}
                        placeholder="Select Status"
                        label="Status"
                        className="w-full md:w-[180px]"
                    />

                    {/* Branch Filter */}
                    <SearchableSelect
                        options={branchOptions}
                        value={filterBranchId}
                        onChange={(val) => onBranchChange(val as string)}
                        placeholder="Select Branch"
                        label="Branch"
                        className="w-full md:w-[200px]"
                    />

                    {/* Staff Filter */}
                    <SearchableSelect
                        options={staffOptions}
                        value={filterStaff}
                        onChange={(val) => onStaffChange(val as string)}
                        placeholder="Select Staff"
                        label="Assigned Staff"
                        className="w-full md:w-[220px]"
                    />
                </div>
            </div>
        </div>
    );
};
