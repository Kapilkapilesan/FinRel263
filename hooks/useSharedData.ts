import { useQuery } from '@tanstack/react-query';
import { branchService } from '@/services/branch.service';
import { centerService } from '@/services/center.service';

// Standard 1 hour stale time for reference data that rarely changes during a session
const STALE_TIME = 1000 * 60 * 60;

export const useBranches = () => {
    return useQuery({
        queryKey: ['branches'],
        queryFn: () => branchService.getBranchesAll(),
        staleTime: STALE_TIME,
    });
};

export const useCenters = () => {
    return useQuery({
        queryKey: ['centers'],
        queryFn: () => centerService.getCentersList('active'),
        staleTime: STALE_TIME,
    });
};
