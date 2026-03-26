'use client';

import React from 'react';
import { DraftItem } from '@/types/loan.types';

interface DraftModalProps {
    isOpen: boolean;
    drafts: DraftItem[];
    onClose: () => void;
    onLoad: (draftId: string) => void;
    onDelete: (draftId: string) => void;
}

export const DraftModal: React.FC<DraftModalProps> = ({
    isOpen,
    drafts,
    onClose,
    onLoad,
    onDelete,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-card border border-border-default rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between p-8 border-b border-border-divider bg-muted-bg">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
                            <h3 className="text-sm font-black text-text-primary uppercase tracking-[0.2em]">Saved Drafts</h3>
                        </div>
                        <p className="text-[10px] text-text-secondary font-black uppercase tracking-[0.1em]">Load a previously saved loan application</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center bg-card hover:bg-hover border border-border-default rounded-xl text-text-secondary transition-all active:scale-95"
                    >
                        <span className="text-xl leading-none">✕</span>
                    </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {drafts.length === 0 && (
                        <div className="p-12 text-center">
                            <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] italic">No saved drafts found</div>
                        </div>
                    )}
                    <div className="divide-y divide-border-divider">
                        {drafts.map((draft) => (
                            <div key={draft.id} className="p-6 flex items-center justify-between group hover:bg-hover transition-colors">
                                <div className="space-y-1">
                                    <p className="font-black text-text-primary uppercase tracking-tight group-hover:text-primary-500 transition-colors">{draft.name || 'Unnamed Draft'}</p>
                                    <div className="flex items-center gap-3">
                                        <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">
                                            {new Date(draft.savedAt).toLocaleString()}
                                        </p>
                                        <span className="w-1 h-1 bg-border-default rounded-full" />
                                        <p className="text-[9px] px-2 py-0.5 bg-muted-bg rounded-full text-text-secondary font-black uppercase tracking-widest border border-border-default">
                                            Step {draft.currentStep || 1}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onLoad(draft.id)}
                                        className="h-10 px-6 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                                    >
                                        Load
                                    </button>
                                    <button
                                        onClick={() => onDelete(draft.id)}
                                        className="h-10 px-4 bg-card hover:bg-hover hover:text-danger-500 border border-border-default rounded-xl text-text-secondary text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-4 bg-muted-bg border-t border-border-divider text-center">
                    <p className="text-[9px] text-text-muted font-black uppercase tracking-[0.2em]">Drafts are stored securely on the server</p>
                </div>
            </div>
        </div>
    );
};
