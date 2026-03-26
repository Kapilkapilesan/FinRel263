'use client'

import React, { useState } from 'react';
import { BarChart3, Filter } from 'lucide-react';
import { MonthlyCollectionData, Branch } from '@/types/admin-dashboard.types';
import { colors } from '@/themes/colors';
import { SearchableSelect } from '@/components/common/SearchableSelect';

interface TotalCollectionChartProps {
    data: MonthlyCollectionData[];
    branches: Branch[];
    onBranchChange: (branchId: number | null) => void;
}

export default function TotalCollectionChart({
    data,
    branches,
    onBranchChange
}: TotalCollectionChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

    const fixedMax = 1000000; // Fixed at 1 Million

    const formatYScale = (value: number) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
        return value.toString();
    };

    const handleBranchSelect = (id: string) => {
        const branchId = id === 'all' ? null : Number(id);
        setSelectedBranchId(branchId);
        onBranchChange(branchId);
    };

    return (
        <div className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none">
                        <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-extrabold text-text-primary tracking-tight">
                            Total Collections
                        </h3>
                        <p className="text-xs font-medium text-text-muted uppercase tracking-widest mt-0.5">
                            Monthly Revenue Stream
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-muted-bg p-1.5 rounded-2xl border border-border-default z-50">
                    <Filter className="w-3.5 h-3.5 text-text-muted ml-2" />
                    <div className="w-[200px]">
                        <SearchableSelect
                            value={selectedBranchId || 'all'}
                            onChange={(val) => handleBranchSelect(String(val))}
                            options={[
                                { id: 'all', label: 'All Branches' },
                                ...branches.map((branch) => ({
                                    id: branch.id,
                                    label: branch.branch_name
                                }))
                            ]}
                            placeholder="Select Branch"
                            searchPlaceholder="Search branch..."
                        />
                    </div>
                </div>
            </div>

            <div className="relative h-72 w-full group">
                {/* Y-Axis Labels */}
                <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[10px] font-black text-text-muted w-10 text-right pr-3">
                    {[1, 0.75, 0.5, 0.25, 0].map((tick) => (
                        <span key={tick}>{formatYScale(fixedMax * tick)}</span>
                    ))}
                </div>

                {/* Grid Lines */}
                <div className="absolute left-10 right-0 top-0 bottom-8 flex flex-col justify-between pointer-events-none">
                    {[1, 0.75, 0.5, 0.25, 0].map((tick) => (
                        <div key={tick} className="w-full h-px bg-border-divider" />
                    ))}
                </div>

                {/* Bars */}
                <div className="absolute left-10 right-0 top-0 bottom-8 flex items-stretch justify-between px-2">
                    {data.map((item, index) => {
                        const height = (item.amount / fixedMax) * 100;
                        const isHovered = hoveredIndex === index;

                        return (
                            <div
                                key={item.month}
                                className="relative flex-1 flex flex-col items-center justify-end group/bar"
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            >
                                {/* Tooltip */}
                                {isHovered && (
                                    <div className="absolute bottom-full mb-4 z-20 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                        <div className="bg-gray-900 text-white px-3 py-2 rounded-xl text-[10px] font-black shadow-2xl flex flex-col items-center">
                                            <span className="text-gray-400 uppercase tracking-tighter mb-0.5">{item.month}</span>
                                            <span className="text-sm">LKR {item.amount.toLocaleString()}</span>
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
                                        </div>
                                    </div>
                                )}

                                {/* Bar Path */}
                                <div
                                    className={`w-full max-w-[32px] rounded-t-lg transition-all duration-500 ease-out cursor-pointer relative overflow-hidden ${isHovered ? 'scale-x-110' : ''
                                        }`}
                                    style={{
                                        height: `${Math.max(height, 0.5)}%`,
                                        background: isHovered
                                            ? `linear-gradient(to top, ${colors.indigo[600]}, ${colors.indigo[400]})`
                                            : `linear-gradient(to top, ${colors.indigo[500]}, ${colors.indigo[300]})`
                                    }}
                                >
                                    {/* Glass reflection effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent w-1/3 h-full" />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* X-Axis Labels */}
                <div className="absolute left-10 right-0 bottom-0 flex justify-between px-2">
                    {data.map((item, index) => (
                        <span
                            key={item.month}
                            className={`flex-1 text-center text-[9px] font-black text-text-muted uppercase tracking-tighter mt-3 transform transition-all 
                                ${index % 2 === 0 ? 'block' : 'hidden lg:block 2xl:hidden min-[2000px]:block'}`}
                        >
                            {item.month.substring(0, 3)}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
