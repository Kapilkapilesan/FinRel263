'use client'

import React, { useState } from 'react';
import { Landmark, ArrowUpRight } from 'lucide-react';
import { MonthlyCollectionData, Branch } from '@/types/admin-dashboard.types';
import { SearchableSelect } from '@/components/common/SearchableSelect';

interface TotalIncomeChartProps {
    data: MonthlyCollectionData[];
    branches: Branch[];
    onBranchChange: (branchId: number | null) => void;
}

import { colors } from '@/themes/colors';

export default function TotalIncomeChart({
    data,
    branches,
    onBranchChange
}: TotalIncomeChartProps) {
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
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none">
                        <Landmark className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h4 className="text-base font-black text-gray-900 dark:text-white tracking-tight">Total Income</h4>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                            <ArrowUpRight className="w-3 h-3" />
                            Revenue Inflow
                        </div>
                    </div>
                </div>

                <div className="w-[200px] z-50">
                    <SearchableSelect
                        value={selectedBranchId || 'all'}
                        onChange={(val) => handleBranchSelect(String(val))}
                        options={[
                            { id: 'all', label: 'Global' },
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

            <div className="relative h-60 w-full">
                {/* Y-Axis Grid */}
                <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[8px] font-black text-gray-400 w-8 pr-2">
                    {[1, 0.5, 0].map((tick) => (
                        <span key={tick}>{formatYScale(fixedMax * tick)}</span>
                    ))}
                </div>

                {/* Bars Container */}
                <div className="absolute left-8 right-0 top-0 bottom-8 flex items-stretch justify-between px-1">
                    {data.map((item, index) => {
                        const height = (item.amount / fixedMax) * 100;
                        const isHovered = hoveredIndex === index;

                        return (
                            <div
                                key={item.month}
                                className="relative flex-1 flex flex-col items-center justify-end group/item"
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            >
                                {/* Tooltip */}
                                {isHovered && (
                                    <div className="absolute bottom-full mb-3 z-30 animate-in zoom-in-95 duration-200">
                                        <div className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-black shadow-xl flex flex-col items-center min-w-[100px]">
                                            <span className="text-gray-400 tracking-tighter uppercase">{item.month}</span>
                                            <span className="text-xs">LKR {item.amount.toLocaleString()}</span>
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
                                        </div>
                                    </div>
                                )}

                                {/* Bar Surface */}
                                <div
                                    className={`w-full max-w-[24px] rounded-t-lg transition-all duration-500 ease-out cursor-pointer relative overflow-hidden ${isHovered ? 'brightness-110 -translate-y-1' : ''
                                        }`}
                                    style={{
                                        height: `${Math.max(height, 0.5)}%`,
                                        background: isHovered
                                            ? `linear-gradient(to top, ${colors.primary[600]}, ${colors.primary[400]})`
                                            : `linear-gradient(to top, ${colors.primary[500]}, ${colors.primary[300]})`
                                    }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent w-[30%] h-full opacity-50" />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Month Axis */}
                <div className="absolute left-8 right-0 bottom-0 flex justify-between px-1">
                    {data.map((item, index) => (
                        <span
                            key={item.month}
                            className={`flex-1 text-center text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tighter mt-4 
                                ${index % 2 === 0 ? 'block' : 'hidden sm:block'}`}
                        >
                            {item.month.substring(0, 3)}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
