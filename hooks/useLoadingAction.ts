'use client';

import { useLoading } from '../contexts/LoadingContext';
import { useCallback } from 'react';

/**
 * Custom hook to wrap async operations with the global loading overlay.
 * 
 * Usage:
 * ```tsx
 * const { withLoading } = useLoadingAction();
 * 
 * const handleSubmit = async () => {
 *   await withLoading(async () => {
 *     await someApiCall();
 *   }, 'Saving data...');
 * };
 * ```
 */
export function useLoadingAction() {
    const { showLoading, hideLoading } = useLoading();

    const withLoading = useCallback(async <T,>(
        action: () => Promise<T>,
        message?: string
    ): Promise<T> => {
        try {
            showLoading(message);
            return await action();
        } finally {
            hideLoading();
        }
    }, [showLoading, hideLoading]);

    return { withLoading, showLoading, hideLoading };
}
