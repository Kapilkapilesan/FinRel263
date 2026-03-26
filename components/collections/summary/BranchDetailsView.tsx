'use client';

import React, { useEffect, useState } from 'react';
import {
    X,
    Building2,
    TrendingUp,
    TrendingDown,
    Calendar,
    UserCheck,
    Users,
    Search,
    Loader2,
    Info,
    CheckCircle2,
    AlertCircle,
    DollarSign,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { collectionSummaryService } from '@/services/collectionSummary.service';
import { receiptService } from '@/services/receipt.service';
import { BranchCollection } from './types';
import { colors } from '@/themes/colors';

interface BranchDetailsViewProps {
    branchId: string;
    branchName: string;
    date: string;
    viewType: 'daily' | 'weekly' | 'monthly';
    onClose: () => void;
}

export function BranchDetailsView({
    branchId,
    branchName,
    date,
    viewType,
    onClose
}: BranchDetailsViewProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [centerData, setCenterData] = useState<BranchCollection[]>([]);
    const [receiptData, setReceiptData] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'centers' | 'history'>('centers');
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyTotal, setHistoryTotal] = useState(0);
    const [historyLastPage, setHistoryLastPage] = useState(1);
    
    const [selectedCenter, setSelectedCenter] = useState<{ id: string, name: string } | null>(null);
    const [centerReceipts, setCenterReceipts] = useState<any[]>([]);
    const [isCenterHistoryLoading, setIsCenterHistoryLoading] = useState(false);
    const [centerHistoryPage, setCenterHistoryPage] = useState(1);
    const [centerHistoryTotal, setCenterHistoryTotal] = useState(0);
    const [centerHistoryLastPage, setCenterHistoryLastPage] = useState(1);

    const fetchHistory = async () => {
        setIsHistoryLoading(true);
        try {
            const params: any = {
                branch_id: branchId,
                view_type: viewType,
                page: historyPage,
                per_page: 15
            };

            // Calculate date range based on viewType
            const d = new Date(date);
            if (viewType === 'weekly') {
                const day = d.getDay();
                const start = new Date(d);
                start.setDate(d.getDate() - day);
                const end = new Date(start);
                end.setDate(start.getDate() + 6);
                params.start_date = start.toISOString().split('T')[0];
                params.end_date = end.toISOString().split('T')[0];
            } else if (viewType === 'monthly') {
                const start = new Date(d.getFullYear(), d.getMonth(), 1);
                const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                params.start_date = start.toISOString().split('T')[0];
                params.end_date = end.toISOString().split('T')[0];
            } else {
                params.date = date;
            }

            const response = await receiptService.getReceipts(params);
            
            let data = [];
            if (response.data) {
                if (Array.isArray(response.data)) {
                    data = response.data;
                } else if (response.data.data && Array.isArray(response.data.data)) {
                    data = response.data.data;
                    setHistoryTotal(response.data.total || 0);
                    setHistoryLastPage(response.data.last_page || 1);
                }
            } else if (Array.isArray(response)) {
                data = response;
            }

            const normalizedData = data.map((item: any) => ({
                id: item.id,
                receipt_id: item.receipt_id,
                customer_name: item.customer?.full_name || item.loan?.customer?.full_name || 'N/A',
                contract_no: item.loan?.contract_no || item.customer?.customer_code || 'N/A',
                staff_name: item.staff?.full_name || item.issued_by?.full_name || 'N/A',
                amount: Number(item.current_due_amount || item.amount || item.total_amount || 0),
                created_at: item.created_at
            }));
            
            setReceiptData(normalizedData);
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setIsHistoryLoading(false);
        }
    };

    const fetchCenterHistory = async () => {
        if (!selectedCenter) return;
        setIsCenterHistoryLoading(true);
        try {
            const params: any = {
                branch_id: branchId,
                center_id: selectedCenter.id,
                CSU_id: selectedCenter.id,
                view_type: viewType,
                page: centerHistoryPage,
                per_page: 15
            };

            // Calculate date range based on viewType
            const d = new Date(date);
            if (viewType === 'weekly') {
                const day = d.getDay();
                const start = new Date(d);
                start.setDate(d.getDate() - day);
                const end = new Date(start);
                end.setDate(start.getDate() + 6);
                params.start_date = start.toISOString().split('T')[0];
                params.end_date = end.toISOString().split('T')[0];
            } else if (viewType === 'monthly') {
                const start = new Date(d.getFullYear(), d.getMonth(), 1);
                const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                params.start_date = start.toISOString().split('T')[0];
                params.end_date = end.toISOString().split('T')[0];
            } else {
                params.date = date;
            }

            const response = await receiptService.getReceipts(params);
            
            let data = [];
            if (response.data) {
                if (Array.isArray(response.data)) {
                    data = response.data;
                } else if (response.data.data && Array.isArray(response.data.data)) {
                    data = response.data.data;
                    setCenterHistoryTotal(response.data.total || 0);
                    setCenterHistoryLastPage(response.data.last_page || 1);
                }
            } else if (Array.isArray(response)) {
                data = response;
            }

            const normalizedData = data.map((item: any) => ({
                id: item.id,
                center_id: item.center_id || item.center?.id || item.loan?.center_id || item.loan?.center?.id,
                receipt_id: item.receipt_id,
                customer_name: item.customer?.full_name || item.loan?.customer?.full_name || 'N/A',
                contract_no: item.loan?.contract_no || item.customer?.customer_code || 'N/A',
                staff_name: item.staff?.full_name || item.issued_by?.full_name || 'N/A',
                amount: Number(item.current_due_amount || item.amount || item.total_amount || 0),
                created_at: item.created_at
            })).filter((receipt: any) => {
                if (selectedCenter && selectedCenter.id) {
                    return String(receipt.center_id) === String(selectedCenter.id);
                }
                return true;
            });
            
            setCenterReceipts(normalizedData);
        } catch (error) {
            console.error('Failed to fetch center history:', error);
        } finally {
            setIsCenterHistoryLoading(false);
        }
    };

    const fetchDetails = async () => {
        setIsLoading(true);
        try {
            const response = await collectionSummaryService.getBranchDetails(branchId, date, viewType);
            const res = response as any;
            
            const dataArray = Array.isArray(res.data) ? res.data : 
                               (res.data?.data && Array.isArray(res.data.data) ? res.data.data : []);
            
            const mappedData = dataArray.map((item: any) => ({
                branch: item.center_name,
                branchId: item.center_id.toString(),
                target: item.target,
                collected: item.collected,
                variance: item.variance,
                total_active_customers: item.total_active_customers,
                due_customers: item.due_customers,
                paid_customers: item.paid_customers,
                achievement: item.achievement
            }));
            setCenterData(mappedData);
        } catch (error) {
            console.error('Failed to fetch details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (branchId) {
            setActiveTab('centers');
            setSelectedCenter(null);
            setSearchQuery('');
        }
    }, [branchId, date, viewType]);

    useEffect(() => {
        if (selectedCenter) {
            setCenterHistoryPage(1); // Reset page on center selection change
            fetchCenterHistory();
        }
    }, [selectedCenter, date, viewType]);

    useEffect(() => {
        if (selectedCenter) {
            fetchCenterHistory();
        }
    }, [centerHistoryPage]);

    useEffect(() => {
        if (branchId) {
            if (activeTab === 'centers') {
                fetchDetails();
            } else {
                fetchHistory();
            }
        }
    }, [activeTab, branchId, date, viewType, historyPage]);

    useEffect(() => {
        if (activeTab === 'history') {
            setHistoryPage(1); // Reset page on tab change
        }
    }, [activeTab]);

    const filteredData = centerData.filter(center =>
        center.branch.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-card border border-border-default rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="bg-table-header border-b border-border-default p-6 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: `${colors.primary[500]}1a`, color: colors.primary[600], border: `1px solid ${colors.primary[600]}30` }}>
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-text-primary tracking-tight">{branchName} — Center Breakdown</h3>
                            <p className="text-xs text-text-muted font-medium mt-1 uppercase tracking-wider">
                                Individual performance for all centers • {viewType.toUpperCase()} ({date})
                            </p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 text-text-muted hover:text-text-primary hover:bg-muted-bg rounded-xl transition-all active:scale-95 flex items-center gap-2 px-4 border border-transparent hover:border-border-default"
                >
                    <ChevronLeft className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Back to Summary</span>
                </button>
            </div>

            {/* Tab Switcher */}
            <div className="bg-card px-6 border-b border-border-default flex gap-8">
                <button
                    onClick={() => setActiveTab('centers')}
                    className={`py-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'centers' ? 'border-primary-500 text-primary-500' : 'border-transparent text-text-muted hover:text-text-primary'}`}
                >
                    Center Breakdown
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`py-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'history' ? 'border-primary-500 text-primary-500' : 'border-transparent text-text-muted hover:text-text-primary'}`}
                >
                    Total Collection History
                </button>
            </div>

            {/* Filters/Search */}
            <div className="px-6 py-4 border-b border-border-divider flex flex-col sm:flex-row gap-4 justify-between items-center bg-card">
                <div className="relative w-full sm:w-80 group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted transition-colors group-focus-within:text-primary-500" />
                    <input
                        type="text"
                        placeholder="Find center..."
                        className="w-full pl-10 pr-4 py-2 bg-input border border-border-default rounded-xl focus:outline-none focus:ring-2 text-sm text-text-primary transition-all shadow-sm"
                        style={{ '--tw-ring-color': `${colors.primary[500]}25`, borderColor: colors.primary[500] } as any}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 px-4 py-1.5 bg-primary-500/10 text-primary-500 border border-primary-500/20 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm">
                    <Info className="w-4 h-4" />
                    Showing {filteredData.length} Centers
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 bg-muted-bg/10 min-h-[400px]">
                {activeTab === 'centers' ? (
                    <div className="space-y-6">
                        {selectedCenter ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => setSelectedCenter(null)}
                                        className="flex items-center gap-2 px-4 py-2 bg-card border border-border-default text-text-muted hover:text-primary-500 hover:border-primary-500/50 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Back to Centers
                                    </button>
                                    <div className="px-4 py-2 bg-primary-500/10 text-primary-500 border border-primary-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                        Center: {selectedCenter.name}
                                    </div>

                                </div>

                                {isCenterHistoryLoading ? (
                                    <div className="h-64 flex flex-col items-center justify-center gap-4">
                                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                                        <p className="text-text-muted font-black uppercase tracking-widest text-xs">Loading center history...</p>
                                    </div>
                                ) : centerReceipts.length === 0 ? (
                                    <div className="h-64 flex flex-col items-center justify-center gap-4 bg-muted-bg/30 border-2 border-dashed border-border-default rounded-2xl">
                                        <DollarSign className="w-8 h-8 text-text-muted" />
                                        <p className="text-text-muted font-black uppercase tracking-widest text-sm">No transactions for this center in this period</p>
                                    </div>
                                ) : (
                                    <div className="bg-card border border-border-default rounded-2xl overflow-hidden shadow-sm font-mono">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-table-header border-b border-border-default">
                                                    <tr>
                                                        <th className="text-left px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Receipt No</th>
                                                        <th className="text-left px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Customer</th>
                                                        <th className="text-left px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Staff</th>
                                                        <th className="text-right px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Amount</th>
                                                        <th className="text-center px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Time</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border-divider">
                                                    {centerReceipts.map((receipt, index) => (
                                                        <tr key={index} className="hover:bg-table-row-hover transition-colors group">
                                                            <td className="px-6 py-4 font-black text-primary-600">{receipt.receipt_id}</td>
                                                            <td className="px-6 py-4">
                                                                <div>
                                                                    <p className="font-black text-text-primary uppercase tracking-tight">{receipt.customer_name}</p>
                                                                    <p className="text-[10px] text-text-muted font-bold">{receipt.contract_no}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-xs font-bold text-text-secondary">{receipt.staff_name}</td>
                                                            <td className="px-6 py-4 text-right font-black text-primary-500">LKR {(receipt.amount || 0).toLocaleString()}</td>
                                                            <td className="px-6 py-4 text-center text-xs text-text-muted font-bold">
                                                                {new Date(receipt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Center History Pagination */}
                                        {centerHistoryLastPage > 1 && (
                                            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-2 pt-6 border-t border-border-divider">
                                                {/* Left: Range Info */}
                                                <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                                                    Showing {((centerHistoryPage - 1) * 15) + 1} — {Math.min(centerHistoryPage * 15, centerHistoryTotal)} of {centerHistoryTotal} Receipts
                                                </div>

                                                {/* Center: Per Page (Static for now) */}
                                                <div className="flex items-center gap-2 px-3 py-1 bg-muted-bg/50 border border-border-default rounded-lg text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                                                    15 per page
                                                </div>

                                                {/* Right: Numbered Pagination */}
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        disabled={centerHistoryPage === 1}
                                                        onClick={() => setCenterHistoryPage(p => Math.max(1, p - 1))}
                                                        className="p-1.5 text-text-muted hover:text-primary-500 disabled:opacity-20 transition-colors"
                                                    >
                                                        <ChevronLeft className="w-4 h-4" />
                                                    </button>
                                                    
                                                    {Array.from({ length: centerHistoryLastPage }, (_, i) => i + 1).map(p => (
                                                        <button
                                                            key={p}
                                                            onClick={() => setCenterHistoryPage(p)}
                                                            className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-black transition-all ${
                                                                centerHistoryPage === p 
                                                                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20 active:scale-90' 
                                                                : 'text-text-muted hover:bg-white hover:text-primary-500'
                                                            }`}
                                                        >
                                                            {p}
                                                        </button>
                                                    ))}

                                                    <button
                                                        disabled={centerHistoryPage === centerHistoryLastPage}
                                                        onClick={() => setCenterHistoryPage(p => Math.min(centerHistoryLastPage, p + 1))}
                                                        className="p-1.5 text-text-muted hover:text-primary-500 disabled:opacity-20 transition-colors"
                                                    >
                                                        <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                {isLoading ? (
                                    <div className="h-64 flex flex-col items-center justify-center gap-4">
                                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                                        <p className="text-text-muted font-black uppercase tracking-widest text-xs">Loading center data...</p>
                                    </div>
                                ) : filteredData.length === 0 ? (
                                    <div className="h-64 flex flex-col items-center justify-center gap-4 bg-muted-bg/30 border-2 border-dashed border-border-default rounded-2xl">
                                        <Search className="w-8 h-8 text-text-muted" />
                                        <p className="text-text-muted font-black uppercase tracking-widest text-sm">No centers found matching your search</p>
                                    </div>
                                ) : (
                                    <div className="bg-card border border-border-default rounded-2xl overflow-hidden shadow-sm">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-table-header border-b border-border-default">
                                                    <tr>
                                                        <th className="text-left px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Center Name</th>
                                                        <th className="text-right px-4 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Expectation</th>
                                                        <th className="text-right px-4 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Collected</th>
                                                        <th className="text-right px-4 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Balance</th>
                                                        <th className="text-center px-4 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Due</th>
                                                        <th className="text-center px-4 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Paid</th>
                                                        <th className="text-center px-4 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Rate</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border-divider">
                                                    {filteredData.map((center, index) => {
                                                        const isPositive = center.variance >= 0;
                                                        return (
                                                            <tr 
                                                                key={index} 
                                                                className="hover:bg-table-row-hover transition-colors group cursor-pointer"
                                                                onClick={() => setSelectedCenter({ id: center.branchId, name: center.branch })}
                                                            >
                                                                <td className="px-6 py-4 text-sm font-black text-text-primary group-hover:text-primary-500 transition-colors uppercase tracking-tight">
                                                                    <div className="flex items-center gap-2">
                                                                        {center.branch}
                                                                        <div className="w-5 h-5 rounded-full bg-primary-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <ChevronRight className="w-3 h-3 text-primary-500" />
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-4 text-sm text-right text-text-primary font-mono font-black">
                                                                    {center.target.toLocaleString()}
                                                                </td>
                                                                <td className="px-4 py-4 text-sm text-right text-primary-500 font-mono font-black">
                                                                    {center.collected.toLocaleString()}
                                                                </td>
                                                                <td className={`px-4 py-4 text-sm text-right font-black font-mono ${isPositive ? 'text-primary-500' : 'text-rose-500'}`}>
                                                                    {isPositive ? '+' : ''}{center.variance.toLocaleString()}
                                                                </td>
                                                                <td className="px-4 py-4 text-sm text-center text-primary-500 font-black font-mono">
                                                                    {center.due_customers}
                                                                </td>
                                                                <td className="px-4 py-4 text-sm text-center text-primary-500 font-black font-mono">
                                                                    {center.paid_customers}
                                                                </td>
                                                                <td className="px-4 py-4 text-center">
                                                                    <div className="flex flex-col items-center gap-1.5">
                                                                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${center.achievement >= 100 ? 'bg-primary-500/10 text-primary-500 border-primary-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                                                            {center.achievement}%
                                                                        </span>
                                                                        <div className="w-16 h-1.5 bg-muted-bg rounded-full overflow-hidden shadow-inner">
                                                                            <div
                                                                                className={`h-full rounded-full transition-all duration-1000 ${center.achievement >= 100 ? 'bg-primary-500' : 'bg-amber-500'}`}
                                                                                style={{ width: `${Math.min(center.achievement, 100)}%` }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {isHistoryLoading ? (
                            <div className="h-64 flex flex-col items-center justify-center gap-4">
                                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                                <p className="text-text-muted font-black uppercase tracking-widest text-xs">Loading transaction history...</p>
                            </div>
                        ) : receiptData.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center gap-4 bg-muted-bg/30 border-2 border-dashed border-border-default rounded-2xl">
                                <DollarSign className="w-8 h-8 text-text-muted" />
                                <p className="text-text-muted font-black uppercase tracking-widest text-sm">No transactions recorded for this branch in this period</p>
                            </div>
                        ) : (
                            <div className="bg-card border border-border-default rounded-2xl overflow-hidden shadow-sm font-mono">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-table-header border-b border-border-default">
                                            <tr>
                                                <th className="text-left px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Receipt No</th>
                                                <th className="text-left px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Customer</th>
                                                <th className="text-left px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Staff</th>
                                                <th className="text-right px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Amount</th>
                                                <th className="text-center px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border-divider">
                                            {receiptData.map((receipt, index) => (
                                                <tr key={index} className="hover:bg-table-row-hover transition-colors group">
                                                    <td className="px-6 py-4 font-black text-primary-600">{receipt.receipt_id}</td>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="font-black text-text-primary uppercase tracking-tight">{receipt.customer_name}</p>
                                                            <p className="text-[10px] text-text-muted font-bold">{receipt.contract_no}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-bold text-text-secondary">{receipt.staff_name}</td>
                                                    <td className="px-6 py-4 text-right font-black text-primary-500">LKR {(receipt.amount || 0).toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-center text-xs text-text-muted font-bold">
                                                        {new Date(receipt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Total History Pagination */}
                                {historyLastPage > 1 && (
                                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 px-2 pt-6 border-t border-border-divider">
                                        {/* Left: Range Info */}
                                        <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                                            Showing {((historyPage - 1) * 15) + 1} — {Math.min(historyPage * 15, historyTotal)} of {historyTotal} Records
                                        </div>

                                        {/* Center: Per Page */}
                                        <div className="flex items-center gap-2 px-3 py-1 bg-muted-bg/50 border border-border-default rounded-lg text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                                            15 per page
                                        </div>

                                        {/* Right: Numbered Pagination */}
                                        <div className="flex items-center gap-1">
                                            <button
                                                disabled={historyPage === 1}
                                                onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                                                className="p-1.5 text-text-muted hover:text-primary-500 disabled:opacity-20 transition-colors"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            
                                            {Array.from({ length: Math.min(historyLastPage, 7) }, (_, i) => i + 1).map(p => (
                                                <button
                                                    key={p}
                                                    onClick={() => setHistoryPage(p)}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-xl text-[10px] font-black transition-all ${
                                                        historyPage === p 
                                                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20 active:scale-90' 
                                                        : 'text-text-muted hover:bg-white hover:text-primary-500 border border-transparent hover:border-border-default'
                                                    }`}
                                                >
                                                    {p}
                                                </button>
                                            ))}

                                            {historyLastPage > 7 && historyPage < historyLastPage - 3 && (
                                                <span className="px-2 text-text-muted">...</span>
                                            )}

                                            <button
                                                disabled={historyPage === historyLastPage}
                                                onClick={() => setHistoryPage(p => Math.min(historyLastPage, p + 1))}
                                                className="p-1.5 text-text-muted hover:text-primary-500 disabled:opacity-20 transition-colors"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="bg-table-header border-t border-border-default p-6 flex justify-end shadow-inner">
                <button
                    onClick={onClose}
                    className="px-8 py-2.5 bg-card border border-border-default text-text-primary rounded-xl text-sm font-black uppercase tracking-widest hover:bg-muted-bg hover:border-text-muted/30 transition-all shadow-lg active:scale-95"
                >
                    Back to Summary List
                </button>
            </div>
        </div>
    );
}
