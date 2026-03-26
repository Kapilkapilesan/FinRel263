import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import { DateFilter } from '@/types/dashboard.types';

export const useDashboardStats = (
    branchId: number | undefined,
    month: number,
    year: number,
    enabled: boolean
) => {
    return useQuery({
        queryKey: ['dashboardStats', branchId, month, year],
        queryFn: () => dashboardService.getDashboardStats(branchId, month, year),
        enabled,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });
};

export const useBranchSummaries = (enabled: boolean) => {
    return useQuery({
        queryKey: ['branchSummaries'],
        queryFn: () => dashboardService.getBranchSummaries(),
        enabled,
        staleTime: 1000 * 60 * 5,
    });
};

export const useBranchPerformance = (
    branchId: number | undefined,
    filterType: DateFilter,
    date?: string,
    startDate?: string,
    endDate?: string,
    enabled: boolean = true
) => {
    return useQuery({
        queryKey: ['branchPerformance', branchId, filterType, date, startDate, endDate],
        queryFn: () => dashboardService.getBranchPerformance(branchId!, filterType, date, startDate, endDate),
        enabled: enabled && !!branchId,
        staleTime: 1000 * 60 * 5,
    });
};
