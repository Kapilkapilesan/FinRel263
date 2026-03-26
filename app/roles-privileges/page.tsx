'use client';

import React, { useEffect, useState } from 'react';
import { RolesPrivileges } from '../../components/roles/RolesPrivileges';
import { authService } from '../../services/auth.service';
import { useRouter } from 'next/navigation';

export default function RolesPrivilegesPage() {
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);
    const router = useRouter();

    useEffect(() => {
        const checkAccess = () => {
            if (!authService.hasPermission('roles.view')) {
                console.warn('[Security] Unauthorized access attempt to roles-privileges. Redirecting...');
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

    if (hasAccess === false) {
        return null;
    }

    if (hasAccess === null) {
        return <div className="p-6">Loading security context...</div>;
    }

    return (
        <div className="p-6">
            <RolesPrivileges />
        </div>
    );
}
