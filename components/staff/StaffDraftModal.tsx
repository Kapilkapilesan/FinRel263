import React from 'react';
import { X, Trash2, Clock, User, ArrowUpRight } from 'lucide-react';
import { StaffDraftItem } from '@/hooks/staff/useStaffDraftManager';

interface StaffDraftModalProps {
    isOpen: boolean;
    drafts: StaffDraftItem[];
    onClose: () => void;
    onLoad: (id: string) => void;
    onDelete: (id: string) => void;
}

export const StaffDraftModal: React.FC<StaffDraftModalProps> = ({ isOpen, drafts, onClose, onLoad, onDelete }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Staff Drafts</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    {drafts.length === 0 ? (
                        <div className="text-center py-10">
                            <Clock className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-500 text-sm">No saved drafts found</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {drafts.map((draft) => (
                                <div
                                    key={draft.id}
                                    className="group p-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-900 rounded-xl transition-all cursor-pointer flex items-center justify-between"
                                    onClick={() => onLoad(draft.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                {draft.name}
                                            </h3>
                                            <p className="text-[10px] text-gray-400 font-medium">
                                                Saved on {new Date(draft.savedAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(draft.id);
                                            }}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
