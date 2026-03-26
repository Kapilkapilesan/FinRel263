import React from 'react';
import { colors } from '@/themes/colors';
import { authService } from '@/services/auth.service';

export interface CollectionSummaryFiltersProps {
    viewType: 'daily' | 'weekly' | 'monthly';
    onViewTypeChange: (type: 'daily' | 'weekly' | 'monthly') => void;
    selectedDate: string;
    onDateChange: (date: string) => void;
    onExport: () => void;
    onImport: (file: File) => void;
    isLoading?: boolean;
}

export function CollectionSummaryFilters({
    viewType,
    onViewTypeChange,
    selectedDate,
    onDateChange,
    onExport,
    onImport,
    isLoading
}: CollectionSummaryFiltersProps) {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Strictly bind visibility to functional permissions
    const canImport = authService.hasPermission('collections.import');
    const canExport = authService.hasPermission('collections.export');

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onImport(file);
        }
        // Reset the input so the same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Collection Summary</h1>
                <p className="text-sm text-text-muted mt-1">Overview of collection performance</p>
            </div>
            <div className="flex items-center gap-3">
                <select
                    value={viewType}
                    onChange={(e) => onViewTypeChange(e.target.value as any)}
                    className="px-4 py-2 border border-border-default rounded-xl focus:outline-none focus:ring-2 bg-input text-text-primary text-sm shadow-sm transition-all"
                    disabled={isLoading}
                    style={{ '--tw-ring-color': `${colors.primary[500]}25`, borderColor: colors.primary[500] } as any}
                >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                </select>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    className="px-4 py-2 border border-border-default rounded-xl focus:outline-none focus:ring-2 bg-input text-text-primary text-sm shadow-sm transition-all"
                    disabled={isLoading}
                    style={{ '--tw-ring-color': `${colors.primary[500]}25`, borderColor: colors.primary[500] } as any}
                />

                {canImport && (
                    <>
                        <button
                            onClick={handleImportClick}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-card text-text-primary border border-border-default rounded-xl hover:bg-muted-bg disabled:opacity-50 transition-all text-sm font-bold shadow-sm active:scale-95"
                            title="Import collections from CSV"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <span className="hidden sm:inline">Import</span>
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".csv,.txt"
                            className="hidden"
                        />
                    </>
                )}

                {canExport && (
                    <button
                        onClick={onExport}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 text-white rounded-xl disabled:opacity-50 transition-all text-sm font-bold shadow-lg active:scale-95"
                        style={{ backgroundColor: colors.primary[600], boxShadow: `0 8px 20px -6px ${colors.primary[600]}80` }}
                        onMouseEnter={(e) => {
                            if (!isLoading) {
                                e.currentTarget.style.backgroundColor = colors.primary[700];
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isLoading) {
                                e.currentTarget.style.backgroundColor = colors.primary[600];
                            }
                        }}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span className="hidden sm:inline">Export</span>
                    </button>
                )}
            </div>
        </div>
    );
}
