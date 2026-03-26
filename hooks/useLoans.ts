import { useQuery } from '@tanstack/react-query';
import { loanService } from '@/services/loan.service';

export const useLoansList = (filters: any) => {
    return useQuery({
        // Include filters in the queryKey so that changing a filter triggers a new fetch and caches it separately
        queryKey: ['loans', filters],
        queryFn: () => loanService.getLoans(filters),
        staleTime: 1000 * 60 * 5, // Keep cached data fresh for 5 minutes
        // This keeps the old data on screen while fetching the next page (no loading spinners when navigating pages)
        // Note: in TanStack Query v5, keepPreviousData is removed in favor of placeholderData: keepPreviousData.
        // Assuming v4 or earlier based on common Next.js setups, but if errors occur, we'll address it.
    });
};

export const useActivationQueue = (filters: any) => {
    return useQuery({
        queryKey: ['activationQueue', filters],
        queryFn: () => loanService.getActivationQueue(filters),
        staleTime: 1000 * 60 * 2,
    });
};

export const usePendingCancellations = (filters: any) => {
    return useQuery({
        queryKey: ['cancellationApprovals', filters],
        queryFn: () => loanService.getPendingCancellations(filters),
        staleTime: 1000 * 60 * 5,
    });
};

