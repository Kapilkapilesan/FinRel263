'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { temporaryPromotionService } from '../services/temporaryPromotion.service';
import { authService } from '../services/auth.service';

export interface EffectiveBranch {
    id: number;
    name: string;
    type: 'original' | 'temporary';
}

interface BranchContextType {
    effectiveBranches: EffectiveBranch[];
    activeBranch: EffectiveBranch | null;
    setActiveBranch: (branch: EffectiveBranch) => void;
    hasMultipleBranches: boolean;
    isLoading: boolean;
    refreshBranches: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
    const [effectiveBranches, setEffectiveBranches] = useState<EffectiveBranch[]>([]);
    const [activeBranch, setActiveBranchState] = useState<EffectiveBranch | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    const fetchEffectiveBranches = useCallback(async () => {
        try {
            // Clear previous state immediately to prevent stale data flash
            setEffectiveBranches([]);
            setActiveBranchState(null);

            setIsLoading(true);
            const user = authService.getCurrentUser();

            if (!user?.id) {
                // State already cleared above
                setCurrentUserId(null);
                return;
            }

            // Set current user ID immediately so we know who we are fetching for
            setCurrentUserId(user.id);

            // Fetch branches and permissions in parallel
            const [branches, permissionsData] = await Promise.all([
                temporaryPromotionService.getEffectiveBranches(),
                temporaryPromotionService.getEffectivePermissions()
            ]);

            setEffectiveBranches(branches);
            setCurrentUserId(user.id);

            // Sync permissions to localStorage if user has temporary promotion
            // This allows the UI to immediately reflect new privileges
            if (permissionsData.has_temporary_promotion && permissionsData.permissions) {
                // We need to format them as the authService expects: array of object {name: string}
                const formattedPermissions = permissionsData.permissions.map(p => ({ name: p, module: '' }));
                localStorage.setItem('permissions', JSON.stringify(formattedPermissions));
            }

            // Load saved active branch from localStorage or default to first branch
            const savedBranchId = localStorage.getItem('activeBranchId');
            const savedForUser = localStorage.getItem('activeBranchUserId');

            // Only use saved branch if it belongs to the current user
            if (savedBranchId && savedForUser === String(user.id)) {
                const savedBranch = branches.find(b => b.id === Number(savedBranchId));
                if (savedBranch) {
                    setActiveBranchState(savedBranch);
                } else if (branches.length > 0) {
                    setActiveBranchState(branches[0]);
                }
            } else if (branches.length > 0) {
                // Default to original branch if exists, otherwise first one
                const originalBranch = branches.find(b => b.type === 'original');
                setActiveBranchState(originalBranch || branches[0]);
            }
        } catch (error) {
            console.error('Failed to fetch effective data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Watch for user identity changes (Login/Logout)
    useEffect(() => {
        const user = authService.getCurrentUser();

        // Always refetch if user ID changes (even if just logging in for first time)
        // The fetch function itself handles clearing state first
        if (user?.id) {
            if (user.id !== currentUserId) {
                fetchEffectiveBranches();
            }
        } else {
            // No user, clear everything
            if (currentUserId !== null) {
                setEffectiveBranches([]);
                setActiveBranchState(null);
                setCurrentUserId(null);
            }
        }
    }, [currentUserId, fetchEffectiveBranches]);

    // Polling effect: Check for branch updates every 5 seconds
    useEffect(() => {
        const user = authService.getCurrentUser();
        // Only poll if user is logged in
        if (!user?.id) return;

        const pollInterval = setInterval(async () => {
            // Background fetch - don't set loading state to avoid UI flicker
            try {
                // Check if user is still logged in before fetching
                const currentUser = authService.getCurrentUser();
                if (!currentUser?.id) return;

                const branches = await temporaryPromotionService.getEffectiveBranches();

                // Smart update: Only change state if array length or IDs differ
                setEffectiveBranches(prev => {
                    const isDifferent = branches.length !== prev.length ||
                        branches.some((b, i) => b.id !== prev[i]?.id);
                    return isDifferent ? branches : prev;
                });

                // We don't auto-switch the active branch during polling to avoid disrupting the user,
                // but the switcher button will appear/unlock automatically.
            } catch (err) {
                // Silently fail on polling errors
                console.debug('Branch polling failed', err);
            }
        }, 5000); // 5 seconds interval

        return () => clearInterval(pollInterval);
    }, [currentUserId]); // Re-start polling if user changes

    // Handle authentication events (from other tabs or same tab logout)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'user' || e.key === 'token') {
                if (!e.newValue) {
                    // Logged out
                    setEffectiveBranches([]);
                    setActiveBranchState(null);
                    setCurrentUserId(null);
                } else {
                    // Logged in or changed
                    fetchEffectiveBranches();
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [fetchEffectiveBranches]);

    const setActiveBranch = (branch: EffectiveBranch) => {
        const user = authService.getCurrentUser();
        setActiveBranchState(branch);
        localStorage.setItem('activeBranchId', String(branch.id));
        if (user) {
            localStorage.setItem('activeBranchUserId', String(user.id));
        }
        // Refresh page to apply new branch scoping to all data
        window.location.reload();
    };

    const hasMultipleBranches = effectiveBranches.length > 1;

    return (
        <BranchContext.Provider
            value={{
                effectiveBranches,
                activeBranch,
                setActiveBranch,
                hasMultipleBranches,
                isLoading,
                refreshBranches: fetchEffectiveBranches
            }}
        >
            {children}
        </BranchContext.Provider>
    );
}

export function useBranchContext() {
    const context = useContext(BranchContext);
    if (context === undefined) {
        throw new Error('useBranchContext must be used within a BranchProvider');
    }
    return context;
}

export default BranchContext;
