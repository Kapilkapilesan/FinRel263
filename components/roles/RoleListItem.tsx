import React from 'react';
import { Shield, Edit, Trash2, Users } from 'lucide-react';
import { Role } from '../../types/role.types';

interface RoleListItemProps {
    role: Role;
    isActive: boolean;
    onClick: () => void;
    onEdit: (role: Role) => void;
    onDelete: (id: string) => void;
}

export function RoleListItem({ role, isActive, onClick, onEdit, onDelete }: RoleListItemProps) {
    return (
        <div
            onClick={onClick}
            className={`w-full text-left p-5 rounded-3xl border transition-all cursor-pointer relative group ${isActive
                ? 'border-primary-500 bg-primary-500/10 ring-4 ring-primary-500/5'
                : 'border-border-default bg-card hover:border-primary-500/30'
                }`}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isActive ? 'bg-primary-600 text-white' : 'bg-primary-500/10 text-primary-500'}`}>
                        <Shield size={18} />
                    </div>
                    <div>
                        <span className="font-bold text-text-primary flex items-center gap-2">
                            {role.display_name || role.name}
                            {role.is_system && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="System Role" />}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(role); }}
                        className="p-1.5 text-text-muted hover:text-primary-500 hover:bg-primary-500/10 rounded-lg border border-transparent hover:border-primary-500/20"
                    >
                        <Edit size={14} />
                    </button>
                    {!role.is_system && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(role.id); }}
                            className="p-1.5 text-text-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg border border-transparent hover:border-rose-500/20"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>

            <p className="text-xs text-text-muted mb-4 line-clamp-2 leading-relaxed">
                {role.description}
            </p>


        </div>
    );
}
