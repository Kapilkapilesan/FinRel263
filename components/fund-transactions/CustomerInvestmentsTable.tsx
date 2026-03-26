'use client';

import React, { useState } from 'react';
import { Calendar, TrendingUp, Landmark, SearchCode, Printer, ShieldAlert, Lock, CheckCircle2 } from 'lucide-react';
import { Investment } from '../../types/investment.types';
import { InvestmentDetailModal } from '../investment/InvestmentDetailModal';
import { colors } from '@/themes/colors';
import { toast } from 'react-toastify';
import { investmentService } from '@/services/investment.service';
import { ReprintRequestModal } from '../investment/ReprintRequestModal';
import { DocumentPreviewModal } from '../investment/DocumentPreviewModal';
import { Pagination } from '../common/Pagination';

interface Props {
    records: Investment[];
    showActions?: boolean;
}

export function CustomerInvestmentsTable({ records, showActions = true }: Props) {
    const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isPrinting, setIsPrinting] = useState<number | null>(null);
    const [isReprintModalOpen, setIsReprintModalOpen] = useState(false);
    const [reprintTarget, setReprintTarget] = useState<Investment | null>(null);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewInvestment, setPreviewInvestment] = useState<Investment | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const handleRowClick = (investment: Investment) => {
        setSelectedInvestment(investment);
        setIsDetailOpen(true);
    };

    const handlePrint = async (e: React.MouseEvent, record: Investment) => {
        e.stopPropagation();

        if (record.print_count > 0 && !record.is_reprint_authorized) {
            if (record.reprint_requested) {
                toast.info('Reprint request is already pending administrator approval.');
                return;
            }

            setReprintTarget(record);
            setIsReprintModalOpen(true);
            return;
        }

        try {
            setIsPrinting(record.id);
            // Increment print count in database
            await investmentService.downloadReceipt(record.id);

            // Open the new preview modal
            setPreviewInvestment(record);
            setIsPreviewModalOpen(true);

            // Update local state print count
            record.print_count += 1;
            record.is_reprint_authorized = false;
        } catch (error: any) {
            toast.error(error.message || 'Print failed');
        } finally {
            setIsPrinting(null);
        }
    };

    const handleReprintConfirm = async (reason: string) => {
        if (!reprintTarget) return;

        try {
            setIsPrinting(reprintTarget.id);
            await investmentService.requestReprint(reprintTarget.id, reason);
            toast.success('Reprint request submitted to Security Control.');

            // Update local state to show "Pending Approval" immediately
            reprintTarget.reprint_requested = true;
            reprintTarget.reprint_reason = reason;
        } catch (error: any) {
            toast.error(error.message || 'Request failed');
            throw error; // Re-throw for the modal to handle error state
        } finally {
            setIsPrinting(null);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'ACTIVE': return { bg: 'bg-primary-500/10', text: 'text-primary-500', border: 'border-primary-500/20' };
            case 'CLOSED': return { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' };
            case 'MATURED': return { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' };
            case 'RENEWED': return { bg: 'bg-primary-500/10', text: 'text-primary-500', border: 'border-primary-500/20' };
            default: return { bg: 'bg-gray-100', text: 'text-gray-400', border: 'border-gray-200' };
        }
    };

    const paginatedRecords = records.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="w-full h-full flex flex-col">
            <div className="bg-muted-bg/30 border-b border-border-divider/50 px-8 py-3.5">
                <div className="grid grid-cols-12 gap-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] opacity-40">
                    <div className="col-span-2">Investment Identity</div>
                    <div className="col-span-2">Principal Investor</div>
                    <div className="col-span-2">Structure & Interest</div>
                    <div className="col-span-2 text-right">Balance (LKR)</div>
                    <div className="col-span-2">Branch</div>
                    <div className="col-span-1 text-right">Lifecycle</div>
                    {showActions && <div className="col-span-1 text-center">Actions</div>}
                </div>
            </div>

            <div className="divide-y border-t border-border-divider/30 divide-border-divider/30 overflow-y-auto custom-scrollbar flex-1">
                {paginatedRecords.length > 0 ? paginatedRecords.map((record) => {
                    const status = getStatusStyle(record.status);
                    const isPrintLocked = record.print_count > 0 && !record.is_reprint_authorized;

                    return (
                        <div
                            key={record.id}
                            onClick={() => handleRowClick(record)}
                            className={`px-8 py-4 hover:bg-muted-bg/50 cursor-pointer transition-all relative group/row ${selectedInvestment?.id === record.id ? 'bg-primary-500/5' : ''}`}
                        >
                            {selectedInvestment?.id === record.id && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500" />
                            )}
                            <div className="grid grid-cols-12 gap-4 items-center">
                                {/* Identity */}
                                <div className="col-span-2 flex flex-col gap-2">
                                    <code className="text-[10px] font-black w-fit bg-primary-500/10 text-primary-500 px-2 py-0.5 rounded border border-primary-500/20 group-hover/row:bg-primary-600 group-hover/row:text-white transition-all duration-300 uppercase truncate">
                                        {record.transaction_id}
                                    </code>
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${status.text.replace('text-', 'bg-')} shadow-[0_0_8px_currentColor] animate-pulse`} />
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${status.text}`}>
                                            {record.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Investor */}
                                <div className="col-span-2 min-w-0">
                                    <p className="text-[13px] font-black text-text-primary uppercase tracking-tight truncate group-hover/row:text-primary-500 transition-colors">
                                        {record.customer?.full_name || 'N/A'}
                                    </p>
                                    <p className="text-[9px] font-black text-text-muted opacity-40 uppercase tracking-widest mt-0.5">
                                        ID: {record.customer?.customer_code}
                                    </p>
                                </div>

                                {/* Product & Yield */}
                                <div className="col-span-2">
                                    <p className="text-[10px] font-black theme-text-primary uppercase tracking-widest truncate mb-1">
                                        {record.snapshot_product_name}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 text-[9px] font-black text-primary-600 bg-primary-600/10 px-1.5 py-0.5 rounded border border-primary-600/20">
                                            <TrendingUp className="w-3 h-3" />
                                            {record.snapshot_payout_type === 'MONTHLY' ? record.snapshot_interest_rate_monthly : record.snapshot_interest_rate_maturity}%
                                        </div>
                                        <span className="text-[8px] font-bold text-text-muted uppercase tracking-tighter opacity-40 truncate">
                                            {record.snapshot_payout_type}
                                        </span>
                                    </div>
                                </div>

                                {/* Balance */}
                                <div className="col-span-2 text-right">
                                    <p className="text-[16px] font-black text-text-primary tracking-tighter tabular-nums">
                                        {Number(record.amount).toLocaleString()}
                                    </p>
                                    <p className="text-[8px] font-black text-text-muted uppercase tracking-widest opacity-40 mt-0.5">
                                        Principal Amount
                                    </p>
                                </div>

                                {/* Branch */}
                                <div className="col-span-2">
                                    <p className="text-[10px] font-black text-text-primary uppercase tracking-widest truncate">
                                        {record.branch?.branch_name || 'N/A'}
                                    </p>
                                    <p className="text-[8px] font-black text-text-muted uppercase tracking-widest opacity-40 mt-0.5">
                                        Institutional Branch
                                    </p>
                                </div>

                                {/* Dates */}
                                <div className="col-span-1 text-right">
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-text-secondary">
                                            <Calendar className="w-3 h-3 text-primary-500/40" />
                                            <span>{record.start_date ? new Date(record.start_date).toLocaleDateString('en-GB') : 'N/A'}</span>
                                        </div>
                                        <div className="text-[8px] font-black text-rose-500/60 uppercase tracking-widest bg-rose-500/5 px-1.5 py-0.5 rounded border border-rose-500/10">
                                            EXP: {record.maturity_date ? new Date(record.maturity_date).toLocaleDateString('en-GB') : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Actions */}
                                {showActions && (
                                    <div className="col-span-1 flex justify-center">
                                        {record.status === 'ACTIVE' && (
                                            <button
                                                onClick={(e) => handlePrint(e, record)}
                                                disabled={isPrinting === record.id}
                                                className={`p-2 rounded-lg transition-all active:scale-95 shadow-lg flex items-center justify-center ${
                                                    isPrinting === record.id 
                                                    ? 'bg-gray-100 text-gray-400 cursor-wait' 
                                                    : isPrintLocked 
                                                        ? (record.reprint_requested ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500' : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500') 
                                                        : 'bg-primary-600/10 text-primary-600 hover:bg-primary-600'
                                                } hover:text-white group/btn`}
                                                title={isPrintLocked ? (record.reprint_requested ? 'Pending Approval' : 'Request to Reprint') : 'Print Document'}
                                            >
                                                {isPrinting === record.id ? (
                                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                ) : isPrintLocked ? (
                                                    record.reprint_requested ? <ShieldAlert className="w-4 h-4" /> : <Lock className="w-4 h-4" />
                                                ) : (
                                                    <Printer className="w-4 h-4" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                }) : (
                    <div className="py-32 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-muted-bg rounded-2xl flex items-center justify-center shadow-inner border border-border-divider">
                            <Landmark className="w-8 h-8 text-border-divider" />
                        </div>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.25em]">No portfolios match search criteria</p>
                    </div>
                )}
            </div>

            <div className="px-6 py-4 border-t border-gray-50">
                <Pagination
                    currentPage={currentPage}
                    totalItems={records.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(newSize) => {
                        setItemsPerPage(newSize);
                        setCurrentPage(1);
                    }}
                    itemName="investments"
                />
            </div>

            <div className="p-6 bg-gray-50/50 border-t border-gray-100 text-center">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] opacity-40">
                    Institutional Asset Portfolio • Verified High-Integrity Records
                </p>
            </div>

            <InvestmentDetailModal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                investment={selectedInvestment}
            />

            {reprintTarget && (
                <ReprintRequestModal
                    isOpen={isReprintModalOpen}
                    onClose={() => setIsReprintModalOpen(false)}
                    onConfirm={handleReprintConfirm}
                    investmentTitle={reprintTarget.customer?.full_name || 'Account Portfolio'}
                    investmentId={reprintTarget.transaction_id}
                />
            )}

            {previewInvestment && (
                <DocumentPreviewModal
                    isOpen={isPreviewModalOpen}
                    onClose={() => setIsPreviewModalOpen(false)}
                    investment={previewInvestment}
                />
            )}
        </div>
    );
}
