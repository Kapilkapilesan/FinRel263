import React, { useEffect, useState } from 'react';
import { X, Download, Printer, Loader2, AlertCircle } from 'lucide-react';
import { DocumentRecord } from '@/types/document.types';
import { documentService } from '@/services/document.service';

interface DocumentPreviewModalProps {
    document: DocumentRecord | null;
    isOpen: boolean;
    onClose: () => void;
    onDownload: () => void;
}

export function DocumentPreviewModal({ document: doc, isOpen, onClose, onDownload }: DocumentPreviewModalProps) {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && doc) {
            loadPreview();
        } else {
            if (blobUrl) {
                window.URL.revokeObjectURL(blobUrl);
                setBlobUrl(null);
            }
            setError(null);
        }
    }, [isOpen, doc]);

    const loadPreview = async () => {
        if (!doc) return;
        setIsLoading(true);
        setError(null);
        try {
            const blob = await documentService.fetchPreviewBlob(doc.id);
            const fileType = doc.file_type === 'pdf' ? 'application/pdf' :
                doc.file_type === 'image' || ['jpg', 'jpeg', 'png'].includes(doc.file_type) ? 'image/jpeg' :
                    'application/octet-stream';

            const blobWithHeader = blob.slice(0, blob.size, fileType);
            const url = window.URL.createObjectURL(blobWithHeader);
            setBlobUrl(url);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to load document preview');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = () => {
        if (!blobUrl) return;
        const printWindow = window.open(blobUrl, '_blank');
        if (printWindow) {
            printWindow.onload = () => {
                printWindow.print();
            };
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 md:p-8">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-border-default">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border-divider bg-card">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-500 border border-primary-500/20">
                            <Loader2 className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </div>
                        <div>
                            <h3 className="font-bold text-text-primary line-clamp-1">{doc?.title}</h3>
                            <p className="text-[10px] text-text-muted uppercase font-black tracking-widest mt-0.5">Previewing {doc?.file_type}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            disabled={!blobUrl}
                            className="p-2.5 hover:bg-hover text-text-muted hover:text-text-primary rounded-xl transition-colors disabled:opacity-50 border border-transparent hover:border-border-divider"
                            title="Print"
                        >
                            <Printer className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onDownload}
                            className="p-2.5 hover:bg-hover text-text-muted hover:text-text-primary rounded-xl transition-colors border border-transparent hover:border-border-divider"
                            title="Download"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                        <div className="w-px h-8 bg-border-divider mx-1" />
                        <button
                            onClick={onClose}
                            className="p-2.5 hover:bg-rose-500/10 text-text-muted hover:text-rose-500 rounded-xl transition-all border border-transparent hover:border-rose-500/20"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-muted-bg relative overflow-hidden flex items-center justify-center">
                    {isLoading && (
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                            <p className="text-sm font-bold text-text-muted uppercase tracking-widest animate-pulse">Loading preview...</p>
                        </div>
                    )}

                    {error && (
                        <div className="flex flex-col items-center gap-4 text-center max-w-md px-6">
                            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 border border-rose-500/20 shadow-lg">
                                <AlertCircle className="w-8 h-8" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-text-primary tracking-tight">Preview Error</h4>
                                <p className="text-sm text-text-muted mt-1 font-medium">{error}</p>
                            </div>
                            <button
                                onClick={loadPreview}
                                className="px-6 py-2.5 bg-card border border-border-default rounded-xl font-bold text-text-primary hover:bg-hover transition-colors shadow-sm text-xs uppercase tracking-widest"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {!isLoading && !error && blobUrl && (
                        <div className="w-full h-full">
                            {doc?.file_type === 'pdf' ? (
                                <iframe
                                    src={`${blobUrl}#toolbar=0`}
                                    className="w-full h-full border-none"
                                    title="PDF Preview"
                                />
                            ) : doc?.file_type === 'image' || ['jpg', 'jpeg', 'png'].includes(doc?.file_type || '') ? (
                                <div className="w-full h-full p-4 flex items-center justify-center overflow-auto">
                                    <img
                                        src={blobUrl}
                                        alt="Preview"
                                        className="max-w-full max-h-full object-contain shadow-lg rounded-lg"
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-5">
                                    <div className="w-20 h-20 bg-primary-500/10 rounded-2xl flex items-center justify-center text-primary-500 border border-primary-500/20 shadow-xl">
                                        <X className="w-10 h-10" />
                                    </div>
                                    <p className="text-lg font-bold text-text-primary tracking-tight">Preview not available for this file type</p>
                                    <button
                                        onClick={onDownload}
                                        className="px-8 py-3.5 bg-primary-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 flex items-center gap-2"
                                    >
                                        <Download className="w-5 h-5" />
                                        Download to View
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer / Status */}
                <div className="p-3 bg-card border-t border-border-divider flex items-center justify-center gap-6 text-[10px] text-text-muted font-black uppercase tracking-widest">
                    <span className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Secure Connection
                    </span>
                    <span className="opacity-30">•</span>
                    <span>Encrypted View</span>
                    <span className="opacity-30">•</span>
                    <span>No data saved on device</span>
                </div>
            </div>
        </div>
    );
}
