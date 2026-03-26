"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { LoginScreen } from '../../components/auth/LoginScreen';
import { authService } from '../../services/auth.service';

export default function ForgotPasswordPage() {
    const router = useRouter();

    const handleLogin = async (username: string, password: string) => {
        try {
            await authService.login(username, password);
            router.push('/');
        } catch (error) {
            throw error;
        }
    };

    return <LoginScreen onLogin={handleLogin} initialView="forgot-password" />;
}
