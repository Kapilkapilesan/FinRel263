"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { LoginScreen } from '../../components/auth/LoginScreen';
import { authService } from '../../services/auth.service';
import { toast } from 'react-toastify';


export default function LoginPage() {
    const router = useRouter();

    const handleLogin = async (username: string, password: string) => {
        try {
            await authService.login(username, password);
             // ✅ SUCCESS POPUP
            toast.success('Login successful');

            // ✅ Small delay so popup is visible
            setTimeout(() => {
                router.push('/');
            }, 1000);
        } catch (error) {
            // Error is handled by LoginScreen which catches promise rejection
            throw error;
        }
    };

    return <LoginScreen onLogin={handleLogin} />;
}
