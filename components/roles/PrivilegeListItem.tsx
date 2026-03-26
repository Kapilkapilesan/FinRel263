import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Privilege } from '../../types/role.types';

interface PrivilegeListItemProps {
    privilege: Privilege;
    onEdit: (privilege: Privilege) => void;
    onDelete: (id: string) => void;
}

export function PrivilegeListItem({ privilege, onEdit, onDelete }: PrivilegeListItemProps) {
    return (
        <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border-default hover:shadow-md transition-all group hover:border-emerald-500/30">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text-primary">
                    {privilege.display_name || privilege.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[9px] font-mono text-primary-500/70 uppercase tracking-tighter">
                        {privilege.name}
                    </span>
                    {privilege.is_core && (
                        <span className="text-[8px] bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter ring-1 ring-rose-500/20">
                            Core
                        </span>
                    )}
                    {privilege.module && (
                        <span className="text-[8px] bg-muted-bg text-text-muted px-1.5 py-0.5 rounded font-black uppercase tracking-tighter border border-border-divider">
                            {privilege.module}
                        </span>
                    )}
                </div>
                {privilege.description && (
                    <p className="text-[10px] text-text-muted mt-1 line-clamp-2 leading-relaxed italic">
                        {privilege.description}
                    </p>
                )}
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onEdit(privilege)}
                    className="p-1.5 text-text-muted hover:text-primary-500 hover:bg-primary-500/10 rounded-lg transition-colors border border-transparent hover:border-primary-500/20"
                >
                    <Edit size={14} />
                </button>
                <button
                    onClick={() => onDelete(privilege.id)}
                    className="p-1.5 text-text-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}
