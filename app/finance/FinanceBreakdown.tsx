'use client';

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { colors } from '@/themes/colors';
import { Target, Activity } from 'lucide-react';
import { BreakdownItem } from '@/types/finance.types';

interface FinanceBreakdownProps {
    incomeBreakdown: BreakdownItem[];
    expenseBreakdown: BreakdownItem[];
}

export const FinanceBreakdown: React.FC<FinanceBreakdownProps> = ({ incomeBreakdown, expenseBreakdown }) => {

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        const labelRadius = outerRadius + 25;
        const lx = cx + labelRadius * Math.cos(-midAngle * RADIAN);
        const ly = cy + labelRadius * Math.sin(-midAngle * RADIAN);

        return (
            <g>
                <text
                    x={lx}
                    y={ly}
                    fill="currentColor"
                    textAnchor={lx > cx ? 'start' : 'end'}
                    dominantBaseline="central"
                    className="text-[10px] font-black uppercase tracking-tight fill-text-secondary"
                >
                    {`${name} (${(percent * 100).toFixed(0)}%)`}
                </text>
                <text
                    x={x}
                    y={y}
                    fill="white"
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-[9px] font-bold"
                >
                    {`${(percent * 100).toFixed(0)}%`}
                </text>
            </g>
        );
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card/95 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-border-default/50 animate-in fade-in zoom-in duration-300">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">{payload[0].name}</p>
                    <p className="text-lg font-black text-text-primary tracking-tight">Rs. {payload[0].value.toLocaleString()}</p>
                    <p className="text-[9px] font-bold text-primary-600 uppercase mt-1">
                        Contribution: {payload[0].payload.percent ? (payload[0].payload.percent * 100).toFixed(1) : ((payload[0].value / payload[0].payload.total) * 100 || 0).toFixed(1)}%
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Income Chart */}
            <div className="bg-card/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-border-default shadow-xl flex flex-col hover:shadow-2xl transition-all duration-500">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100/50 shadow-sm">
                            <Target className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-text-primary tracking-tight">Income Sources</h3>
                            <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-0.5">Revenue Allocation</p>
                        </div>
                    </div>
                </div>

                <div className="h-[380px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={incomeBreakdown}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={renderCustomizedLabel}
                                innerRadius={0}
                                outerRadius={90}
                                paddingAngle={2}
                                dataKey="value"
                                stroke="#fff"
                                strokeWidth={2}
                            >
                                {incomeBreakdown.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                verticalAlign="bottom"
                                content={(props) => {
                                    const { payload } = props;
                                    return (
                                        <div className="flex flex-wrap justify-center gap-4 mt-8">
                                            {payload?.map((entry: any, index: number) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">{entry.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Expense Chart */}
            <div className="bg-card/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-border-default shadow-xl flex flex-col hover:shadow-2xl transition-all duration-500">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100/50 shadow-sm">
                            <Activity className="w-5 h-5 text-rose-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-text-primary tracking-tight">Expense Vector</h3>
                            <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-0.5">Capital Outflow</p>
                        </div>
                    </div>
                </div>

                <div className="h-[380px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={expenseBreakdown}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={renderCustomizedLabel}
                                innerRadius={0}
                                outerRadius={90}
                                paddingAngle={2}
                                dataKey="value"
                                stroke="#fff"
                                strokeWidth={2}
                            >
                                {expenseBreakdown.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                verticalAlign="bottom"
                                content={(props) => {
                                    const { payload } = props;
                                    return (
                                        <div className="flex flex-wrap justify-center gap-4 mt-8">
                                            {payload?.map((entry: any, index: number) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">{entry.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
