import { useQuery } from '@tanstack/react-query';
import { collectionService } from '@/services/collection.service';
import { groupService } from '@/services/group.service';

export const useDuePayments = (branchId: string, centerId: string | undefined, date: string, mode?: string) => {
    return useQuery({
        // The query runs automatically when branchId is present
        queryKey: ['duePayments', branchId, centerId, date, mode],
        queryFn: () => collectionService.getDuePayments(branchId, centerId, date, mode),
        enabled: !!branchId,
        staleTime: 1000 * 60 * 2, // 2 minutes stale time for payments (since they update when collected)
    });
};

export const useGroupsByCenter = (centerId: string) => {
    return useQuery({
        queryKey: ['groups', centerId],
        queryFn: () => groupService.getGroupsByCenter(centerId),
        enabled: !!centerId,
        staleTime: 1000 * 60 * 60, // 1 hour for groups
    });
};
