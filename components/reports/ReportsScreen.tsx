'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Download, FileText, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { ReportsStats } from './ReportsStats';
import { ReportsFilters } from './ReportsFilters';
import { ReportsTable } from './ReportsTable';
import { ColumnSelectionModal } from './ColumnSelectionModal';
import { reportService } from '../../services/report.service';
import { colors } from '@/themes/colors';
import {
    ReportRow,
    ReportStats as IReportStats,
    ReportFilter,
    ReportColumn,
    REPORT_COLUMNS
} from '../../types/report.types';

export function ReportsScreen() {
    // Data state
    const [reportData, setReportData] = useState<ReportRow[]>([]);
    const [filteredData, setFilteredData] = useState<ReportRow[]>([]);
    const [stats, setStats] = useState<IReportStats | null>(null);
    const [columns] = useState<ReportColumn[]>(REPORT_COLUMNS);

    // Selection state
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());

    // Filter state
    const [activeFilters, setActiveFilters] = useState<ReportFilter[]>([]);

    // UI state
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isStatsLoading, setIsStatsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    // Fetch report data
    const fetchReportData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Convert active filters to API format
            const filterParams: Record<string, string> = {};
            activeFilters.forEach(filter => {
                filterParams[filter.column] = filter.value;
            });

            const data = await reportService.getReportData(filterParams);
            setReportData(data);
            setFilteredData(data);
        } catch (error) {
            console.error('Failed to fetch report data:', error);
            toast.error('Failed to load report data');
        } finally {
            setIsLoading(false);
        }
    }, [activeFilters]);

    // Fetch stats
    const fetchStats = useCallback(async () => {
        setIsStatsLoading(true);
        try {
            const statsData = await reportService.getReportStats();
            setStats(statsData);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
            // Use fallback stats
            setStats({
                total_reports: reportData.length,
                downloads_this_month: 0,
                scheduled_reports: 0,
                last_generated: 'Today'
            });
        } finally {
            setIsStatsLoading(false);
        }
    }, [reportData.length]);

    // Initial load
    useEffect(() => {
        fetchReportData();
        fetchStats();
    }, []);

    // Refetch when filters change
    useEffect(() => {
        fetchReportData();
    }, [activeFilters]);

    // Apply client-side filtering
    useEffect(() => {
        if (activeFilters.length === 0) {
            setFilteredData(reportData);
            return;
        }

        const filtered = reportData.filter(row => {
            return activeFilters.every(filter => {
                const value = (row as any)[filter.column];
                if (value === null || value === undefined) return false;
                return String(value).toLowerCase().includes(filter.value.toLowerCase());
            });
        });

        setFilteredData(filtered);
    }, [reportData, activeFilters]);

    // Row selection handlers
    const handleSelectRow = (id: string) => {
        setSelectedRows(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleSelectAllRows = () => {
        if (selectedRows.size === filteredData.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(filteredData.map(row => row.id)));
        }
    };

    // Filter handlers
    const handleAddFilter = (filter: ReportFilter) => {
        setActiveFilters(prev => [...prev, filter]);
    };

    const handleRemoveFilter = (index: number) => {
        setActiveFilters(prev => prev.filter((_, i) => i !== index));
    };

    const handleClearAllFilters = () => {
        setActiveFilters([]);
    };

    // Export handlers
    const handleOpenExportModal = () => {
        // Initialize with all columns selected
        setSelectedColumns(new Set(columns.map(c => c.key)));
        setIsExportModalOpen(true);
    };

    const handleToggleColumn = (key: string) => {
        setSelectedColumns(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const handleSelectAllColumns = () => {
        setSelectedColumns(new Set(columns.map(c => c.key)));
    };

    const handleDeselectAllColumns = () => {
        setSelectedColumns(new Set());
    };

    const handleExport = async () => {
        if (selectedColumns.size === 0) {
            toast.error('Please select at least one column');
            return;
        }

        setIsExporting(true);
        try {
            const payload = {
                columns: Array.from(selectedColumns),
                filters: activeFilters.reduce((acc, f) => ({ ...acc, [f.column]: f.value }), {}),
                rowIds: selectedRows.size > 0 ? Array.from(selectedRows) : undefined
            };

            await reportService.exportReport(payload);
            toast.success('Report exported successfully');
            setIsExportModalOpen(false);
        } catch (error) {
            console.error('Failed to export:', error);
            toast.error('Failed to export report');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-app-background">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full opacity-10 blur-[120px]"
                    style={{ background: `radial-gradient(circle, ${colors.primary[400]}, transparent)` }}
                />
                <div
                    className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] rounded-full opacity-10 blur-[100px]"
                    style={{ background: `radial-gradient(circle, ${colors.indigo[400]}, transparent)` }}
                />
            </div>

            <div className="relative z-10 p-6 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-700">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/70 backdrop-blur-xl p-6 rounded-3xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border-default">
                    <div className="flex items-center gap-5">
                        <div
                            className="p-3.5 rounded-2xl shadow-lg transform transition-transform hover:scale-105 duration-500"
                            style={{
                                background: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[700]})`,
                                boxShadow: `0 10px 20px ${colors.primary[600]}30`
                            }}
                        >
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-text-primary tracking-tight">Reports</h1>
                            <p className="text-[10px] text-text-muted font-bold tracking-[0.2em] uppercase mt-0.5">
                                Comprehensive Reporting & Data Analytics
                            </p>
                        </div>
                    </div>
                    
                </div>

                {/* Stats Cards */}
                <ReportsStats stats={stats} isLoading={isStatsLoading} />

                {/* Main Content Card */}
                <div className="bg-card/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border-default overflow-hidden">
                    {/* Section Header */}
                    <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-divider">
                        <div>
                            <h2 className="text-lg font-black text-text-primary tracking-tight flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-muted-bg">
                                    <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
                                </div>
                                Detailed Source Data
                            </h2>
                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-[0.2em] mt-0.5 ml-9">Raw Transactional Logs</p>
                        </div>

                        <button
                            onClick={handleOpenExportModal}
                            className="group relative flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl transition-all duration-300 active:scale-95 overflow-hidden shadow-lg"
                            style={{
                                background: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[700]})`,
                                boxShadow: `0 8px 16px -4px ${colors.primary[600]}40`
                            }}
                        >
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                            <Download className="w-4 h-4 text-white transition-transform group-hover:-translate-y-0.5" />
                            <span className="text-white font-black tracking-tight text-[11px] uppercase">Export Dataset</span>
                        </button>
                    </div>

                    {/* Filters Container */}
                    <div className="px-6 py-5 bg-muted-bg/30 border-b border-border-divider">
                        <ReportsFilters
                            columns={columns}
                            activeFilters={activeFilters}
                            onAddFilter={handleAddFilter}
                            onRemoveFilter={handleRemoveFilter}
                            onClearAllFilters={handleClearAllFilters}
                            totalRecords={reportData.length}
                            filteredRecords={filteredData.length}
                        />
                    </div>

                    {/* Table Container */}
                    <div className="bg-card">
                        <ReportsTable
                            data={filteredData}
                            columns={columns}
                            selectedRows={selectedRows}
                            onSelectRow={handleSelectRow}
                            onSelectAll={handleSelectAllRows}
                            isLoading={isLoading}
                        />
                    </div>
                </div>
            </div>

            {/* Column Selection Modal */}
            <ColumnSelectionModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                columns={columns}
                selectedColumns={selectedColumns}
                onToggleColumn={handleToggleColumn}
                onSelectAll={handleSelectAllColumns}
                onDeselectAll={handleDeselectAllColumns}
                onExport={handleExport}
                isExporting={isExporting}
            />
        </div>
    );
}
