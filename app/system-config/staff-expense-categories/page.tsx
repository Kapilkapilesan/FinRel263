'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    X,
    MoreVertical,
    Trash2,
    Edit3,
    DollarSign,
    AlertCircle,
    Loader2,
    Tag,
} from 'lucide-react';
import { staffExpenseCategoryService, StaffExpenseCategory } from '../../../services/staffExpenseCategory.service';
import { toast } from 'react-toastify';

// =============================================
// CATEGORY MODAL (ADD / EDIT)
// =============================================
function CategoryModal({
    isOpen,
    onClose,
    onSubmit,
    isLoading,
    initialData,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<StaffExpenseCategory>) => void;
    isLoading: boolean;
    initialData: StaffExpenseCategory | null;
}) {
    const [name, setName] = useState('');
    const [fixedAmount, setFixedAmount] = useState<string>('');
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setName(initialData?.name || '');
            setFixedAmount(initialData?.fixed_amount ? initialData.fixed_amount.toString() : '');
            setIsActive(initialData === null ? true : initialData.is_active);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !fixedAmount) return;
        onSubmit({
            name: name.trim(),
            fixed_amount: parseFloat(fixedAmount),
            is_active: isActive
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-border-default">
                <div className="px-6 pt-6 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-text-primary tracking-tight">
                                {initialData ? 'EDIT CATEGORY' : 'ADD NEW CATEGORY'}
                            </h2>
                            <p className="text-sm text-text-secondary mt-0.5">
                                Enter the expense category details
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-hover text-text-muted hover:text-text-primary transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                            Category Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Category Name"
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all text-sm"
                            autoFocus
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                            Fixed Amount (LKR)
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={fixedAmount}
                            onChange={(e) => setFixedAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all text-sm"
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-border-default bg-input">
                        <div>
                            <div className="text-sm font-semibold text-text-primary">Status</div>
                            <div className="text-xs text-text-muted mt-0.5">Active categories are visible to staff</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-border-default peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-hover rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !name.trim() || !fixedAmount}
                            className="px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {initialData ? 'Update Category' : 'Save Category'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// =============================================
// DELETE CONFIRMATION MODAL
// =============================================
function DeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    isLoading,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    isLoading: boolean;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-border-default">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-danger-50 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-danger-600" />
                        </div>
                        <h3 className="text-lg font-bold text-text-primary">{title}</h3>
                    </div>
                    <p className="text-sm text-text-secondary">{message}</p>

                    <div className="flex items-center justify-end gap-3 mt-6">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-hover rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="px-6 py-2.5 text-sm font-semibold text-white bg-danger-600 hover:bg-danger-500 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// =============================================
// MAIN PAGE COMPONENT
// =============================================
export default function StaffExpenseCategoriesPage() {
    const [categories, setCategories] = useState<StaffExpenseCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modals
    const [modalState, setModalState] = useState<{
        show: boolean;
        type: 'add' | 'edit';
        data: StaffExpenseCategory | null;
    }>({ show: false, type: 'add', data: null });

    const [deleteTarget, setDeleteTarget] = useState<StaffExpenseCategory | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

    const fetchCategories = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await staffExpenseCategoryService.getAll();
            setCategories(data);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load categories');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleSave = async (data: Partial<StaffExpenseCategory>) => {
        try {
            setIsSaving(true);
            if (modalState.type === 'edit' && modalState.data) {
                await staffExpenseCategoryService.update(modalState.data.id, data);
                toast.success('Category updated successfully');
            } else {
                await staffExpenseCategoryService.create(data);
                toast.success('Category created successfully');
            }
            setModalState({ show: false, type: 'add', data: null });
            fetchCategories();
        } catch (error: any) {
            toast.error(error.response?.data?.message || error.message || 'Failed to save category');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setIsDeleting(true);
            await staffExpenseCategoryService.delete(deleteTarget.id);
            toast.success('Category deleted successfully');
            setDeleteTarget(null);
            fetchCategories();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete category');
        } finally {
            setIsDeleting(false);
            setMenuOpenId(null);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                        STAFF EXPENSE CATEGORIES
                    </h1>
                    <p className="text-text-secondary mt-1">
                        Manage predefined fixed expense categories for staff requests
                    </p>
                </div>
                <button
                    onClick={() => setModalState({ show: true, type: 'add', data: null })}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-primary-500/20"
                >
                    <Plus className="w-4 h-4" />
                    New Category
                </button>
            </div>

            {/* Table */}
            <div className="bg-card rounded-2xl border border-border-default overflow-hidden shadow-sm">
                <div className="grid grid-cols-12 gap-4 px-6 py-3.5 bg-table-header border-b border-border-divider">
                    <div className="col-span-5">
                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                            Category Name
                        </span>
                    </div>
                    <div className="col-span-3">
                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                            Fixed Amount
                        </span>
                    </div>
                    <div className="col-span-3">
                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                            Status
                        </span>
                    </div>
                    <div className="col-span-1 text-right">
                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                            Actions
                        </span>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                        <span className="ml-3 text-text-secondary text-sm">Loading categories...</span>
                    </div>
                ) : categories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Tag className="w-12 h-12 text-text-muted mb-3" />
                        <h3 className="text-base font-semibold text-text-primary">
                            No Categories Found
                        </h3>
                        <p className="text-sm text-text-secondary mt-1">
                            Start by adding your first active expense category.
                        </p>
                        <button
                            onClick={() => setModalState({ show: true, type: 'add', data: null })}
                            className="mt-4 text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                        >
                            Add Category
                        </button>
                    </div>
                ) : (
                    <div>
                        {categories.map((category) => (
                            <div
                                key={category.id}
                                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border-divider last:border-b-0 hover:bg-table-row-hover transition-colors items-center"
                            >
                                <div className="col-span-5 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                                        <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <span className="font-semibold text-text-primary text-sm">
                                        {category.name}
                                    </span>
                                </div>
                                <div className="col-span-3 flex items-center">
                                    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-input border border-border-default text-text-primary text-sm font-semibold font-mono">
                                        LKR {category.fixed_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="col-span-3 flex items-center">
                                    {category.is_active ? (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                            Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-500/10 text-gray-500 text-[10px] font-black uppercase tracking-widest border border-gray-500/20">
                                            Inactive
                                        </span>
                                    )}
                                </div>
                                <div className="col-span-1 flex items-center justify-end relative">
                                    <button
                                        onClick={() => setMenuOpenId(menuOpenId === category.id ? null : category.id)}
                                        className="p-2 rounded-lg hover:bg-hover text-text-muted hover:text-text-primary transition-colors"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>

                                    {menuOpenId === category.id && (
                                        <div className="absolute right-0 top-full mt-1 w-40 bg-card rounded-xl shadow-lg border border-border-default z-10 py-1">
                                            <button
                                                onClick={() => {
                                                    setModalState({ show: true, type: 'edit', data: category });
                                                    setMenuOpenId(null);
                                                }}
                                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-primary hover:bg-hover transition-colors"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setDeleteTarget(category);
                                                    setMenuOpenId(null);
                                                }}
                                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <CategoryModal
                isOpen={modalState.show}
                onClose={() => setModalState({ show: false, type: 'add', data: null })}
                onSubmit={handleSave}
                isLoading={isSaving}
                initialData={modalState.data}
            />

            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Category"
                message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                isLoading={isDeleting}
            />
        </div>
    );
}
