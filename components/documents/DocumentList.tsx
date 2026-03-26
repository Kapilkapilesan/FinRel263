import React from 'react';
import BMSLoader from '@/components/common/BMSLoader';
import { DocumentRecord } from '@/types/document.types';
import { FileText, Download, Eye, Trash2, Printer, Calendar, File } from 'lucide-react';

interface DocumentListProps {
    documents: DocumentRecord[];
    isLoading: boolean;
    onDownload: (doc: DocumentRecord) => void;
    onPreview: (doc: DocumentRecord) => void;
    onDelete: (id: number) => void;
    onPrint: (doc: DocumentRecord) => void;
    canDelete?: boolean;
    canDownload?: boolean;
}

export function DocumentList({ documents, isLoading, onDownload, onPreview, onDelete, onPrint, canDelete = false, canDownload = false }: DocumentListProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <BMSLoader message="Loading documents..." size="xsmall" />
            </div>
        );
    }

    if (documents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-muted-bg/10 rounded-2xl border-2 border-dashed border-border-default/50">
                <div className="w-16 h-16 bg-muted-bg/20 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-text-muted" />
                </div>
                <h3 className="text-lg font-bold text-text-primary">No Documents Found</h3>
                <p className="text-sm text-text-muted mt-1 font-medium">Try adjusting your search or filter criteria</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
                <div key={doc.id} className="group bg-card rounded-xl border border-border-default p-5 hover:shadow-xl hover:shadow-black/5 hover:border-primary-500/30 transition-all flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center border border-primary-500/20">
                                <FileText className="w-5 h-5 text-primary-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-text-primary line-clamp-1 text-sm uppercase tracking-tight" title={doc.title}>{doc.title}</h3>
                                <div className="flex items-center gap-2 text-[10px] text-text-muted mt-0.5">
                                    <span className="uppercase font-black tracking-widest text-primary-500/70">{doc.file_type}</span>
                                    <span className="opacity-30">•</span>
                                    <span className="font-bold">{(doc.file_size / 1024).toFixed(0)} KB</span>
                                </div>
                            </div>
                        </div>
                        {canDelete && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => onDelete(doc.id)}
                                    className="p-1.5 hover:bg-rose-500/10 text-text-muted hover:text-rose-500 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                                    title="Delete Document"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {doc.description && (
                        <p className="text-xs text-text-secondary mb-4 line-clamp-2 min-h-[2rem] font-medium leading-relaxed italic">{doc.description}</p>
                    )}

                    <div className="mt-auto pt-4 border-t border-border-divider flex items-center justify-between">
                        <div className="text-[10px] text-text-muted font-bold flex items-center gap-1.5 uppercase tracking-wider">
                            <Calendar className="w-3.5 h-3.5 text-primary-500/50" />
                            {new Date(doc.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1.5">
                            {canDownload && (
                                <>
                                    <button
                                        onClick={() => onPrint(doc)}
                                        className="p-2 hover:bg-hover text-text-muted hover:text-text-primary rounded-lg transition-colors border border-transparent hover:border-border-divider"
                                        title="Print"
                                    >
                                        <Printer className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onPreview(doc)}
                                        className="p-2 hover:bg-primary-500/10 text-primary-500 rounded-lg transition-colors border border-transparent hover:border-primary-500/20"
                                        title="Preview"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onDownload(doc)}
                                        className="p-2 hover:bg-emerald-500/10 text-emerald-500 rounded-lg transition-colors border border-transparent hover:border-emerald-500/20"
                                        title="Download"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
