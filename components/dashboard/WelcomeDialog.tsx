'use client'

import { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';

interface WelcomeDialogProps {
    username: string;
    onClose: () => void;
}

export default function WelcomeDialog({ username, onClose }: WelcomeDialogProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation after mount
        setTimeout(() => setIsVisible(true), 100);
    }, []);

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to finish
    };

    return (
        <div className={`fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className={`relative w-full max-w-lg transform transition-all duration-500 ${isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}>
                {/* Premium Glass Card - Semantic theme colors */}
                <div className="relative bg-card/95 backdrop-blur-2xl rounded-3xl shadow-2xl dark:shadow-[0_25px_60px_-15px_rgba(0,132,209,0.4)] overflow-hidden border border-border-default/80">

                    {/* Decorative gradient background - Light: Subtle blue tint | Dark: Vibrant blue glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/8 via-transparent to-primary-600/8 dark:from-primary-500/20 dark:via-transparent dark:to-primary-600/20 pointer-events-none" />

                    {/* Ambient glow effect - Only visible in dark mode */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-500/30 rounded-full blur-3xl opacity-0 dark:opacity-100 pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary-600/20 rounded-full blur-3xl opacity-0 dark:opacity-100 pointer-events-none" />

                    {/* Close button - Light: Gray with shadow | Dark: Glass with border */}
                    <button
                        onClick={handleClose}
                        className="absolute top-6 right-6 z-10 p-2 rounded-xl 
                                   bg-muted-bg/60 hover:bg-hover dark:border dark:border-border-default
                                   text-text-secondary hover:text-text-primary 
                                   transition-all duration-200 
                                   shadow-md hover:shadow-lg dark:shadow-lg dark:hover:shadow-primary-500/20 
                                   hover:scale-110"
                        aria-label="Close welcome dialog"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Content Container */}
                    <div className="relative px-8 py-12 flex flex-col items-center text-center">
                        {/* Icon with animated gradient - Enhanced for both themes */}
                        <div className="relative mb-6">
                            {/* Glow effect - Light: Soft shadow | Dark: Vibrant glow */}
                            <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full blur-xl opacity-30 dark:opacity-60 animate-pulse" />

                            {/* Icon container - Light: Solid gradient | Dark: Glass with border */}
                            {/* <div className="relative flex items-center justify-center w-20 h-20 
                                          bg-gradient-to-br from-primary-500 to-primary-600 
                                          dark:bg-gradient-to-br dark:from-primary-500/80 dark:to-primary-600/80
                                          dark:border-2 dark:border-primary-400/30
                                          rounded-full 
                                          shadow-lg dark:shadow-[0_0_30px_rgba(0,132,209,0.5)]">
                                <Sparkles className="w-10 h-10 text-white drop-shadow-lg" strokeWidth={2} />
                            </div> */}
                        </div>

                        {/* Date - Semantic theme color */}
                        <p className="text-sm font-medium text-text-muted mb-3 tracking-wide uppercase">
                            {currentDate}
                        </p>

                        {/* Main Heading - Light: Gradient text | Dark: Brighter gradient with glow */}
                        <h1 className="text-3xl md:text-4xl font-bold mb-2 
                                     bg-gradient-to-r from-primary-600 to-primary-500 
                                     dark:from-primary-400 dark:to-primary-500
                                     bg-clip-text text-transparent
                                     dark:drop-shadow-[0_0_20px_rgba(0,132,209,0.3)]">
                            Welcome to BMS Capital
                        </h1>

                        {/* Personalized greeting - Semantic theme color */}
                        <p className="text-xl font-semibold text-text-secondary mb-4">
                            Hello, <span className="text-primary-600 dark:text-primary-400 font-bold">{username}</span>!
                        </p>

                        {/* Subtitle - Semantic theme color */}
                        <p className="text-base text-text-muted max-w-md mb-8 leading-relaxed">
                            Your dashboard is ready. Let's make today productive and achieve great things together!
                        </p>

                        {/* CTA Button - Enhanced for both themes */}
                        <button
                            onClick={handleClose}
                            className="group relative w-full max-w-xs overflow-hidden rounded-xl 
                                     bg-gradient-to-r from-primary-600 to-primary-500 
                                     dark:from-primary-500 dark:to-primary-600
                                     px-8 py-4 text-base font-semibold text-white 
                                     shadow-lg dark:shadow-[0_10px_40px_-10px_rgba(0,132,209,0.6)]
                                     transition-all duration-300 
                                     hover:shadow-xl dark:hover:shadow-[0_15px_50px_-10px_rgba(0,132,209,0.8)]
                                     hover:scale-105 active:scale-95
                                     dark:border dark:border-primary-400/30"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                Get Started
                                <svg
                                    className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </span>
                            {/* Hover overlay - Light: Darker gradient | Dark: Brighter gradient */}
                            <div className="absolute inset-0 
                                          bg-gradient-to-r from-primary-700 to-primary-600 
                                          dark:from-primary-400 dark:to-primary-500
                                          opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
