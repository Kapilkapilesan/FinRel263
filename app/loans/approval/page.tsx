'use client';

import { LoanApproval } from '../../../components/loan/approval/LoanApproval';

export default function LoanApprovalsPage() {
    return (
        <div className="min-h-screen bg-app-background transition-colors">
            <div className="container mx-auto px-4 py-8">
                <LoanApproval />
            </div>
        </div>
    );
}
