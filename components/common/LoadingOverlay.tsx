'use client';

import React from 'react';
import { useLoading } from '../../contexts/LoadingContext';
import { BMSLoader } from './BMSLoader';

export function LoadingOverlay() {
    const { isLoading, loadingMessage } = useLoading();

    if (!isLoading) return null;

    return (
        <div className="loading-overlay">
            <BMSLoader message={loadingMessage} />

            <style jsx>{`
                .loading-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(6px);
                    animation: fadeIn 0.2s ease-out;
                    color: white; /* Important for BMSLoader text */
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}

export default LoadingOverlay;
