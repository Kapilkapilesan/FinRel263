'use client';

import { LoanEdit } from '@/components/loan/LoanEdit';
import { Suspense } from 'react';

import BMSLoader from '@/components/common/BMSLoader';

export default function EditLoanPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center"><BMSLoader message="Loading editor..." /></div>}>
            <LoanEdit />
        </Suspense>
    );
}
