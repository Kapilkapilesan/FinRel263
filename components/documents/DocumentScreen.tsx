'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, FileText, Filter, Receipt, BookOpen, Scale, FileCode, CheckSquare, Layers } from 'lucide-react';
import { documentService } from '@/services/document.service';
import { DocumentRecord, DocumentCategory, DocumentUploadPayload } from '@/types/document.types';
import { DocumentList } from './DocumentList';
import { UploadDocumentModal } from './UploadDocumentModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { toast } from 'react-toastify';
import { authService } from '@/services/auth.service';

const TABS: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'All Documents', label: 'All Documents', icon: <Layers className="w-4 h-4" /> },
    { id: 'Forms', label: 'Forms', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'Contracts', label: 'Contracts', icon: <FileText className="w-4 h-4" /> },
    { id: 'Reports', label: 'Reports', icon: <Receipt className="w-4 h-4" /> },
    { id: 'Templates', label: 'Templates', icon: <FileCode className="w-4 h-4" /> },
    { id: 'Legal', label: 'Legal', icon: <Scale className="w-4 h-4" /> },
    { id: 'Reference', label: 'Reference', icon: <BookOpen className="w-4 h-4" /> },
];

export function DocumentScreen() {
    const [activeTab, setActiveTab] = useState('All Documents');
    const [searchQuery, setSearchQuery] = useState('');
    const [documents, setDocuments] = useState<DocumentRecord[]>([]);
    const [stats, setStats] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);

    const fetchDocuments = useCallback(async () => {
        setIsLoading(true);
        try {
            const [docsData, statsData] = await Promise.all([
                documentService.getDocuments(activeTab, searchQuery),
                documentService.getStats()
            ]);
            setDocuments(docsData);
            setStats(statsData);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load documents');
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, searchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchDocuments();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchDocuments]);

    const handleUpload = async (payload: DocumentUploadPayload) => {
        try {
            await documentService.uploadDocument(payload);
            fetchDocuments(); // Refresh list and stats
        } catch (error: any) {
            toast.error(error.message || 'Upload failed');
            throw error;
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this document?')) return;
        try {
            await documentService.deleteDocument(id);
            toast.success('Document deleted');
            fetchDocuments(); // Refresh list and stats
        } catch (error) {
            toast.error('Failed to delete document');
        }
    };

    const handleDownload = async (doc: DocumentRecord) => {
        try {
            toast.info('Downloading...');
            await documentService.downloadDocument(doc);
        } catch (error) {
            toast.error('Download failed');
        }
    };

    const handlePreview = (doc: DocumentRecord) => {
        setPreviewDoc(doc);
    };

    const handlePrint = (doc: DocumentRecord) => {
        handlePreview(doc); // Open popup, then they can click print inside
    };

    return (
        <div className="space-y-6">
            <UploadDocumentModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUpload={handleUpload}
            />

            <DocumentPreviewModal
                isOpen={!!previewDoc}
                document={previewDoc}
                onClose={() => setPreviewDoc(null)}
                onDownload={() => previewDoc && handleDownload(previewDoc)}
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">Document Downloads</h1>
                    <p className="text-sm text-text-muted mt-1 font-medium">Access forms, templates, and generate customized documents</p>
                </div>
                {authService.hasPermission('documents.upload') && (
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-lg shadow-primary-500/20 transition-all font-bold text-sm"
                    >
                        <Plus className="w-5 h-5" />
                        Upload Document
                    </button>
                )}
            </div>

            <div className="bg-card rounded-2xl border border-border-default shadow-sm p-1">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-transparent outline-none text-text-primary placeholder:text-text-muted/40 font-medium"
                        placeholder="Search by name, description, tags..."
                    />
                </div>

                <div className="border-t border-border-divider p-2 overflow-x-auto">
                    <div className="flex items-center gap-1 min-w-max">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id
                                    ? 'bg-primary-500/10 text-primary-500 shadow-sm'
                                    : 'text-text-muted hover:bg-hover hover:text-text-primary'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                                <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-black ${activeTab === tab.id ? 'bg-primary-500 text-white' : 'bg-muted-bg text-text-muted'
                                    }`}>
                                    {stats[tab.id] || 0}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="min-h-[400px]">
                <p className="text-sm text-text-muted mb-4 font-bold flex items-center gap-2">
                    Showing <span className="text-text-primary">{documents.length}</span> documents
                    {activeTab !== 'All Documents' && <span className="text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded text-xs leading-none border border-primary-500/20">in {activeTab}</span>}
                </p>
                <DocumentList
                    documents={documents}
                    isLoading={isLoading}
                    onDownload={handleDownload}
                    onPreview={handlePreview}
                    onDelete={handleDelete}
                    onPrint={handlePrint}
                    canDelete={authService.hasPermission('documents.delete')}
                    canDownload={authService.hasPermission('documents.download')}
                />
            </div>
        </div>
    );
}
