'use client';

import React from 'react';
import { StaffDirectory } from '../../components/staff/StaffDirectory';
import { authService } from '../../services/auth.service';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function StaffDirectoryPage() {
    const router = useRouter();

    useEffect(() => {
        // Check permission
        if (!authService.hasPermission('staff.directory')) {
            router.push('/dashboard');
            return;
        }
    }, [router]);

    // Check permission before rendering
    if (!authService.hasPermission('staff.directory')) {
        return null;
    }

    return (
        <div className="p-6">
            <StaffDirectory />
        </div>
    );
}
