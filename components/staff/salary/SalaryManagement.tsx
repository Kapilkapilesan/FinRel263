
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { SalaryStatsCard } from './SalaryStats';
import { SalaryHistoryTable } from './SalaryHistoryTable';
import { NewPaymentForm } from './NewPaymentForm';
import { salaryService } from '@/services/salary.service';
import { SalaryPayment, SalaryStats } from '@/types/salary.types';
import BMSLoader from '@/components/common/BMSLoader';

type ViewState = 'LIST' | 'NEW_PAYMENT';

export const SalaryManagement: React.FC = () => {
    const [view, setView] = useState<ViewState>('LIST');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<SalaryStats>({
        totalPayroll: 0,
        processedCount: 0,
        averageSalary: 0,
        activeHeadcount: 0,
        eligibleForPayroll: 0
    });
    const [history, setHistory] = useState<SalaryPayment[]>([]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [fetchedStats, fetchedHistory] = await Promise.all([
                salaryService.getStats(),
                salaryService.getHistory()
            ]);
            setStats(fetchedStats);
            setHistory(fetchedHistory);
        } catch (error) {
            console.error("Failed to load salary data", error);
            toast.error("Failed to load salary data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleProcessPayment = async (data: any) => {
        try {
            await salaryService.processPayment(data);
            toast.success("Payments processed successfully!");
            setView('LIST');
            loadData();
        } catch (error: any) {
            console.error("Payment processing failed", error);
            toast.error(error.message || "Failed to process payments");
        }
    };

    if (loading && view === 'LIST') {
        return <div className="flex items-center justify-center p-12">
            <BMSLoader message="Loading salary data..." size="xsmall" />
        </div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {view === 'LIST' && (
                <>
                    <SalaryStatsCard stats={stats} />
                    <SalaryHistoryTable
                        history={history}
                        onProcessNew={() => setView('NEW_PAYMENT')}
                    />
                </>
            )}

            {view === 'NEW_PAYMENT' && (
                <NewPaymentForm
                    onBack={() => setView('LIST')}
                    onSubmit={handleProcessPayment}
                />
            )}
        </div>
    );
};
