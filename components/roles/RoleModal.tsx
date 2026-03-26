import React, { useState, useEffect } from 'react';
import { X, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { Role, Permission, Privilege } from '../../types/role.types';
import { PermissionsTable } from './PermissionsTable';
import { authService } from '../../services/auth.service';

interface RoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (role: Partial<Role>) => void;
    editingRole: Role | null;
    privileges: Privilege[];
    allDefinitions: Privilege[]; // Full permission objects for module filtering
    defaultModules: string[];
    existingRoles: Role[];
}

export function RoleModal({ isOpen, onClose, onSave, editingRole, privileges, allDefinitions, defaultModules, existingRoles }: RoleModalProps) {
    const [name, setName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [description, setDescription] = useState('');
    const [level, setLevel] = useState<string>('staff');
    const [customLevel, setCustomLevel] = useState('');
    const [isCustomLevel, setIsCustomLevel] = useState(false);
    const [hierarchy, setHierarchy] = useState(100);
    const [isDefault, setIsDefault] = useState(false);
    const [isEditable, setIsEditable] = useState(true);
    const [permissions, setPermissions] = useState<Permission[]>([]);

    const userHierarchy = authService.getHighestHierarchy();
    const minHierarchy = userHierarchy + 1;

    useEffect(() => {
        const emptyMatrix = defaultModules.map(module => ({
            module,
            permissions: privileges.reduce((acc, priv) => {
                acc[priv.name] = false;
                return acc;
            }, {} as { [key: string]: boolean })
        }));

        if (editingRole) {
            setName(editingRole.name);
            setDisplayName(editingRole.display_name || editingRole.name);
            setDescription(editingRole.description);
            setLevel(editingRole.level || 'staff');
            setHierarchy(editingRole.hierarchy || 100);
            setIsDefault(editingRole.is_default);
            setIsEditable(editingRole.is_editable);

            // Check if it's a standard level
            const isStandard = ['admin', 'manager', 'staff', 'super_admin'].includes(editingRole.level);
            setIsCustomLevel(!isStandard);
            if (!isStandard) setCustomLevel(editingRole.level);

            const mergedMatrix = emptyMatrix.map(row => {
                const existingRow = editingRole.permissions.find(p => p.module === row.module);
                if (existingRow) {
                    return {
                        ...row,
                        permissions: { ...row.permissions, ...existingRow.permissions }
                    };
                }
                return row;
            });
            setPermissions(mergedMatrix);
        } else {
            setName('');
            setDisplayName('');
            setDescription('');
            setLevel('staff');
            setHierarchy(minHierarchy);
            setIsDefault(false);
            setIsEditable(true);
            setPermissions(emptyMatrix);
        }
    }, [editingRole, isOpen, privileges, defaultModules, minHierarchy]);

    const handleUpdatePermission = (moduleIndex: number, privilegeName: string, value: boolean) => {
        const newPermissions = [...permissions];
        newPermissions[moduleIndex] = {
            ...newPermissions[moduleIndex],
            permissions: { ...newPermissions[moduleIndex].permissions, [privilegeName]: value }
        };
        setPermissions(newPermissions);
    };

    const handleLevelChange = (newLevel: string) => {
        if (newLevel === 'custom') {
            setIsCustomLevel(true);
            setLevel('');
            return;
        }

        setIsCustomLevel(false);

        // If it's a standard level string, just update the level
        if (['admin', 'manager', 'staff'].includes(newLevel)) {
            setLevel(newLevel);
            return;
        }

        // If it's a Role ID, we use it as a template
        const templateRole = existingRoles.find(r => r.id === newLevel);
        if (templateRole) {
            setLevel(templateRole.level as any);
            setHierarchy(templateRole.hierarchy + 1); // Suggest one level below

            // Clone permissions to matrix
            const clonedMatrix = permissions.map(row => {
                const templateRow = templateRole.permissions.find(p => p.module === row.module);
                if (templateRow) {
                    return {
                        ...row,
                        permissions: { ...row.permissions, ...templateRow.permissions }
                    };
                }
                return row;
            });
            setPermissions(clonedMatrix);
        }
    };

    const hasUnauthorized = permissions.some(row =>
        Object.entries(row.permissions).some(([privName, isChecked]) => {
            if (!isChecked) return false;
            return !authService.hasModulePermission(row.module, privName);
        })
    );

    const isNameDuplicate = name.trim() !== '' && existingRoles.some(role => 
        role.name.toLowerCase() === name.trim().toLowerCase() && 
        (!editingRole || role.id !== editingRole.id)
    );

    const isDisplayNameDuplicate = displayName.trim() !== '' && existingRoles.some(role => 
        (role.display_name || role.name).toLowerCase() === displayName.trim().toLowerCase() && 
        (!editingRole || role.id !== editingRole.id)
    );

    const hasErrors = hasUnauthorized || isNameDuplicate || isDisplayNameDuplicate;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (hasErrors) {
            if (hasUnauthorized) toast.error("Security Block: You must untick all red-flagged permissions before saving.");
            if (isNameDuplicate) toast.error("Configuration Error: System name already exists.");
            if (isDisplayNameDuplicate) toast.error("Configuration Error: Display label already exists.");
            return;
        }

        onSave({
            name,
            display_name: displayName,
            description,
            level: isCustomLevel ? customLevel.toLowerCase().replace(/\s+/g, '_') : level,
            hierarchy,
            is_default: isDefault,
            is_editable: isEditable,
            permissions
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4 animate-in fade-in duration-300">
            <div className="bg-card rounded-[2.5rem] max-w-6xl w-full shadow-2xl border border-border-default flex flex-col max-h-[95vh] overflow-hidden transform transition-all scale-100">

                {/* Header */}
                <div className="p-8 border-b border-border-divider flex items-center justify-between bg-card/80 backdrop-blur-xl sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-text-primary tracking-tight">
                                {editingRole ? 'Update Security Role' : 'Engineer New Role'}
                            </h2>
                            <p className="text-xs text-text-muted font-bold uppercase tracking-widest opacity-70">
                                RBAC Infrastructure Configurator
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-hover rounded-2xl transition-all">
                        <X size={24} className="text-text-muted" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-12 scrollbar-thin scrollbar-thumb-border-divider">

                    {/* Section 1: Identity & Authority */}
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-500 ml-1">Identity & Authority</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">System Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="manager_regional"
                                    disabled={!!editingRole}
                                    className={`w-full px-5 py-4 bg-muted-bg border rounded-2xl focus:outline-none focus:ring-4 transition-all font-bold text-text-primary text-sm disabled:opacity-50
                                        ${isNameDuplicate 
                                            ? 'border-red-500 ring-red-500/10 focus:ring-red-500/20 focus:border-red-500' 
                                            : 'border-border-default focus:ring-primary-500/10 focus:border-primary-500'}
                                    `}
                                />
                                {isNameDuplicate && (
                                    <p className="text-[10px] text-red-500 font-bold flex items-center gap-1.5 px-2 animate-in slide-in-from-top-1 duration-200">
                                        <AlertCircle size={12} />
                                        This system name is already in use
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Display Label</label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={e => setDisplayName(e.target.value)}
                                    placeholder="Regional Manager"
                                    className={`w-full px-5 py-4 bg-card border rounded-2xl focus:outline-none focus:ring-4 transition-all font-bold text-text-primary text-sm
                                        ${isDisplayNameDuplicate 
                                            ? 'border-red-500 ring-red-500/10 focus:ring-red-500/20 focus:border-red-500' 
                                            : 'border-border-default focus:ring-primary-500/10 focus:border-primary-500'}
                                    `}
                                />
                                {isDisplayNameDuplicate && (
                                    <p className="text-[10px] text-red-500 font-bold flex items-center gap-1.5 px-2 animate-in slide-in-from-top-1 duration-200">
                                        <AlertCircle size={12} />
                                        This display label is already in use
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Access Level</label>
                                <select
                                    value={isCustomLevel ? 'custom' : level}
                                    onChange={e => handleLevelChange(e.target.value)}
                                    className="w-full px-5 py-4 bg-card border border-border-default rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold text-text-primary text-sm"
                                >
                                    <optgroup label="Standard Profiles">
                                        {authService.getHighestHierarchy() < 10 && <option value="admin">Administrator</option>}
                                        {authService.getHighestHierarchy() < 100 && <option value="manager">Manager</option>}
                                        <option value="staff">Standard Staff</option>
                                        <option value="custom" className="text-blue-500 font-black">+ Create New Custom Level...</option>
                                    </optgroup>

                                    {existingRoles.length > 0 && (
                                        <optgroup label="Clone from Existing Role">
                                            {existingRoles.map(r => (
                                                <option key={r.id} value={r.id}>{r.display_name || r.name}</option>
                                            ))}
                                        </optgroup>
                                    )}
                                </select>

                                {isCustomLevel && (
                                    <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                                        <input
                                            type="text"
                                            value={customLevel}
                                            onChange={e => setCustomLevel(e.target.value)}
                                            placeholder="e.g. Senior Manager"
                                            className="w-full px-5 py-4 bg-primary-500/10 border border-primary-500/30 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold text-primary-500 text-sm"
                                        />
                                        <p className="text-[9px] text-primary-500 mt-2 ml-2 font-black uppercase tracking-widest opacity-70">Defining custom security tier</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Hierarchy Order</label>
                                <input
                                    type="number"
                                    min={minHierarchy}
                                    value={hierarchy}
                                    onChange={e => setHierarchy(Math.max(minHierarchy, parseInt(e.target.value)))}
                                    className="w-full px-5 py-4 bg-card border border-border-default rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold text-text-primary text-sm"
                                />
                                <p className="text-[9px] text-text-muted mt-1 italic font-medium">Note: Higher numbers represent lower ranks (e.g., Staff = 200, Admin = 10)</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Advanced Logic Switches */}
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-500 ml-1">Advanced Configuration</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex items-center justify-between p-6 bg-primary-500/5 rounded-3xl border border-primary-500/10">
                                <div>
                                    <h4 className="text-sm font-black text-text-primary">Default Role</h4>
                                    <p className="text-[10px] text-text-muted mt-1 uppercase tracking-wider font-bold">Assign automatically to new user accounts</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsDefault(!isDefault)}
                                    className={`w-14 h-8 rounded-full transition-all relative ${isDefault ? 'bg-primary-600' : 'bg-border-default'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all ${isDefault ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-6 bg-muted-bg/50 rounded-3xl border border-border-default">
                                <div>
                                    <h4 className="text-sm font-black text-text-primary">Editable Status</h4>
                                    <p className="text-[10px] text-text-muted mt-1 uppercase tracking-wider font-bold">Allow future modifications to this role structure</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsEditable(!isEditable)}
                                    className={`w-14 h-8 rounded-full transition-all relative ${isEditable ? 'bg-emerald-600' : 'bg-border-default'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all ${isEditable ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Descriptive Context */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-500 ml-1">Descriptive Context</h3>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Provide a deep technical or operational description for this role..."
                            rows={3}
                            className="w-full px-6 py-5 bg-card border border-border-default rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium text-text-secondary text-sm leading-relaxed"
                        />
                    </div>

                    {/* Section 4: Capabilities Table */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-500 ml-1">Module Capabilities Matrix</h3>
                            <div className="flex items-center gap-2 bg-primary-500/10 px-4 py-2 rounded-full border border-primary-500/20">
                                <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                                <span className="text-[10px] text-primary-500 font-black uppercase tracking-[0.1em]">
                                    {permissions.length} System Modules Isolated
                                </span>
                            </div>
                        </div>
                        <PermissionsTable
                            permissions={permissions}
                            availablePrivileges={privileges}
                            allPrivileges={allDefinitions}
                            onChange={handleUpdatePermission}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-border-divider flex items-center justify-end gap-4 bg-muted-bg/50 backdrop-blur-xl">
                    <button
                        onClick={onClose}
                        className="px-8 py-4 text-xs font-black text-text-muted hover:bg-card rounded-2xl transition-all uppercase tracking-widest shadow-sm active:scale-95 border border-transparent hover:border-border-divider"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={hasErrors}
                        className={`flex items-center gap-3 px-12 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95
                            ${hasErrors
                                ? 'bg-border-default text-text-muted cursor-not-allowed shadow-none border-red-500/20'
                                : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/25'}
                        `}
                    >
                        {hasErrors ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                        {editingRole ? 'Update Role' : 'Create Role'}
                    </button>
                </div>
            </div>
        </div>
    );
}
