'use client';

import React, { useState, useEffect } from 'react';
import { WelcomeGreetingTab } from './WelcomeGreetingTab';
import { FestivalGreetingTab } from './FestivalGreetingTab';
import { Users, Calendar } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export default function GreetingConfigPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const currentTab = searchParams.get('tab') || 'welcome';

    const handleTabChange = (tab: 'welcome' | 'festival') => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        Greeting Configuration
                    </h1>
                    <p className="text-text-secondary mt-1 max-w-2xl">
                        Design and preview personal messages for your employees and customers.
                        These templates use dynamic variables like {'{staff_name}'} to personalize each message.
                    </p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex p-1 bg-surface border border-border-default rounded-2xl w-full max-w-2xl shadow-sm">
                <button
                    onClick={() => handleTabChange('welcome')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold transition-all ${currentTab === 'welcome'
                        ? 'bg-app-background shadow-sm text-primary-600 ring-1 ring-border-default'
                        : 'text-text-secondary hover:text-text-primary hover:bg-hover'
                        }`}
                >
                    <Users className="w-4 h-4" />
                    Welcome greeting
                </button>
                <button
                    onClick={() => handleTabChange('festival')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold transition-all ${currentTab === 'festival'
                        ? 'bg-app-background shadow-sm text-primary-600 ring-1 ring-border-default'
                        : 'text-text-secondary hover:text-text-primary hover:bg-hover'
                        }`}
                >
                    <Calendar className="w-4 h-4" />
                    Festival greeting
                </button>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {currentTab === 'welcome' && <WelcomeGreetingTab />}
                {currentTab === 'festival' && <FestivalGreetingTab />}
            </div>
        </div>
    );
}
