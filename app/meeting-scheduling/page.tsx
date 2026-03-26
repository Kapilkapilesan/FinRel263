'use client';

import React, { useEffect, useState } from 'react';
import { ViewMeetingScheduling } from '../../components/centers/ViewMeetingScheduling';
import { authService } from '../../services/auth.service';
import { useRouter } from 'next/navigation';

export default function MeetingSchedulingPage() {
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = () => {
            const hasPermission = authService.hasPermission('sessions.view');

            if (!hasPermission) {
                setIsAuthorized(false);
                setTimeout(() => router.push('/'), 3000);
            } else {
                setIsAuthorized(true);
            }
        };

        checkAuth();
    }, [router]);

    if (isAuthorized === null) return null;

    if (!isAuthorized) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] text-text-secondary">
                <h2 className="text-xl font-semibold mb-2 text-text-primary">Access Denied</h2>
                <p>You do not have permission to view this page. Redirecting to dashboard...</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <ViewMeetingScheduling />
        </div>
    );
}
