'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLoading } from '../../contexts/LoadingContext';

/**
 * Inner component that handles navigation loading (needs Suspense).
 */
function NavigationLoaderInner() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { showLoading, hideLoading } = useLoading();

    useEffect(() => {
        // Hide loading when navigation completes (pathname/searchParams change)
        hideLoading();
    }, [pathname, searchParams, hideLoading]);

    useEffect(() => {
        // Intercept link clicks to show loading
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest('a');

            if (anchor) {
                const href = anchor.getAttribute('href');
                const linkTarget = anchor.getAttribute('target');

                const isDownload = anchor.hasAttribute('download');
                const isBlob = href?.startsWith('blob:');

                // Only show loading for internal navigation (not external links, new tabs, or downloads)
                if (href &&
                    !isDownload &&
                    !isBlob &&
                    !href.startsWith('http') &&
                    !href.startsWith('mailto:') &&
                    !href.startsWith('tel:') &&
                    !href.startsWith('#') &&
                    linkTarget !== '_blank' &&
                    href !== pathname) {
                    showLoading('Loading...');
                }
            }
        };

        document.addEventListener('click', handleClick);

        return () => {
            document.removeEventListener('click', handleClick);
        };
    }, [pathname, showLoading]);

    return null;
}

/**
 * Component that shows loading overlay during page navigation.
 * Place this component inside the LoadingProvider.
 */
export function NavigationLoader() {
    return (
        <Suspense fallback={null}>
            <NavigationLoaderInner />
        </Suspense>
    );
}

export default NavigationLoader;
