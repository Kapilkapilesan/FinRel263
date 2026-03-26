'use client';

import React from 'react';
import { colors } from '@/themes/colors';

interface BMSLoaderProps {
    message?: string;
    className?: string;
    size?: 'xsmall' | 'small' | 'medium' | 'large';
}

export function BMSLoader({ message, className = '', size = 'large' }: BMSLoaderProps) {
    // Size scales
    const scales = {
        xsmall: 0.5, // ~54px
        small: 0.5,  // ~90px
        medium: 1, // ~135px
        large: 1     // ~180px
    };

    // Default to large if size not found (safety)
    const scale = scales[size as keyof typeof scales] || scales.large;

    return (
        <div className={`bms-loader-wrapper ${className}`}>
            <div className="bms-loader-container" style={{ transform: `scale(${scale})` }}>
                {/* Rotating border ring */}
                <svg className="bms-loading-ring" viewBox="0 0 50 50">
                    <circle
                        className="path"
                        cx="25"
                        cy="25"
                        r="23"
                        fill="none"
                        strokeWidth="2"
                    />
                </svg>

                {/* BMS Logo in center */}
                <div className="bms-logo-container">
                    <img
                        src="/bms-logo-verified.png"
                        alt="BMS Logo"
                        className="bms-logo"
                    />
                </div>
            </div>

            {/* Loading message - outside scaling to keep text readable */}
            {message && (
                <p className="bms-loading-message">{message}</p>
            )}

            <style jsx>{`
                .bms-loader-wrapper {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 24px;
                    width: 100%;
                    height: 100%;
                    min-height: inherit; /* Inherit min-height from parent if set, or just fill */
                    flex: 1;
                }

                .bms-loader-container {
                    position: relative;
                    width: 180px;
                    height: 180px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .bms-loading-ring {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    animation: rotate 2s linear infinite;
                    z-index: 10;
                }

                .path {
                    stroke: ${colors.primary.brand};
                    stroke-linecap: round;
                    animation: dash 1.5s ease-in-out infinite;
                }

                @keyframes rotate {
                    100% {
                        transform: rotate(360deg);
                    }
                }

                @keyframes dash {
                    0% {
                        stroke-dasharray: 1, 150;
                        stroke-dashoffset: 0;
                    }
                    50% {
                        stroke-dasharray: 100, 150;
                        stroke-dashoffset: -30;
                    }
                    100% {
                        stroke-dasharray: 100, 150;
                        stroke-dashoffset: -140;
                    }
                }

                .bms-logo-container {
                    width: 140px;
                    height: 140px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    z-index: 20;
                    animation: pulse 2s ease-in-out infinite;
                }

                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.3);
                    }
                }

                .bms-logo {
                    width: 110px;
                    height: 110px;
                    object-fit: contain;
                }

                .bms-loading-message {
                    color: inherit;
                    font-size: 16px;
                    font-weight: 500;
                    letter-spacing: 0.5px;
                    animation: textPulse 1.5s ease-in-out infinite;
                    text-align: center;
                }

                @keyframes textPulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.7;
                    }
                }
            `}</style>
        </div>
    );
}

export default BMSLoader;

