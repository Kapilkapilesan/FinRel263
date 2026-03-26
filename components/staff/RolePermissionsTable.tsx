import { Permission } from '../../types/staff.types';
import { colors } from '@/themes/colors';

interface RolePermissionsTableProps {
    roles: string[];
    permissions: Permission[];
}

export function RolePermissionsTable({ roles, permissions }: RolePermissionsTableProps) {
    return (
        <div className="p-6">
            <div className="mb-6">
                <h3 className="text-sm font-semibold text-text-primary mb-2">Available Roles</h3>
                <div className="flex flex-wrap gap-2">
                    {roles.map((role: any) => (
                        <button
                            key={role.id || role}
                            className="px-3 py-1.5 rounded-lg transition-colors text-sm font-medium bg-primary-500/10 text-primary-600 hover:bg-primary-500/20"
                        >
                            {role.display_name || role}
                        </button>
                    ))}
                </div>
            </div>

            <div className="border border-border-default rounded-lg overflow-hidden">
                <div className="bg-table-header border-b border-border-divider px-4 py-3">
                    <div className="grid grid-cols-5 gap-4 text-xs font-semibold text-text-muted uppercase">
                        <div className="col-span-1">Module</div>
                        <div className="col-span-1 text-center">View</div>
                        <div className="col-span-1 text-center">Create</div>
                        <div className="col-span-1 text-center">Edit</div>
                        <div className="col-span-1 text-center">Delete</div>
                    </div>
                </div>
                <div className="divide-y divide-border-divider">
                    {permissions.map((perm, index) => (
                        <div key={index} className="px-4 py-3 hover:bg-table-row-hover transition-colors">
                            <div className="grid grid-cols-5 gap-4 items-center">
                                <div className="col-span-1">
                                    <p className="text-sm font-medium text-text-primary">{perm.module}</p>
                                </div>
                                <div className="col-span-1 flex justify-center">
                                    <input
                                        type="checkbox"
                                        checked={perm.view}
                                        readOnly
                                        className="w-4 h-4 rounded border-border-input"
                                        style={{ accentColor: colors.primary[600] }}
                                    />
                                </div>
                                <div className="col-span-1 flex justify-center">
                                    <input
                                        type="checkbox"
                                        checked={perm.create}
                                        readOnly
                                        className="w-4 h-4 rounded border-border-input"
                                        style={{ accentColor: colors.primary[600] }}
                                    />
                                </div>
                                <div className="col-span-1 flex justify-center">
                                    <input
                                        type="checkbox"
                                        checked={perm.edit}
                                        readOnly
                                        className="w-4 h-4 rounded border-border-input"
                                        style={{ accentColor: colors.primary[600] }}
                                    />
                                </div>
                                <div className="col-span-1 flex justify-center">
                                    <input
                                        type="checkbox"
                                        checked={perm.delete}
                                        readOnly
                                        className="w-4 h-4 rounded border-border-input"
                                        style={{ accentColor: colors.primary[600] }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-4 flex justify-end">
                <button
                    className="px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/20 active:scale-95"
                >
                    Save Permissions
                </button>
            </div>
        </div>
    );
}
