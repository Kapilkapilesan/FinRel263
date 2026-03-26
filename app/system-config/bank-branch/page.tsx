'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Building2,
    Search,
    Plus,
    X,
    GitBranch,
    ArrowLeft,
    Phone,
    MapPin,
    MoreVertical,
    Trash2,
    Edit3,
    Landmark,
    AlertCircle,
    Loader2,
    UploadCloud,
} from 'lucide-react';
import { bankService } from '../../../services/bank.service';
import { Bank, BankBranch, BankFormData, BankBranchFormData } from '../../../types/bank.types';
import { toast } from 'react-toastify';

// =============================================
// ADD BANK MODAL
// =============================================
function AddBankModal({
    isOpen,
    onClose,
    onSubmit,
    isLoading,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: BankFormData) => void;
    isLoading: boolean;
}) {
    const [bankName, setBankName] = useState('');
    const [bankCode, setBankCode] = useState('');

    useEffect(() => {
        if (isOpen) {
            setBankName('');
            setBankCode('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!bankName.trim() || !bankCode.trim()) return;
        onSubmit({ bank_name: bankName.trim(), bank_code: bankCode.trim() });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-border-default">
                {/* Header */}
                <div className="px-6 pt-6 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-text-primary tracking-tight">
                                ADD NEW BANK
                            </h2>
                            <p className="text-sm text-text-secondary mt-0.5">
                                Enter the official bank details below
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

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                            Bank Name
                        </label>
                        <input
                            type="text"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="e.g. Bank of Ceylon"
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all text-sm"
                            autoFocus
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                            Bank Code
                        </label>
                        <input
                            type="text"
                            value={bankCode}
                            onChange={(e) => setBankCode(e.target.value)}
                            placeholder="e.g. 7010"
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all text-sm"
                            required
                        />
                    </div>

                    {/* Actions */}
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
                            disabled={isLoading || !bankName.trim() || !bankCode.trim()}
                            className="px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Add Bank
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// =============================================
// ADD BRANCH MODAL
// =============================================
function AddBranchModal({
    isOpen,
    onClose,
    onSubmit,
    isLoading,
    bank,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: BankBranchFormData) => void;
    isLoading: boolean;
    bank: Bank | null;
}) {
    const [branchName, setBranchName] = useState('');
    const [branchCode, setBranchCode] = useState('');

    useEffect(() => {
        if (isOpen) {
            setBranchName('');
            setBranchCode('');
        }
    }, [isOpen]);

    if (!isOpen || !bank) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!branchName.trim()) return;
        onSubmit({
            branch_name: branchName.trim(),
            branch_code: branchCode.trim() || undefined,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-border-default">
                {/* Header */}
                <div className="px-6 pt-6 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-text-primary tracking-tight">
                                REGISTER BRANCH
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <Landmark className="w-4 h-4 text-primary-500" />
                                <span className="text-sm font-semibold text-primary-600">
                                    {bank.bank_name} ({bank.bank_code})
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-hover text-text-muted hover:text-text-primary transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                            Branch Name
                        </label>
                        <input
                            type="text"
                            value={branchName}
                            onChange={(e) => setBranchName(e.target.value)}
                            placeholder="e.g. City Office"
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all text-sm"
                            autoFocus
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                            Branch Code
                        </label>
                        <input
                            type="text"
                            value={branchCode}
                            onChange={(e) => setBranchCode(e.target.value)}
                            placeholder="e.g. 1"
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all text-sm"
                        />
                    </div>

                    {/* Actions */}
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
                            disabled={isLoading || !branchName.trim()}
                            className="px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Confirm Addition
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// =============================================
// BANK LIST VIEW
// =============================================
function BankListView({
    banks,
    searchQuery,
    onSearchChange,
    onAddBank,
    onSelectBank,
    onDeleteBank,
    onBulkImport,
    isLoading,
    isImporting,
}: {
    banks: Bank[];
    searchQuery: string;
    onSearchChange: (q: string) => void;
    onAddBank: () => void;
    onSelectBank: (bank: Bank) => void;
    onDeleteBank: (bank: Bank) => void;
    onBulkImport: () => void;
    isLoading: boolean;
    isImporting: boolean;
}) {
    const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                        BANK MANAGEMENT
                    </h1>
                    <p className="text-text-secondary mt-1">
                        Manage external banking partners and their networks
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBulkImport}
                        disabled={isImporting}
                        className="flex items-center gap-2 px-5 py-2.5 bg-card border border-border-default hover:bg-hover text-text-primary rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                        {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4 text-primary-500" />}
                        {isImporting ? 'Importing...' : 'Bulk Import'}
                    </button>
                    <button
                        onClick={onAddBank}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-primary-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        Add Bank
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search banks by name or code..."
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all text-sm"
                />
            </div>

            {/* Table */}
            <div className="bg-card rounded-2xl border border-border-default overflow-hidden shadow-sm">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3.5 bg-table-header border-b border-border-divider">
                    <div className="col-span-5">
                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                            Bank Name
                        </span>
                    </div>
                    <div className="col-span-3">
                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                            Bank Code
                        </span>
                    </div>
                    <div className="col-span-2">
                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                            Branch Count
                        </span>
                    </div>
                    <div className="col-span-2 text-right">
                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                            Actions
                        </span>
                    </div>
                </div>

                {/* Table Body */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                        <span className="ml-3 text-text-secondary text-sm">Loading banks...</span>
                    </div>
                ) : banks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Building2 className="w-12 h-12 text-text-muted mb-3" />
                        <h3 className="text-base font-semibold text-text-primary">
                            No Banks Registered
                        </h3>
                        <p className="text-sm text-text-secondary mt-1">
                            Start by adding your first banking partner.
                        </p>
                        <button
                            onClick={onAddBank}
                            className="mt-4 text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                        >
                            Add Bank
                        </button>
                    </div>
                ) : (
                    <div>
                        {banks.map((bank) => (
                            <div
                                key={bank.id}
                                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border-divider last:border-b-0 hover:bg-table-row-hover transition-colors cursor-pointer group"
                                onClick={() => onSelectBank(bank)}
                            >
                                <div className="col-span-5 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                                        <Landmark className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-text-primary text-sm">
                                            {bank.bank_name}
                                        </p>
                                        <p className="text-xs text-text-muted uppercase tracking-wide">
                                            System Partner
                                        </p>
                                    </div>
                                </div>
                                <div className="col-span-3 flex items-center">
                                    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-primary-50 text-primary-600 text-sm font-semibold">
                                        {bank.bank_code}
                                    </span>
                                </div>
                                <div className="col-span-2 flex items-center gap-2">
                                    <GitBranch className="w-4 h-4 text-text-muted" />
                                    <span className="text-sm text-text-primary font-medium">
                                        {bank.branches_count}
                                    </span>
                                </div>
                                <div className="col-span-2 flex items-center justify-end relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setMenuOpenId(menuOpenId === bank.id ? null : bank.id);
                                        }}
                                        className="p-2 rounded-lg hover:bg-hover text-text-muted hover:text-text-primary transition-colors"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>

                                    {menuOpenId === bank.id && (
                                        <div className="absolute right-0 top-full mt-1 w-40 bg-card rounded-xl shadow-lg border border-border-default z-10 py-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectBank(bank);
                                                    setMenuOpenId(null);
                                                }}
                                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-primary hover:bg-hover transition-colors"
                                            >
                                                <GitBranch className="w-4 h-4" />
                                                View Branches
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteBank(bank);
                                                    setMenuOpenId(null);
                                                }}
                                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete Bank
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// =============================================
// BRANCH LIST VIEW (for a selected bank)
// =============================================
function BranchListView({
    bank,
    branches,
    searchQuery,
    onSearchChange,
    onBack,
    onAddBranch,
    onDeleteBranch,
    isLoading,
}: {
    bank: Bank;
    branches: BankBranch[];
    searchQuery: string;
    onSearchChange: (q: string) => void;
    onBack: () => void;
    onAddBranch: () => void;
    onDeleteBranch: (branch: BankBranch) => void;
    isLoading: boolean;
}) {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2.5 rounded-xl bg-card border border-border-default hover:bg-hover text-text-primary transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                            {bank.bank_name.toUpperCase()} BRANCHES
                        </h1>
                        <p className="text-text-secondary mt-0.5">
                            Managing branch network for {bank.bank_name} ({bank.bank_code})
                        </p>
                    </div>
                </div>
                <button
                    onClick={onAddBranch}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-primary-500/20"
                >
                    <Plus className="w-4 h-4" />
                    Add Branch
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={`Search branches in ${bank.bank_name}...`}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all text-sm"
                />
            </div>

            {/* Table */}
            <div className="bg-card rounded-2xl border border-border-default overflow-hidden shadow-sm">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3.5 bg-table-header border-b border-border-divider">
                    <div className="col-span-3">
                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                            Branch Name
                        </span>
                    </div>
                    <div className="col-span-2">
                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                            Branch Code
                        </span>
                    </div>
                    <div className="col-span-4">
                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                            Status
                        </span>
                    </div>
                    <div className="col-span-3 text-right">
                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                            Actions
                        </span>
                    </div>
                </div>

                {/* Table Body */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                        <span className="ml-3 text-text-secondary text-sm">Loading branches...</span>
                    </div>
                ) : branches.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-muted-bg flex items-center justify-center mb-4">
                            <GitBranch className="w-8 h-8 text-text-muted" />
                        </div>
                        <h3 className="text-base font-semibold text-text-primary">
                            No Branches Registered
                        </h3>
                        <p className="text-sm text-text-secondary mt-1">
                            Start by adding your first branch for this partner.
                        </p>
                        <button
                            onClick={onAddBranch}
                            className="mt-4 text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                        >
                            Register Branch
                        </button>
                    </div>
                ) : (
                    <div>
                        {branches.map((branch) => (
                            <div
                                key={branch.id}
                                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border-divider last:border-b-0 hover:bg-table-row-hover transition-colors"
                            >
                                <div className="col-span-3 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                        <Building2 className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <span className="font-medium text-text-primary text-sm">
                                        {branch.branch_name}
                                    </span>
                                </div>
                                <div className="col-span-2 flex items-center">
                                    {branch.branch_code ? (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-sm font-semibold">
                                            {branch.branch_code}
                                        </span>
                                    ) : (
                                        <span className="text-sm text-text-muted">—</span>
                                    )}
                                </div>
                                <div className="col-span-4 flex items-center">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                                        Verified
                                    </span>
                                </div>
                                <div className="col-span-3 flex items-center justify-end">
                                    <button
                                        onClick={() => onDeleteBranch(branch)}
                                        className="p-2 rounded-lg hover:bg-danger-50 text-text-muted hover:text-danger-600 transition-colors"
                                        title="Delete branch"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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
export default function BankBranchPage() {
    // View state
    const [view, setView] = useState<'banks' | 'branches'>('banks');
    const [selectedBank, setSelectedBank] = useState<Bank | null>(null);

    // Bank state
    const [banks, setBanks] = useState<Bank[]>([]);
    const [bankSearch, setBankSearch] = useState('');
    const [isBanksLoading, setIsBanksLoading] = useState(true);
    const [showAddBankModal, setShowAddBankModal] = useState(false);
    const [isCreatingBank, setIsCreatingBank] = useState(false);

    // Branch state
    const [branches, setBranches] = useState<BankBranch[]>([]);
    const [branchSearch, setBranchSearch] = useState('');
    const [isBranchesLoading, setIsBranchesLoading] = useState(false);
    const [showAddBranchModal, setShowAddBranchModal] = useState(false);
    const [isCreatingBranch, setIsCreatingBranch] = useState(false);

    // Delete state
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'bank' | 'branch'; item: Bank | BankBranch } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Fetch banks
    const fetchBanks = useCallback(async () => {
        try {
            setIsBanksLoading(true);
            const data = await bankService.getBanks(bankSearch || undefined);
            setBanks(data);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load banks');
        } finally {
            setIsBanksLoading(false);
        }
    }, [bankSearch]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchBanks();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchBanks]);

    // Fetch branches for selected bank
    const fetchBranches = useCallback(async () => {
        if (!selectedBank) return;
        try {
            setIsBranchesLoading(true);
            const data = await bankService.getBankBranches(selectedBank.id, branchSearch || undefined);
            setBranches(data.branches);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load branches');
        } finally {
            setIsBranchesLoading(false);
        }
    }, [selectedBank, branchSearch]);

    useEffect(() => {
        if (view === 'branches' && selectedBank) {
            const timer = setTimeout(() => {
                fetchBranches();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [view, fetchBranches]);

    // Handlers
    const handleSelectBank = (bank: Bank) => {
        setSelectedBank(bank);
        setBranchSearch('');
        setView('branches');
    };

    const handleBackToBanks = () => {
        setView('banks');
        setSelectedBank(null);
        setBranches([]);
        setBranchSearch('');
        fetchBanks();
    };

    const handleCreateBank = async (data: BankFormData) => {
        try {
            setIsCreatingBank(true);
            await bankService.createBank(data);
            toast.success('Bank created successfully');
            setShowAddBankModal(false);
            fetchBanks();
        } catch (error: any) {
            toast.error(error.message || 'Failed to create bank');
        } finally {
            setIsCreatingBank(false);
        }
    };

    const handleCreateBranch = async (data: BankBranchFormData) => {
        if (!selectedBank) return;
        try {
            setIsCreatingBranch(true);
            await bankService.createBankBranch(selectedBank.id, data);
            toast.success('Branch registered successfully');
            setShowAddBranchModal(false);
            fetchBranches();
        } catch (error: any) {
            toast.error(error.message || 'Failed to create branch');
        } finally {
            setIsCreatingBranch(false);
        }
    };

    const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsImporting(true);
            const response = await bankService.importBanks(file);
            const { data } = response;

            toast.success(
                `Import Successful: ${data.banks_created} Banks created, ${data.branches_created} Branches added.`
            );
            fetchBanks();
        } catch (error: any) {
            toast.error(error.message || 'Import failed');
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        try {
            setIsDeleting(true);
            if (deleteTarget.type === 'bank') {
                await bankService.deleteBank((deleteTarget.item as Bank).id);
                toast.success('Bank deleted successfully');
                fetchBanks();
            } else {
                if (!selectedBank) return;
                await bankService.deleteBankBranch(selectedBank.id, (deleteTarget.item as BankBranch).id);
                toast.success('Branch deleted successfully');
                fetchBranches();
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete');
        } finally {
            setIsDeleting(false);
            setDeleteTarget(null);
        }
    };

    return (
        <>
            {view === 'banks' ? (
                <BankListView
                    banks={banks}
                    searchQuery={bankSearch}
                    onSearchChange={setBankSearch}
                    onAddBank={() => setShowAddBankModal(true)}
                    onSelectBank={handleSelectBank}
                    onDeleteBank={(bank) => setDeleteTarget({ type: 'bank', item: bank })}
                    onBulkImport={() => fileInputRef.current?.click()}
                    isLoading={isBanksLoading}
                    isImporting={isImporting}
                />
            ) : (
                selectedBank && (
                    <BranchListView
                        bank={selectedBank}
                        branches={branches}
                        searchQuery={branchSearch}
                        onSearchChange={setBranchSearch}
                        onBack={handleBackToBanks}
                        onAddBranch={() => setShowAddBranchModal(true)}
                        onDeleteBranch={(branch) => setDeleteTarget({ type: 'branch', item: branch })}
                        isLoading={isBranchesLoading}
                    />
                )
            )}

            {/* Modals */}
            <AddBankModal
                isOpen={showAddBankModal}
                onClose={() => setShowAddBankModal(false)}
                onSubmit={handleCreateBank}
                isLoading={isCreatingBank}
            />

            <AddBranchModal
                isOpen={showAddBranchModal}
                onClose={() => setShowAddBranchModal(false)}
                onSubmit={handleCreateBranch}
                isLoading={isCreatingBranch}
                bank={selectedBank}
            />

            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDeleteConfirm}
                title={
                    deleteTarget?.type === 'bank'
                        ? `Delete ${(deleteTarget.item as Bank).bank_name}?`
                        : `Delete ${(deleteTarget?.item as BankBranch)?.branch_name}?`
                }
                message={
                    deleteTarget?.type === 'bank'
                        ? 'This will permanently remove this bank. All branches must be removed first.'
                        : 'This will permanently remove this branch from the bank.'
                }
                isLoading={isDeleting}
            />

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleBulkImport}
                className="hidden"
                accept=".csv"
            />
        </>
    );
}
