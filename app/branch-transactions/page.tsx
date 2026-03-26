'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BMSLoader from '../../components/common/BMSLoader';

export default function BranchTransactionsPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/cashier/branch-activity');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-app-background text-text-primary">
            <div className="flex flex-col items-center gap-4">
                <BMSLoader message="Redirecting to Branch Activity..." size="small" />
                <p className="text-sm font-bold text-text-muted animate-pulse">
                    This module has been moved to the Cashier System.
                </p>
            </div>
        </div>
    );
}
