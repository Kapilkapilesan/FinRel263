import React from 'react';
import { Upload, AlertCircle, CheckCircle, X, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import { DocumentPreviewModal } from '../../common/DocumentPreviewModal';
import { DOCUMENT_TYPES, REQUIRED_DOCUMENTS } from '@/constants/loan.constants';
import { LoanFormData } from '@/types/loan.types';
import { getDocumentUrl } from '@/utils/loan.utils';
import { colors } from '@/themes/colors';
import { API_BASE_URL } from '@/services/api.config';

interface DocumentUploadProps {
    formData: LoanFormData;
    onDocumentChange: (type: string, file: File | null) => void;
    showErrors?: boolean;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ formData, onDocumentChange, showErrors }) => {
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
    const [previewType, setPreviewType] = React.useState<string>('');
    const [isSecure, setIsSecure] = React.useState<boolean>(false);

    React.useEffect(() => {
        return () => {
            if (previewUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleFileChange = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            // Requirement: Max size 1MB
            if (file.size > 1 * 1024 * 1024) {
                toast.error('File size exceeds 1MB limit');
                return;
            }
        }
        onDocumentChange(type, file);
    };

    const removeFile = (type: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onDocumentChange(type, null);
    };

    const openPreview = (type: string, file: File | null, existing: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setPreviewType(type);
        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
            setIsSecure(false);
        } else if (existing) {
            const docId = existing.id;
            if (!docId) {
                setPreviewUrl(getDocumentUrl(existing.url || existing.file_path));
                setIsSecure(false);
                return;
            }

            let endpoint = `${API_BASE_URL}/media/loan-documents/${docId}`;
            if (existing.is_from_profile) {
                const typeParam = type.toLowerCase().includes('nic') ? 'nic' : 'profile';
                endpoint = `${API_BASE_URL}/media/customers/${formData.customer}?type=${typeParam}`;
            }
            setPreviewUrl(endpoint);
            setIsSecure(true);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 mb-1">
                <div className="w-1.5 h-6 bg-primary-500 rounded-full" />
                <h2 className="text-xl font-black text-text-primary uppercase tracking-tight">Upload Documents</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DOCUMENT_TYPES.map((type) => {
                    const selectedFile = formData.documents?.[type];
                    const existingDoc = [...(formData.existingDocuments || [])].reverse().find(doc => doc.type === type);
                    const isRequired = REQUIRED_DOCUMENTS.includes(type as any);
                    const hasDocument = selectedFile || existingDoc;

                    return (
                        <div
                            key={type}
                            className={`group relative border-2 border-dashed rounded-2xl p-3 text-center transition-all cursor-pointer overflow-hidden h-32 flex flex-col items-center justify-center ${hasDocument
                                ? 'border-primary-500/50 bg-primary-500/5'
                                : (isRequired && showErrors)
                                    ? 'border-rose-500 bg-rose-500/10 ring-4 ring-rose-500/10 scale-[1.02]'
                                    : isRequired
                                        ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50 hover:bg-amber-500/10'
                                        : 'border-border-divider/50 bg-primary-500/5 hover:border-primary-500/40 hover:bg-primary-500/10'
                                }`}
                            onClick={() => document.getElementById(`file-${type}`)?.click()}
                        >
                            {/* Decorative background element */}
                            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 blur-3xl opacity-20 transition-all duration-500 group-hover:scale-150 ${hasDocument ? 'bg-primary-500' : isRequired ? 'bg-amber-500' : 'bg-primary-500'}`} />

                            <input
                                id={`file-${type}`}
                                type="file"
                                className="hidden"
                                accept=".jpg,.jpeg,.png,.pdf"
                                onChange={(e) => handleFileChange(type, e)}
                            />

                            {selectedFile ? (
                                <div className="flex flex-col items-center gap-2 relative z-10 animate-in zoom-in duration-300 w-full">
                                    <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center mx-auto border border-primary-500/30">
                                        <CheckCircle className="w-5 h-5 text-primary-500" />
                                    </div>
                                    <p className="text-[10px] font-black text-text-primary uppercase tracking-widest">
                                        {type} {isRequired && <span className="text-rose-500">*</span>}
                                    </p>
                                    <div className="flex items-center justify-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={(e) => openPreview(type, selectedFile, null, e)}
                                            className="text-[9px] text-text-primary font-black uppercase tracking-widest bg-primary-500/10 border border-primary-500/20 px-3 py-1 rounded-lg hover:bg-primary-500/20 transition-all flex items-center gap-1"
                                        >
                                            <Eye className="w-3 h-3" />
                                            <span className="max-w-[70px] truncate">{selectedFile.name}</span>
                                        </button>
                                        <button
                                            onClick={removeFile.bind(null, type)}
                                            className="p-1 hover:bg-rose-500/20 rounded-lg text-rose-500 transition-all bg-rose-500/10 border border-rose-500/20"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ) : existingDoc ? (
                                <div className="flex flex-col items-center gap-2 relative z-10 w-full">
                                    <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center mx-auto border border-primary-500/30">
                                        <CheckCircle className="w-5 h-5 text-primary-500" />
                                    </div>
                                    <p className="text-[10px] font-black text-text-primary uppercase tracking-widest">
                                        {type} {isRequired && <span className="text-rose-500">*</span>}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={(e) => openPreview(type, null, existingDoc, e)}
                                        className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 shadow-sm ${(existingDoc as any).is_from_profile ? 'bg-amber-500 text-white hover:opacity-90' : 'bg-primary-500 text-white hover:opacity-90'}`}
                                    >
                                        <Eye className="w-3 h-3" />
                                        {(existingDoc as any).is_from_profile ? 'From Profile' : 'View Doc'}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 relative z-10 transition-transform group-hover:scale-105 duration-300">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto border transition-colors ${isRequired ? 'bg-amber-500/20 border-amber-500/30 text-amber-500' : 'bg-primary-500/5 border-border-divider/50 text-text-muted/40'}`}>
                                        <Upload className={`w-5 h-5 ${(isRequired && showErrors) ? 'animate-bounce text-rose-500' : ''}`} />
                                    </div>
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${(isRequired && showErrors) ? 'text-rose-500' : 'text-text-primary'}`}>
                                        {type} {isRequired && <span className="text-rose-500">*</span>}
                                    </p>
                                    <p className={`text-[9px] font-black uppercase tracking-widest italic ${isRequired ? (showErrors ? 'text-rose-500' : 'text-amber-500/70') : 'text-text-muted/40'}`}>
                                        {isRequired ? (showErrors ? 'Missing!' : 'Required') : 'Click to upload'}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Preview Modal */}
            {previewUrl && (
                <DocumentPreviewModal
                    url={previewUrl}
                    type={previewType}
                    onClose={() => setPreviewUrl(null)}
                    isSecure={isSecure}
                />
            )}
        </div>
    );
};
