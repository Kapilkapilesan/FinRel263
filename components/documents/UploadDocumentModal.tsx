import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { DocumentCategory, DocumentUploadPayload } from '@/types/document.types';
import { toast } from 'react-toastify';

interface UploadDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (payload: DocumentUploadPayload) => Promise<void>;
}

const CATEGORIES: DocumentCategory[] = ['Forms', 'Contracts', 'Reports', 'Templates', 'Legal', 'Reference'];
const FILE_TYPES = ['PDF', 'Excel', 'Word', 'Image'];
const MAX_FILE_SIZE_MB = 1;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function UploadDocumentModal({ isOpen, onClose, onUpload }: UploadDocumentModalProps) {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<string>('Forms');
    const [fileType, setFileType] = useState('PDF');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const chosen = e.target.files[0];
            if (chosen.size > MAX_FILE_SIZE_BYTES) {
                toast.error(`File must be ${MAX_FILE_SIZE_MB} MB or less. This file is ${(chosen.size / 1024 / 1024).toFixed(1)} MB.`);
                e.target.value = '';
                return;
            }
            setFile(chosen);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !category || !fileType || !file) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsUploading(true);
        try {
            await onUpload({
                title,
                category,
                file_type: fileType.toLowerCase(),
                file,
                description
            });
            toast.success('Document uploaded successfully');
            onClose();
            // Reset form
            setTitle('');
            setCategory('Forms');
            setFile(null);
            setDescription('');
        } catch (error) {
            console.error(error);
            const message = error instanceof Error ? error.message : 'Upload failed';
            toast.error(message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-border-default flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-border-divider bg-muted-bg/5 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-text-primary tracking-tight">Upload Document</h2>
                        <p className="text-sm text-text-muted font-medium mt-0.5">Add a new document to the library</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-hover rounded-full transition-colors border border-transparent hover:border-border-divider">
                        <X className="w-5 h-5 text-text-muted" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                    <div>
                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1.5 ml-1">Document Name *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-input border border-border-default rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all text-text-primary font-bold placeholder:text-text-muted/40"
                            placeholder="Enter document name"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1.5 ml-1">Category *</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-3 bg-input border border-border-default rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all appearance-none text-text-primary font-bold"
                        >
                            {CATEGORIES.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1.5 ml-1">File Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {FILE_TYPES.map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFileType(type)}
                                    className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${fileType === type
                                            ? 'bg-primary-500 text-white border-primary-600 shadow-lg shadow-primary-500/20'
                                            : 'bg-input border-border-default text-text-muted hover:border-primary-500/30 hover:text-text-primary'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1.5 ml-1">File Upload *</label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-border-default hover:border-primary-500/50 hover:bg-hover'
                                }`}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept={fileType === 'Image' ? 'image/*' : fileType === 'PDF' ? '.pdf' : fileType === 'Excel' ? '.xls,.xlsx' : '.doc,.docx'}
                            />
                            {file ? (
                                <>
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3 border border-emerald-500/20">
                                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <p className="text-sm font-bold text-text-primary text-center break-all">{file.name}</p>
                                    <p className="text-[10px] font-black uppercase text-emerald-600 mt-1 tracking-widest">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-12 h-12 rounded-full bg-primary-500/10 flex items-center justify-center mb-3 border border-primary-500/20">
                                        <Upload className="w-6 h-6 text-primary-500" />
                                    </div>
                                    <p className="text-sm font-bold text-text-primary">Click to upload or drag and drop</p>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-1 opacity-60">Supported: {fileType} · Max {MAX_FILE_SIZE_MB} MB</p>
                                </>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1.5 ml-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 bg-input border border-border-default rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all resize-none text-text-primary font-bold placeholder:text-text-muted/40"
                            placeholder="Enter document description"
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-muted-bg text-text-primary font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-hover transition-colors border border-border-default"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isUploading}
                            className="flex-1 px-4 py-3 bg-primary-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isUploading ? (
                                <>
                                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-3.5 h-3.5" />
                                    Upload Document
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
