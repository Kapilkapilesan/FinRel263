'use client';

import { LoanCreation } from '@/components/loan/LoanCreation';

export default function LoanCreatePage() {
    return (
        <div className="min-h-screen bg-app-background">
            <div className="container mx-auto px-4 py-8">
                <LoanCreation />
            </div>
        </div>
    );
}
