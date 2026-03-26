/**
 * CacheManager — Client-side caching for static reference data.
 * 
 * Caches API responses (branches, products, centers) with 5-min auto-refresh
 * to reduce unnecessary API calls on page navigation.
 * 
 * Usage:
 *   import { cacheManager } from '@/services/CacheManager';
 *   const branches = await cacheManager.get('branches', () => branchService.getAll());
 */

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
    fetchedAt: number;
}

class CacheManager {
    private cache: Map<string, CacheEntry<unknown>> = new Map();
    private pendingRequests: Map<string, Promise<unknown>> = new Map();
    private defaultTTL: number; // milliseconds

    constructor(ttlMinutes: number = 5) {
        this.defaultTTL = ttlMinutes * 60 * 1000;
    }

    /**
     * Get cached data or fetch from the API.
     * Deduplicates concurrent requests for the same key.
     */
    async get<T>(key: string, fetcher: () => Promise<T>, ttlMs?: number): Promise<T> {
        // 1. Check cache
        const cached = this.cache.get(key);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.data as T;
        }

        // 2. Deduplicate concurrent requests
        if (this.pendingRequests.has(key)) {
            return this.pendingRequests.get(key) as Promise<T>;
        }

        // 3. Fetch and cache
        const fetchPromise = fetcher().then((data) => {
            const ttl = ttlMs ?? this.defaultTTL;
            this.cache.set(key, {
                data,
                expiresAt: Date.now() + ttl,
                fetchedAt: Date.now(),
            });
            this.pendingRequests.delete(key);
            return data;
        }).catch((error) => {
            this.pendingRequests.delete(key);
            throw error;
        });

        this.pendingRequests.set(key, fetchPromise);
        return fetchPromise;
    }

    /**
     * Force refresh a specific cache key.
     */
    async refresh<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
        this.cache.delete(key);
        return this.get(key, fetcher);
    }

    /**
     * Invalidate a specific cache key.
     */
    invalidate(key: string): void {
        this.cache.delete(key);
        this.pendingRequests.delete(key);
    }

    /**
     * Invalidate all cache keys matching a prefix.
     */
    invalidateByPrefix(prefix: string): void {
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear the entire cache.
     */
    invalidateAll(): void {
        this.cache.clear();
        this.pendingRequests.clear();
    }

    /**
     * Get cache stats for debugging.
     */
    getStats(): { size: number; keys: string[]; pendingCount: number } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            pendingCount: this.pendingRequests.size,
        };
    }

    /**
     * Check if a key is cached and not expired.
     */
    has(key: string): boolean {
        const cached = this.cache.get(key);
        return !!cached && cached.expiresAt > Date.now();
    }

    /**
     * Get the age of a cached entry in seconds.
     */
    getAge(key: string): number | null {
        const cached = this.cache.get(key);
        if (!cached) return null;
        return Math.floor((Date.now() - cached.fetchedAt) / 1000);
    }
}

// Singleton instance — 5 minute TTL
export const cacheManager = new CacheManager(5);

// Pre-defined cache keys for consistency
export const CACHE_KEYS = {
    BRANCHES: 'ref:branches',
    PRODUCTS: 'ref:products',
    CENTERS: 'ref:centers',
    ROLES: 'ref:roles',
    BANKS: 'ref:banks',
    SYSTEM_SETTINGS: 'ref:system_settings',
} as const;

export default CacheManager;
