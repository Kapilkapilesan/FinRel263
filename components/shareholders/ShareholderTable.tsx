import React from 'react';
import { Eye, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { Shareholder } from '@/types/shareholder.types';

interface ShareholderTableProps {
    shareholders: Shareholder[];
    onViewDetails: (shareholder: Shareholder) => void;
    onEdit: (shareholder: Shareholder) => void;
    onDelete: (shareholder: Shareholder) => void;
    canEdit: boolean;
    canDelete: boolean;
}

export function ShareholderTable({ shareholders, onViewDetails, onEdit, onDelete, canEdit, canDelete }: ShareholderTableProps) {
    const total_investment = shareholders.reduce((sum, s) => sum + s.total_investment, 0);
    const totalShares = shareholders.reduce((sum, s) => sum + s.shares, 0);
    const totalPercentage = shareholders.reduce((sum, s) => sum + s.percentage, 0);

    if (shareholders.length === 0) {
        return (
            <div className="bg-card rounded-xl border border-border-default p-12 text-center">
                <div className="w-16 h-16 bg-muted-bg rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <h3 className="text-text-primary font-semibold mb-2">No Shareholders Yet</h3>
                <p className="text-text-secondary text-sm">Add your first shareholder to get started.</p>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-xl border border-border-default overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border-divider flex items-center justify-between bg-table-header">
                <h3 className="text-sm font-semibold text-text-primary">Shareholder List</h3>
                <span className="text-sm text-text-secondary">{shareholders.length} shareholders</span>
            </div>

            <div className="bg-table-header border-b border-border-divider px-6 py-3">
                <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-text-secondary uppercase">
                    <div className="col-span-3">Shareholder Name</div>
                    <div className="col-span-2">Investment (LKR)</div>
                    <div className="col-span-2">Shares</div>
                    <div className="col-span-2">Percentage</div>
                    <div className="col-span-3 text-right">Actions</div>
                </div>
            </div>

            <div className="divide-y divide-border-divider">
                {shareholders.map((shareholder) => (
                    <div key={shareholder.id} className="px-6 py-4 hover:bg-table-row-hover transition-colors">
                        <div className="grid grid-cols-12 gap-4 items-center">
                            {/* Name */}
                            <div className="col-span-3 flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <span className="text-white text-sm font-semibold">{shareholder.name.charAt(0).toUpperCase()}</span>
                                </div>
                                <div>
                                    <p className="font-medium text-text-primary">{shareholder.name}</p>
                                    {shareholder.nic && (
                                        <p className="text-xs text-text-muted">NIC: {shareholder.nic}</p>
                                    )}
                                </div>
                            </div>

                            {/* Investment - THE KEY INPUT FIELD */}
                            <div className="col-span-2">
                                <p className="text-sm font-semibold text-text-primary">
                                    LKR {shareholder.total_investment.toLocaleString()}
                                </p>
                            </div>

                            {/* Shares - Auto Calculated */}
                            <div className="col-span-2">
                                <div className="inline-flex items-center px-2.5 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                                    <span className="text-sm font-medium">{shareholder.shares}</span>
                                    <span className="text-xs ml-1 text-primary-500 dark:text-primary-400">shares</span>
                                </div>
                            </div>

                            {/* Percentage - Auto Calculated */}
                            <div className="col-span-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-muted-bg rounded-full h-2 max-w-[60px]">
                                        <div
                                            className="bg-gradient-to-r from-primary-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${shareholder.percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-semibold text-text-primary">{shareholder.percentage.toFixed(2)}%</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="col-span-3 flex items-center justify-end gap-2">
                                <button
                                    onClick={() => onViewDetails(shareholder)}
                                    className="p-2 text-text-muted hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                    title="View Details"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                                {canEdit && (
                                    <button
                                        onClick={() => onEdit(shareholder)}
                                        className="p-2 text-text-muted hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                )}
                                {canDelete && (
                                    <button
                                        onClick={() => onDelete(shareholder)}
                                        className="p-2 text-text-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer with totals */}
            <div className="bg-muted-bg border-t border-border-divider px-6 py-4">
                <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3">
                        <p className="text-sm font-bold text-text-primary">Total ({shareholders.length} shareholders)</p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-sm font-bold text-text-primary">LKR {total_investment.toLocaleString()}</p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-sm font-bold text-primary-600 dark:text-primary-400">{totalShares} shares</p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{totalPercentage.toFixed(2)}%</p>
                    </div>
                    <div className="col-span-3"></div>
                </div>
            </div>
        </div >
    );
}
