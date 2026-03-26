import { useQuery } from '@tanstack/react-query';
import { customerService } from '@/services/customer.service';

// Standard 1 hour stale time for reference data that rarely changes during a session
const STALE_TIME = 1000 * 60 * 60;

export const useCustomersList = () => {
    return useQuery({
        // Since the current customer page fetches all customers at once and filters locally,
        // we just cache the entire list of customers.
        queryKey: ['customers', 'all'],
        queryFn: () => customerService.getCustomers(),
        staleTime: 1000 * 60 * 5, // Keep cached data fresh for 5 minutes
    });
};

export const useCustomerConstants = () => {
    return useQuery({
        queryKey: ['customerConstants'],
        queryFn: () => customerService.getConstants(),
        staleTime: STALE_TIME,
    });
};
