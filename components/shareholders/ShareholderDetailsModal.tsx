import React from 'react';
import { X } from 'lucide-react';
import { Shareholder } from '@/types/shareholder.types';

interface ShareholderDetailsModalProps {
    show: boolean;
    onClose: () => void;
    shareholder: Shareholder | null;
}

export function ShareholderDetailsModal({
    show,
    onClose,
    shareholder
}: ShareholderDetailsModalProps) {
    if (!show || !shareholder) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg max-w-lg w-full shadow-xl border border-border-default">
                <div className="p-6 border-b border-border-divider">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-text-primary">Shareholder Details</h2>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-muted-bg rounded transition-colors"
                        >
                            <X className="w-5 h-5 text-text-muted" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-4 text-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm font-semibold">
                                {shareholder.name.charAt(0)}
                            </span>
                        </div>
                        <div>
                            <p className="font-semibold text-text-primary">{shareholder.name}</p>
                            {shareholder.nic && (
                                <p className="text-text-muted text-xs">NIC: {shareholder.nic}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-text-secondary">Shares</p>
                            <p className="font-medium text-text-primary">
                                {shareholder.shares.toLocaleString()} shares
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-text-secondary">Percentage</p>
                            <p className="font-medium text-text-primary">{shareholder.percentage}%</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-secondary">Total Investment</p>
                            <p className="font-medium text-text-primary">
                                LKR {shareholder.total_investment.toLocaleString()}
                            </p>
                        </div>
                        {shareholder.contact && (
                            <div>
                                <p className="text-xs text-text-secondary">Contact</p>
                                <p className="font-medium text-text-primary">{shareholder.contact}</p>
                            </div>
                        )}
                    </div>

                    {shareholder.address && (
                        <div>
                            <p className="text-xs text-text-secondary mb-1">Address</p>
                            <p className="text-text-primary">{shareholder.address}</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-border-divider flex justify-end bg-muted-bg rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-border-default bg-card text-text-primary rounded-lg hover:bg-hover transition-colors font-medium text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
