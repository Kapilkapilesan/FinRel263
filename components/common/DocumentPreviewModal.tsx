import React, { useState, useEffect, useCallback } from 'react';
import { X, Maximize2, Download, Loader2, AlertCircle } from 'lucide-react';
import { getHeaders } from '@/services/api.config';

interface DocumentPreviewModalProps {
    url: string;
    type: string;
    onClose: () => void;
    isSecure?: boolean;
    details?: {
        title: string;
        items: { label: string; value: string }[];
    };
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ url, type, onClose, isSecure = false, details }) => {
    const [displayUrl, setDisplayUrl] = useState<string>(url);
    const [loading, setLoading] = useState<boolean>(isSecure);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    const loadSecureDocument = useCallback(async () => {
        if (!isSecure || !url || url.startsWith('blob:') || url.startsWith('data:')) {
            setDisplayUrl(url);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await fetch(url, {
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch document: ${response.statusText}`);
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            setDisplayUrl(objectUrl);
        } catch (err: any) {
            console.error('Error loading secure document:', err);
            setError(err.message || 'Failed to load document');
        } finally {
            setLoading(false);
        }
    }, [url, isSecure]);

    useEffect(() => {
        loadSecureDocument();
        return () => {
            if (displayUrl.startsWith('blob:')) {
                URL.revokeObjectURL(displayUrl);
            }
        };
    }, [loadSecureDocument, retryCount]);

    // Handle ESC key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const isPdf = displayUrl.toLowerCase().endsWith('.pdf') ||
        url.toLowerCase().split('?')[0].endsWith('.pdf') ||
        type.toLowerCase().includes('pdf');

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-md animate-in fade-in duration-500"
            onClick={onClose}
        >
            <div
                className="relative max-w-6xl w-full max-h-[95vh] bg-card border border-border-divider/50 rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col scale-in-center"
                onClick={e => e.stopPropagation()}
            >
                {/* Decorative modal gradient */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 via-primary-400 to-primary-600" />

                {/* Modal Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-border-divider/30 bg-muted-bg/20 shrink-0">
                    <div className="flex items-center gap-5">
                        <div className="p-3.5 rounded-2xl bg-primary-500/10 text-primary-500 border border-primary-500/20">
                            <Maximize2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-text-primary uppercase tracking-[0.1em] leading-tight">{type}</h3>
                            <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] opacity-40 mt-1">DOCUMENT PREVIEW</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {!loading && !error && (
                            <a
                                href={displayUrl}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-12 px-6 bg-muted-bg/40 hover:bg-muted-bg border border-border-divider/50 rounded-2xl text-text-primary transition-all flex items-center gap-3 text-xs font-black uppercase tracking-widest shadow-sm active:scale-95"
                            >
                                <Download className="w-4 h-4" />
                                <span>Download</span>
                            </a>
                        )}
                        <button
                            onClick={onClose}
                            className="w-12 h-12 flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-2xl transition-all active:scale-95"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    <div className="flex-1 overflow-auto custom-scrollbar bg-black/20 flex items-center justify-center p-6 md:p-12">
                        {loading ? (
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
                                <p className="text-xs font-black text-primary-500 uppercase tracking-widest">Securely Fetching Document...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center gap-4 text-rose-500 max-w-md text-center">
                                <AlertCircle className="w-12 h-12" />
                                <p className="text-sm font-bold uppercase tracking-tight">{error}</p>
                                <button
                                    onClick={() => setRetryCount(prev => prev + 1)}
                                    className="px-6 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest mt-4"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : displayUrl ? (
                            isPdf ? (
                                <iframe
                                    src={displayUrl}
                                    className="w-full h-full min-h-[70vh] rounded-[2rem] shadow-2xl border border-border-divider/30 bg-white"
                                    title="PDF Preview"
                                />
                            ) : (
                                <div className="relative group/preview-img">
                                    <div className="absolute -inset-4 bg-primary-500/10 blur-3xl opacity-0 group-hover/preview-img:opacity-100 transition-opacity duration-700" />
                                    <img
                                        src={displayUrl}
                                        alt="Preview"
                                        className="relative z-10 max-w-full max-h-full object-contain rounded-[2rem] shadow-2xl transition-all duration-700 group-hover/preview-img:scale-[1.01]"
                                    />
                                </div>
                            )
                        ) : null}
                    </div>

                    {details && (
                        <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border-divider/30 bg-muted-bg/20 p-8 flex flex-col gap-6 shrink-0 overflow-y-auto custom-scrollbar">
                            <h4 className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em] mb-2">{details.title}</h4>
                            <div className="space-y-6">
                                {details.items.map((item, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <label className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">{item.label}</label>
                                        <div className="bg-card/50 px-4 py-3 rounded-xl border border-border-divider/50 shadow-sm">
                                            <p className="text-sm font-black text-text-primary uppercase tracking-tight leading-tight">{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-auto pt-6 border-t border-border-divider/20 text-center">
                                <p className="text-[9px] font-bold text-text-muted/60 uppercase tracking-widest leading-relaxed">
                                    Vetted Technical Audit Artifact
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="px-8 py-5 bg-muted-bg/20 border-t border-border-divider/30 text-center shrink-0">
                    <p className="text-[10px] text-text-muted/40 font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        Press ESC or click outside to close
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    </p>
                </div>
            </div>
        </div>
    );
};
