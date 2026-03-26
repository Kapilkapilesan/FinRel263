import { useQuery } from '@tanstack/react-query';
import { financeService } from '@/services/finance.service';
import { investmentService } from '@/services/investment.service';
import { shareholderService } from '@/services/shareholder.service';
import { staffLoanService } from '@/services/staffLoan.service';

const STALE_TIME = 1000 * 60 * 2; // Keep transactions fresh for 2 minutes

export const useFundStats = (branchId?: number, date?: string, period?: string, enabled = true) => {
    return useQuery({
        queryKey: ['fundStats', branchId, date, period],
        queryFn: async () => {
            const data = await financeService.getFundTransactions(branchId, date, period as any);
            return data.stats;
        },
        enabled,
        staleTime: STALE_TIME,
    });
};

export const usePendingLoans = (branchId?: number, date?: string, month?: number, year?: number, enabled = true) => {
    return useQuery({
        queryKey: ['fundingLoans', branchId, date, month, year],
        queryFn: () => financeService.getApprovedLoans(branchId, date, month, year),
        enabled,
        staleTime: STALE_TIME,
    });
};

export const usePendingSalaries = (branchId?: number, date?: string, month?: number, year?: number, enabled = true) => {
    return useQuery({
        queryKey: ['fundingSalaries', branchId, date, month, year],
        queryFn: () => financeService.getPendingSalaries(branchId, date, month, year),
        enabled,
        staleTime: STALE_TIME,
    });
};

export const useShareholders = (branchId?: number, month?: number, year?: number, enabled = true) => {
    return useQuery({
        queryKey: ['fundingShareholders', branchId, month, year],
        queryFn: async () => {
            const data = await shareholderService.getAll(month, year, branchId);
            return data.shareholders;
        },
        enabled,
        staleTime: STALE_TIME,
    });
};

export const useCustomerInvestments = (branchId?: number, month?: number, year?: number, enabled = true) => {
    return useQuery({
        queryKey: ['fundingInvestments', branchId, month, year],
        queryFn: () => investmentService.getInvestments(month, year, branchId),
        enabled,
        staleTime: STALE_TIME,
    });
};

export const useStaffLoans = (branchId?: number, month?: number, year?: number, enabled = true) => {
    return useQuery({
        queryKey: ['fundingStaffLoans', branchId, month, year],
        queryFn: async () => {
            const response = await staffLoanService.getAll({
                status: 'approved,disbursed',
                month: month?.toString(),
                year: year?.toString(),
                branch_id: branchId
            });
            if (response.status === 'success') {
                return response.data.data.sort((a: any, b: any) => {
                    if (a.status === b.status) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    return a.status === 'approved' ? -1 : 1;
                });
            }
            return [];
        },
        enabled,
        staleTime: STALE_TIME,
    });
};

export const useInvestmentPayouts = (branchId?: number, month?: number, year?: number, enabled = true) => {
    return useQuery({
        queryKey: ['fundingPayouts', branchId, month, year],
        queryFn: () => investmentService.getPayouts(month, year, branchId),
        enabled,
        staleTime: STALE_TIME,
    });
};
