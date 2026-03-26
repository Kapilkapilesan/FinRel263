"use client";

import React, { useState, useEffect } from 'react';
import { SalaryApprovalStats } from '../../../components/transaction-approval/salary/SalaryApprovalStats';
import { SalaryApprovalTable } from '../../../components/transaction-approval/salary/SalaryApprovalTable';
import { financeService } from '../../../services/finance.service';
import { toast } from 'react-toastify';
import { CheckCircle2, BadgeDollarSign } from 'lucide-react';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import BMSLoader from '../../../components/common/BMSLoader';
import { colors } from '@/themes/colors';

export default function SalaryApprovalPage() {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isApproving, setIsApproving] = useState(false);

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const data = await financeService.getSalaryApprovals();
            setRecords(data);
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch salary records');
        } finally {
            setLoading(false);
        }
    };

    const handleApproveClick = (id: string) => {
        setSelectedId(id);
        setIsConfirmOpen(true);
    };

    const handleConfirmApprove = async () => {
        if (selectedIds.length > 0) {
            try {
                setIsApproving(true);
                await financeService.bulkApproveSalaries(selectedIds.map(id => parseInt(id)));
                toast.success(`${selectedIds.length} salaries approved successfully`);
                setRecords(prev => prev.filter(rec => !selectedIds.includes(rec.id.toString())));
                setSelectedIds([]);
            } catch (error: any) {
                toast.error(error.message || 'Failed to approve salaries');
            } finally {
                setIsApproving(false);
                setIsConfirmOpen(false);
            }
            return;
        }

        if (!selectedId) return;

        try {
            setIsApproving(true);
            await financeService.approveSalary(parseInt(selectedId));
            toast.success('Salary approved successfully');
            setRecords(prev => prev.filter(rec => rec.id.toString() !== selectedId.toString()));
        } catch (error: any) {
            toast.error(error.message || 'Failed to approve salary');
        } finally {
            setIsApproving(false);
            setSelectedId(null);
            setIsConfirmOpen(false);
        }
    };

    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const handleToggleSelectAll = () => {
        if (selectedIds.length === records.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(records.map(r => r.id.toString()));
        }
    };

    const handleBulkApproveClick = () => {
        if (selectedIds.length === 0) return;
        setIsConfirmOpen(true);
    };

    const stats = {
        pendingCount: records.length,
        pendingAmount: records.reduce((sum, r) => sum + parseFloat(r.net_payable), 0),
        approvedCount: 0,
        approvedAmount: 0,
        monthlyTotal: records.reduce((sum, r) => sum + parseFloat(r.net_payable), 0),
        monthlyCount: records.length
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <BMSLoader message="Analyzing Payroll..." size="small" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-app-background relative overflow-hidden">
            {/* Minimal Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-[5%] -left-[5%] w-[35%] h-[35%] rounded-full opacity-5 blur-[100px]"
                    style={{ background: `radial-gradient(circle, ${colors.primary[400]}, transparent)` }}
                />
            </div>

            <div className="relative z-10 p-4 max-w-[1500px] mx-auto space-y-4 animate-in fade-in duration-500">
                {/* High Density Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/90 backdrop-blur-xl p-5 rounded-2xl shadow-lg border border-border-default">
                    <div className="flex items-center gap-4">
                        <div
                            className="p-3 rounded-xl shadow-md transform transition-transform"
                            style={{
                                background: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[700]})`,
                                boxShadow: `0 8px 16px ${colors.primary[600]}25`
                            }}
                        >
                            <BadgeDollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-text-primary tracking-tight uppercase leading-none">Salary Approval</h1>
                            <p className="text-[9px] text-text-muted font-bold tracking-[0.2em] uppercase mt-1">
                                Authorization Engine & Control Center
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {selectedIds.length > 0 && (
                            <button
                                onClick={handleBulkApproveClick}
                                className="group relative flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all active:scale-95 overflow-hidden shadow-lg"
                                style={{
                                    background: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[700]})`,
                                    boxShadow: `0 8px 16px ${colors.primary[600]}30`
                                }}
                                disabled={isApproving}
                            >
                                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                <span className="text-white font-black tracking-tight text-[10px] uppercase">
                                    Approve {selectedIds.length} Payments
                                </span>
                                <div className="ml-2 pl-2 border-l border-white/20">
                                    <span className="text-[10px] font-black text-white/90 tabular-nums">
                                        Rs. {records.filter(r => selectedIds.includes(r.id.toString())).reduce((sum, r) => sum + parseFloat(r.net_payable), 0).toLocaleString()}
                                    </span>
                                </div>
                            </button>
                        )}
                    </div>
                </div>

                <SalaryApprovalStats {...stats} />

                {/* Main Content Card with High-Density Frame */}
                <div className="bg-card rounded-2xl shadow-xl border border-border-default overflow-hidden">
                    <SalaryApprovalTable
                        records={records.map(r => ({
                            id: r.id.toString(),
                            processedDate: new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                            employeeName: r.staff?.full_name || r.user?.full_name || 'Unknown',
                            role: r.staff?.work_info?.designation || r.staff?.role || 'Staff',
                            month: r.month,
                            baseSalary: parseFloat(r.base_salary),
                            adjustments: parseFloat(r.allowances) - parseFloat(r.deductions),
                            totalPaid: parseFloat(r.net_payable),
                            status: r.status
                        }))}
                        onApprove={handleApproveClick}
                        approvingId={isApproving ? (selectedIds.length === 1 ? selectedIds[0] : selectedId) : null}
                        selectedIds={selectedIds}
                        onToggleSelect={handleToggleSelect}
                        onToggleSelectAll={handleToggleSelectAll}
                    />
                </div>
            </div>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title={selectedIds.length > 0 ? `Bulk Authorization` : "Payment Authorization"}
                message={selectedIds.length > 0
                    ? `Process approval for ${selectedIds.length} selected records?`
                    : "Approve this resource allocation?"
                }
                confirmText={isApproving ? "Processing..." : "Approve"}
                onConfirm={handleConfirmApprove}
                onCancel={() => !isApproving && setIsConfirmOpen(false)}
                variant="info"
            />
        </div>
    );
}
