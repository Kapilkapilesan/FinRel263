'use client'

import React, { useState } from 'react';
import { TrendingUp, Circle } from 'lucide-react';
import { MonthlyFinancialData } from '@/types/admin-dashboard.types';
import { colors } from '@/themes/colors';

interface FinancialPerformanceChartProps {
    data: MonthlyFinancialData[];
}

export default function FinancialPerformanceChart({ data }: FinancialPerformanceChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const maxAmount = Math.max(
        ...data.map(d => Math.max(d.income, d.disbursements)),
        100000
    ) * 1.2;

    const formatYScale = (value: number) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
        return value.toString();
    };

    const width = 800;
    const height = 300;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const getPoints = (type: 'income' | 'disbursements') => {
        return data.map((item, index) => {
            const x = padding + (index * (chartWidth / (data.length - 1)));
            const y = height - padding - (item[type] / maxAmount) * chartHeight;
            return { x, y, value: item[type], month: item.month };
        });
    };

    const incomePoints = getPoints('income');
    const disbursementPoints = getPoints('disbursements');

    const createSmoothPath = (points: { x: number; y: number }[]) => {
        if (points.length < 2) return "";
        let path = `M ${points[0].x} ${points[0].y}`;

        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const cp1x = p0.x + (p1.x - p0.x) / 2;
            const cp1y = p0.y;
            const cp2x = p0.x + (p1.x - p0.x) / 2;
            const cp2y = p1.y;
            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
        }
        return path;
    };

    return (
        <div className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none">
                        <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-extrabold text-text-primary tracking-tight">
                            Financial Performance
                        </h3>
                        <p className="text-xs font-medium text-text-muted uppercase tracking-widest mt-0.5">
                            Income vs Disbursement Analysis
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6 px-4 py-2 bg-muted-bg rounded-2xl border border-border-default">
                    <div className="flex items-center gap-2">
                        <Circle className="w-2.5 h-2.5 fill-blue-500 stroke-none" />
                        <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Income</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Circle className="w-2.5 h-2.5 fill-indigo-500 stroke-none" />
                        <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Disbursements</span>
                    </div>
                </div>
            </div>

            <div className="relative w-full overflow-hidden">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                    <defs>
                        <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={colors.primary[500]} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={colors.primary[500]} stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="disbursementGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={colors.indigo[500]} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={colors.indigo[500]} stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Y-Axis Grid */}
                    {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
                        <g key={tick}>
                            <line
                                x1={padding}
                                y1={height - padding - (tick * chartHeight)}
                                x2={width - padding}
                                y2={height - padding - (tick * chartHeight)}
                                stroke="currentColor"
                                className="text-border-default"
                                strokeDasharray="4 4"
                            />
                            <text
                                x={padding - 10}
                                y={height - padding - (tick * chartHeight)}
                                textAnchor="end"
                                alignmentBaseline="middle"
                                className="text-[10px] font-black fill-text-muted"
                            >
                                {formatYScale(maxAmount * tick)}
                            </text>
                        </g>
                    ))}

                    {/* Interaction Crosshair */}
                    {hoveredIndex !== null && (
                        <line
                            x1={incomePoints[hoveredIndex].x}
                            y1={padding}
                            x2={incomePoints[hoveredIndex].x}
                            y2={height - padding}
                            stroke="currentColor"
                            className="text-text-muted opacity-30"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                        />
                    )}

                    {/* Disbursement Curve */}
                    <path
                        d={createSmoothPath(disbursementPoints)}
                        fill="none"
                        stroke={colors.indigo[500]}
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                    <path
                        d={`${createSmoothPath(disbursementPoints)} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`}
                        fill="url(#disbursementGradient)"
                    />

                    {/* Income Curve */}
                    <path
                        d={createSmoothPath(incomePoints)}
                        fill="none"
                        stroke={colors.primary[500]}
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                    <path
                        d={`${createSmoothPath(incomePoints)} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`}
                        fill="url(#incomeGradient)"
                    />

                    {/* Pivot Points & Hover Area */}
                    {data.map((item, index) => (
                        <g
                            key={index}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            className="cursor-pointer"
                        >
                            <rect
                                x={incomePoints[index].x - (chartWidth / data.length / 2)}
                                y={padding}
                                width={chartWidth / data.length}
                                height={chartHeight}
                                fill="transparent"
                            />

                            {/* Points on Curve */}
                            {hoveredIndex === index && (
                                <>
                                    <circle cx={incomePoints[index].x} cy={incomePoints[index].y} r="5" fill={colors.primary[500]} stroke="white" strokeWidth="2" />
                                    <circle cx={disbursementPoints[index].x} cy={disbursementPoints[index].y} r="5" fill={colors.indigo[500]} stroke="white" strokeWidth="2" />
                                </>
                            )}

                            {/* X-Axis Month Labels */}
                            <text
                                x={incomePoints[index].x}
                                y={height - padding + 25}
                                textAnchor="middle"
                                className={`text-[9px] font-black uppercase tracking-tighter transition-all duration-300 
                                    ${hoveredIndex === index ? 'fill-text-primary' : 'fill-text-muted'}
                                    ${index % 2 !== 0 ? 'hidden sm:block' : ''}`}
                            >
                                {item.month.substring(0, 3)}
                            </text>
                        </g>
                    ))}
                </svg>

                {/* Floating Unified Tooltip */}
                {hoveredIndex !== null && (
                    <div
                        className="absolute z-30 pointer-events-none"
                        style={{
                            left: `${incomePoints[hoveredIndex].x}px`,
                            top: `${Math.min(incomePoints[hoveredIndex].y, disbursementPoints[hoveredIndex].y) - 50}px`,
                            transform: 'translateX(-50%)'
                        }}
                    >
                        <div className="bg-gray-950 text-white px-4 py-3 rounded-2xl shadow-2xl flex flex-col gap-1 min-w-[140px] border border-gray-800">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{data[hoveredIndex].month} Statistics</span>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-[10px] font-bold text-blue-400">Income</span>
                                <span className="text-sm font-black">LKR {data[hoveredIndex].income.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-[10px] font-bold text-indigo-400">Outflow</span>
                                <span className="text-sm font-black">LKR {data[hoveredIndex].disbursements.toLocaleString()}</span>
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-950 rotate-45 -mt-1.5" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
