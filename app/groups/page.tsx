'use client';

import React, { useEffect, useState } from 'react';
import { ViewGroups } from '../../components/groups/ViewGroups';
import BMSLoader from '@/components/common/BMSLoader';
import { authService } from '../../services/auth.service';
import { useRouter } from 'next/navigation';

export default function GroupsPage() {
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);
    const router = useRouter();

    useEffect(() => {
        const checkAccess = () => {
            if (!authService.hasPermission('groups.view')) {
                router.push('/');
                return false;
            }
            return true;
        };

        if (typeof window !== 'undefined') {
            const allowed = checkAccess();
            setHasAccess(allowed);
        }
    }, [router]);

    if (hasAccess === false) return null;

    if (hasAccess === null) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
                <BMSLoader message="Loading groups..." size="medium" />
            </div>
        );
    }

    return <ViewGroups />;
}
