import React, { useState, useMemo } from 'react';
import { Calculator, DollarSign, PieChart, AlertCircle } from 'lucide-react';
import { Shareholder, ShareholderSystemInfo } from '@/types/shareholder.types';

interface ProfitDistributionProps {
    shareholders: Shareholder[];
    systemInfo: ShareholderSystemInfo | null;
}

export function ProfitDistribution({ shareholders, systemInfo }: ProfitDistributionProps) {
    const [totalProfit, setTotalProfit] = useState<string>('');
    const [showDistribution, setShowDistribution] = useState(false);

    // Calculate profit distribution based on share percentage
    // Formula: Shareholder Profit = Total Profit × (Share Percentage ÷ 100)
    const distribution = useMemo(() => {
        const profitAmount = parseFloat(totalProfit) || 0;

        return shareholders.map(shareholder => ({
            ...shareholder,
            profitShare: profitAmount * (shareholder.percentage / 100)
        }));
    }, [shareholders, totalProfit]);

    const totalDistributed = distribution.reduce((sum, d) => sum + d.profitShare, 0);
    const profitAmount = parseFloat(totalProfit) || 0;

    return (
        <div className="bg-card rounded-xl border border-border-default overflow-hidden shadow-sm">
            <div className="p-5 border-b border-border-divider bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <Calculator className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-text-primary">Profit Distribution Calculator</h3>
                        <p className="text-xs text-text-muted">
                            Distribute profit based on share percentage: Profit × (Share % ÷ 100)
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            Total Profit to Distribute (LKR)
                        </label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <input
                                type="number"
                                value={totalProfit}
                                onChange={(e) => setTotalProfit(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-input border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm text-text-primary"
                                placeholder="Enter profit amount"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            Distribution Date
                        </label>
                        <input
                            type="date"
                            defaultValue={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 bg-input border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm text-text-primary dark:[color-scheme:dark]"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => setShowDistribution(profitAmount > 0)}
                            disabled={profitAmount <= 0 || shareholders.length === 0}
                            className={`w-full px-4 py-3 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 ${profitAmount > 0 && shareholders.length > 0
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-muted-bg text-text-muted cursor-not-allowed'
                                }`}
                        >
                            <PieChart className="w-4 h-4" />
                            Calculate Distribution
                        </button>
                    </div>
                </div>

                {/* Distribution Preview */}
                {showDistribution && profitAmount > 0 && shareholders.length > 0 && (
                    <div className="mt-6 border-t border-border-divider pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-text-primary">Distribution Preview</h4>
                            <span className="text-sm text-text-muted">
                                Total: LKR {totalDistributed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>

                        <div className="space-y-3">
                            {distribution.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-4 bg-muted-bg/50 rounded-lg hover:bg-muted-bg transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                            <span className="text-white text-xs font-semibold">
                                                {item.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-text-primary">{item.name}</p>
                                            <p className="text-xs text-text-muted">
                                                {item.percentage.toFixed(2)}% share | {item.shares} shares
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-green-600 dark:text-green-400">
                                            LKR {item.profitShare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-xs text-text-muted">
                                            {profitAmount.toLocaleString()} × {item.percentage}%
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium text-green-800 dark:text-green-300">Distribution Formula</p>
                                    <p className="text-green-700 dark:text-green-400 mt-1">
                                        Each shareholder receives: Total Profit × (Share Percentage ÷ 100)
                                    </p>
                                    <p className="text-green-600 dark:text-green-500 text-xs mt-2">
                                        Example: LKR {profitAmount.toLocaleString()} × ({distribution[0]?.percentage || 0}% ÷ 100) =
                                        LKR {(profitAmount * ((distribution[0]?.percentage || 0) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {shareholders.length === 0 && (
                    <div className="text-center py-8 text-text-muted">
                        <PieChart className="w-12 h-12 mx-auto mb-3 text-text-muted/50" />
                        <p className="text-sm">Add shareholders to calculate profit distribution</p>
                    </div>
                )}
            </div>
        </div>
    );
}
