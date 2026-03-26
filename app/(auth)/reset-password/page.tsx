"use client";

import React, { Suspense } from 'react';
import { ResetPasswordScreen } from '../../../components/auth/ResetPasswordScreen';

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordScreen />
        </Suspense>
    );
}
