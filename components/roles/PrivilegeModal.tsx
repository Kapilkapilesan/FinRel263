import React, { useState, useEffect } from 'react';
import { X, Settings, Info, CheckCircle2 } from 'lucide-react';
import { Privilege } from '../../types/role.types';

interface PrivilegeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (privilege: Partial<Privilege>) => void;
    editingPrivilege: Privilege | null;
}

export function PrivilegeModal({ isOpen, onClose, onSave, editingPrivilege }: PrivilegeModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (editingPrivilege) {
            setName(editingPrivilege.name);
            setDescription(editingPrivilege.description);
        } else {
            setName('');
            setDescription('');
        }
    }, [editingPrivilege, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, description });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4 animate-in fade-in duration-300">
            <div className="bg-card rounded-[2.5rem] max-w-lg w-full shadow-2xl border border-border-default flex flex-col transform transition-all scale-100">

                {/* Header */}
                <div className="p-8 border-b border-border-divider flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <Settings size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-text-primary tracking-tight">
                                {editingPrivilege ? 'Edit Privilege' : 'New Privilege'}
                            </h2>
                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest opacity-70">Define system capability</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-hover rounded-2xl transition-all">
                        <X size={24} className="text-text-muted" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Privilege Name</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-emerald-500 transition-colors">
                                <Settings size={16} />
                            </div>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. approve_loans"
                                className="w-full pl-12 pr-4 py-4 bg-muted-bg border border-border-default rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-text-primary placeholder:text-text-muted/40 placeholder:font-normal"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Description</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={4}
                            placeholder="Detail what this privilege allows a user to do..."
                            className="w-full p-4 bg-muted-bg border border-border-default rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-text-primary placeholder:text-text-muted/40 placeholder:font-normal resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-border-divider flex items-center justify-end gap-3 bg-muted-bg/50 backdrop-blur-xl rounded-b-[2.5rem]">
                    <button
                        onClick={onClose}
                        className="px-8 py-4 text-xs font-black text-text-muted hover:bg-card rounded-2xl transition-all uppercase tracking-widest active:scale-95 border border-transparent hover:border-border-divider"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex items-center gap-3 px-12 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition-all font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/25 active:scale-95"
                    >
                        <CheckCircle2 size={18} />
                        {editingPrivilege ? 'Update' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    );
}
